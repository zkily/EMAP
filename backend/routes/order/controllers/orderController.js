import { query, db } from "../../../db/index.js";

//====  后端 order.js  调用   ==

// 出荷月订单 → 生成日订单
export const generateDailyOrders = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { year, month, destination_cd, productType } = req.body;

    if (!year || !month) {
      console.log("🔥 参数验证失败:", { year, month });
      return res.status(400).json({ message: "パラメータ不正（year / month が必要です）" });
    }

    console.log("🔥 参数验证通过:", { year, month, destination_cd, productType });

    let sql = `
      SELECT * FROM order_monthly
      WHERE year = ? AND month = ?
    `;
    const params = [year, month];
    if (destination_cd) {
      sql += ` AND destination_cd = ?`;
      params.push(destination_cd);
    }

    // 添加productType过滤
    if (productType) {
      sql += ` AND product_type = ?`;
      params.push(productType);
    }

    console.log("🔥 执行查询:", sql, params);
    const [monthlyOrders] = await connection.query(sql, params);
    console.log("🔥 查询结果:", monthlyOrders?.length || 0, "条记录");

    if (!monthlyOrders || monthlyOrders.length === 0) {
      console.log("🔥 没有找到月订单数据");
      connection.release();
      return res.status(404).json({ message: "対象の月受注が見つかりません" });
    }

    await connection.beginTransaction();
    console.log("🔥 开始事务处理");

    let insertedCount = 0;
    let updatedCount = 0;

    for (const order of monthlyOrders) {
      console.log("🔥 处理订单:", order.order_id);
      const [workingDays] = await connection.query(
        `
        SELECT day_list.day AS work_date
        FROM (
          SELECT DATE(CONCAT(?, '-', ?, '-01')) + INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY AS day
          FROM
            (SELECT 0 a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
             UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
          CROSS JOIN
            (SELECT 0 a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
             UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
          CROSS JOIN
            (SELECT 0 a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
             UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
        ) AS day_list
        WHERE
          MONTH(day_list.day) = ?
          AND YEAR(day_list.day) = ?
          AND (
            (
              DAYOFWEEK(day_list.day) NOT IN (1,7)
              AND day_list.day NOT IN (
                SELECT holiday_date FROM destination_holidays WHERE destination_cd = ?
              )
            )
            OR
            (
              day_list.day IN (
                SELECT work_date FROM destination_override_attendance WHERE destination_cd = ?
              )
            )
          )
        ORDER BY work_date ASC
        `,
        [year, month, month, year, order.destination_cd, order.destination_cd],
      );

      console.log("🔥 工作日查询结果:", workingDays?.length || 0, "天");

      if (!workingDays || workingDays.length === 0) {
        console.log("🔥 没有工作日，记录错误日志");
        await insertLog(
          connection,
          "error",
          "order_monthly",
          order.order_id,
          `納入先 ${order.destination_cd} に作業日が存在しません`,
        );
        continue;
      }

      const dayCount = workingDays.length;

      if (order.forecast_units < 500) {
        for (let i = 0; i < dayCount; i++) {
          const workDate = workingDays[i].work_date;
          const units = i === 0 ? order.forecast_units : 0;

          const result = await upsertOrderDaily(order, workDate, units, connection);
          if (result === "insert") insertedCount++;
          if (result === "update") updatedCount++;
        }
      } else {
        const avg = Math.floor(order.forecast_units / dayCount);
        const remain = order.forecast_units - avg * dayCount;

        for (let i = 0; i < dayCount; i++) {
          const workDate = workingDays[i].work_date;
          const units = i === dayCount - 1 ? avg + remain : avg;

          const result = await upsertOrderDaily(order, workDate, units, connection);
          if (result === "insert") insertedCount++;
          if (result === "update") updatedCount++;
        }
      }
    }

    // 新增功能：更新最后确认日期之前的forecast_units为confirmed_units
    console.log("🔥 开始更新历史预测值为实际确认值");

    // 对每个月度订单分别处理
    for (const order of monthlyOrders) {
      // 1. 找到该订单的最后一个confirmed_boxes > 0的记录
      const [lastConfirmedOrders] = await connection.query(
        `
        SELECT id, year, month, day, confirmed_units
        FROM order_daily
        WHERE monthly_order_id = ?
        AND confirmed_boxes > 0
        ORDER BY year DESC, month DESC, day DESC
        LIMIT 1
        `,
        [order.order_id],
      );

      if (lastConfirmedOrders.length === 0) {
        console.log(`🔥 订单 ${order.order_id} 没有已确认的记录，跳过`);
        continue;
      }

      const lastConfirmed = lastConfirmedOrders[0];
      // console.log(
      //   `🔥 订单 ${order.order_id} 最后确认日期: ${lastConfirmed.year}-${lastConfirmed.month}-${lastConfirmed.day}`,
      // );

      // 2. 更新该日期之前的所有记录，将forecast_units设为confirmed_units
      const updateSql = `
        UPDATE order_daily
        SET forecast_units = confirmed_units
        WHERE monthly_order_id = ?
        AND (
          (year < ?) OR
          (year = ? AND month < ?) OR
          (year = ? AND month = ? AND day <= ?)
        )
      `;

      const [updateResult] = await connection.query(updateSql, [
        order.order_id,
        lastConfirmed.year,
        lastConfirmed.year,
        lastConfirmed.month,
        lastConfirmed.year,
        lastConfirmed.month,
        lastConfirmed.day,
      ]);

      // console.log(
      //   `🔥 更新订单 ${order.order_id} 的历史预测值: ${updateResult.affectedRows} 条记录已更新`,
      // );

      await insertLog(
        connection,
        "update",
        "order_daily",
        order.order_id,
        `${lastConfirmed.year}年${lastConfirmed.month}月${lastConfirmed.day}日以前及当日の予測数を確定数に更新しました（${updateResult.affectedRows}件）`,
      );
    }

    console.log("🔥 处理完成，更新预测数据");
    const updateForecastSql = `
      UPDATE order_monthly om
      SET
        om.forecast_total_units = (
          SELECT IFNULL(SUM(od.confirmed_units), 0)
          FROM order_daily od
          WHERE od.monthly_order_id = om.order_id
        ),
        om.forecast_diff = (
          SELECT IFNULL(SUM(od.confirmed_units), 0)
          FROM order_daily od
          WHERE od.monthly_order_id = om.order_id
        ) - om.forecast_units
      WHERE om.year = ?
      AND om.month = ?
      ${destination_cd ? "AND om.destination_cd = ?" : ""}
    `;
    const updateForecastParams = destination_cd ? [year, month, destination_cd] : [year, month];

    await connection.query(updateForecastSql, updateForecastParams);
    await insertLog(
      connection,
      "update",
      "order_monthly",
      "-",
      "forecast_total_units / forecast_diff 更新",
    );

    await connection.commit();
    console.log("🔥 事务提交成功");

    res.json({
      success: true,
      message: "日別注文生成完了",
      insertedCount,
      updatedCount,
      total: insertedCount + updatedCount,
    });
  } catch (error) {
    console.error("🔥 generateDailyOrders 错误:", error);
    await connection.rollback();
    try {
      await insertLog(connection, "error", "system", "-", `エラー発生：${error.message}`);
    } catch (logErr) {
      console.error("🔥 ログ記録失敗:", logErr);
    }
    res.status(500).json({ message: "サーバーエラー", error: error.message });
  } finally {
    connection.release();
    console.log("🔥 数据库连接已释放");
  }
};

