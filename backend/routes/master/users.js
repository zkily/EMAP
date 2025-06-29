// ユーザーマスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
import bcrypt from "bcrypt";
const router = express.Router();

// === 前端 api/master/userMaster.ts  ==

// 获取全部用户
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "ユーザー一覧取得失敗",
      error: err.message,
    });
  }
});

// 获取单个用户
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "ユーザーが存在しません" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 新增用户
router.post("/", async (req, res) => {
  const { username, password, name, department_id, role, email, phone, status } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (username, password, name, department_id, role, email, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, name, department_id, role, email, phone, status ?? 1],
    );
    res.json({ success: true, message: "ユーザー登録成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "登録失敗", error: err.message });
  }
});

// 更新用户
router.put("/:id", async (req, res) => {
  const { username, password, name, department_id, role, email, phone, status } = req.body;
  try {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const fields = [
      "username = ?",
      "name = ?",
      "department_id = ?",
      "role = ?",
      "email = ?",
      "phone = ?",
      "status = ?",
    ];
    const values = [username, name, department_id, role, email, phone, status ?? 1];

    if (hashedPassword) {
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    values.push(req.params.id);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ success: true, message: "ユーザー更新成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "更新失敗", error: err.message });
  }
});

// 删除用户
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "ユーザー削除成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "削除失敗", error: err.message });
  }
});

export default router;
