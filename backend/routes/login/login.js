import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { db } from "../../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = express.Router();

// === 前端 api/login/login.ts  ===

// 登录接口  监听 POST /login 请求，通常由前端提交用户名和密码。
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    //从数据库中查找用户名对应的用户信息。
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0]; //用户名应唯一

    if (!user) {
      return res.status(401).json({ message: "ユーザー名が間違っています" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "パスワードが間違っています" });
    }

    //登录成功 → 签发 JWT Token，确保包含用户名
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username, // 添加用户名
        name: user.name, // 添加用户显示名
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    //登录成功后，返回 token 和用户信息（供前端展示或权限控制）
    res.json({
      token,
      userInfo: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        department_id: user.department_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

export default router;
