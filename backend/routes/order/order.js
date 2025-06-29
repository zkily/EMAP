import express from "express";
import { db } from "../../db/index.js";
import { success, fail, error } from "../../utils/response.js";
import multer from "multer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../../middleware/auth.js"; // 导入认证中间件
import {
  generateDailyOrders, // 出荷月订单→生成日订单
  fetchDailyOrders, // 日別受注 一覧取得
  fetchDailyOrdersByMonthlyOrderId, // 通过月订单ID取得所有日订单
  updateDailyOrder, // 日別受注 単件更新
  getLogs, // 日志查询
  batchUpdateDailyOrders, // 批量更新日订单
  getForecastDiffRanking, // 内示差異ランキング用
  updateOrderDailyStatus, // 一括出荷済に更新
  fetchDailyOrdersByDate, // 指定日受注データ取得
  getFilteredDailyOrders, // 出货履历用
  getProductsByDestination, // 指定納入先+年月的产品和数量列表
  batchShippingSync, // 一括日订单→流水表
} from "./controllers/orderController.js";
import {
  createOrderHistorySnapshot,
  getOrderHistoryComparison,
} from "./services/orderHistoryService.js";
const router = express.Router();

// === 前端 api/order/order.ts  ==

// 取得：月別注文リスト（带分页）
router.get("/monthly", async (req, res) => {
  try {
    const { year, month, destination_cd, keyword, page = 1, pageSize = 20 } = req.query;

    let where = "WHERE 1=1";
    if (year) where += ` AND year = ${year}`;
    if (month) where += ` AND month = ${month}`;
    if (destination_cd) where += ` AND destination_cd = '${destination_cd}'`;
    if (keyword) {
      where += ` AND (product_cd LIKE '%${keyword}%' OR product_name LIKE '%${keyword}%')`;
    }

    const offset = (page - 1) * pageSize;

    const [list] = await db.query(
      `
      SELECT *,
        (forecast_total_units - forecast_units) AS forecast_diff
      FROM order_monthly
      ${where}
      ORDER BY year DESC, month DESC
      LIMIT ?, ?
    `,
      [offset, Number(pageSize)],
    );

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) AS total FROM order_monthly
      ${where}
    `);

    res.json({
      success: true,
      data: { list, total },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "注文一覧取得失敗" });
  }
});

// 新增月订单
router.post("/monthly/add", async (req, res) => {
  try {
    const {
      order_id,
      destination_cd,
      destination_name,
      year,
      month,
      product_cd,
      product_name,
      product_type,
      product_alias,
      forecast_units,
      forecast_total_units,
    } = req.body;

    const sql = `INSERT INTO order_monthly
      (order_id, destination_cd, destination_name, year, month, product_cd, product_name, product_type, product_alias, forecast_units, forecast_total_units)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(sql, [
      order_id,
      destination_cd,
      destination_name,
      year,
      month,
      product_cd,
      product_name,
      product_type,
      product_alias,
      forecast_units,
      forecast_total_units,
    ]);

    success(res, { id: result.insertId });
  } catch (err) {
    fail(res, err);
  }
});

// 更新月订单
router.put("/monthly/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      destination_cd,
      destination_name,
      year,
      month,
      product_cd,
      product_name,
      product_type,
      product_alias,
      forecast_units,
      forecast_total_units,
    } = req.body;

    const sql = `UPDATE order_monthly SET
      destination_cd = ?, destination_name = ?, year = ?, month = ?, product_cd = ?, product_name = ?, product_type = ?, product_alias = ?, forecast_units = ?, forecast_total_units = ?
      WHERE id = ?`;

    await db.query(sql, [
      destination_cd,
      destination_name,
      year,
      month,
      product_cd,
      product_name,
      product_type,
      product_alias,
      forecast_units,
      forecast_total_units,
      id,
    ]);

    success(res);
  } catch (err) {
    fail(res, err);
  }
});

// 删除月订单
router.delete("/monthly/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return fail(res, new Error("IDが指定されていません"));
    }

    // 先根据 id 查出对应的 order_id
    const [orderRows] = await db.query(`SELECT order_id FROM order_monthly WHERE id = ?`, [id]);
    if (!orderRows.length) {
      return fail(res, new Error("対象の月別受注データが存在しません"));
    }
    const orderId = orderRows[0].order_id;

    // 🔥 先删除日订单（order_daily）
    await db.query(`DELETE FROM order_daily WHERE monthly_order_id = ?`, [orderId]);

    // 🔥 再删除月订单（order_monthly）
    await db.query(`DELETE FROM order_monthly WHERE id = ?`, [id]);

    success(res);
  } catch (err) {
    fail(res, err);
  }
});

// 检查指定 order_id 是否已经存在
router.get("/check-exists", async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return fail(res, "order_idは必須です");
  }

  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM order_monthly WHERE order_id = ?",
      [order_id],
    );

    const exists = rows[0]?.count > 0;
    success(res, { exists }); // 这里data返回 { exists: true/false }
  } catch (err) {
    error(res, err);
  }
});

