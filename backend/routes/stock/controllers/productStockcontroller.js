import { db } from "../../../db/index.js";

// 添加一条在庫流水记录
export const addStockTransaction = async (req, res) => {
  const {
    stock_type,
    target_cd,
    location_cd,
    transaction_type,
    quantity,
    unit,
    process_cd,
    base_qty,
    lot_no,
    related_doc_type,
    related_doc_no,
    operator_name,
    remarks,
    transaction_time,
  } = req.body;

  // 🔍 必須項目チェック
  const isMissing = (val) => val === undefined || val === null || val === "";

  if (
    isMissing(stock_type) ||
    isMissing(target_cd) ||
    isMissing(location_cd) ||
    isMissing(transaction_type) ||
    isMissing(transaction_time) ||
    quantity === undefined ||
    quantity === null
  ) {
    return res.status(400).json({ success: false, message: "必須項目が不足しています" });
  }

  try {
    // 材料类型自动补全工程名
    let finalProcessCd = process_cd;
    if (stock_type === "材料" && (!process_cd || process_cd === "")) {
      finalProcessCd = "KT15";
    }
    await db.query(
      `INSERT INTO stock_transaction_logs (
        stock_type,
        target_cd,
        location_cd,
        transaction_type,
        quantity,
        unit,
        process_cd,
        base_qty,
        lot_no,
        related_doc_type,
        related_doc_no,
        operator_name,
        remarks,
        transaction_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stock_type,
        target_cd,
        location_cd,
        transaction_type,
        quantity,
        unit || null,
        finalProcessCd || null,
        base_qty || null,
        lot_no || null,
        related_doc_type || null,
        related_doc_no || null,
        operator_name || null,
        remarks || null,
        transaction_time,
      ],
    );

    res.json({ success: true, message: "在庫履歴を登録しました" });
  } catch (error) {
    console.error("在庫履歴登録エラー:", error);
    res.status(500).json({ success: false, message: "登録失敗", error });
  }
};

// 删除一条在庫流水记录
export const deleteStockLog = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM stock_transaction_logs WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "削除失敗" });
  }
};

// 庫存推移算法：快照+差分+订单+forecast切换+缓存写入
export const getProductStockTrend = async (req, res) => {
  const { product_cd_list, location_cd, refresh = false } = req.query;

  if (!product_cd_list || !location_cd) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  // 将产品代码最后一位改为1
  const convertProductCode = (product_cd) => {
    return product_cd.slice(0, -1) + "1";
  };

  const originalProductList = Array.isArray(product_cd_list) ? product_cd_list : [product_cd_list];
  let productList = [...new Set(originalProductList.map(convertProductCode))];

  // 过滤掉名称包含"加工"或"アーチ"的产品
  if (productList.length) {
    const [nameRows] = await db.query(
      `SELECT CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') AS base_cd, product_name
       FROM products
       WHERE CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') IN (${productList
         .map(() => "?")
         .join(",")})`,
      productList,
    );
    const invalidCds = nameRows
      .filter(
        (r) =>
          r.product_name && (r.product_name.includes("加工") || r.product_name.includes("アーチ")),
      )
      .map((r) => r.base_cd);
    if (invalidCds.length) {
      productList = productList.filter((cd) => !invalidCds.includes(cd));
      if (productList.length === 0) {
        return res.json({ success: true, data: [] });
      }
    }
  }

  try {
    // 获取每个产品的最后一个初期数据（合并后的）
    const [initialStocks] = await db.query(
      `SELECT
        CONCAT(LEFT(s1.product_cd, LENGTH(s1.product_cd)-1), '1') as product_cd,
        s1.snapshot_date as last_snapshot_date,
        SUM(s1.quantity) as initial_quantity
      FROM stock_product_snapshots s1
      INNER JOIN (
        SELECT
          CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') as base_product_cd,
          MAX(snapshot_date) as max_date
        FROM stock_product_snapshots
        WHERE CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') IN (${productList.map(() => "?").join(",")})
          AND location_cd = ?
        GROUP BY base_product_cd
      ) s2 ON CONCAT(LEFT(s1.product_cd, LENGTH(s1.product_cd)-1), '1') = s2.base_product_cd
        AND s1.snapshot_date = s2.max_date
      WHERE s1.location_cd = ?
      GROUP BY CONCAT(LEFT(s1.product_cd, LENGTH(s1.product_cd)-1), '1'), s1.snapshot_date`,
      [...productList, location_cd, location_cd],
    );

    // 构建初期数据映射
    const initialStockMap = {};
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    productList.forEach((product_cd) => {
      const initialStock = initialStocks.find((stock) => stock.product_cd === product_cd);
      if (initialStock && initialStock.last_snapshot_date) {
        initialStockMap[product_cd] = {
          start_date: new Date(initialStock.last_snapshot_date),
          initial_quantity: Number(initialStock.initial_quantity || 0),
        };
      } else {
        initialStockMap[product_cd] = {
          start_date: firstDayOfMonth,
          initial_quantity: 0,
        };
      }
    });

    // 生成日期范围（每个产品92天）
    const dateRangeMap = {};
    productList.forEach((product_cd) => {
      const { start_date } = initialStockMap[product_cd];
      const dates = [];
      const currentDate = new Date(start_date);

      for (let i = 0; i < 92; i++) {
        currentDate.setDate(currentDate.getDate() + 1);
        dates.push(currentDate.toISOString().split("T")[0]);
      }

      dateRangeMap[product_cd] = {
        start: dates[0],
        end: dates[dates.length - 1],
        dates,
      };
    });

    // 获取所有产品的最早和最晚日期
    const globalStartDate = new Date(
      Math.min(...Object.values(dateRangeMap).map((range) => new Date(range.start).getTime())),
    );
    const globalEndDate = new Date(
      Math.max(...Object.values(dateRangeMap).map((range) => new Date(range.end).getTime())),
    );

    // 优先查缓存，除非强制刷新
    if (!refresh) {
      const [cached] = await db.query(
        `SELECT * FROM stock_daily_trends
         WHERE location_cd = ?
           AND product_cd IN (${productList.map(() => "?").join(",")})
           AND date BETWEEN ? AND ?
         ORDER BY product_cd, location_cd, date`,
        [
          location_cd,
          ...productList,
          globalStartDate.toISOString().split("T")[0],
          globalEndDate.toISOString().split("T")[0],
        ],
      );

      // 验证每个产品的缓存完整性
      const isCacheValid = productList.every((product_cd) => {
        const productDates = dateRangeMap[product_cd].dates;
        const productCache = cached.filter((c) => c.product_cd === product_cd);
        return productCache.length === productDates.length;
      });

      if (isCacheValid && cached.length > 0) {
        return res.json({ success: true, data: cached, cached: true });
      }
    }

    // 批量获取产品信息
    const [productsData] = await db.query(
      `SELECT
        CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') as product_cd,
        GROUP_CONCAT(product_name) as product_names
      FROM products
      WHERE CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') IN (${productList.map(() => "?").join(",")})
      GROUP BY CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1')`,
      productList,
    );

    const productNameMap = {};
    productsData.forEach((p) => {
      productNameMap[p.product_cd] = p.product_names.split(",")[0] || "";
    });

    // 批量获取库存流水记录（合并相同基础产品代码）
    const [stockFlows] = await db.query(
      `SELECT
         CONCAT(LEFT(target_cd, LENGTH(target_cd)-1), '1') AS product_cd,
         DATE(transaction_time) AS date,
         transaction_type,
         SUM(quantity) AS quantity
       FROM stock_transaction_logs
       WHERE stock_type = '製品'
         AND CONCAT(LEFT(target_cd, LENGTH(target_cd)-1), '1') IN (${productList.map(() => "?").join(",")})
         AND location_cd = ?
         AND DATE(transaction_time) BETWEEN ? AND ?
       GROUP BY CONCAT(LEFT(target_cd, LENGTH(target_cd)-1), '1'), DATE(transaction_time), transaction_type`,
      [
        ...productList,
        location_cd,
        globalStartDate.toISOString().split("T")[0],
        globalEndDate.toISOString().split("T")[0],
      ],
    );

    // 构建库存流水映射
    const stockFlowMap = {};
    stockFlows.forEach((flow) => {
      const key = `${flow.product_cd}_${flow.date}`;
      if (!stockFlowMap[key]) {
        stockFlowMap[key] = {
          初期: 0,
          入庫: 0,
          出庫: 0,
          調整: 0,
          廃棄: 0,
          保留: 0,
        };
      }
      stockFlowMap[key][flow.transaction_type] = Number(flow.quantity || 0);
    });

    // 批量获取订单数据（合并相同基础产品代码）
    const [shipments] = await db.query(
      `SELECT
         CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') as product_cd,
         DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) AS date,
         SUM(confirmed_units) AS confirmed,
         SUM(forecast_units) AS forecast
       FROM order_daily
       WHERE CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') IN (${productList.map(() => "?").join(",")})
         AND DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0')))
             BETWEEN ? AND ?
       GROUP BY CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1'), date`,
      [
        ...productList,
        globalStartDate.toISOString().split("T")[0],
        globalEndDate.toISOString().split("T")[0],
      ],
    );

    // 构建订单数据映射
    const shipmentMap = {};
    shipments.forEach((order) => {
      const key = `${order.product_cd}_${order.date}`;
      shipmentMap[key] = {
        confirmed: Number(order.confirmed || 0),
        forecast: Number(order.forecast || 0),
      };
    });

    // 批量获取最后确认日期（合并相同基础产品代码）
    const [lastConfirmedDates] = await db.query(
      `SELECT
         CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') as product_cd,
         MAX(DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-', LPAD(day,2,'0')))) AS last_confirmed_date
       FROM order_daily
       WHERE CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1') IN (${productList.map(() => "?").join(",")})
         AND confirmed_units > 0
       GROUP BY CONCAT(LEFT(product_cd, LENGTH(product_cd)-1), '1')`,
      productList,
    );

    // 构建最后确认日期映射
    const lastConfirmedMap = {};
    lastConfirmedDates.forEach((item) => {
      lastConfirmedMap[item.product_cd] = item.last_confirmed_date;
    });

    // 计算推移并准备批量插入数据
    const allResults = [];
    const batchInsertValues = [];

    // 按产品处理
    for (const product_cd of productList) {
      const product_name = productNameMap[product_cd] || "";
      const { initial_quantity } = initialStockMap[product_cd];
      const dateRange = dateRangeMap[product_cd].dates;
      const lastConfirmedDate = lastConfirmedMap[product_cd] || null;

      // 从快照表的初期值开始累计
      let cumulative = initial_quantity;

      for (const date of dateRange) {
        const stockKey = `${product_cd}_${date}`;
        const stock = stockFlowMap[stockKey] || {
          初期: 0,
          入庫: 0,
          出庫: 0,
          調整: 0,
          廃棄: 0,
          保留: 0,
        };
        const order = shipmentMap[stockKey] || { confirmed: 0, forecast: 0 };

        // 确定使用确认订单还是预测订单
        let 出荷量 = 0;
        let is_predicted = false;

        if (lastConfirmedDate && date <= lastConfirmedDate) {
          出荷量 = order.confirmed;
          is_predicted = false;
        } else {
          出荷量 = order.forecast;
          is_predicted = true;
        }

        // 从stock_transaction_logs获取当天的初期值
        const 初期値 = Number(stock.初期 || 0);

        // 使用新的计算公式计算差引累計
        cumulative =
          cumulative +
          初期値 +
          Number(stock.入庫 || 0) +
          Number(stock.調整 || 0) -
          Number(stock.出庫 || 0) -
          Number(stock.廃棄 || 0) -
          Number(stock.保留 || 0) -
          出荷量;

        const result = {
          product_cd,
          product_name,
          location_cd,
          date,
          初期: 初期値,
          入庫: Number(stock.入庫 || 0),
          出庫: Number(stock.出庫 || 0),
          調整: Number(stock.調整 || 0),
          廃棄: Number(stock.廃棄 || 0),
          保留: Number(stock.保留 || 0),
          出荷: 出荷量,
          is_predicted,
          confirmed_units: order.confirmed,
          forecast_units: order.forecast,
          差引累計: cumulative,
          updated_at: new Date(),
        };

        allResults.push(result);
        batchInsertValues.push([
          result.product_cd,
          result.product_name,
          result.location_cd,
          result.date,
          result.初期,
          result.入庫,
          result.出庫,
          result.調整,
          result.廃棄,
          result.保留,
          result.出荷,
          result.is_predicted ? 1 : 0,
          result.confirmed_units,
          result.forecast_units,
          result.差引累計,
          result.updated_at,
        ]);
      }
    }

    // 批量删除旧数据
    await db.query(
      `DELETE FROM stock_daily_trends
       WHERE product_cd IN (${productList.map(() => "?").join(",")})
         AND location_cd = ?
         AND date BETWEEN ? AND ?`,
      [
        ...productList,
        location_cd,
        globalStartDate.toISOString().split("T")[0],
        globalEndDate.toISOString().split("T")[0],
      ],
    );

    // 批量插入新数据
    if (batchInsertValues.length > 0) {
      await db.query(
        `INSERT INTO stock_daily_trends
         (product_cd, product_name, location_cd, date, 初期,
          入庫, 出庫, 調整, 廃棄, 保留, 出荷,
          is_predicted, confirmed_units, forecast_units, 差引累計, updated_at)
         VALUES ?`,
        [batchInsertValues],
      );
    }

    // 排序结果
    allResults.sort((a, b) => {
      const productCompare = a.product_cd.localeCompare(b.product_cd);
      if (productCompare !== 0) return productCompare;
      return new Date(a.date) - new Date(b.date);
    });

    res.json({ success: true, data: allResults, cached: false });
  } catch (err) {
    console.error("推移算法发生异常:", err);
    res.status(500).json({ success: false, message: "在庫推移取得失敗", err: err.message });
  }
};

