/**
 * 数据库迁移执行工具 - 向上迁移
 * 执行所有未运行的迁移
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./connection.js";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

// 确保迁移表存在
async function ensureMigrationsTable() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    connection.release();
  }
}

// 获取已执行的迁移
async function getExecutedMigrations() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT name FROM migrations ORDER BY id");
    return rows.map((row) => row.name);
  } finally {
    connection.release();
  }
}

// 获取所有迁移文件
function getMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort((a, b) => {
      // 按照数字前缀排序（例如：001_xxx.js 应该在 002_xxx.js 之前）
      const numA = parseInt(a.split("_")[0]);
      const numB = parseInt(b.split("_")[0]);
      return numA - numB;
    });
}

// 导入迁移模块
async function importMigration(file) {
  const modulePath = `file://${path.join(migrationsDir, file)}`;
  return await import(modulePath);
}

// 记录已执行的迁移
async function recordMigration(name) {
  const connection = await pool.getConnection();
  try {
    await connection.query("INSERT INTO migrations (name) VALUES (?)", [name]);
  } finally {
    connection.release();
  }
}

// 主函数
async function runMigrations() {
  console.log("开始执行数据库迁移...");

  await ensureMigrationsTable();
  const executedMigrations = await getExecutedMigrations();
  const migrationFiles = getMigrationFiles();

  // 过滤出未执行的迁移
  const pendingMigrations = migrationFiles.filter((file) => !executedMigrations.includes(file));

  if (pendingMigrations.length === 0) {
    console.log("没有待执行的迁移。");
    process.exit(0);
  }

  console.log(`将执行 ${pendingMigrations.length} 个迁移:`);
  pendingMigrations.forEach((file) => console.log(`- ${file}`));

  // 执行迁移
  for (const file of pendingMigrations) {
    console.log(`执行迁移: ${file}`);

    try {
      const migration = await importMigration(file);
      await migration.up();
      await recordMigration(file);
      console.log(`迁移 ${file} 成功完成。`);
    } catch (error) {
      console.error(`迁移 ${file} 失败:`, error);
      process.exit(1);
    }
  }

  console.log("所有迁移已成功完成。");
  process.exit(0);
}

// 执行迁移
runMigrations().catch((error) => {
  console.error("迁移过程中发生错误:", error);
  process.exit(1);
});