// 生成日订单
router.post("/generate-daily", generateDailyOrders);

// 批量确认日订单
router.post("/daily/confirm-batch", authenticateToken, async (req, res) => {
  try {
    const { list } = req.body;

    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({
        success: false,
        message: "確認対象の注文データがありません",
      });
    }

    // 提取所有需要更新的订单ID
    const orderIds = list.map((item) => item.id);
    console.log(`批量确认订单，共${orderIds.length}个订单:`, orderIds);

    // 一次性更新所有订单的confirmed状态
    const [result] = await db.query(
      `UPDATE order_daily
       SET confirmed = 1,
           confirmed_at = NOW(),
           confirmed_by = ?
       WHERE id IN (?)`,
      [req.user?.username || "システム", orderIds],
    );

    res.json({
      success: true,
      message: `${result.affectedRows}件の注文を確認しました`,
      data: { updatedCount: result.affectedRows },
    });
  } catch (err) {
    console.error("批量确认订单失败:", err);
    res.status(500).json({
      success: false,
      message: "注文確認に失敗しました",
      error: err.message,
    });
  }
});

// 根据納入先CD查询对应的产品列表
router.post("/batch-create-monthly", async (req, res) => {
  try {
    const { year, month, destination_cd, destination_name, products } = req.body;

    if (!year || !month || !destination_cd || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json(fail(res, "パラメータが不正です"));
    }

    // 验证产品数据的完整性
    for (const product of products) {
      if (!product.product_cd || product.forecast_units === undefined) {
        return res.status(400).json(fail(res, "製品データが不完全です"));
      }

      // 确保forecast_units是数字类型
      if (isNaN(Number(product.forecast_units))) {
        return res.status(400).json(fail(res, `不正な数量値: ${product.product_cd}`));
      }
    }

    // 生成带order_id的数据
    const values = products.map((p) => {
      // 生成order_id: 年月+纳入先CD+产品CD
      const orderId = `${year}${String(month).padStart(2, "0")}${destination_cd}${p.product_cd}`;

      return [
        orderId, // order_id
        destination_cd,
        destination_name,
        year,
        month,
        p.product_cd,
        p.product_name,
        p.product_type || null,
        Number(p.forecast_units),
        0, // forecast_total_units 初期0
      ];
    });

    // 使用INSERT IGNORE避免重复数据错误
    const [insertResult] = await db.query(
      `
      INSERT IGNORE INTO order_monthly
      (order_id, destination_cd, destination_name, year, month, product_cd, product_name, product_type, forecast_units, forecast_total_units)
      VALUES ?
    `,
      [values],
    );

    // 更新納入先名称
    await db.query(`
      UPDATE order_monthly om
      JOIN delivery_destinations dd
        ON om.destination_cd = dd.destination_cd
      SET om.destination_name = dd.destination_name
      WHERE (om.destination_name IS NULL OR om.destination_name = '')
        AND om.destination_cd IS NOT NULL
    `);

    // 返回实际插入的记录数
    const actualInserted = insertResult.affectedRows;
    const totalAttempted = products.length;

    success(res, {
      inserted: actualInserted,
      total: totalAttempted,
      skipped: totalAttempted - actualInserted,
      message: `${actualInserted}件を登録しました（${totalAttempted - actualInserted}件は既存のためスキップ）`,
    });
  } catch (error) {
    console.error("一括登録エラー:", error);
    fail(res, "一括登録に失敗しました");
  }
});

// 受注情報を一括更新
router.post("/monthly/update-fields", async (req, res) => {
  try {
    const { startDate, updateProductInfo } = req.body;

    if (!startDate) {
      return fail(res, new Error("開始日は必須です"));
    }

    // 将startDate解析为年月
    const startDateObj = new Date(startDate);
    const startYear = startDateObj.getFullYear();
    const startMonth = startDateObj.getMonth() + 1;

    let updatedCount = 0;

    // 如果需要更新产品信息
    if (updateProductInfo) {
      // 获取所有需要更新的月订单 - 使用年月字段进行筛选
      const [orders] = await db.query(
        `SELECT om.id, om.product_cd, om.order_id
         FROM order_monthly om
         WHERE (om.year > ? OR (om.year = ? AND om.month >= ?))`,
        [startYear, startYear, startMonth],
      );

      if (orders && orders.length > 0) {
        // 对每个订单，从products表获取最新产品信息并更新
        for (const order of orders) {
          const [products] = await db.query(
            `SELECT product_cd, product_name, product_alias, product_type, unit_per_box
             FROM products
             WHERE product_cd = ?`,
            [order.product_cd],
          );

          if (products && products.length > 0) {
            const product = products[0];

            // 更新月订单的产品信息
            await db.query(
              `UPDATE order_monthly
               SET product_name = ?, product_alias = ?, product_type = ?
               WHERE id = ?`,
              [
                product.product_name,
                product.product_alias || null,
                product.product_type || null,
                order.id,
              ],
            );

            // 同步更新对应的日订单
            if (order.order_id) {
              await db.query(
                `UPDATE order_daily
                 SET product_name = ?, product_alias = ?, product_type = ?, unit_per_box = ?
                 WHERE monthly_order_id = ?`,
                [
                  product.product_name,
                  product.product_alias || null,
                  product.product_type || null,
                  product.unit_per_box || null,
                  order.order_id,
                ],
              );
            }

            updatedCount++;
          }
        }
      }
    }

    success(res, {
      updatedCount,
      message: `${updatedCount}件の受注情報を更新しました`,
    });
  } catch (err) {
    console.error("受注情報一括更新エラー:", err);
    fail(res, err);
  }
});