// 製品在庫推移計算--全製品
export const getAllProductStockTrends = async (req, res) => {
  const { location_cd, start_date, end_date, batch_size = 10 } = req.query;

  if (!location_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    // ① 製品CD一覧を取得（空でないことを保証）
    const [rows] = await db.query(`
      SELECT product_cd
      FROM products
      WHERE product_cd IS NOT NULL
        AND product_name NOT LIKE '%加工%'
        AND product_name NOT LIKE '%アーチ%'
    `);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: [] }); // 空の場合も正常返却
    }

    // ② 製品CDリストに変換
    const allProductCds = rows.map((r) => r.product_cd);

    // ③ 分批处理以避免内存溢出
    const batchSize = parseInt(batch_size);
    const results = [];

    // 创建一个临时响应对象，以便我们可以捕获getProductStockTrend的输出
    const tempRes = {
      json: (data) => {
        if (data.success && data.data) {
          results.push(...data.data);
        }
        return tempRes;
      },
      status: (code) => {
        return {
          json: (data) => {
            throw new Error(`处理批次失败: ${data.message || "未知错误"}`);
          },
        };
      },
    };

    // 分批处理产品
    for (let i = 0; i < allProductCds.length; i += batchSize) {
      const batchProductCds = allProductCds.slice(i, i + batchSize);

      // 设置请求查询参数
      const batchReq = {
        ...req,
        query: {
          ...req.query,
          product_cd_list: batchProductCds,
        },
      };

      // 调用getProductStockTrend处理当前批次
      await getProductStockTrend(batchReq, tempRes);
    }

    // 返回所有批次的组合结果
    res.json({
      success: true,
      data: results,
      total_products: allProductCds.length,
      batches: Math.ceil(allProductCds.length / batchSize),
    });
  } catch (err) {
    console.error("全製品在庫推移計算エラー:", err);
    res.status(500).json({
      success: false,
      message: "全製品の在庫推移再計算に失敗しました",
      error: err.message,
    });
  }
};

