/**
 * BOM表（部品構成表）の作成
 */
import { pool } from "../connection.js";

export async function up() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // BOM テーブル作成
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bom (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL COMMENT '製品ID',
        component_id INT NOT NULL COMMENT '部品ID',
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1 COMMENT '数量',
        unit_price DECIMAL(10,2) DEFAULT NULL COMMENT '単価',
        note TEXT DEFAULT NULL COMMENT '備考',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_product_component (product_id, component_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部品構成表（BOM）';
    `);

    console.log("✅ BOM テーブルを作成しました");

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error("❌ BOM テーブル作成エラー:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function down() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // テーブル削除
    await connection.query("DROP TABLE IF EXISTS bom");

    console.log("✅ BOM テーブルを削除しました");

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error("❌ BOM テーブル削除エラー:", error);
    throw error;
  } finally {
    connection.release();
  }
}
