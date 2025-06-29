// 納入先マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 api/master/destinationMaster.ts  ==

// 获取納入先列表
router.get("/", async (req, res) => {
  const { keyword = "" } = req.query;
  const [data] = await db.query(
    `SELECT * FROM delivery_destinations
     WHERE destination_cd LIKE ? OR destination_name LIKE ?
     ORDER BY id DESC`,
    [`%${keyword}%`, `%${keyword}%`],
  );
  res.json({ data });
});

// 新增納入先
router.post("/", async (req, res) => {
  const {
    destination_cd,
    destination_name,
    customer_cd,
    carrier_cd,
    delivery_lead_time,
    issue_type,
    phone,
    address,
  } = req.body;
  await db.query(
    `INSERT INTO delivery_destinations
    (destination_cd, destination_name, customer_cd, carrier_cd, delivery_lead_time, issue_type, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      destination_cd,
      destination_name,
      customer_cd,
      carrier_cd,
      delivery_lead_time,
      issue_type,
      phone,
      address,
    ],
  );
  res.json({ message: "納入先を登録しました" });
});

// 编辑納入先
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    destination_cd,
    destination_name,
    customer_cd,
    carrier_cd,
    delivery_lead_time,
    issue_type,
    phone,
    address,
  } = req.body;

  await db.query(
    `UPDATE delivery_destinations SET
      destination_cd = ?, destination_name = ?, customer_cd = ?, carrier_cd = ?,
      delivery_lead_time = ?, issue_type = ?, phone = ?, address = ?
     WHERE id = ?`,
    [
      destination_cd,
      destination_name,
      customer_cd,
      carrier_cd,
      delivery_lead_time,
      issue_type,
      phone,
      address,
      id,
    ],
  );

  res.json({ message: "納入先を更新しました" });
});

// 删除納入先
router.delete("/:id", async (req, res) => {
  await db.query(`DELETE FROM delivery_destinations WHERE id = ?`, [req.params.id]);
  res.json({ message: "削除しました" });
});

// 状态切换
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  await db.query(`UPDATE delivery_destinations SET status = ? WHERE id = ?`, [
    status,
    req.params.id,
  ]);
  res.json({ message: "状態を更新しました" });
});

export default router;
