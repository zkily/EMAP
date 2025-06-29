// 创建shipping_items表并插入示例数据
import { db } from "./index.js";

async function createAndPopulateTable() {
  try {
    console.log("开始创建shipping_items表...");

    // 检查表是否存在
    const [tables] = await db.query(`SHOW TABLES LIKE 'shipping_items'`);

    if (tables.length > 0) {
      console.log("shipping_items表已存在，删除重建...");
      await db.query("DROP TABLE shipping_items");
    }

    // 创建表
    const createTableSQL = `
      CREATE TABLE shipping_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
        shipping_date DATE NOT NULL COMMENT '出荷日',
        delivery_date DATE NULL COMMENT '納入日',
        destination_cd VARCHAR(20) NOT NULL COMMENT '納入先コード',
        destination_name VARCHAR(100) NULL COMMENT '納入先名',
        product_cd VARCHAR(50) NOT NULL COMMENT '製品コード',
        product_name VARCHAR(100) NULL COMMENT '製品名',
        product_alias VARCHAR(100) NULL COMMENT '製品別名/納入日など追加情報',
        box_type VARCHAR(20) NULL COMMENT '箱種',
        confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '箱数',
        confirmed_units INT NOT NULL DEFAULT 0 COMMENT '出荷数量',
        unit VARCHAR(10) NOT NULL DEFAULT '本' COMMENT '単位',
        status VARCHAR(20) NOT NULL DEFAULT '未発行' COMMENT '状態（未発行/発行済/出荷済/キャンセル）',
        remarks TEXT NULL COMMENT '備考',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
        UNIQUE KEY uk_shipping_no (shipping_no)
      ) COMMENT='出荷管理'
    `;

    await db.query(createTableSQL);
    console.log("shipping_items表创建成功");

    // 检查是否已有数据
    const [count] = await db.query("SELECT COUNT(*) as count FROM shipping_items");

    if (count[0].count > 0) {
      console.log(`shipping_items表中已有${count[0].count}条数据，跳过插入示例数据步骤`);
      return;
    }

    // 插入示例数据
    console.log("开始插入示例数据...");

    const sampleData = [
      {
        shipping_no: "S001-20240601-001",
        shipping_date: "2024-06-01",
        destination_cd: "D001",
        destination_name: "東京倉庫",
        product_cd: "P001",
        product_name: "テスト製品A",
        product_alias: "納入日:2024-06-08",
        box_type: "小箱",
        confirmed_boxes: 10,
        confirmed_units: 200,
        unit: "本",
        status: "未発行",
        remarks: "テスト備考",
      },
      {
        shipping_no: "S001-20240618-001",
        shipping_date: "2024-06-18",
        destination_cd: "D001",
        destination_name: "東京倉庫",
        product_cd: "P002",
        product_name: "テスト製品B",
        product_alias: "納入日:2024-06-25",
        box_type: "大箱",
        confirmed_boxes: 15,
        confirmed_units: 300,
        unit: "本",
        status: "未発行",
        remarks: "テスト備考",
      },
    ];

    for (const item of sampleData) {
      await db.query(
        `
        INSERT INTO shipping_items
          (shipping_no, shipping_date,
           destination_cd, destination_name, product_cd, product_name,
           product_alias, box_type, confirmed_boxes, confirmed_units,
           unit, status, remarks)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          item.shipping_no,
          item.shipping_date,
          item.destination_cd,
          item.destination_name,
          item.product_cd,
          item.product_name,
          item.product_alias || null,
          item.box_type || null,
          item.confirmed_boxes || 0,
          item.confirmed_units,
          item.unit || "本",
          item.status,
          item.remarks || null,
        ],
      );
    }

    console.log(`已成功插入${sampleData.length}条示例数据`);
  } catch (error) {
    console.error("错误:", error);
  } finally {
    process.exit();
  }
}

createAndPopulateTable();
