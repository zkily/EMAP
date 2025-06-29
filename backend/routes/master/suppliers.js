// 仕入先マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 veiws/master/supplierMaster/SupplierList.vue  直接调用 ==
// === 前端 veiws/master/supplierMaster/SupplierEditDialog.vue  直接调用 ==

// 仕入先一覧取得
router.get("/", async (req, res) => {
  const { keyword = "", page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const [list] = await db.query(
      `
            SELECT * FROM suppliers
            WHERE supplier_cd LIKE ? OR supplier_name LIKE ?
            ORDER BY supplier_cd
            LIMIT ? OFFSET ?
        `,
      [`%${keyword}%`, `%${keyword}%`, Number(pageSize), Number(offset)],
    );

    const [[{ total }]] = await db.query(
      `
            SELECT COUNT(*) AS total
            FROM suppliers
            WHERE supplier_cd LIKE ? OR supplier_name LIKE ?
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
  const data = req.body;
  try {
    await db.query("INSERT INTO suppliers SET ?", [data]);
    res.json({ success: true, message: "登録しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  if (!data.supplier_cd || !data.supplier_name) {
    return res.status(400).json({ success: false, message: "必須項目が不足しています" });
  }

  try {
    await db.query(
      `UPDATE suppliers
         SET supplier_cd = ?, supplier_name = ?, contact_person = ?, phone = ?, email = ?
         WHERE id = ?`,
      [data.supplier_cd, data.supplier_name, data.contact_person, data.phone, data.email, id],
    );

    res.json({ success: true, message: "更新しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 削除
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM suppliers WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