// 日別受注 一覧取得
export async function fetchDailyOrders(req, res) {
  try {
    const {
      year,
      month,
      day,
      destination_cd,
      keyword,
      specificDate,
      page = 1,
      pageSize = 20,
      all = false,
    } = req.query;

    let where = "WHERE 1=1";
    const params = [];
    if (year) {
      where += " AND year = ?";
      params.push(year);
    }
    if (month) {
      where += " AND month = ?";
      params.push(month);
    }
    if (day) {
      where += " AND day = ?";
      params.push(day);
    }
    if (specificDate) {
      where += " AND DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) = ?";
      params.push(specificDate);
    }
    if (destination_cd) {
      where += " AND destination_cd = ?";
      params.push(destination_cd);
    }
    if (keyword) {
      where += " AND (product_cd LIKE ? OR product_name LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let sql = `
      SELECT * FROM order_daily
      ${where}
      ORDER BY year DESC, month DESC, day DESC
    `;

    if (all !== "true" && all !== true) {
      const offset = (page - 1) * pageSize;
      sql += " LIMIT ?, ?";
      params.push(offset, Number(pageSize));
    }

    const [list] = await db.query(sql, params);

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM order_daily ${where}`,
      all === "true" || all === true ? params : params.slice(0, params.length - 2),
    );
    const total = countRows[0]?.total || 0;

    // 检查请求来源，如果是从ShippingCreateDialog.vue来的请求，直接返回数组格式
    const referer = req.headers.referer || '';
    const userAgent = req.headers['user-agent'] || '';

    // 检查是否包含特定的参数，这可能表明是从ShippingCreateDialog.vue来的请求
    const isFromShippingCreate = req.query.startDate && req.query.endDate;

    if (isFromShippingCreate) {
      // 直接返回数组格式
      console.log('检测到来自ShippingCreateDialog的请求，返回数组格式');
      res.json(list);
    } else {
      // 返回标准格式
      res.json({
        success: true,
        data: { list, total },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "注文一覧取得失敗" });
  }
}

// 通过月订单ID取得所有日订单
export async function fetchDailyOrdersByMonthlyOrderId(req, res) {
  try {
    const { monthlyOrderId } = req.params;
    const rows = await query(
      `SELECT * FROM order_daily WHERE monthly_order_id = ? ORDER BY day ASC`,
      [monthlyOrderId],
    );

    res.json({
      success: true,
      data: {
        list: rows || [],
      },
    });
  } catch (error) {
    console.error("fetchDailyOrdersByMonthlyOrderId error", error);
    res.status(500).json({
      success: false,
      message: "データ取得失敗",
      error: error.message,
    });
  }
}

// 日別受注 単件更新
export async function updateDailyOrder(req, res) {
  console.log("---UPDATE DAILY ORDER 请求体---");
  console.log("请求参数ID:", req.params.id);
  console.log("请求体:", req.body);
  console.log("req.user:", req.user);

  const id = req.params.id;

  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: "不正なIDです（正の数値IDが必要）" });
  }

  // 提取 req.body 的所有字段，给予明确的默认值 undefined
  const { confirmed_boxes, confirmed_units, status, remarks, confirmed, confirmed_at } = req.body;

  try {
    const confirmedBy = getConfirmedBy(req);
    console.log("确认人:", confirmedBy);
    console.log("确认时间:", getJapanDatetime());

    // 动态拼接SQL，只更新前端传递的字段
    const fields = [];
    const values = [];

    // 仅当值明确存在时才更新该字段
    if (confirmed_boxes !== undefined) {
      fields.push("confirmed_boxes = ?");
      values.push(confirmed_boxes);
    }
    if (confirmed_units !== undefined) {
      fields.push("confirmed_units = ?");
      values.push(confirmed_units);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (remarks !== undefined) {
      fields.push("remarks = ?");
      values.push(remarks);
    }
    if (confirmed !== undefined) {
      fields.push("confirmed = ?");
      values.push(confirmed);
    }

    // confirmed_by 和 confirmed_at 必须
    fields.push("confirmed_by = ?");
    values.push(confirmedBy);
    fields.push("confirmed_at = ?");
    values.push(getJapanDatetime());
    fields.push("updated_at = NOW()");

    const sql = `UPDATE order_daily SET ${fields.join(", ")} WHERE id = ?`;
    const sqlWithValues = sql.replace(/\?/g, (match, i) =>
      values[i] === undefined
        ? "undefined"
        : typeof values[i] === "string"
          ? `'${values[i]}'`
          : values[i],
    );
    console.log("执行SQL:", sqlWithValues, values, Number(id));

    await db.query(sql, [...values, Number(id)]);
    console.log("更新成功");

    res.json({ success: true });
  } catch (error) {
    console.error("日別受注更新失敗", error);
    res.status(500).json({ success: false, message: "サーバーエラー", error });
  }
}

