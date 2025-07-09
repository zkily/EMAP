import { pool, query } from "./connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("开始数据库迁移...");

  try {
    // 读取并执行打印历史表创建脚本
    const printHistorySQL = fs.readFileSync(
      path.join(__dirname, "create_print_history_table.sql"),
      "utf8",
    );

    console.log("创建打印历史表...");
    await query(printHistorySQL);
    console.log("打印历史表创建成功");

    console.log("数据库迁移完成");
    process.exit(0);
  } catch (error) {
    console.error("数据库迁移失败:", error);
    process.exit(1);
  }
}

runMigration();