// 受注ダッシュボード集計
router.get("/dashboard-summary", async (req, res) => {
  const { year, month } = req.query;

  if (!year) {
    return res.status(400).json({ success: false, message: "yearは必須です" });
  }

  try {
    // 1️⃣ 納入先別集計
    const [destinationSummary] = await db.query(
      `
      SELECT
        destination_cd,
        destination_name,
        COUNT(*) AS order_count,
        SUM(forecast_units) AS forecast_units_sum
      FROM
        order_monthly
      WHERE
        year = ?
        ${month ? "AND month = ?" : ""}
      GROUP BY
        destination_cd, destination_name
      ORDER BY
        forecast_units_sum DESC
      `,
      month ? [year, month] : [year],
    );

    // 2️⃣ 月別集計
    const [monthlySummary] = await db.query(
      `
      SELECT
        month,
        SUM(forecast_units) AS forecast_units_sum
      FROM
        order_monthly
      WHERE
        year = ?
      GROUP BY
        month
      ORDER BY
        month
      `,
      [year],
    );

    res.json({
      success: true,
      data: {
        destinationSummary,
        monthlySummary,
      },
    });
  } catch (error) {
    console.error("dashboard-summary取得失敗", error);
    res.status(500).json({ success: false, message: "サーバーエラー" });
  }
});

//========================================================================导入的

// 日別受注 一覧取得
router.get("/daily", fetchDailyOrders);

// 通过月订单ID取得所有日订单
router.get("/daily/by-monthly/:monthlyOrderId", fetchDailyOrdersByMonthlyOrderId);

// 日別受注 单条更新
router.put("/daily/:id", authenticateToken, updateDailyOrder);

// 日志查询
router.get("/logs", getLogs);

// 批量更新日订单
router.post("/daily/batch-update", authenticateToken, batchUpdateDailyOrders);

// 内示差異ランキング用
router.get("/forecast-diff-ranking", getForecastDiffRanking);

// 一括出荷済に更新
router.post("/daily/update-status", updateOrderDailyStatus);

// 指定日受注データ取得
router.get("/daily/by-date", fetchDailyOrdersByDate);

// 出货履历用
router.get("/daily/list", getFilteredDailyOrders);

// 指定納入先+年月的产品和数量列表
router.get("/products", getProductsByDestination);

//=================================納入先別出荷履歴
// 納入先別日別一覧
router.get("/destination-history", async (req, res) => {
  const { destination_cd, start_date, end_date } = req.query;
  if (!destination_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    const [rows] = await db.query(
      `
        SELECT
        id,
        CONCAT(year, '-', LPAD(month, 2, '0'), '-', LPAD(day, 2, '0')) AS order_date,
        destination_cd,
        destination_name,
        product_cd,
        product_name,
        confirmed_units AS quantity,
        status
    FROM order_daily
    WHERE destination_cd = ?
      AND DATE(CONCAT(year, '-', month, '-', day)) BETWEEN ? AND ?
    ORDER BY order_date

    `,
      [destination_cd, start_date, end_date],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err); // ✅ 加详细日志
    res.status(500).json({ success: false, message: err.message });
  }
});