// 日志查询
export const getLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, action, target_type, keyword } = req.query;

    const filters = [];
    const params = [];

    if (action) {
      filters.push("action = ?");
      params.push(action);
    }
    if (target_type) {
      filters.push("target_type = ?");
      params.push(target_type);
    }
    if (keyword) {
      filters.push("message LIKE ?");
      params.push(`%${keyword}%`);
    }

    const whereSql = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    const sql = `
      SELECT * FROM order_log
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${pageSizeNum} OFFSET ${offset}
    `;

    const [list] = await query(sql, params);

    const countSql = `
      SELECT COUNT(*) as total FROM order_log
      ${whereSql}
    `;
    const [countResult] = await query(countSql, params);

    // 🔥 返回包裹在 data里
    res.json({
      success: true,
      message: "取得成功",
      data: {
        list: list || [],
        total: countResult[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("ログ取得失敗", err);
    res.status(500).json({
      success: false,
      message: "ログ取得失敗",
      data: null,
      error: err.message,
    });
  }
};

// 批量更新日订单
export async function batchUpdateDailyOrders(req, res) {
  console.log("---BATCH UPDATE DAILY ORDERS 请求体---");
  console.log("批量请求体:", req.body);
  console.log("req.user:", req.user);

  const updates = req.body.list;

  // 参数检查
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ success: false, message: "更新データがありません" });
  }

  // 检查用户认证状态
  if (!req.user) {
    console.error("用户未认证");
    return res.status(403).json({ success: false, message: "ログインが必要です" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 获取当前登录用户名
    const confirmedBy = getConfirmedBy(req);
    console.log("确认人:", confirmedBy);
    console.log("确认时间:", getJapanDatetime());

    for (const item of updates) {
      // 注意：解构时不要设置默认值，确保 undefined 的字段不会被更新
      const { id, forecast_units, confirmed_boxes, confirmed_units, status, remarks, confirmed } =
        item;

      // 加 ID 类型校验
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new Error(`不正なIDです（正の数値IDが必要）: ${id}`);
      }

      // 动态拼接SQL，只更新前端传递的字段
      const fields = [];
      const values = [];

      // 仅当值明确存在时才更新该字段
      if (forecast_units !== undefined) {
        fields.push("forecast_units = ?");
        values.push(forecast_units);
      }
      if (confirmed_boxes !== undefined) {
        fields.push("confirmed_boxes = ?");
        values.push(confirmed_boxes);
      }
      if (confirmed_units !== undefined) {
        fields.push("confirmed_units = ?");
        values.push(confirmed_units);
      }
      if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
      }
      if (remarks !== undefined) {
        fields.push("remarks = ?");
        values.push(remarks);
      }
      if (confirmed !== undefined) {
        fields.push("confirmed = ?");
        values.push(confirmed);
      }

      // confirmed_by 和 confirmed_at 必须
      fields.push("confirmed_by = ?");
      values.push(confirmedBy);
      fields.push("confirmed_at = ?");
      values.push(getJapanDatetime());
      fields.push("updated_at = NOW()");

      if (fields.length === 0) {
        console.warn(`订单 ${id} 没有字段需要更新，跳过`);
        continue;
      }

      const sql = `UPDATE order_daily SET ${fields.join(", ")} WHERE id = ?`;
      const sqlWithValues = sql.replace(/\?/g, (match, i) =>
        values[i] === undefined
          ? "undefined"
          : typeof values[i] === "string"
            ? `'${values[i]}'`
            : values[i],
      );
      console.log("执行SQL:", sqlWithValues, numericId);

      await conn.query(sql, [...values, numericId]);
    }

    // 获取关联的 monthly_order_id
    const ids = updates.map((u) => u.id);
    const [orderIdsResult] = await conn.query(
      `SELECT DISTINCT monthly_order_id FROM order_daily WHERE id IN (?)`,
      [ids],
    );
    const monthlyOrderIds = orderIdsResult.map((r) => r.monthly_order_id);

    // 更新月表 forecast_total_units / forecast_diff
    for (const monthlyOrderId of monthlyOrderIds) {
      const [sumResult] = await conn.query(
        `SELECT IFNULL(SUM(confirmed_units), 0) AS total FROM order_daily WHERE monthly_order_id = ?`,
        [monthlyOrderId],
      );
      const total = sumResult[0]?.total || 0;

      await conn.query(
        `UPDATE order_monthly
         SET forecast_total_units = ?,
             forecast_diff = ? - forecast_units
         WHERE order_id = ?`,
        [total, total, monthlyOrderId],
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    console.error("バッチ更新失敗:", error);
    res.status(500).json({ success: false, message: "更新に失敗しました", error: error.message });
  } finally {
    conn.release();
  }
}

// 内示差異ランキング用
export async function getForecastDiffRanking(req, res) {
  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);

  if (isNaN(year) || isNaN(month)) {
    return res.status(400).json({
      success: false,
      message: "Invalid year/month",
      data: null,
    });
  }

  try {
    const [positiveRows] = await db.query(
      `SELECT
      ROW_NUMBER() OVER (ORDER BY SUM(forecast_diff) DESC) AS \`rank\`,
      product_cd,
      product_name,
      SUM(forecast_diff) AS diff
    FROM order_monthly
    WHERE year = ? AND month = ?
    GROUP BY product_cd, product_name
    HAVING diff > 0
    LIMIT 10`,
      [year, month],
    );

    const [negativeRows] = await db.query(
      `SELECT
      ROW_NUMBER() OVER (ORDER BY SUM(forecast_diff) DESC) AS \`rank\`,
      product_cd,
      product_name,
      SUM(forecast_diff) AS diff
    FROM order_monthly
    WHERE year = ? AND month = ?
    GROUP BY product_cd, product_name
    HAVING diff < 0
    LIMIT 10`,
      [year, month],
    );

    res.json({
      success: true,
      data: {
        positive: positiveRows,
        negative: negativeRows,
      },
    });
  } catch (err) {
    console.error("差異ランキング取得失敗:", err);
    res.status(500).json({
      success: false,
      message: "サーバーエラー",
      data: null,
    });
  }
}