// 出荷枯渇予測
export const getStockDepletionDates = async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    // ① 读取产品安全日数
    const [products] = await db.query(`
      SELECT product_cd, product_name, safety_days
      FROM products
      WHERE product_cd IS NOT NULL
        AND product_name NOT LIKE '%加工%'
        AND product_name NOT LIKE '%アーチ%'
    `);

    if (products.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // ② 获取产品每日在庫推移（全保管場所合计）
    const [trends] = await db.query(
      `
      SELECT
        product_cd,
        DATE(date) AS date,
        SUM(差引累計) AS total_balance
      FROM stock_daily_trends
      WHERE date BETWEEN ? AND ?
      GROUP BY product_cd, date
      ORDER BY product_cd, date
    `,
      [start_date, end_date],
    );

    // ③ 获取产品每日出荷（order_daily）
    const [shipments] = await db.query(
      `
      SELECT
        product_cd,
        DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) AS date,
        SUM(forecast_units) AS units
      FROM order_daily
      WHERE DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0')))
            BETWEEN ? AND ?
      GROUP BY product_cd, date
    `,
      [start_date, end_date],
    );

    // 建立日期范围数组，确保连续性
    const dateRange = [];
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split("T")[0]);
    }

    // 构建出货数据映射
    const shipmentMap = new Map();
    for (const row of shipments) {
      const key = `${row.product_cd}_${row.date}`;
      shipmentMap.set(key, Number(row.units || 0));
    }

    // ④ 按产品分组整理趋势数据
    const productMap = new Map();
    for (const p of products) {
      productMap.set(p.product_cd, {
        product_cd: p.product_cd,
        product_name: p.product_name,
        safety_days: p.safety_days ?? 0,
        depletion_date: null,
        last_positive_date: null,
        final_balance: 0,
        safety_stock: 0,
        days_until_depletion: null,
        avg_daily_shipment: 0,
        total_period_shipment: 0,
      });
    }

    // 按产品分组，确保数据连续性
    const trendsByProduct = new Map();
    for (const p of products) {
      trendsByProduct.set(p.product_cd, new Map());
    }

    // 填充趋势数据
    for (const row of trends) {
      if (trendsByProduct.has(row.product_cd)) {
        trendsByProduct.get(row.product_cd).set(row.date, Number(row.total_balance || 0));
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算每个产品的库存状态
    for (const [product_cd, productInfo] of productMap) {
      // 计算总出货量和平均日出货量
      let totalShipment = 0;
      let totalDays = 0;

      // 考虑所有日期（包括无出货日期）计算平均值
      for (const date of dateRange) {
        const shipKey = `${product_cd}_${date}`;
        const shipped = shipmentMap.get(shipKey) || 0;
        totalShipment += shipped;
        totalDays++;
      }

      // 计算平均每日出货量（考虑整个期间）
      const avgDailyShipment = totalDays > 0 ? totalShipment / totalDays : 0;
      productInfo.avg_daily_shipment = avgDailyShipment;
      productInfo.total_period_shipment = totalShipment;

      // 设置安全库存（基于安全天数和平均日出货量）
      productInfo.safety_stock = Math.ceil(productInfo.safety_days * avgDailyShipment);

      // 获取产品的趋势数据
      const productTrends = trendsByProduct.get(product_cd);

      // 确保日期连续性，进行分析
      for (const date of dateRange) {
        // 使用已有数据或默认为0
        const balance = productTrends.get(date) || 0;

        // 枯渇日：最初 balance < 0
        if (!productInfo.depletion_date && balance < 0) {
          productInfo.depletion_date = date;
          const dateDiff = Math.ceil(
            (new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          productInfo.days_until_depletion = dateDiff;
        }

        // 最终正数日在庫
        if (balance > 0) {
          productInfo.last_positive_date = date;
        }

        // 更新最终日 balance
        productInfo.final_balance = balance;
      }
    }

    const result = Array.from(productMap.values());
    res.json({
      success: true,
      data: result,
      date_range: {
        start: start_date,
        end: end_date,
        days: dateRange.length,
      },
    });
  } catch (err) {
    console.error("❌ stock-depletion-error:", err);
    res.status(500).json({
      success: false,
      message: "在庫枯渇予測の取得に失敗しました",
      error: err.message,
    });
  }
};

// 製品在庫推移計算キャッシュ読取（前端ページ用）
export const getDailyTrendData = async (req, res) => {
  const { product_cd, location_cd, start_date, end_date } = req.query;

  if (!product_cd || !location_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    // 验证日期格式和范围
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: "日期格式不正确" });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "开始日期不能晚于结束日期",
      });
    }

    // 限制查询范围防止过大查询
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 366) {
      return res.status(400).json({
        success: false,
        message: "查询范围不能超过一年",
      });
    }

    // 使用索引优化查询，添加更多返回信息
    const [rows] = await db.query(
      `
      SELECT
        t.*,
        p.product_name
      FROM stock_daily_trends t
      LEFT JOIN products p ON t.product_cd = p.product_cd
      WHERE t.product_cd = ? AND t.location_cd = ?
        AND t.date BETWEEN ? AND ?
      ORDER BY t.date ASC
      `,
      [product_cd, location_cd, start_date, end_date],
    );

    // 汇总统计信息
    const summary = {
      total_rows: rows.length,
      date_range: {
        start: start_date,
        end: end_date,
        days: daysDiff + 1,
      },
      transactions: {
        入庫: 0,
        出庫: 0,
        調整: 0,
        廃棄: 0,
        保留: 0,
        出荷: 0,
      },
      initial_balance:
        rows.length > 0
          ? rows[0].差引累計 -
            (rows[0].入庫 -
              rows[0].出庫 -
              rows[0].廃棄 -
              rows[0].保留 -
              rows[0].出荷 +
              rows[0].調整)
          : 0,
      final_balance: rows.length > 0 ? rows[rows.length - 1].差引累計 : 0,
    };

    // 计算合计
    rows.forEach((row) => {
      summary.transactions.入庫 += Number(row.入庫 || 0);
      summary.transactions.出庫 += Number(row.出庫 || 0);
      summary.transactions.調整 += Number(row.調整 || 0);
      summary.transactions.廃棄 += Number(row.廃棄 || 0);
      summary.transactions.保留 += Number(row.保留 || 0);
      summary.transactions.出荷 += Number(row.出荷 || 0);
    });

    res.json({
      success: true,
      data: rows,
      summary,
    });
  } catch (err) {
    console.error("获取在庫推移数据失败:", err);
    res.status(500).json({
      success: false,
      message: "在庫推移データの取得に失敗しました",
      error: err.message,
    });
  }
};

