// 部品マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 veiws/master/supplierMaster/SupplierList.vue  直接调用 ==

// 部品一覧取得（検索 + ページング）
router.get("/", async (req, res) => {
  const { keyword = "", page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const [list] = await db.query(
      `
            SELECT c.*, s.supplier_name
            FROM components c
            LEFT JOIN suppliers s ON c.supplier_cd = s.supplier_cd
            WHERE c.component_cd LIKE ? OR c.component_name LIKE ?
            ORDER BY c.component_cd
            LIMIT ? OFFSET ?
        `,
      [`%${keyword}%`, `%${keyword}%`, Number(pageSize), Number(offset)],
    );

    const [[{ total }]] = await db.query(
      `
            SELECT COUNT(*) AS total
            FROM components
            WHERE component_cd LIKE ? OR component_name LIKE ?
        `,
      [`%${keyword}%`, `%${keyword}%`],
    );

    res.json({ success: true, data: list, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 新規登録
router.post("/", async (req, res) => {
  const rawData = { ...req.body };

  // 只取允许的字段
  const allowedFields = [
    "component_cd",
    "component_name",
    "spec_model",
    "unit",
    "procurement_type",
    "supplier_cd",
    "lead_time_days",
    "unit_price",
    "foreign_currency_price",
    "lot_size",
    "payment_type",
    "end_of_life_flag",
    "remarks",
  ];
  const data = {};
  allowedFields.forEach((key) => {
    if (rawData[key] !== undefined) {
      data[key] = rawData[key];
    }
  });

  try {
    await db.query("INSERT INTO components SET ?", [data]);
    res.json({ success: true, message: "登録しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const rawData = { ...req.body };

  // 只取允许的字段，防止多余字段或 Proxy 问题
  const allowedFields = [
    "component_cd",
    "component_name",
    "spec_model",
    "unit",
    "procurement_type",
    "supplier_cd",
    "lead_time_days",
    "unit_price",
    "foreign_currency_price",
    "lot_size",
    "payment_type",
    "end_of_life_flag",
    "remarks",
  ];
  const data = {};
  allowedFields.forEach((key) => {
    if (rawData[key] !== undefined) {
      data[key] = rawData[key];
    }
  });

  try {
    const [result] = await db.query("UPDATE components SET ? WHERE id = ?", [data, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "対象データが存在しません" });
    }

    res.json({ success: true, message: "更新しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 削除
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM components WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
