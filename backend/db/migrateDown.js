/**
 * 数据库迁移执行工具 - 向下迁移
 * 回滚最近的一次迁移
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './connection.js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

// 获取最后执行的迁移
async function getLastMigration() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT id, name FROM migrations ORDER BY id DESC LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
}

// 导入迁移模块
async function importMigration(file) {
  const modulePath = `file://${path.join(migrationsDir, file)}`;
  return await import(modulePath);
}

// 删除迁移记录
async function removeMigration(id) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM migrations WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
}

// 主函数
async function revertLastMigration() {
  console.log('开始回滚最近的迁移...');

  const lastMigration = await getLastMigration();

  if (!lastMigration) {
    console.log('没有找到已执行的迁移。');
    process.exit(0);
  }

  console.log(`将回滚迁移: ${lastMigration.name}`);

  try {
    const migration = await importMigration(lastMigration.name);
    await migration.down();
    await removeMigration(lastMigration.id);
    console.log(`迁移 ${lastMigration.name} 已成功回滚。`);
  } catch (error) {
    console.error(`回滚迁移 ${lastMigration.name} 失败:`, error);
    process.exit(1);
  }

  console.log('迁移回滚完成。');
  process.exit(0);
}

// 执行回滚
revertLastMigration().catch(error => {
  console.error('回滚过程中发生错误:', error);
  process.exit(1);
});
