import { query } from "./connection.js";

async function insertDemoShippingData() {
  try {
    console.log("开始插入演示用的shipping_items数据...");

    // 清理旧的演示数据（可选）
    console.log("清理旧的演示数据...");
    await query(`DELETE FROM shipping_items WHERE shipping_no LIKE 'DEMO-%'`);

    // 插入演示数据
    const demoData = [
      {
        shipping_no_p: "DEMO-001-P001",
        shipping_no: "DEMO-001",
        shipping_date: "2024-01-15",
        delivery_date: "2024-01-20",
        destination_cd: "D001",
        destination_name: "東京倉庫",
        product_cd: "P001",
        product_name: "テスト製品A",
        product_alias: "Demo Product A",
        box_type: "小箱",
        confirmed_boxes: 10,
        confirmed_units: 200,
        unit: "本",
        status: "未発行",
        remarks: "Demo data for testing",
      },
      {
        shipping_no_p: "DEMO-001-P002",
        shipping_no: "DEMO-001",
        shipping_date: "2024-01-15",
        delivery_date: "2024-01-20",
        destination_cd: "D001",
        destination_name: "東京倉庫",
        product_cd: "P002",
        product_name: "テスト製品B",
        product_alias: "Demo Product B",
        box_type: "大箱",
        confirmed_boxes: 15,
        confirmed_units: 300,
        unit: "本",
        status: "未発行",
        remarks: "Demo data for testing",
      },
      {
        shipping_no_p: "DEMO-002-P003",
        shipping_no: "DEMO-002",
        shipping_date: "2024-01-16",
        delivery_date: "2024-01-21",
        destination_cd: "D002",
        destination_name: "大阪倉庫",
        product_cd: "P003",
        product_name: "テスト製品C",
        product_alias: "Demo Product C",
        box_type: "TP箱",
        confirmed_boxes: 8,
        confirmed_units: 160,
        unit: "本",
        status: "発行済",
        remarks: "Demo data for testing",
      },
      {
        shipping_no_p: "DEMO-003-P001",
        shipping_no: "DEMO-003",
        shipping_date: "2024-01-17",
        delivery_date: "2024-01-22",
        destination_cd: "D003",
        destination_name: "名古屋倉庫",
        product_cd: "P001",
        product_name: "テスト製品A",
        product_alias: "Demo Product A",
        box_type: "小箱",
        confirmed_boxes: 12,
        confirmed_units: 240,
        unit: "本",
        status: "未発行",
        remarks: "Demo data for testing",
      },
      {
        shipping_no_p: "DEMO-003-P004",
        shipping_no: "DEMO-003",
        shipping_date: "2024-01-17",
        delivery_date: "2024-01-22",
        destination_cd: "D003",
        destination_name: "名古屋倉庫",
        product_cd: "P004",
        product_name: "テスト製品D",
        product_alias: "Demo Product D",
        box_type: "特殊",
        confirmed_boxes: 5,
        confirmed_units: 100,
        unit: "本",
        status: "未発行",
        remarks: "Demo data for testing",
      },
    ];

    // 插入数据
    for (const item of demoData) {
      const insertSQL = `
        INSERT INTO shipping_items (
          shipping_no_p, shipping_no, shipping_date, delivery_date,
          destination_cd, destination_name, product_cd, product_name,
          product_alias, box_type, confirmed_boxes, confirmed_units,
          unit, status, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertSQL, [
        item.shipping_no_p,
        item.shipping_no,
        item.shipping_date,
        item.delivery_date,
        item.destination_cd,
        item.destination_name,
        item.product_cd,
        item.product_name,
        item.product_alias,
        item.box_type,
        item.confirmed_boxes,
        item.confirmed_units,
        item.unit,
        item.status,
        item.remarks,
      ]);

      console.log(`✅ 插入数据: ${item.shipping_no_p} - ${item.product_name}`);
    }

    console.log(`\n总共插入了 ${demoData.length} 条演示数据`);

    // 验证插入的数据
    const result = await query(`
      SELECT shipping_no_p, shipping_no, product_cd, product_name, confirmed_boxes
      FROM shipping_items
      WHERE shipping_no LIKE 'DEMO-%'
      ORDER BY shipping_no, product_cd
    `);

    console.log("\n插入的演示数据:");
    console.table(result);
  } catch (error) {
    console.error("❌ 插入演示数据失败:", error.message);
  } finally {
    process.exit();
  }
}

insertDemoShippingData();