// 納入先別月別集計
router.get("/destination-monthly-summary", async (req, res) => {
  const { destination_cd, start_date, end_date } = req.query;
  if (!destination_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    // 提取年月日
    const start = new Date(start_date);
    const end = new Date(end_date);

    const start_year = start.getFullYear();
    const start_month = start.getMonth() + 1; // 注意：JS是0-11月
    const start_day = start.getDate();

    const end_year = end.getFullYear();
    const end_month = end.getMonth() + 1;
    const end_day = end.getDate();

    const [rows] = await db.query(
      `
      SELECT
          CONCAT(\`year\`, '-', LPAD(\`month\`, 2, '0')) AS ym,
          SUM(confirmed_units) AS total_quantity
      FROM order_daily
      WHERE destination_cd = ?
        AND (
            (\`year\` > ?)
            OR (\`year\` = ? AND (
                (\`month\` > ?) OR
                (\`month\` = ? AND \`day\` >= ?)
            ))
        )
        AND (
            (\`year\` < ?)
            OR (\`year\` = ? AND (
                (\`month\` < ?) OR
                (\`month\` = ? AND \`day\` <= ?)
            ))
        )
      GROUP BY \`year\`, \`month\`
      ORDER BY \`year\`, \`month\`
    `,
      [
        destination_cd,
        start_year,
        start_year,
        start_month,
        start_month,
        start_day,
        end_year,
        end_year,
        end_month,
        end_month,
        end_day,
      ],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 顧客別日別一覧
router.get("/customer-history", async (req, res) => {
  const { customer_cd, start_date, end_date } = req.query;
  if (!customer_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const sy = start.getFullYear(),
      sm = start.getMonth() + 1,
      sd = start.getDate();
    const ey = end.getFullYear(),
      em = end.getMonth() + 1,
      ed = end.getDate();

    const [rows] = await db.query(
      `
      SELECT
          o.id,
          CONCAT(o.\`year\`, '-', LPAD(o.\`month\`, 2, '0'), '-', LPAD(o.\`day\`, 2, '0')) AS order_date,
          o.destination_cd,
          d.destination_name,
          d.customer_cd,
          c.customer_name,
          o.product_cd,
          o.product_name,
          o.confirmed_units AS quantity,
          o.status
      FROM order_daily o
      JOIN delivery_destinations d ON o.destination_cd = d.destination_cd
      JOIN customers c ON d.customer_cd = c.customer_cd
      WHERE c.customer_cd = ?
        AND (
            (o.\`year\` > ?)
            OR (o.\`year\` = ? AND (
                (o.\`month\` > ?) OR
                (o.\`month\` = ? AND o.\`day\` >= ?)
            ))
        )
        AND (
            (o.\`year\` < ?)
            OR (o.\`year\` = ? AND (
                (o.\`month\` < ?) OR
                (o.\`month\` = ? AND o.\`day\` <= ?)
            ))
        )
      ORDER BY order_date
    `,
      [customer_cd, sy, sy, sm, sm, sd, ey, ey, em, em, ed],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 顧客別月別集計
router.get("/customer-monthly-summary", async (req, res) => {
  const { customer_cd, start_date, end_date } = req.query;
  if (!customer_cd || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "パラメータ不足" });
  }

  try {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const sy = start.getFullYear(),
      sm = start.getMonth() + 1,
      sd = start.getDate();
    const ey = end.getFullYear(),
      em = end.getMonth() + 1,
      ed = end.getDate();

    const [rows] = await db.query(
      `
      SELECT
          CONCAT(o.\`year\`, '-', LPAD(o.\`month\`, 2, '0')) AS ym,
          SUM(o.confirmed_units) AS total_quantity
      FROM order_daily o
      JOIN delivery_destinations d ON o.destination_cd = d.destination_cd
      JOIN customers c ON d.customer_cd = c.customer_cd
      WHERE c.customer_cd = ?
        AND (
            (o.\`year\` > ?)
            OR (o.\`year\` = ? AND (
                (o.\`month\` > ?) OR
                (o.\`month\` = ? AND o.\`day\` >= ?)
            ))
        )
        AND (
            (o.\`year\` < ?)
            OR (o.\`year\` = ? AND (
                (o.\`month\` < ?) OR
                (o.\`month\` = ? AND o.\`day\` <= ?)
            ))
        )
      GROUP BY o.\`year\`, o.\`month\`
      ORDER BY o.\`year\`, o.\`month\`
    `,
      [customer_cd, sy, sy, sm, sm, sd, ey, ey, em, em, ed],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

//==================================受注KPI
// 月別受注金額推移
router.get("/order-amount-trend", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          CONCAT(o.\`year\`, '-', LPAD(o.\`month\`, 2, '0')) AS ym,
          SUM(o.confirmed_units * IFNULL(p.unit_price, 0)) AS total_amount
      FROM order_daily o
      LEFT JOIN products p ON o.product_cd = p.product_cd
      GROUP BY o.\`year\`, o.\`month\`
      ORDER BY o.\`year\`, o.\`month\`
      LIMIT 12
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 月別受注数量推移
router.get("/order-quantity-trend", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          CONCAT(\`year\`, '-', LPAD(\`month\`, 2, '0')) AS ym,
          SUM(confirmed_units) AS total_quantity
      FROM order_daily
      GROUP BY \`year\`, \`month\`
      ORDER BY \`year\`, \`month\`
      LIMIT 12
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 顧客TOP10
router.get("/customer-top10", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT customer_name, SUM(confirmed_units) AS total_quantity
      FROM order_daily o
      JOIN delivery_destinations d ON o.destination_cd = d.destination_cd
      JOIN customers c ON d.customer_cd = c.customer_cd
      GROUP BY c.customer_cd
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 納入先TOP10
router.get("/destination-top10", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          destination_cd,
          destination_name,
          SUM(confirmed_units) AS total_quantity
      FROM order_daily
      GROUP BY destination_cd, destination_name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 製品TOP10
router.get("/product-top10", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT product_cd, product_name, SUM(confirmed_units) AS total_quantity
      FROM order_daily
      GROUP BY product_cd, product_name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 筛选KPI
router.get("/order-quantity-trend", async (req, res) => {
  try {
    // ✅ 从 query 参数获取 filter
    const { customer_cd, product_cd, destination_cd, start_date, end_date } = req.query;

    // ✅ 拼接 WHERE 条件
    let where = "WHERE 1=1";
    const values = [];

    if (customer_cd) {
      where += " AND customer_cd = ?";
      values.push(customer_cd);
    }
    if (product_cd) {
      where += " AND product_cd = ?";
      values.push(product_cd);
    }
    if (destination_cd) {
      where += " AND destination_cd = ?";
      values.push(destination_cd);
    }
    if (start_date && end_date) {
      where += ` AND STR_TO_DATE(CONCAT(year, '-', month, '-', day), '%Y-%m-%d') BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }

    // ✅ 拼接SQL
    const [rows] = await db.query(
      `
      SELECT
          CONCAT(year, '-', LPAD(month, 2, '0')) AS ym,
          SUM(confirmed_units) AS total_quantity
      FROM order_daily
      ${where}
      GROUP BY year, month
      ORDER BY year, month
    `,
      values,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Summaryカード
router.get("/summary", async (req, res) => {
  try {
    const { customer_cd, product_cd, destination_cd, start_date, end_date } = req.query;

    let where = "WHERE 1=1";
    const values = [];

    if (customer_cd && customer_cd.trim() !== "") {
      where += " AND customer_cd = ?";
      values.push(customer_cd);
    }
    if (product_cd && product_cd.trim() !== "") {
      where += " AND product_cd = ?";
      values.push(product_cd);
    }
    if (destination_cd && destination_cd.trim() !== "") {
      where += " AND destination_cd = ?";
      values.push(destination_cd);
    }
    if (start_date && end_date) {
      where += ` AND STR_TO_DATE(CONCAT(year, '-', month, '-', day), '%Y-%m-%d') BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }

    const [[summary]] = await db.query(
      `
    SELECT
      SUM(o.confirmed_units * IFNULL(p.unit_price, 0)) AS total_amount,
      SUM(o.confirmed_units) AS total_quantity,
      COUNT(DISTINCT d.customer_cd) AS customer_count,
      COUNT(DISTINCT o.product_cd) AS product_count,
      COUNT(DISTINCT o.destination_cd) AS destination_count
    FROM order_daily o
    LEFT JOIN products p ON o.product_cd = p.product_cd
    LEFT JOIN delivery_destinations d ON o.destination_cd = d.destination_cd
    ${where}
  `,
      values,
    );

    res.json({ success: true, data: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 平均単価推移
router.get("/average-unit-price-trend", async (req, res) => {
  try {
    const { customer_cd, product_cd, destination_cd, start_date, end_date } = req.query;

    let where = "WHERE 1=1";
    const values = [];

    if (customer_cd && customer_cd.trim() !== "") {
      where += " AND customer_cd = ?";
      values.push(customer_cd);
    }
    if (product_cd && product_cd.trim() !== "") {
      where += " AND product_cd = ?";
      values.push(product_cd);
    }
    if (destination_cd && destination_cd.trim() !== "") {
      where += " AND destination_cd = ?";
      values.push(destination_cd);
    }
    if (start_date && end_date) {
      where += ` AND STR_TO_DATE(CONCAT(year, '-', month, '-', day), '%Y-%m-%d') BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }

    const [rows] = await db.query(
      `
      SELECT
          CONCAT(o.year, '-', LPAD(o.month, 2, '0')) AS ym,
          CASE WHEN SUM(o.confirmed_units) > 0 THEN
              SUM(o.confirmed_units * IFNULL(p.unit_price, 0)) / SUM(o.confirmed_units)
          ELSE 0 END AS avg_unit_price
      FROM order_daily o
      LEFT JOIN products p ON o.product_cd = p.product_cd
      ${where}
      GROUP BY o.year, o.month
      ORDER BY o.year, o.month
    `,
      values,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 出荷遅延率
router.get("/shipping-delay-rate", async (req, res) => {
  try {
    const { customer_cd, product_cd, destination_cd, start_date, end_date } = req.query;

    let where = "WHERE 1=1";
    const values = [];

    if (customer_cd && customer_cd.trim() !== "") {
      where += " AND customer_cd = ?";
      values.push(customer_cd);
    }
    if (product_cd && product_cd.trim() !== "") {
      where += " AND product_cd = ?";
      values.push(product_cd);
    }
    if (destination_cd && destination_cd.trim() !== "") {
      where += " AND destination_cd = ?";
      values.push(destination_cd);
    }
    if (start_date && end_date) {
      where += ` AND STR_TO_DATE(CONCAT(year, '-', month, '-', day), '%Y-%m-%d') BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }

    const [[totalRow]] = await db.query(
      `SELECT SUM(confirmed_units) AS total FROM order_daily ${where}`,
      values,
    );
    const [[delayedRow]] = await db.query(
      `SELECT SUM(confirmed_units) AS delayed FROM order_daily ${where} AND status = '未出荷'`,
      values,
    );

    const total = totalRow.total ?? 0;
    const delayed = delayedRow.delayed ?? 0;
    const rate = total > 0 ? Math.round((delayed / total) * 10000) / 100 : 0; // 小数第2位%

    res.json({ success: true, data: { total, delayed, rate } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//====================================================订单解析

// multer 用于处理上传
const upload = multer({ dest: "uploads/" });

// ✅ 上传 + 解析
router.post("/import-batch", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "ファイルがありません" });
    }

    const destination_cd = req.body.destination_cd;
    if (!destination_cd) {
      return res.status(400).json({ success: false, message: "納入先CDがありません" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    let jsonData = [];
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = xlsx.readFile(req.file.path);

      // ✅ destination_cd 分流
      if (destination_cd === "D001") {
        jsonData = parseDestinationD001(workbook);
      } else if (destination_cd === "D002") {
        jsonData = parseDestinationD002(workbook);
      } else {
        jsonData = parseDefault(workbook);
      }

      res.json(jsonData);
    } else {
      res.status(400).json({ success: false, message: "対応していないファイル形式" });
    }

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "解析中にエラーが発生しました" });
  }
});

// ✅ 【批量导入】确认 → 写入 order_daily
router.post("/import-batch/confirm", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const orders = req.body.data;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, message: "データがありません" });
    }

    await connection.beginTransaction();

    for (const order of orders) {
      await connection.query(
        `INSERT INTO order_daily
         (destination_cd, order_date, product_cd, product_name, confirmed_units, unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          order.destination_cd,
          order.order_date,
          order.product_cd,
          order.product_name,
          order.order_quantity,
          order.unit,
        ],
      );
    }

    await connection.commit();
    res.json({ success: true, message: "注文データ登録完了" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: "登録中にエラー発生" });
  } finally {
    connection.release();
  }
});

// ✅ 各納入先の専用解析
function parseDestinationD001(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map((row) => ({
    destination_cd: "D001",
    order_date: row["注文日"],
    product_cd: row["製品CD"],
    product_name: row["製品名"],
    order_quantity: row["数量"],
    unit: row["単位"],
  }));
}

function parseDestinationD002(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map((row) => ({
    destination_cd: "D002",
    order_date: row["Order Date"],
    product_cd: row["Product Code"],
    product_name: row["Product Name"],
    order_quantity: row["Qty"],
    unit: row["Unit"],
  }));
}

// ✅ デフォルトテンプレート
function parseDefault(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map((row) => ({
    destination_cd: "",
    order_date: row["order_date"],
    product_cd: row["product_cd"],
    product_name: row["product_name"],
    order_quantity: row["quantity"],
    unit: row["unit"],
  }));
}

//====================================日订单同步到流水表

// 一括日订单→流水表(整合版)
router.get("/batch-shipping-sync", batchShippingSync);

// 📊 受注履歴比較
router.get("/monthly/history-comparison", async (req, res) => {
  try {
    const { year, month, baseRecordMonth, baseRecordYear, compareRecordMonth, compareRecordYear } =
      req.query;

    // 参数验证
    if (
      !year ||
      !month ||
      !baseRecordMonth ||
      !baseRecordYear ||
      !compareRecordMonth ||
      !compareRecordYear
    ) {
      return res.status(400).json({
        success: false,
        message: "必須パラメータが不足しています",
      });
    }

    const results = await getOrderHistoryComparison({
      year: parseInt(year),
      month: parseInt(month),
      baseRecordMonth: parseInt(baseRecordMonth),
      baseRecordYear: parseInt(baseRecordYear),
      compareRecordMonth: parseInt(compareRecordMonth),
      compareRecordYear: parseInt(compareRecordYear),
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("受注履歴比較の取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "エラーが発生しました",
      error: error.message,
    });
  }
});

// 手動で受注履歴を記録（主に開発用）
router.post("/monthly/create-history", async (req, res) => {
  try {
    const result = await createOrderHistorySnapshot();
    res.json(result);
  } catch (error) {
    console.error("受注履歴記録エラー:", error);
    res.status(500).json({
      success: false,
      message: "エラーが発生しました",
      error: error.message,
    });
  }
});

// 新增日订单
router.post("/daily", async (req, res) => {
  try {
    const {
      destination_cd,
      destination_name,
      year,
      month,
      day,
      weekday,
      product_cd,
      product_name,
      product_type,
      unit_per_box,
      confirmed_boxes,
      confirmed_units,
    } = req.body;

    const sql = `INSERT INTO order_daily
      (destination_cd, destination_name, year, month, day, weekday, product_cd, product_name,
       product_type, unit_per_box, confirmed_boxes, confirmed_units, status, delivery_date,
       monthly_order_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const [result] = await db.query(sql, [
      destination_cd,
      destination_name,
      year,
      month,
      day,
      weekday,
      product_cd,
      product_name,
      product_type,
      unit_per_box,
      confirmed_boxes,
      confirmed_units,
      req.body.status,
      req.body.delivery_date,
      req.body.monthly_order_id,
    ]);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("日订单新增失败", err);
    res.status(500).json({ success: false, message: "日订单新增失败", error: err.message });
  }
});

// 删除日订单
router.delete("/daily/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "IDが必要です" });
    await db.query("DELETE FROM order_daily WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "削除失敗", error: err.message });
  }
});

// 获取月订单合计
router.get("/monthly/summary", async (req, res) => {
  try {
    const { year, month, destination_cd, keyword } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    // 排除产品名包含"加工"的品种
    where += " AND (product_name IS NULL OR product_name NOT LIKE '%加工%')";

    if (year) {
      where += " AND year = ?";
      params.push(year);
    }
    if (month) {
      where += " AND month = ?";
      params.push(month);
    }
    if (destination_cd) {
      where += " AND destination_cd = ?";
      params.push(destination_cd);
    }
    if (keyword) {
      where += " AND (product_cd LIKE ? OR product_name LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    const [rows] = await db.query(
      `SELECT
        SUM(forecast_units) AS forecast_units,
        SUM(forecast_total_units) AS forecast_total_units,
        SUM(forecast_diff) AS forecast_diff
      FROM order_monthly ${where}`,
      params,
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "集計失敗", error: err.message });
  }
});

// 添加新的API端点，替代原/api/shipping/suggestion功能
router.get("/daily", async (req, res) => {
  try {
    const { startDate, endDate, destination_cd } = req.query;

    if (!startDate) {
      return res.status(400).json({ success: false, message: "開始日付が必要です" });
    }

    console.log("クエリパラメータ:", { startDate, endDate, destination_cd });

    // 构建查询条件
    let conditions = ["o.confirmed_units > 0"];
    let params = [];

    // 添加日期条件
    if (endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth() + 1;
      const startDay = startDateObj.getDate();

      const endYear = endDateObj.getFullYear();
      const endMonth = endDateObj.getMonth() + 1;
      const endDay = endDateObj.getDate();

      // 复杂的条件来模拟日期范围
      conditions.push(`(
        (o.year > ? OR (o.year = ? AND o.month > ?) OR (o.year = ? AND o.month = ? AND o.day >= ?))
        AND
        (o.year < ? OR (o.year = ? AND o.month < ?) OR (o.year = ? AND o.month = ? AND o.day <= ?))
      )`);

      // 添加开始日期参数
      params.push(startYear, startYear, startMonth, startYear, startMonth, startDay);
      // 添加结束日期参数
      params.push(endYear, endYear, endMonth, endYear, endMonth, endDay);
    } else {
      const dateObj = new Date(startDate);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();

      conditions.push(
        `(o.year > ? OR (o.year = ? AND o.month > ?) OR (o.year = ? AND o.month = ? AND o.day >= ?))`,
      );
      params.push(year, year, month, year, month, day);
    }

    // 添加纳入先条件
    if (destination_cd) {
      conditions.push("o.destination_cd = ?");
      params.push(destination_cd);
    }

    // 添加箱数条件
    conditions.push("o.confirmed_boxes > 0");

    // 拼接WHERE条件
    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT
        o.product_cd,
        p.product_name,
        o.destination_cd,
        o.destination_name,
        CONCAT(o.year, '-', LPAD(o.month, 2, '0'), '-', LPAD(o.day, 2, '0')) AS shipping_date,
        o.delivery_date,
        p.box_type,
        o.shipping_no,
        SUM(o.confirmed_units) AS confirmed_units,
        SUM(o.confirmed_boxes) AS confirmed_boxes
      FROM order_daily o
      LEFT JOIN products p ON o.product_cd = p.product_cd
      WHERE ${whereClause}
      GROUP BY o.product_cd, o.destination_cd, o.destination_name, o.year, o.month, o.day, o.delivery_date, p.box_type
      HAVING SUM(o.confirmed_units) > 0
      ORDER BY o.year, o.month, o.day ASC
    `;

    console.log("クエリを実行:", query);
    console.log("クエリパラメータ:", params);

    const [rows] = await db.query(query, params);

    console.log("クエリ結果数:", rows.length);
    // 返回标准格式的响应，包含success字段和data数组，不要包含嵌套的list结构
    res.json({
      success: true,
      message: `${rows.length}件のデータが見つかりました`,
      data: rows, // 直接返回数组，不要包装在list属性中
    });
  } catch (error) {
    console.error("日次オーダーデータの取得に失敗しました:", error);
    res
      .status(500)
      .json({ success: false, message: "サーバーエラーが発生しました: " + error.message });
  }
});

// 添加新的API端点，替代原/api/shipping/suggestion/update-shipping-no功能
router.patch("/daily/update-shipping-no", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: "更新データが必要です。" });
    }

    await connection.beginTransaction();

    const updatePromises = updates.map((item) => {
      const { product_cd, destination_cd, shipping_date, shipping_no } = item;

      // 将shipping_date (YYYY-MM-DD) 分割为 year, month, day
      const dateParts = shipping_date.split("-").map((part) => parseInt(part, 10));
      const [year, month, day] = dateParts;

      const query = `
        UPDATE order_daily
        SET shipping_no = ?
        WHERE product_cd = ?
          AND destination_cd = ?
          AND year = ?
          AND month = ?
          AND day = ?
          AND (shipping_no IS NULL OR shipping_no = '')
      `;
      return connection.query(query, [shipping_no, product_cd, destination_cd, year, month, day]);
    });

    await Promise.all(updatePromises);

    await connection.commit();
    res.json({ success: true, message: "出荷番号の更新が成功しました。" });
  } catch (error) {
    await connection.rollback();
    console.error("出荷番号の更新に失敗しました:", error);
    res
      .status(500)
      .json({ success: false, message: "サーバーエラーが発生しました: " + error.message });
  } finally {
    connection.release();
  }
});

// 检测没有ピッキング的订单 - confirmed_boxes > 0 但 shipping_no 为空
router.get("/daily/unpicked", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      destination_cd,
      page = 1,
      pageSize = 50,
      export: isExport = false,
    } = req.query;

    console.log("未ピッキング検索パラメータ:", {
      startDate,
      endDate,
      destination_cd,
      page,
      pageSize,
    });

    // 构建查询条件
    let conditions = ["o.confirmed_boxes > 0", "(o.shipping_no IS NULL OR o.shipping_no = '')"];
    let params = [];

    // 添加日期条件
    if (startDate) {
      const startDateObj = new Date(startDate);
      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth() + 1;
      const startDay = startDateObj.getDate();

      if (endDate) {
        const endDateObj = new Date(endDate);
        const endYear = endDateObj.getFullYear();
        const endMonth = endDateObj.getMonth() + 1;
        const endDay = endDateObj.getDate();

        conditions.push(`(
          (o.year > ? OR (o.year = ? AND o.month > ?) OR (o.year = ? AND o.month = ? AND o.day >= ?))
          AND
          (o.year < ? OR (o.year = ? AND o.month < ?) OR (o.year = ? AND o.month = ? AND o.day <= ?))
        )`);

        params.push(startYear, startYear, startMonth, startYear, startMonth, startDay);
        params.push(endYear, endYear, endMonth, endYear, endMonth, endDay);
      } else {
        conditions.push(
          `(o.year > ? OR (o.year = ? AND o.month > ?) OR (o.year = ? AND o.month = ? AND o.day >= ?))`,
        );
        params.push(startYear, startYear, startMonth, startYear, startMonth, startDay);
      }
    }

    // 添加纳入先条件
    if (destination_cd) {
      conditions.push("o.destination_cd = ?");
      params.push(destination_cd);
    }

    const whereClause = conditions.join(" AND ");

    // 构建查询语句
    let query = `
      SELECT
        o.id,
        o.destination_cd,
        o.destination_name,
        o.product_cd,
        o.product_name,
        o.product_alias,
        o.confirmed_boxes,
        o.confirmed_units,
        o.unit_per_box,
        o.status,
        o.year,
        o.month,
        o.day,
        o.weekday,
        o.delivery_date,
        o.remarks,
        o.created_at,
        o.updated_at,
        CONCAT(o.year, '-', LPAD(o.month, 2, '0'), '-', LPAD(o.day, 2, '0')) AS shipping_date,
        p.box_type
      FROM order_daily o
      LEFT JOIN products p ON o.product_cd = p.product_cd
      WHERE ${whereClause}
      ORDER BY o.year DESC, o.month DESC, o.day DESC, o.destination_cd, o.product_cd
    `;

    // 如果不是导出，添加分页
    if (!isExport || isExport === "false") {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      query += ` LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
    }

    console.log("未ピッキング検索クエリ:", query);
    console.log("クエリパラメータ:", params);

    const [rows] = await db.query(query, params);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM order_daily o
      WHERE ${whereClause}
    `;

    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // 计算汇总数据
    const summaryQuery = `
      SELECT
        COUNT(*) as total_orders,
        SUM(o.confirmed_boxes) as total_boxes,
        SUM(o.confirmed_units) as total_units,
        COUNT(DISTINCT o.destination_cd) as destination_count,
        COUNT(DISTINCT o.product_cd) as product_count,
        COUNT(DISTINCT CONCAT(o.year, '-', LPAD(o.month, 2, '0'), '-', LPAD(o.day, 2, '0'))) as date_count
      FROM order_daily o
      WHERE ${whereClause}
    `;

    const [summaryRows] = await db.query(summaryQuery, params);
    const summary = summaryRows[0];

    console.log("未ピッキング検索結果:", {
      found: rows.length,
      total: total,
      summary: summary,
    });

    res.json({
      success: true,
      message: `${total}件の未ピッキングデータが見つかりました`,
      data: {
        list: rows,
        total: total,
        summary: {
          totalOrders: summary.total_orders,
          totalBoxes: summary.total_boxes,
          totalUnits: summary.total_units,
          destinationCount: summary.destination_count,
          productCount: summary.product_count,
          dateCount: summary.date_count,
        },
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      },
    });
  } catch (error) {
    console.error("未ピッキングデータの取得に失敗しました:", error);
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました: " + error.message,
    });
  }
});

export default router;
