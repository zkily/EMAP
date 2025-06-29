#!/usr/bin/env node
/**
 * 数据库种子命令行工具
 *
 * 使用方法:
 *   node seed.js up             - 运行所有未应用的种子
 *   node seed.js reset          - 重置所有种子
 *   node seed.js refresh        - 重置并重新应用所有种子
 *   node seed.js create <name>  - 创建新的种子文件
 *   node seed.js status         - 显示已应用的种子和未应用的种子
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import seedManager from "./seeds/seedManager.js";
import { testConnection } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据库连接
await testConnection();

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "up":
    console.log("应用所有未应用的种子...");
    await seedManager.seedUp();
    break;

  case "reset":
    console.log("重置所有种子...");
    await seedManager.seedReset();
    break;

  case "refresh":
    console.log("刷新所有种子...");
    await seedManager.seedRefresh();
    break;

  case "status":
    const appliedSeeds = await seedManager.getAppliedSeeds();
    console.log("已应用的种子:");

    if (appliedSeeds.length === 0) {
      console.log("  无");
    } else {
      appliedSeeds.forEach((s) => console.log(`  ✅ ${s}`));
    }

    // 获取所有种子文件
    const seedsDir = path.join(__dirname, "seeds");
    const allSeeds = fs
      .readdirSync(seedsDir)
      .filter((file) => file !== "seedManager.js" && file.endsWith(".js"))
      .sort();

    const pendingSeeds = allSeeds.filter((file) => !appliedSeeds.includes(file));

    console.log("\n未应用的种子:");
    if (pendingSeeds.length === 0) {
      console.log("  无");
    } else {
      pendingSeeds.forEach((s) => console.log(`  ❌ ${s}`));
    }
    break;

  case "create":
    if (!arg) {
      console.error("错误: 请提供种子名称");
      console.log("使用: node seed.js create <name>");
      process.exit(1);
    }

    await seedManager.createSeed(arg);
    break;

  default:
    console.log(`
数据库种子命令行工具

使用方法:
  node seed.js up             - 运行所有未应用的种子
  node seed.js reset          - 重置所有种子
  node seed.js refresh        - 重置并重新应用所有种子
  node seed.js create <name>  - 创建新的种子文件
  node seed.js status         - 显示已应用的种子和未应用的种子
`);
}

// 退出进程
process.exit(0);
