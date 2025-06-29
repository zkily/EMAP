/**
 * 数据库种子管理工具
 * 用于初始化和填充测试数据
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, transaction } from '../connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建种子记录表（如果不存在）
const initSeedTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS seeds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await query(sql);
    console.log('种子记录表已初始化');
  } catch (error) {
    console.error('种子记录表初始化失败:', error.message);
    throw error;
  }
};

// 获取已应用的种子
const getAppliedSeeds = async () => {
  try {
    await initSeedTable();
    const seeds = await query('SELECT name FROM seeds ORDER BY id');
    return seeds.map(s => s.name);
  } catch (error) {
    console.error('获取已应用种子失败:', error.message);
    throw error;
  }
};

// 获取种子文件列表
const getSeedFiles = () => {
  // 读取当前目录下所有的种子文件（排除当前文件和非.js文件）
  const files = fs.readdirSync(__dirname)
    .filter(file => file !== 'seedManager.js' && file.endsWith('.js'))
    .sort(); // 确保按文件名顺序执行

  return files;
};

// 应用种子
const applySeed = async (seedName) => {
  const seedPath = path.join(__dirname, seedName);

  try {
    // 动态导入种子文件
    const seed = await import(seedPath);

    // 执行种子
    await transaction(async (connection) => {
      // 运行种子函数
      await seed.run(connection);

      // 记录种子已应用
      await connection.execute(
        'INSERT INTO seeds (name) VALUES (?)',
        [seedName]
      );

      console.log(`已应用种子: ${seedName}`);
    });

    return true;
  } catch (error) {
    console.error(`应用种子失败 ${seedName}:`, error.message);
    throw error;
  }
};

// 重置种子
const resetSeed = async (seedName) => {
  const seedPath = path.join(__dirname, seedName);

  try {
    // 动态导入种子文件
    const seed = await import(seedPath);

    // 如果种子有重置功能，则执行重置
    if (typeof seed.reset === 'function') {
      await transaction(async (connection) => {
        // 运行种子重置函数
        await seed.reset(connection);

        // 从种子记录表中删除记录
        await connection.execute(
          'DELETE FROM seeds WHERE name = ?',
          [seedName]
        );

        console.log(`已重置种子: ${seedName}`);
      });
    } else {
      console.log(`种子 ${seedName} 没有提供重置功能`);
    }

    return true;
  } catch (error) {
    console.error(`重置种子失败 ${seedName}:`, error.message);
    throw error;
  }
};

// 执行所有未应用的种子
export const seedUp = async () => {
  try {
    const appliedSeeds = await getAppliedSeeds();
    const seedFiles = getSeedFiles();

    let appliedCount = 0;

    for (const file of seedFiles) {
      if (!appliedSeeds.includes(file)) {
        await applySeed(file);
        appliedCount++;
      }
    }

    if (appliedCount === 0) {
      console.log('没有新的种子需要应用');
    } else {
      console.log(`成功应用了 ${appliedCount} 个种子`);
    }

    return appliedCount;
  } catch (error) {
    console.error('应用种子失败:', error.message);
    throw error;
  }
};

// 重置所有种子
export const seedReset = async () => {
  try {
    const appliedSeeds = await getAppliedSeeds();

    if (appliedSeeds.length === 0) {
      console.log('没有已应用的种子可重置');
      return 0;
    }

    // 按照相反的顺序重置所有种子
    let resetCount = 0;
    for (const seed of [...appliedSeeds].reverse()) {
      await resetSeed(seed);
      resetCount++;
    }

    console.log(`成功重置了 ${resetCount} 个种子`);
    return resetCount;
  } catch (error) {
    console.error('重置种子失败:', error.message);
    throw error;
  }
};

// 重置并重新应用所有种子
export const seedRefresh = async () => {
  try {
    await seedReset();
    return await seedUp();
  } catch (error) {
    console.error('刷新种子失败:', error.message);
    throw error;
  }
};

// 创建新的种子文件
export const createSeed = async (name) => {
  if (!name) {
    throw new Error('必须提供种子名称');
  }

  // 创建种子文件名
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const fileName = `${timestamp}_${name}.js`;
  const filePath = path.join(__dirname, fileName);

  // 种子模板
  const template = `/**
 * 种子: ${name}
 * 创建于: ${new Date().toISOString()}
 */

/**
 * 执行种子填充数据
 * @param {import('mysql2/promise').PoolConnection} connection 数据库连接
 */
export async function run(connection) {
  // 在此处编写插入测试数据的逻辑
  console.log('执行 ${name} 种子...');

  // 示例:
  // const sql = \`INSERT INTO your_table (column1, column2) VALUES (?, ?)\`;
  // await connection.execute(sql, ['value1', 'value2']);
}

/**
 * 重置种子数据
 * @param {import('mysql2/promise').PoolConnection} connection 数据库连接
 */
export async function reset(connection) {
  // 在此处编写重置逻辑
  console.log('重置 ${name} 种子...');

  // 示例:
  // const sql = \`DELETE FROM your_table WHERE condition\`;
  // await connection.execute(sql);
}
`;

  // 写入文件
  try {
    await fs.writeFile(filePath, template, 'utf8');
    console.log(`已创建新种子文件: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error('创建种子文件失败:', error.message);
    throw error;
  }
};

// 导出函数
export default {
  seedUp,
  seedReset,
  seedRefresh,
  createSeed,
  getAppliedSeeds
};
