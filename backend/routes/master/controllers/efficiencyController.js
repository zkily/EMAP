import { pool as db } from "../../../db/connection.js";

// 一覧取得
export async function getEfficiencies(req, res) {
  const [rows] = await db.query(`
    SELECT * FROM product_process_machine_efficiency
    ORDER BY product_cd, process_cd, machine_cd
  `);
  res.json({ success: true, data: { list: rows, total: rows.length } });
}

// 新規作成
export async function createEfficiency(req, res) {
  const data = req.body;
  const [result] = await db.query(`INSERT INTO product_process_machine_efficiency SET ?`, [data]);
  res.json({ success: true, data: { id: result.insertId } });
}

// 更新
export async function updateEfficiency(req, res) {
  const data = req.body;
  await db.query(`UPDATE product_process_machine_efficiency SET ? WHERE id = ?`, [
    data,
    req.params.id,
  ]);
  res.json({ success: true, data: null });
}

// 削除
export async function deleteEfficiency(req, res) {
  await db.query(`DELETE FROM product_process_machine_efficiency WHERE id = ?`, [req.params.id]);
  res.json({ success: true, data: null });
}
