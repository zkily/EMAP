// 顧客マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 api/master/customerMaster.ts  ==

// 顧客一覧
router.get("/", async (req, res) => {
  const { keyword = "" } = req.query;
  const [data] = await db.query(
    `SELECT *
     FROM customers
     WHERE customer_cd LIKE ? OR customer_name LIKE ?
     ORDER BY id DESC`,
    [`%${keyword}%`, `%${keyword}%`],
  );
  res.json({ data });
});

// 顧客登録
router.post("/", async (req, res) => {
  const { customer_cd, customer_name, phone, address, customer_type } = req.body;
  await db.query(
    `INSERT INTO customers
     (customer_cd, customer_name, phone, address, customer_type)
     VALUES (?, ?, ?, ?, ?)`,
    [customer_cd, customer_name, phone, address, customer_type],
  );
  res.json({ message: "登録成功" });
});

// 顧客更新
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { customer_cd, customer_name, phone, address, customer_type } = req.body;
  await db.query(
    `UPDATE customers SET
       customer_cd = ?, customer_name = ?, phone = ?, address = ?, customer_type = ?
     WHERE id = ?`,
    [customer_cd, customer_name, phone, address, customer_type, id],
  );
  res.json({ message: "更新成功" });
});

// 顧客削除
router.delete("/:id", async (req, res) => {
  await db.query(`DELETE FROM customers WHERE id = ?`, [req.params.id]);
  res.json({ message: "削除成功" });
});

// 顧客状態切替
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  await db.query(`UPDATE customers SET status = ? WHERE id = ?`, [status, req.params.id]);
  res.json({ message: "状態更新成功" });
});

export default router;
