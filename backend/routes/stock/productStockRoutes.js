import express from "express";
import { pool as db } from "../../db/connection.js";
import { importStockTransactions } from "./services/importStockTransactions.js";
import {
  addStockTransaction,
  getProductStockTrend,
  getDailyTrendData,
  getAllProductStockTrends,
  getStockDepletionDates,
  deleteStockLog,
  clearStockTrends,
} from "./controllers/productStockcontroller.js";
import { recalculateStockAndSnapshot } from "./services/productStockService.js"; // 製品在庫快照保存

const router = express.Router();

//============== 入出庫手动录入  和  入出庫履歴取得 =======================
// 入出庫履歴取得
router.get("/logs", async (req, res) => {
  const {
    stock_type,
    transaction_type, // 👈 确保取得
    keyword = "",
    location_cd,
    date_range = [],
    page = 1,
    pageSize = 20,
  } = req.query;

  const [startDate, endDate] = Array.isArray(date_range) ? date_range : [null, null];

  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  const values = [];

  // ✅ 条件句拼接（针对主数据查询）
  if (stock_type) {
    conditions.push("l.stock_type = ?");
    values.push(stock_type);
  }
  if (transaction_type) {
    conditions.push("l.transaction_type = ?");
    values.push(transaction_type);
  }
  if (location_cd) {
    conditions.push("l.location_cd LIKE ?");
    values.push(`%${location_cd}%`);
  }
  if (startDate && endDate) {
    conditions.push("DATE(l.transaction_time) BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }
  if (keyword) {
    conditions.push(`(
      l.target_cd LIKE ?
      OR (l.stock_type IN ('製品', '在制品') AND p.product_name LIKE ?)
      OR (l.stock_type = '材料' AND m.material_name LIKE ?)
      OR (l.stock_type = '部品' AND c.component_name LIKE ?)
    )`);
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  try {
    // ✅ 获取分页数据
    const [rows] = await db.query(
      `
      SELECT
        l.*,
        CASE
          WHEN l.stock_type IN ('製品', '在制品') THEN p.product_name
          WHEN l.stock_type = '材料' THEN m.material_name
          WHEN l.stock_type = '部品' THEN c.component_name
          ELSE ''
        END AS target_name,
        pr.process_name
      FROM stock_transaction_logs l
      LEFT JOIN products p ON l.stock_type IN ('製品', '在制品') AND l.target_cd = p.product_cd
      LEFT JOIN materials m ON l.stock_type = '材料' AND l.target_cd = m.material_cd
      LEFT JOIN components c ON l.stock_type = '部品' AND l.target_cd = c.component_cd
      LEFT JOIN processes pr ON l.process_cd = pr.process_cd
      ${whereClause}
      ORDER BY l.transaction_time DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset],
    );

    // ✅ 获取总数（也加入 transaction_type 条件）
    const countConditions = [];
    const countValues = [];

    if (stock_type) {
      countConditions.push("stock_type = ?");
      countValues.push(stock_type);
    }
    if (transaction_type) {
      countConditions.push("transaction_type = ?");
      countValues.push(transaction_type);
    }
    if (location_cd) {
      countConditions.push("location_cd LIKE ?");
      countValues.push(`%${location_cd}%`);
    }
    if (startDate && endDate) {
      countConditions.push("DATE(transaction_time) BETWEEN ? AND ?");
      countValues.push(startDate, endDate);
    }
    if (keyword) {
      countConditions.push(`(
        target_cd LIKE ?
        OR (stock_type IN ('製品', '在制品') AND EXISTS (
          SELECT 1 FROM products p WHERE p.product_cd = target_cd AND p.product_name LIKE ?
        ))
        OR (stock_type = '材料' AND EXISTS (
          SELECT 1 FROM materials m WHERE m.material_cd = target_cd AND m.material_name LIKE ?
        ))
        OR (stock_type = '部品' AND EXISTS (
          SELECT 1 FROM components c WHERE c.component_cd = target_cd AND c.component_name LIKE ?
        ))
      )`);
      countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const countWhere = countConditions.length ? "WHERE " + countConditions.join(" AND ") : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM stock_transaction_logs ${countWhere}`,
      countValues,
    );

    res.json({
      success: true,
      data: {
        list: rows,
        total: Number(total),
      },
    });
  } catch (err) {
    console.error("在庫ログ取得エラー:", err);
    res.status(500).json({
      success: false,
      message: "在庫ログ取得失敗",
      error: err,
    });
  }
});

// 全体在庫入出庫
router.post("/transaction", addStockTransaction);

// 在庫ログ削除
router.delete("/logs/:id", deleteStockLog);

// EXCEL読取製品倉庫入出庫
router.post("/import-stock", async (req, res) => {
  try {
    await importStockTransactions();
    res.json({ success: true, message: "在庫履歴をインポートしました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//==============          =======================

// 一体化组合调用 再计算 + 异常检测 + 报警 + 库存快照 + 流水归档
router.post("/products/recalculate-and-check", async (req, res) => {
  try {
    const result = await recalculateStockAndSnapshot();
    res.json({
      success: true,
      message: result.message || "在庫再計算が完了しました",
      data: result, // 所有业务字段都包进 data 里
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 製品在庫推移計算--选择
router.get("/product-trend", getProductStockTrend);

// 製品在庫推移計算--全製品
router.get("/product-trend/all", getAllProductStockTrends);

// 清空在庫推移表
router.post("/clear-trends", clearStockTrends);

// キャッシュ読取（前端ページ用）
router.get("/daily-trends", getDailyTrendData);

// 出荷枯渇予測
router.get("/stock-depletion-dates", getStockDepletionDates);

// 製品倉庫履歴検索
router.get("/snapshots", async (req, res) => {
  const { product_cd, location_cd, start_date, end_date } = req.query;
  let conditions = [];
  let params = [];

  if (product_cd) {
    conditions.push("s.product_cd = ?");
    params.push(product_cd);
  }
  if (location_cd) {
    conditions.push("s.location_cd = ?");
    params.push(location_cd);
  }
  if (start_date && end_date) {
    conditions.push("s.snapshot_date BETWEEN ? AND ?");
    params.push(start_date, end_date);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await db.query(
      `
    SELECT
      DATE_FORMAT(s.snapshot_date, '%Y-%m-%d') AS snapshot_date,
      s.product_cd,
      p.product_name,
      s.location_cd,
      s.lot_no,
      s.quantity
    FROM stock_product_snapshots s
    LEFT JOIN products p ON s.product_cd = p.product_cd
    ${where}
    ORDER BY s.snapshot_date, s.product_cd, s.location_cd
  `,
      params,
    );

    res.json({
      success: true,
      message: "OK",
      data: rows, // ✅ 注意加 data
    });
  } catch (err) {
    console.error("❌ 在庫スナップショット取得失敗:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
});

export default router;