// 一括出荷済に更新
export const updateOrderDailyStatus = async (req, res) => {
  const { date, status } = req.body;

  if (!date || !status) {
    return res.status(400).json({ success: false, message: "日付と状態は必須です" });
  }

  try {
    const [result] = await db.query(
      `UPDATE order_daily
       SET status = ?
       WHERE DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) <= ?
         AND status != ?`,
      [status, date, status],
    );

    res.json({
      success: true,
      data: {
        updated: result.affectedRows,
      },
    });
  } catch (err) {
    console.error("一括状態更新失敗:", err);
    res.status(500).json({ success: false, message: "DBエラー" });
  }
};

// 出货履历用
export const getFilteredDailyOrders = async (req, res) => {
  const {
    year,
    month,
    destination_cd,
    status,
    startDate,
    endDate,
    product_cd,
    specificDate,
    page = 1,
    pageSize = 20,
  } = req.query;

  try {
    let sql = `SELECT * FROM order_daily WHERE 1=1`;
    const params = [];

    // 年・月
    if (year) {
      sql += ` AND year = ?`;
      params.push(Number(year));
    }
    if (month) {
      sql += ` AND month = ?`;
      params.push(Number(month));
    }

    // 納入先CD（部分一致）
    if (destination_cd) {
      sql += ` AND destination_cd LIKE ?`;
      params.push(`%${destination_cd}%`);
    }

    // 状態
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    // 出荷日（範囲）
    if (startDate) {
      sql += ` AND STR_TO_DATE(CONCAT(year,'-',LPAD(month,2,'0'),'-',LPAD(day,2,'0')), '%Y-%m-%d') >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND STR_TO_DATE(CONCAT(year,'-',LPAD(month,2,'0'),'-',LPAD(day,2,'0')), '%Y-%m-%d') <= ?`;
      params.push(endDate);
    }

    // 出荷日（指定日）
    if (specificDate) {
      sql += ` AND STR_TO_DATE(CONCAT(year,'-',LPAD(month,2,'0'),'-',LPAD(day,2,'0')), '%Y-%m-%d') = ?`;
      params.push(specificDate);
    }

    // 製品CD（完全一致）
    if (product_cd) {
      sql += ` AND product_cd = ?`;
      params.push(product_cd);
    }

    // 合計件数查询
    const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS tmp`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    // 限定件数
    sql += ` ORDER BY year DESC, month DESC, day DESC LIMIT ?, ?`;
    params.push((Number(page) - 1) * Number(pageSize), Number(pageSize));

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: { list: rows, total } });
  } catch (error) {
    console.error("日別出荷履歴取得失敗", error);
    res.status(500).json({
      success: false,
      message: "データ取得失敗",
      error: error.message,
    });
  }
};

// 指定納入先+年月的产品和数量列表
export async function getProductsByDestination(req, res) {
  const { destination_cd, year, month } = req.query;

  // 参数校验
  if (!destination_cd || !year || !month) {
    return res.status(400).json({
      success: false,
      message: "destination_cd, year, month は必須です",
    });
  }

  try {
    const [rows] = await db.execute(
      `
      SELECT
        p.product_cd,
        p.product_name,
        p.product_type,
        IFNULL(om.forecast_units, 0) AS forecast_units
      FROM
        products p
      LEFT JOIN
        order_monthly om
      ON
        om.product_cd = p.product_cd
        AND om.destination_cd = p.delivery_destination_cd
        AND om.year = ?
        AND om.month = ?
      WHERE
        p.delivery_destination_cd = ?
      ORDER BY
        p.product_cd
      `,
      [year, month, destination_cd],
    );

    // ✅ 成功返回
    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("❌ getProductsByDestination 取得失敗:", err);
    res.status(500).json({
      success: false,
      message: "データ取得失敗",
      error: err,
    });
  }
}

// 指定日受注データ取得
export async function fetchDailyOrdersByDate(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "日付が必要です",
      data: null,
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM order_daily
       WHERE DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) = ?`,
      [date],
    );

    return res.status(200).json({
      success: true,
      message: "",
      data: rows,
    });
  } catch (error) {
    console.error("日別注文検索エラー:", error);
    return res.status(500).json({
      success: false,
      message: "日別注文の取得中にエラーが発生しました",
      data: null,
    });
  }
}

