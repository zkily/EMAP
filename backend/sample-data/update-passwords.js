import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_emap",
  charset: "utf8mb4",
};

// 测试用户数据
const testUsers = [
  { username: "admin", password: "password" },
  { username: "manager1", password: "password" },
  { username: "manager2", password: "password" },
  { username: "user1", password: "password" },
  { username: "user2", password: "password" },
  { username: "user3", password: "password" },
  { username: "guest1", password: "password" },
];

async function updateUserPasswords() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("数据库连接成功");

    console.log("正在更新用户密码...");

    for (const user of testUsers) {
      try {
        // 生成密码hash
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(user.password, saltRounds);

        // 更新用户密码
        const [result] = await connection.execute(
          "UPDATE users SET password = ? WHERE username = ?",
          [passwordHash, user.username],
        );

        if (result.affectedRows > 0) {
          console.log(`✓ 用户 ${user.username} 密码已更新`);
        } else {
          console.log(`⚠ 用户 ${user.username} 不存在，跳过`);
        }
      } catch (error) {
        console.error(`✗ 更新用户 ${user.username} 密码失败:`, error.message);
      }
    }

    console.log("\n密码更新完成！");
    console.log("\n=== 测试账户登录信息 ===");
    console.log("所有测试账户的密码都是: password");
    testUsers.forEach((user) => {
      console.log(`- ${user.username} / password`);
    });
  } catch (error) {
    console.error("更新密码时发生错误:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行脚本
updateUserPasswords();
