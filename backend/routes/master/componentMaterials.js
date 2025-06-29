import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// 📥 部品材料一覧取得
router.get("/:component_cd", async (req, res) => {
  const { component_cd } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT
        cm.id,
        cm.material_cd,
        m.material_name,
        cm.quantity,
        cm.unit_price
      FROM component_materials cm
      LEFT JOIN materials m ON cm.material_cd = m.material_cd
      WHERE cm.component_cd = ?
      ORDER BY cm.id ASC
    `,
      [component_cd],
    );
    res.json({ success: true, message: "OK", data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📥 材料1件追加
router.post("/", async (req, res) => {
  const { component_cd, material_cd, quantity, unit_price } = req.body;
  if (!component_cd || !material_cd) {
    return res.status(400).json({
      success: false,
      message: "component_cd, material_cd は必須です",
    });
  }
  try {
    await db.query(
      `
      INSERT INTO component_materials (component_cd, material_cd, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `,
      [component_cd, material_cd, quantity ?? 1, unit_price ?? 0],
    );
    res.json({ success: true, message: "登録しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📥 材料1件更新
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { material_cd, quantity, unit_price } = req.body;
  try {
    await db.query(
      `
      UPDATE component_materials
      SET material_cd = ?, quantity = ?, unit_price = ?
      WHERE id = ?
    `,
      [material_cd, quantity ?? 1, unit_price ?? 0, id],
    );
    res.json({ success: true, message: "更新しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📥 材料1件削除
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM component_materials WHERE id = ?`, [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
