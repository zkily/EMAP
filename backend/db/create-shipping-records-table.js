import { query } from "./connection.js";

async function createShippingRecordsTable() {
  try {
    console.log("开始创建shipping_records表...");

    // 检查表是否存在
    const [tables] = await query(`SHOW TABLES LIKE 'shipping_records'`);

    if (tables.length > 0) {
      console.log("shipping_records表已存在");
      return;
    }

    // 创建表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shipping_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
        status VARCHAR(20) NOT NULL DEFAULT '発行済' COMMENT '状態',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '印刷日時',
        INDEX idx_shipping_no (shipping_no),
        INDEX idx_created_at (created_at)
      ) COMMENT='出荷印刷記録'
    `;

    await query(createTableSQL);
    console.log("shipping_records表创建成功");
  } catch (error) {
    console.error("错误:", error);
  } finally {
    process.exit();
  }
}

createShippingRecordsTable();