// 一括日订单→流水表（支持去重 + 日期范围 + 实际出荷日）
export const batchShippingSync = async (req, res) => {
  const connection = await db.getConnection();
  let transaction = false;

  try {
    const mode = req.query.mode || "today"; // 'today' | 'all' | 'range'
    const startDateStr = req.query.start_date;
    const endDateStr = req.query.end_date;

    console.log(`[DEBUG] 开始同步，模式: ${mode}`);

    let dateCondition = "";
    const params = [];

    if (mode === "today") {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      dateCondition = `AND year = ? AND month = ? AND day = ? AND status = '出荷済'`;
      params.push(year, month, day);
      console.log(`[DEBUG] 今日模式: ${year}-${month}-${day}, 状态: 出荷済`);
    } else if (mode === "all") {
      // 全期間模式：获取当天之前所有订单
      const today = new Date();
      dateCondition = `AND DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0'))) <= ?`;
      params.push(today.toISOString().split("T")[0]);
      console.log(`[DEBUG] 全期間模式: <= ${today.toISOString().split("T")[0]}`);
    } else if (mode === "range" && startDateStr && endDateStr) {
      dateCondition = `
        AND DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0')))
        BETWEEN ? AND ?
      `;
      params.push(startDateStr, endDateStr);
      console.log(`[DEBUG] 範囲模式: ${startDateStr} ~ ${endDateStr}`);
    }

    // 开始事务
    await connection.beginTransaction();
    transaction = true;

    // 先查询有多少记录符合基本条件
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM order_daily
       WHERE confirmed_units > 0
       ${dateCondition}`,
      params,
    );
    const totalRecords = countRows[0].total;
    console.log(`[DEBUG] 符合条件的订单总数: ${totalRecords}`);

    // 检查已经同步过的订单ID列表
    const [syncedIds] = await connection.query(
      `SELECT DISTINCT SUBSTRING_INDEX(remarks, ':', -1) as order_id
       FROM stock_transaction_logs
       WHERE remarks LIKE '日订单ID:%'`,
    );

    const syncedIdsSet = new Set();
    for (const row of syncedIds) {
      if (row.order_id) {
        syncedIdsSet.add(row.order_id);
      }
    }

    console.log(`[DEBUG] 已同步过的订单数: ${syncedIdsSet.size}`);

    // 为性能考虑，根据数据量分批次处理
    const batchSize = 500; // 每批处理的记录数
    let processedCount = 0;
    let shipCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 如果数据量过大，分批处理
    for (let offset = 0; offset < totalRecords; offset += batchSize) {
      // ✅ 出荷済み同步 - 查找未同步的订单
      const shipQuery = `SELECT * FROM order_daily
         WHERE confirmed_units > 0
         ${dateCondition}
         ORDER BY id DESC
         LIMIT ${offset}, ${batchSize}`;
      console.log(`[DEBUG] 批次查询 ${offset}-${offset + batchSize}: ${shipQuery}`);

      const [shipOrders] = await connection.query(shipQuery, params);
      console.log(`[DEBUG] 本批次查询到 ${shipOrders.length} 条订单`);

      // 记录前几条订单详情以便调试
      if (shipOrders.length > 0 && offset === 0) {
        console.log(`[DEBUG] 订单示例:`, JSON.stringify(shipOrders.slice(0, 2), null, 2));
      }

      for (const order of shipOrders) {
        processedCount++;

        // 检查是否已同步
        if (syncedIdsSet.has(order.id.toString())) {
          console.log(`[DEBUG] 订单ID ${order.id} 已经同步过，跳过`);
          skipCount++;
          continue;
        }

        // 跳过confirmed_units为0的订单
        if (!order.confirmed_units || order.confirmed_units <= 0) {
          console.log(`[DEBUG] 订单ID ${order.id} 确定本数为0，跳过`);
          skipCount++;
          continue;
        }

        // 处理product_cd，将最后一位改为1
        let modifiedProductCd = order.product_cd;
        if (modifiedProductCd && modifiedProductCd.length > 0) {
          // 去掉最后一位，然后加上"1"
          modifiedProductCd = modifiedProductCd.slice(0, -1) + "1";
          console.log(`[DEBUG] 产品编码转换: ${order.product_cd} -> ${modifiedProductCd}`);
        }

        const remark = `日订单ID:${order.id}`;

        try {
          await connection.query(
            `INSERT INTO stock_transaction_logs
             (stock_type, target_cd, location_cd, transaction_type, quantity, unit,
              transaction_time, remarks, process_cd, operator_name, lot_no)
             VALUES ('製品', ?, '製品倉庫', '出荷', ?, '本',
             STR_TO_DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')), '%Y-%m-%d'),
             ?, '', '', '')`,
            [
              modifiedProductCd, // 使用修改后的产品编码
              order.confirmed_units ?? 0,
              order.year,
              order.month,
              order.day,
              remark,
            ],
          );
          shipCount++;

          // 每100条记录输出一次进度
          if (shipCount % 100 === 0) {
            console.log(`[DEBUG] 进度: 已同步 ${shipCount} 条记录`);
          }
        } catch (insertErr) {
          // 如果是重复键错误，忽略它
          if (insertErr.code === "ER_DUP_ENTRY") {
            console.log(`[DEBUG] 订单ID ${order.id} 同步时发生重复键错误，跳过`);
            skipCount++;
          } else {
            console.error(`[DEBUG] 同步订单ID ${order.id} 失败:`, insertErr.message);
            errorCount++;
          }
        }
      }

      // 每批次处理完毕后提交一次，避免事务过大
      await connection.commit();
      transaction = false;
      // 重新开始一个事务
      await connection.beginTransaction();
      transaction = true;

      console.log(`[DEBUG] 批次 ${offset}-${offset + batchSize} 处理完毕，已提交`);
    }

    // 最后一批提交
    if (transaction) {
      await connection.commit();
      transaction = false;
    }

    console.log(
      `[DEBUG] 同步完成 - 总计: ${totalRecords}, 已处理: ${processedCount}, 新增: ${shipCount}, 跳过: ${skipCount}, 错误: ${errorCount}`,
    );

    // 构建返回消息
    const summaryMessage = `${shipCount}件の注文を同期しました（${skipCount}件スキップ、${errorCount}件エラー）`;

    res.json({
      success: true,
      data: {
        mode,
        totalRecords,
        processed: processedCount,
        inserted: shipCount,
        skipped: skipCount,
        errors: errorCount,
        range: mode === "range" ? { start_date: startDateStr, end_date: endDateStr } : undefined,
        message: summaryMessage,
      },
    });
  } catch (err) {
    console.error("出荷履歴同期エラー:", err);

    // 如果事务已开始但未提交，回滚事务
    if (transaction) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("トランザクションのロールバックに失敗しました:", rollbackErr);
      }
    }

    res.status(500).json({
      success: false,
      message: "出荷履歴同期エラー: " + (err.message || err),
      error: err.toString(),
    });
  } finally {
    connection.release();
  }
};

//===================================================函数

// 日志插入函数
async function insertLog(connection, action, target_type, target_id, message) {
  await connection.query(
    `INSERT INTO order_log (action, target_type, target_id, message) VALUES (?, ?, ?, ?)`,
    [action, target_type, target_id, message],
  );
}

// 曜日取得関数（日）
function getJapaneseWeekday(date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}

// 统一封装一个「存在则更新，否则插入」的处理
async function upsertOrderDaily(order, workDate, forecastUnits, connection) {
  // 🔥 修复：确保 workDate 是 Date 对象
  const dateObj = workDate instanceof Date ? workDate : new Date(workDate);

  // 1. 先查出 products 表里的 unit_per_box
  const [productRows] = await connection.query(
    `SELECT unit_per_box FROM products WHERE product_cd = ? LIMIT 1`,
    [order.product_cd],
  );

  // 2. 取出入数，没有的话默认为 0
  const unitsPerBox = productRows.length > 0 ? productRows[0].unit_per_box || 0 : 0;

  // 3. 获取交付提前期
  const [destinations] = await connection.query(
    "SELECT delivery_lead_time FROM delivery_destinations WHERE destination_cd = ?",
    [order.destination_cd],
  );
  const leadTime = destinations[0]?.delivery_lead_time || 0;

  // 4. 计算交付日期
  const deliveryDate = new Date(dateObj);
  let daysToAdd = leadTime;

  // 循环添加工作日，直到满足所需的工作日数
  while (daysToAdd > 0) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const currentDate = deliveryDate.toISOString().split("T")[0];

    // 检查是否是假期
    const [holidays] = await connection.query(
      "SELECT holiday_date FROM destination_holidays WHERE destination_cd = ? AND holiday_date = ?",
      [order.destination_cd, currentDate],
    );

    // 检查是否是临时工作日
    const [overrides] = await connection.query(
      "SELECT work_date FROM destination_override_attendance WHERE destination_cd = ? AND work_date = ?",
      [order.destination_cd, currentDate],
    );

    // 如果是工作日（不是周末，不是假期，或者是临时工作日），则减少待添加的工作日数
    const isWeekend = deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6;
    const isHoliday = holidays.length > 0;
    const isOverrideWorkday = overrides.length > 0;

    if ((!isWeekend && !isHoliday) || isOverrideWorkday) {
      daysToAdd--;
    }
  }

  // 8. 检查日订单是否存在
  const [existing] = await connection.query(
    `
    SELECT id, confirmed_boxes, confirmed_units FROM order_daily
    WHERE monthly_order_id = ? AND year = ? AND month = ? AND day = ?
    `,
    [order.order_id, dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()],
  );

  if (existing.length > 0) {
    // 更新预测数量、入数和交付日期
    await connection.query(
      `
      UPDATE order_daily
      SET forecast_units = ?,
          unit_per_box = ?,
          delivery_date = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [forecastUnits, unitsPerBox, deliveryDate, existing[0].id],
    );

    return "update";
  } else {
    const confirmedBoxes = 0;
    const confirmedUnits = unitsPerBox * confirmedBoxes;

    await connection.query(
      `
      INSERT INTO order_daily (
        monthly_order_id,
        destination_cd,
        destination_name,
        year,
        month,
        day,
        weekday,
        product_cd,
        product_name,
        product_type,
        product_alias,
        forecast_units,
        confirmed_units,
        confirmed_boxes,
        unit_per_box,
        delivery_date,
        status,
        remarks,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        order.order_id,
        order.destination_cd,
        order.destination_name,
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate(),
        getJapaneseWeekday(dateObj),
        order.product_cd,
        order.product_name,
        order.product_type || "",
        order.product_alias || "",
        forecastUnits,
        confirmedUnits,
        confirmedBoxes,
        unitsPerBox,
        deliveryDate,
        "未出荷",
        "",
      ],
    );

    return "insert";
  }
}
// 在 updateDailyOrder 和 batchUpdateDailyOrders 里，处理 confirmed_at 字段为 MySQL DATETIME 格式
function toMysqlDatetime(val) {
  if (!val) return null;
  // 只取前19位并替换T为空格
  return val.replace("T", " ").substring(0, 19);
}

// 获取当前登录用户名，现在 authenticateToken 中间件会自动挂载用户信息
function getConfirmedBy(req) {
  // JWT 中间件已经挂载了 req.user 信息
  const username = req.user?.username || req.user?.name;
  console.log("当前认证用户:", username, req.user);
  return username || "系统用户";
}

// 获取日本时区当前时间（YYYY-MM-DD HH:mm:ss）
function getJapanDatetime() {
  const date = new Date();
  // 转为日本时区
  const japanDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return japanDate.toISOString().replace("T", " ").substring(0, 19);
}
