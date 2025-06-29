// 製品マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
import { success, fail } from "../../utils/response.js";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
const router = express.Router();

// === 前端 api/master/productMaster.ts  ==

// 允许写入字段
const allowedFields = [
  "product_cd",
  "product_name",
  "product_type",
  "category",
  "department_id",
  "delivery_destination_cd",
  "process_count",
  "lead_time",
  "lot_size",
  "is_multistage",
  "priority",
  "status",
  "part_number",
  "vehicle_model",
  "box_type",
  "unit_per_box",
  "dimensions",
  "weight",
  "material_cd",
  "cut_length",
  "chamfer_length",
  "developed_length",
  "take_count",
  "scrap_length",
  "bom_id",
  "route_cd",
  "safety_days",
  "unit_price",
  "note",
];

// 工具：过滤 req.body 中的有效字段
const extractFields = (body) => {
  const result = {};
  for (const key of allowedFields) {
    if (body.hasOwnProperty(key)) {
      let value = body[key];

      // 特殊処理：ブール型フィールドを数値に変換
      if (key === "is_multistage") {
        value = value ? 1 : 0;
      }

      result[key] = value;
    }
  }
  return result;
};

// 获取製品一覧
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const { keyword, category, product_cd, material_cd, route_cd, status, product_type } =
      req.query;

    const whereClauses = [];
    const params = [];

    // 🔍 キーワード（CD/名称/納入先名）部分一致
    if (keyword) {
      whereClauses.push(`(
        p.product_cd LIKE ? OR
        p.product_name LIKE ? OR
        d.destination_name LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // 🔎 カテゴリ
    if (category) {
      whereClauses.push("p.category = ?");
      params.push(category);
    }

    // 🔎 製品CD（精确匹配）
    if (product_cd) {
      whereClauses.push("p.product_cd = ?");
      params.push(product_cd);
    }

    // 🔎 材料CD（精确匹配）
    if (material_cd) {
      whereClauses.push("p.material_cd = ?");
      params.push(material_cd);
    }

    // 工程ルートCD
    if (route_cd) {
      whereClauses.push("p.route_cd = ?");
      params.push(route_cd);
    }
    // 製品種別（精确匹配）
    if (product_type) {
      whereClauses.push("p.product_type = ?");
      params.push(product_type);
    }
    // 状态
    if (req.query.status) {
      whereClauses.push("p.status = ?");
      params.push(req.query.status);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 製品情報 + 納入先名
    const [rows] = await db.query(
      `
      SELECT p.*, d.destination_name
      FROM products p
      LEFT JOIN delivery_destinations d ON p.delivery_destination_cd = d.destination_cd
      ${whereSQL}
      ORDER BY p.product_name ASC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset],
    );

    // データ型の正しい変換を保証
    const processedRows = rows.map((row) => ({
      ...row,
      is_multistage: Boolean(row.is_multistage), // ブール型に変換
      // 数値型フィールドの保証
      process_count: Number(row.process_count) || 1,
      lead_time: Number(row.lead_time) || 0,
      lot_size: Number(row.lot_size) || 1,
      priority: Number(row.priority) || 2,
      unit_per_box: Number(row.unit_per_box) || 0,
      weight: Number(row.weight) || 0,
      cut_length: Number(row.cut_length) || 0,
      chamfer_length: Number(row.chamfer_length) || 0,
      developed_length: Number(row.developed_length) || 0,
      scrap_length: Number(row.scrap_length) || 0,
      take_count: Number(row.take_count) || 0,
      safety_days: Number(row.safety_days) || 0,
      unit_price: Number(row.unit_price) || 0,
    }));

    // 総件数
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN delivery_destinations d ON p.delivery_destination_cd = d.destination_cd
      ${whereSQL}
      `,
      params,
    );

    res.json({
      success: true,
      data: {
        list: processedRows, // 処理済みデータを使用
        total: countRows[0].total,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "製品一覧取得失敗", error: e.message });
  }
});

// 製品新規登録
router.post("/", async (req, res) => {
  try {
    const product = extractFields(req.body);
    const { product_cd } = product;

    if (!product_cd) {
      return fail(res, "製品CDは必須です");
    }

    // ✅ 登録前に重複チェック
    const [existRows] = await db.query("SELECT id FROM products WHERE product_cd = ? LIMIT 1", [
      product_cd,
    ]);

    if (existRows.length > 0) {
      return fail(res, `製品CD「${product_cd}」は既に存在します`);
    }

    await db.query(
      "INSERT INTO products SET ?, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP",
      [product],
    );

    success(res, "登録成功");
  } catch (e) {
    console.error("登録失敗", e);
    fail(res, "登録失敗", e);
  }
});

// 製品更新
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = extractFields(req.body);

    await db.query("UPDATE products SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
      product,
      id,
    ]);
    success(res, "更新成功");
  } catch (e) {
    console.error("更新失敗", e);
    fail(res, "更新失敗", e);
  }
});

// 製品削除（管理者権限必須）
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [productInfo] = await db.query(
      "SELECT product_cd, product_name FROM products WHERE id = ?",
      [id],
    );

    if (productInfo.length === 0) {
      return fail(res, "製品が見つかりません");
    }

    await db.query("DELETE FROM products WHERE id = ?", [id]);

    console.log(
      `管理者 ${req.user.id} が製品を削除しました: ${productInfo[0].product_cd} - ${productInfo[0].product_name}`,
    );

    success(res, "削除成功");
  } catch (e) {
    console.error("削除失敗", e);
    fail(res, "削除失敗", e);
  }
});

// 製品状态切换
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query("UPDATE products SET status = ? WHERE id = ?", [status, id]);
    success(res, "状態更新成功");
  } catch (e) {
    fail(res, "状態更新失敗", e);
  }
});

// 製品CD最大値
router.get("/max-cd", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT product_cd
      FROM products
      ORDER BY id DESC
      LIMIT 1
    `);
    const latestCd = rows[0]?.product_cd || "90000";
    res.json({ success: true, data: latestCd });
  } catch (err) {
    console.error("製品CD取得失敗:", err);
    res.status(500).json({ success: false, message: "CD取得失敗" });
  }
});

export default router;
