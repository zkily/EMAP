// 送便マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 api/master/carrierMaster.ts  ==

// 運送便一覧取得
router.get("/", async (req, res) => {
  const { keyword = "" } = req.query;
  const [data] = await db.query(
    `SELECT * FROM carriers WHERE carrier_cd LIKE ? OR carrier_name LIKE ? ORDER BY id DESC`,
    [`%${keyword}%`, `%${keyword}%`],
  );
  res.json({ data });
});

// 運送便登録
router.post("/", async (req, res) => {
  const { carrier_cd, carrier_name, contact_person, phone, shipping_time, report_no, note } =
    req.body;
  await db.query(
    `INSERT INTO carriers (carrier_cd, carrier_name, contact_person, phone, shipping_time, report_no, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [carrier_cd, carrier_name, contact_person, phone, shipping_time, report_no, note],
  );
  res.json({ message: "登録成功" });
});

// 運送便編集
router.put("/:id", async (req, res) => {
  const { carrier_cd, carrier_name, contact_person, phone, shipping_time, report_no, note } =
    req.body;
  await db.query(
    `UPDATE carriers SET
      carrier_cd=?, carrier_name=?, contact_person=?, phone=?,
      shipping_time=?, report_no=?, note=?
     WHERE id=?`,
    [
      carrier_cd,
      carrier_name,
      contact_person,
      phone,
      shipping_time,
      report_no,
      note,
      req.params.id,
    ],
  );
  res.json({ message: "更新成功" });
});

// 運送便削除
router.delete("/:id", async (req, res) => {
  await db.query(`DELETE FROM carriers WHERE id=?`, [req.params.id]);
  res.json({ message: "削除成功" });
});

// 運送便状態切替
router.put("/:id/status", async (req, res) => {
  await db.query(`UPDATE carriers SET status=? WHERE id=?`, [req.body.status, req.params.id]);
  res.json({ message: "状態更新" });
});

export default router;
