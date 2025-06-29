/**
 * 数据库Schema管理工具
 * 此文件用于导出完整的数据库结构，便于查看和管理
 */
import { query } from "../connection.js";

// 获取数据库中所有表
export const getTables = async () => {
  const sql = "SHOW TABLES";
  const results = await query(sql);
  return results.map((row) => Object.values(row)[0]);
};

// 获取表结构
export const getTableStructure = async (tableName) => {
  const sql = `DESCRIBE ${tableName}`;
  return await query(sql);
};

// 获取表索引
export const getTableIndexes = async (tableName) => {
  const sql = `SHOW INDEX FROM ${tableName}`;
  return await query(sql);
};

// 获取表的外键约束
export const getTableForeignKeys = async (tableName) => {
  const sql = `
    SELECT
      TABLE_NAME,
      COLUMN_NAME,
      CONSTRAINT_NAME,
      REFERENCED_TABLE_NAME,
      REFERENCED_COLUMN_NAME
    FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      REFERENCED_TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
  `;

  return await query(sql, [tableName]);
};

// 导出数据库结构到JSON文件
export const exportSchemaToJson = async () => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // 获取所有表
    const tables = await getTables();
    const schema = {};

    // 获取每个表的结构、索引和外键
    for (const table of tables) {
      schema[table] = {
        structure: await getTableStructure(table),
        indexes: await getTableIndexes(table),
        foreignKeys: await getTableForeignKeys(table),
      };
    }

    // 将结构写入JSON文件
    const schemaPath = path.join(__dirname, "database_schema.json");
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), "utf8");

    console.log(`数据库结构已导出到: ${schemaPath}`);
    return schemaPath;
  } catch (error) {
    console.error("导出数据库结构失败:", error.message);
    throw error;
  }
};

// 导出创建表的SQL语句
export const exportCreateTableStatements = async () => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // 获取所有表
    const tables = await getTables();
    let sqlContent = "";

    // 获取每个表的创建语句
    for (const table of tables) {
      const [result] = await query(`SHOW CREATE TABLE ${table}`);
      sqlContent += `${result["Create Table"]};\n\n`;
    }

    // 将SQL语句写入文件
    const sqlPath = path.join(__dirname, "database_schema.sql");
    await fs.writeFile(sqlPath, sqlContent, "utf8");

    console.log(`数据库创建语句已导出到: ${sqlPath}`);
    return sqlPath;
  } catch (error) {
    console.error("导出创建表语句失败:", error.message);
    throw error;
  }
};

// 导出数据库文档（Markdown格式）
export const exportSchemaDocumentation = async () => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // 获取所有表
    const tables = await getTables();
    let markdown = "# 数据库结构文档\n\n";

    // 获取每个表的结构
    for (const table of tables) {
      markdown += `## ${table}\n\n`;

      // 表结构
      const structure = await getTableStructure(table);
      markdown += "### 表结构\n\n";
      markdown += "| 字段名 | 类型 | 允许为空 | 键 | 默认值 | 额外信息 |\n";
      markdown += "|--------|------|----------|-----|--------|----------|\n";

      structure.forEach((column) => {
        markdown += `| ${column.Field} | ${column.Type} | ${column.Null} | ${column.Key || "-"} | ${column.Default || "-"} | ${column.Extra || "-"} |\n`;
      });

      // 索引
      const indexes = await getTableIndexes(table);
      if (indexes.length > 0) {
        markdown += "\n### 索引\n\n";
        markdown += "| 索引名称 | 列名 | 唯一性 | 类型 |\n";
        markdown += "|----------|------|--------|------|\n";

        const processedIndexes = {};
        indexes.forEach((index) => {
          const indexName = index.Key_name;
          const columnName = index.Column_name;
          const isUnique = index.Non_unique === 0 ? "是" : "否";
          const indexType = index.Index_type;

          // 避免重复索引名称
          if (!processedIndexes[indexName]) {
            processedIndexes[indexName] = [];
          }

          if (!processedIndexes[indexName].includes(columnName)) {
            processedIndexes[indexName].push(columnName);
            markdown += `| ${indexName} | ${columnName} | ${isUnique} | ${indexType} |\n`;
          }
        });
      }

      // 外键
      const foreignKeys = await getTableForeignKeys(table);
      if (foreignKeys.length > 0) {
        markdown += "\n### 外键约束\n\n";
        markdown += "| 约束名称 | 列名 | 引用表 | 引用列 |\n";
        markdown += "|----------|------|--------|--------|\n";

        foreignKeys.forEach((fk) => {
          markdown += `| ${fk.CONSTRAINT_NAME} | ${fk.COLUMN_NAME} | ${fk.REFERENCED_TABLE_NAME} | ${fk.REFERENCED_COLUMN_NAME} |\n`;
        });
      }

      markdown += "\n";
    }

    // 将文档写入文件
    const docPath = path.join(__dirname, "database_schema.md");
    await fs.writeFile(docPath, markdown, "utf8");

    console.log(`数据库文档已导出到: ${docPath}`);
    return docPath;
  } catch (error) {
    console.error("导出数据库文档失败:", error.message);
    throw error;
  }
};

export default {
  getTables,
  getTableStructure,
  getTableIndexes,
  getTableForeignKeys,
  exportSchemaToJson,
  exportCreateTableStatements,
  exportSchemaDocumentation,
};
