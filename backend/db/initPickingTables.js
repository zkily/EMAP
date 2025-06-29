import fs from "fs";
import path from "path";
import { query } from "./connection.js";

/**
 * 初始化Picking相关数据库表
 */
export async function initPickingTables() {
  try {
    console.log("🔍 检查Picking相关数据库表...");

    // 检查picking_tasks表是否存在
    const tables = await query("SHOW TABLES LIKE 'picking%'");

    if (tables.length === 0) {
      console.log("📋 未找到Picking相关表，开始创建...");

      // 读取SQL脚本文件
      const sqlPath = path.join(process.cwd(), "backend/db/create-picking-tables.sql");

      if (!fs.existsSync(sqlPath)) {
        throw new Error(`SQL脚本文件不存在: ${sqlPath}`);
      }

      const sqlScript = fs.readFileSync(sqlPath, "utf8");

      // 处理SQL脚本：分割语句并过滤空语句
      const statements = sqlScript
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt && !stmt.startsWith("--") && !stmt.startsWith("/*"));

      console.log(`📝 准备执行 ${statements.length} 个SQL语句...`);

      // 逐一执行SQL语句
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        if (statement.length > 0) {
          try {
            await query(statement);

            // 只记录重要的操作
            if (statement.toUpperCase().includes("CREATE TABLE")) {
              const tableName = extractTableName(statement);
              console.log(`✅ 创建表: ${tableName}`);
            } else if (statement.toUpperCase().includes("CREATE INDEX")) {
              console.log(`✅ 创建索引`);
            } else if (statement.toUpperCase().includes("CREATE TRIGGER")) {
              console.log(`✅ 创建触发器`);
            }
          } catch (error) {
            // 忽略一些常见的非致命错误
            if (
              error.message.includes("already exists") ||
              error.message.includes("Duplicate key name") ||
              error.message.includes("Duplicate column name")
            ) {
              console.log(`⚠️  跳过已存在的对象: ${error.message.substring(0, 50)}...`);
            } else {
              console.error(`❌ SQL执行失败:`, statement.substring(0, 100) + "...");
              console.error(`   错误: ${error.message}`);
              // 不要抛出错误，继续执行其他语句
            }
          }
        }
      }

      // 验证表是否创建成功
      const newTables = await query("SHOW TABLES LIKE 'picking%'");
      console.log(`✅ Picking表创建完成，共 ${newTables.length} 个表`);

      return { success: true, tablesCreated: newTables.length };
    } else {
      console.log(`✅ Picking表已存在，共 ${tables.length} 个表`);
      return { success: true, tablesCreated: 0 };
    }
  } catch (error) {
    console.error("❌ Picking表初始化失败:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 从CREATE TABLE语句中提取表名
 */
function extractTableName(sql) {
  const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
  return match ? match[1] : "unknown";
}

/**
 * 检查Picking表的健康状态
 */
export async function checkPickingTablesHealth() {
  try {
    const tables = await query("SHOW TABLES LIKE 'picking%'");
    const tableNames = tables.map((row) => Object.values(row)[0]);

    const health = {
      tablesExist: tableNames.length > 0,
      tables: tableNames,
      issues: [],
    };

    // 检查必要的表是否存在
    const requiredTables = ["picking_tasks", "picking_history"];
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        health.issues.push(`缺少必要的表: ${table}`);
      }
    }

    return health;
  } catch (error) {
    return {
      tablesExist: false,
      tables: [],
      issues: [`检查失败: ${error.message}`],
    };
  }
}
