import { Router } from "express";
import { pool as db } from "../../db/connection.js";

const router = Router();

// 📥 获取最近50条系统日志
router.get("/logs", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, DATE_FORMAT(log_time, '%Y-%m-%d %H:%i:%s') as log_time, message
      FROM system_logs
      ORDER BY log_time DESC
      LIMIT 50
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "システムログ取得失敗" });
  }
});

// 📤 外部调用用：插入日志
export async function addSystemLog(message) {
  await db.query(`INSERT INTO system_logs (log_time, message) VALUES (NOW(), ?)`, [message]);
}

export default router;
