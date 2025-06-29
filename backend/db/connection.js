// 增强版数据库连接管理
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// 加载环境变量
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env';

// 检查环境变量文件是否存在，如果不存在则使用默认.env
const envPath = path.resolve(process.cwd(), envFile);
const defaultEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`数据库配置已加载: ${envFile}`);
} else {
  dotenv.config({ path: defaultEnvPath });
  console.log(`数据库配置已加载: .env (默认)`);
}

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_emap',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  decimalNumbers: true,
  supportBigNumbers: true,
  dateStrings: true, // 将日期格式化为字符串
  timezone: '+08:00', // 设置时区
};

// 创建连接池
export const pool = mysql.createPool(dbConfig);

// 测试连接并打印数据库信息
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');

    // 获取数据库版本信息
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`MySQL 版本: ${rows[0].version}`);

    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

// 执行查询的辅助函数
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('查询执行失败:', error.message);
    console.error('SQL:', sql);
    console.error('参数:', params);
    throw error;
  }
};

// 事务辅助函数
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default {
  pool,
  query,
  transaction,
  testConnection
};
