import { query } from "../connection.js";

export const up = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS shipping_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project VARCHAR(255) COMMENT '項目',
      date DATE COMMENT '日付',
      datetime DATETIME COMMENT '日時',
      model_no VARCHAR(255) COMMENT '機種No',
      person_in_charge VARCHAR(255) COMMENT '担当者',
      picking_no VARCHAR(255) COMMENT 'ピッキングNo',
      product_name VARCHAR(255) COMMENT '製品名',
      product_code VARCHAR(255) COMMENT '製品CD',
      product_name_2 VARCHAR(255) COMMENT '製品名2',
      quantity INT COMMENT '数量',
      shipping_quantity INT COMMENT '出荷数',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_picking_no (picking_no),
      INDEX idx_product_code (product_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await query(sql);
    console.log("shipping_log 表创建成功");
  } catch (error) {
    console.error("shipping_log 表创建失败:", error);
    throw error;
  }
};

export const down = async () => {
  const sql = "DROP TABLE IF EXISTS shipping_log";

  try {
    await query(sql);
    console.log("shipping_log 表删除成功");
  } catch (error) {
    console.error("shipping_log 表删除失败:", error);
    throw error;
  }
};

export default {
  up,
  down,
};
