// 納入先別平日祝日、土日臨時出勤
import express from "express";
import { pool as db } from "../../db/connection.js";
import { success, fail } from "../../utils/response.js";
const router = express.Router();

// === 前端 api/master/destinationMaster.ts  ==

// 納入先休日一覧取得
router.get("/", async (req, res) => {
  try {
    const { destination_cd } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM destination_holidays WHERE destination_cd = ? ORDER BY holiday_date ASC`,
      [destination_cd],
    );
    success(res, rows);
  } catch (err) {
    fail(res, err);
  }
});

// 指定納入先休日新規
router.post("/", async (req, res) => {
  try {
    const { destination_cd, holiday_date } = req.body;
    await db.query(
      `INSERT IGNORE INTO destination_holidays (destination_cd, holiday_date) VALUES (?, ?)`,
      [destination_cd, holiday_date],
    );
    success(res);
  } catch (err) {
    fail(res, err);
  }
});

// 指定納入先休日削除
router.delete("/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM destination_holidays WHERE id = ?`, [req.params.id]);
    success(res);
  } catch (err) {
    fail(res, err);
  }
});

// 臨時出勤日一覧取得
router.get("/workday", async (req, res) => {
  try {
    const { destination_cd } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM destination_override_attendance WHERE destination_cd = ? ORDER BY work_date ASC`,
      [destination_cd],
    );
    success(res, rows);
  } catch (err) {
    fail(res, err);
  }
});

// 臨時出勤日新規
router.post("/workday", async (req, res) => {
  try {
    const { destination_cd, work_date, reason } = req.body;
    await db.query(
      `INSERT IGNORE INTO destination_override_attendance (destination_cd, work_date, reason) VALUES (?, ?, ?)`,
      [destination_cd, work_date, reason],
    );
    success(res);
  } catch (err) {
    fail(res, err);
  }
});

// 臨時出勤日削除
router.delete("/workday/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM destination_override_attendance WHERE id = ?`, [req.params.id]);
    success(res);
  } catch (err) {
    fail(res, err);
  }
});

export default router;
