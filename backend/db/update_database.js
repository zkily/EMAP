// 数据库结构更新脚本

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES模块中获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSQL(sqlContent) {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
    multipleStatements: true, // 允许执行多条SQL语句
  });

  try {
    console.log("执行SQL...");
    await connection.query(sqlContent);
    console.log("SQL执行成功!");
  } catch (error) {
    console.error("SQL执行错误:", error.message);
  } finally {
    await connection.end();
  }
}

async function updateDatabase() {
  console.log("开始更新数据库结构...");

  try {
    // 读取并执行系统导入状态表更新脚本
    const systemImportStatusSQL = fs.readFileSync(
      path.join(__dirname, "alter_system_import_status.sql"),
      "utf8",
    );
    await executeSQL(systemImportStatusSQL);

    // 读取并执行库存交易日志表更新脚本
    const stockTransactionLogsSQL = fs.readFileSync(
      path.join(__dirname, "alter_stock_transaction_logs.sql"),
      "utf8",
    );
    await executeSQL(stockTransactionLogsSQL);

    // 读取并执行唯一约束修改脚本
    const modifyUniqueKeySQL = fs.readFileSync(
      path.join(__dirname, "modify_transaction_unique_key.sql"),
      "utf8",
    );
    await executeSQL(modifyUniqueKeySQL);

    console.log("数据库结构更新完成!");
  } catch (error) {
    console.error("读取SQL文件错误:", error.message);
  }
}

// 执行更新
updateDatabase();