// 函数
function formatDateToYMD(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function mergeTrendRows(rows) {
  const map = new Map();

  for (const row of rows) {
    // 确保日期格式一致
    const date = row.date instanceof Date ? formatDateToYMD(row.date) : row.date;
    const key = `${row.product_cd}||${row.location_cd}||${date}`;

    // 确保所有字段都是有效的数字
    const numericValues = {
      初期: Number(row.初期 ?? 0),
      入庫: Number(row.入庫 ?? 0),
      出庫: Number(row.出庫 ?? 0),
      調整: Number(row.調整 ?? 0),
      廃棄: Number(row.廃棄 ?? 0),
      保留: Number(row.保留 ?? 0),
      出荷: Number(row.出荷 ?? 0),
      差引累計: Number(row.差引累計 ?? 0),
      confirmed_units: Number(row.confirmed_units ?? 0),
      forecast_units: Number(row.forecast_units ?? 0),
    };

    const existing = map.get(key);
    if (existing) {
      // 合并数值字段
      existing.初期 += numericValues.初期;
      existing.入庫 += numericValues.入庫;
      existing.出庫 += numericValues.出庫;
      existing.調整 += numericValues.調整;
      existing.廃棄 += numericValues.廃棄;
      existing.保留 += numericValues.保留;
      existing.出荷 += numericValues.出荷;

      // 更新确认单位和预测单位（取最大值）
      existing.confirmed_units = Math.max(existing.confirmed_units, numericValues.confirmed_units);
      existing.forecast_units = Math.max(existing.forecast_units, numericValues.forecast_units);

      // 重新计算差引累计
      existing.差引累計 = numericValues.差引累計;

      // 両方が予測だったらtrue、それ以外はfalse（实绩优先）
      existing.is_predicted = existing.is_predicted && !!row.is_predicted;

      // 更新时间戳为最新
      existing.updated_at = new Date();
    } else {
      // 创建新记录
      map.set(key, {
        ...row,
        date,
        ...numericValues,
        is_predicted: !!row.is_predicted,
        updated_at: new Date(),
      });
    }
  }

  // 排序结果
  return [...map.values()].sort((a, b) => {
    // 按产品代码、位置和日期排序
    const productCompare = a.product_cd.localeCompare(b.product_cd);
    if (productCompare !== 0) return productCompare;

    const locationCompare = a.location_cd.localeCompare(b.location_cd);
    if (locationCompare !== 0) return locationCompare;

    return new Date(a.date) - new Date(b.date);
  });
}

export async function saveDailyTrendsToDB(trendRows) {
  if (!trendRows || !trendRows.length) return;

  try {
    // ✅ ① 合并重复行
    const mergedRows = mergeTrendRows(trendRows);

    // ✅ ② 抽出需要删除的唯一键
    const uniqueKeys = new Set();
    const uniqueConditions = [];
    const uniqueParams = [];

    for (const row of mergedRows) {
      const dateStr = formatDateToYMD(row.date);
      uniqueKeys.add(`${row.product_cd}|${row.location_cd}|${dateStr}`);

      // 为参数化查询准备条件
      uniqueConditions.push("(product_cd = ? AND location_cd = ? AND date = ?)");
      uniqueParams.push(row.product_cd, row.location_cd, dateStr);
    }

    // ✅ ③ 批量删除现有记录 - 使用参数化查询防止SQL注入
    if (uniqueParams.length > 0) {
      const deleteSql = `
        DELETE FROM stock_daily_trends
        WHERE ${uniqueConditions.join(" OR ")}
      `;

      await db.query(deleteSql, uniqueParams);
    }

    // ✅ ④ 批量插入 - 一次性插入所有行
    if (mergedRows.length > 0) {
      const values = mergedRows.map((row) => [
        row.product_cd,
        row.product_name || "",
        row.location_cd,
        formatDateToYMD(row.date),
        row.初期,
        row.入庫,
        row.出庫,
        row.調整,
        row.廃棄,
        row.保留,
        row.出荷,
        row.is_predicted ? 1 : 0,
        row.confirmed_units || 0,
        row.forecast_units || 0,
        row.差引累計,
        row.updated_at,
      ]);

      await db.query(
        `
        INSERT INTO stock_daily_trends (
          product_cd, product_name, location_cd, date, 初期,
          入庫, 出庫, 調整, 廃棄, 保留, 出荷,
          is_predicted, confirmed_units, forecast_units, 差引累計, updated_at
        )
        VALUES ?
        `,
        [values],
      );
    }

    return { success: true, processed: mergedRows.length };
  } catch (error) {
    console.error("保存库存趋势数据失败:", error);
    throw error;
  }
}

// 清空库存推移表
export const clearStockTrends = async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE stock_daily_trends");
    res.json({ success: true, message: "在庫推移テーブルをクリアしました" });
  } catch (err) {
    console.error("清空库存推移表失败:", err);
    res.status(500).json({ success: false, message: "テーブルクリア失敗", error: err.message });
  }
};

// 获取负库存数据（在庫数<0）
export const getNegativeStockData = async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    // 查询负库存数据，包含納入先名和製品種類
    const [rows] = await db.query(
      `
      SELECT
        dd.destination_name as 納入先名,
        sdt.product_cd as 製品CD,
        sdt.product_name as 製品名,
        p.product_type as 製品種類,
        sdt.date as 日付,
        sdt.差引累計 as 在庫数
      FROM stock_daily_trends sdt
      LEFT JOIN products p ON sdt.product_cd = p.product_cd
      LEFT JOIN delivery_destinations dd ON p.delivery_destination_cd = dd.destination_cd
      WHERE sdt.date BETWEEN ? AND ?
        AND sdt.差引累計 < 0
      ORDER BY sdt.date DESC, sdt.product_cd
    `,
      [start_date, end_date],
    );

    res.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error("❌ 負在庫データ取得エラー:", err);
    res.status(500).json({
      success: false,
      message: "負在庫データの取得に失敗しました",
      error: err.message,
    });
  }
};
