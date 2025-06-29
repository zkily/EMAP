// 数据库迁移管理系统
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, transaction } from "../connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建迁移表（如果不存在）
const initMigrationTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await query(sql);
    console.log("迁移表已初始化");
  } catch (error) {
    console.error("迁移表初始化失败:", error.message);
    throw error;
  }
};

// 获取已应用的迁移
const getAppliedMigrations = async () => {
  try {
    await initMigrationTable();
    const migrations = await query("SELECT name FROM migrations ORDER BY id");
    return migrations.map((m) => m.name);
  } catch (error) {
    console.error("获取已应用迁移失败:", error.message);
    throw error;
  }
};

// 获取迁移文件列表
const getMigrationFiles = () => {
  // 读取当前目录下所有的迁移文件（排除当前文件和非.js文件）
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file !== "migrationManager.js" && file.endsWith(".js"))
    .sort(); // 确保按文件名顺序执行

  return files;
};

// 应用迁移
const applyMigration = async (migrationName) => {
  const migrationPath = path.join(__dirname, migrationName);
  // 在 Windows 上需要使用 file:// URL
  const migrationUrl =
    path.sep === "\\" ? `file:///${migrationPath.replace(/\\/g, "/")}` : migrationPath;

  try {
    // 动态导入迁移文件
    const migration = await import(migrationUrl);

    // 在事务中执行迁移
    await transaction(async (connection) => {
      // 执行迁移的 up 函数
      await migration.up(connection);

      // 记录迁移已应用
      await connection.execute("INSERT INTO migrations (name) VALUES (?)", [migrationName]);

      console.log(`已应用迁移: ${migrationName}`);
    });

    return true;
  } catch (error) {
    console.error(`应用迁移失败 ${migrationName}:`, error.message);
    throw error;
  }
};

// 回滚迁移
const rollbackMigration = async (migrationName) => {
  const migrationPath = path.join(__dirname, migrationName);
  // 在 Windows 上需要使用 file:// URL
  const migrationUrl =
    path.sep === "\\" ? `file:///${migrationPath.replace(/\\/g, "/")}` : migrationPath;

  try {
    // 动态导入迁移文件
    const migration = await import(migrationUrl);

    // 在事务中执行回滚
    await transaction(async (connection) => {
      // 执行迁移的 down 函数
      await migration.down(connection);

      // 从迁移表中删除记录
      await connection.execute("DELETE FROM migrations WHERE name = ?", [migrationName]);

      console.log(`已回滚迁移: ${migrationName}`);
    });

    return true;
  } catch (error) {
    console.error(`回滚迁移失败 ${migrationName}:`, error.message);
    throw error;
  }
};

// 执行所有未应用的迁移
export const migrateUp = async () => {
  try {
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        await applyMigration(file);
        appliedCount++;
      }
    }

    if (appliedCount === 0) {
      console.log("没有新的迁移需要应用");
    } else {
      console.log(`成功应用了 ${appliedCount} 个迁移`);
    }

    return appliedCount;
  } catch (error) {
    console.error("迁移失败:", error.message);
    throw error;
  }
};

// 回滚最后一个迁移
export const migrateDown = async () => {
  try {
    const appliedMigrations = await getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      console.log("没有可回滚的迁移");
      return 0;
    }

    // 获取最后应用的迁移
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];

    await rollbackMigration(lastMigration);
    console.log(`成功回滚了迁移: ${lastMigration}`);

    return 1;
  } catch (error) {
    console.error("回滚失败:", error.message);
    throw error;
  }
};

// 回滚到特定迁移
export const migrateDownTo = async (targetMigration) => {
  try {
    const appliedMigrations = await getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      console.log("没有可回滚的迁移");
      return 0;
    }

    // 找到目标迁移的索引
    const targetIndex = appliedMigrations.indexOf(targetMigration);

    if (targetIndex === -1) {
      console.log(`目标迁移 ${targetMigration} 未找到或未应用`);
      return 0;
    }

    // 回滚所有在目标迁移之后的迁移（从最新的开始）
    const migrationsToRollback = appliedMigrations.slice(targetIndex + 1).reverse();

    let rollbackCount = 0;
    for (const migration of migrationsToRollback) {
      await rollbackMigration(migration);
      rollbackCount++;
    }

    console.log(`成功回滚了 ${rollbackCount} 个迁移`);
    return rollbackCount;
  } catch (error) {
    console.error("回滚失败:", error.message);
    throw error;
  }
};

// 刷新所有迁移（先回滚所有，然后重新应用）
export const refreshMigrations = async () => {
  try {
    const appliedMigrations = await getAppliedMigrations();

    // 按照相反的顺序回滚所有迁移
    for (const migration of [...appliedMigrations].reverse()) {
      await rollbackMigration(migration);
    }

    // 重新应用所有迁移
    return await migrateUp();
  } catch (error) {
    console.error("刷新迁移失败:", error.message);
    throw error;
  }
};

export default {
  migrateUp,
  migrateDown,
  migrateDownTo,
  refreshMigrations,
  getAppliedMigrations,
};
