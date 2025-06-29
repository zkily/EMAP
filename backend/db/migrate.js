#!/usr/bin/env node
/**
 * 数据库迁移命令行工具
 *
 * 使用方法:
 *   node migrate.js up            - 运行所有未应用的迁移
 *   node migrate.js down          - 回滚最后一个迁移
 *   node migrate.js refresh       - 回滚所有迁移并重新应用
 *   node migrate.js status        - 显示已应用的迁移和未应用的迁移
 *   node migrate.js create <name> - 创建新的迁移文件
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import migrationManager from "./migrations/migrationManager.js";
import { testConnection } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据库连接
await testConnection();

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "up":
    console.log("应用所有未应用的迁移...");
    await migrationManager.migrateUp();
    break;

  case "down":
    console.log("回滚最后一个迁移...");
    await migrationManager.migrateDown();
    break;

  case "refresh":
    console.log("刷新所有迁移...");
    await migrationManager.refreshMigrations();
    break;

  case "status":
    const appliedMigrations = await migrationManager.getAppliedMigrations();
    console.log("已应用的迁移:");

    if (appliedMigrations.length === 0) {
      console.log("  无");
    } else {
      appliedMigrations.forEach((m) => console.log(`  ✅ ${m}`));
    }

    // 获取所有迁移文件
    const migrationsDir = path.join(__dirname, "migrations");
    const allMigrations = fs
      .readdirSync(migrationsDir)
      .filter((file) => file !== "migrationManager.js" && file.endsWith(".js"))
      .sort();

    const pendingMigrations = allMigrations.filter((file) => !appliedMigrations.includes(file));

    console.log("\n未应用的迁移:");
    if (pendingMigrations.length === 0) {
      console.log("  无");
    } else {
      pendingMigrations.forEach((m) => console.log(`  ❌ ${m}`));
    }
    break;

  case "create":
    if (!arg) {
      console.error("错误: 请提供迁移名称");
      console.log("使用: node migrate.js create <name>");
      process.exit(1);
    }

    // 创建新迁移文件
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .substring(0, 14);
    const fileName = `${timestamp}_${arg}.js`;
    const filePath = path.join(__dirname, "migrations", fileName);

    const template = `/**
 * 迁移: ${arg}
 * 创建于: ${new Date().toISOString()}
 */
export async function up(connection) {
  // 在此处编写迁移操作
  const sql = \`
    -- 在此处添加SQL语句
  \`;

  await connection.execute(sql);
  console.log('${arg} 迁移已应用');
}

export async function down(connection) {
  // 在此处编写回滚操作
  const sql = \`
    -- 在此处添加回滚SQL语句
  \`;

  await connection.execute(sql);
  console.log('${arg} 迁移已回滚');
}
`;

    fs.writeFileSync(filePath, template);
    console.log(`已创建新迁移文件: ${fileName}`);
    break;

  default:
    console.log(`
数据库迁移命令行工具

使用方法:
  node migrate.js up            - 运行所有未应用的迁移
  node migrate.js down          - 回滚最后一个迁移
  node migrate.js refresh       - 回滚所有迁移并重新应用
  node migrate.js status        - 显示已应用的迁移和未应用的迁移
  node migrate.js create <name> - 创建新的迁移文件
`);
}

// 退出进程
process.exit(0);
