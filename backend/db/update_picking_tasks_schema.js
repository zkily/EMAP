import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "arai_db",
};

async function updatePickingTasksSchema() {
  let connection;

  try {
    console.log("连接数据库...");
    connection = await mysql.createConnection(dbConfig);

    console.log("读取ALTER SQL脚本...");
    const sqlFile = path.join(__dirname, "alter_picking_tasks_add_fields.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // 分割并执行每个SQL语句
    const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("执行SQL:", statement.trim().substring(0, 100) + "...");
        await connection.execute(statement.trim());
        console.log("✓ 成功");
      }
    }

    console.log("picking_tasks表结构更新完成！");

    // 验证字段是否添加成功
    console.log("\n验证表结构:");
    const [columns] = await connection.query("DESCRIBE picking_tasks");
    console.log("picking_tasks表字段:");
    columns.forEach((col) => {
      console.log(
        `  ${col.Field}: ${col.Type} ${col.Null === "YES" ? "(nullable)" : "(not null)"}${col.Default ? " default=" + col.Default : ""}`,
      );
    });
  } catch (error) {
    console.error("更新表结构失败:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updatePickingTasksSchema();
