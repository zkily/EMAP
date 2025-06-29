// 查询shipping_items表结构
import { db } from "./index.js";

async function describeTable() {
  try {
    console.log("查询shipping_items表结构...");

    const [rows] = await db.query(`DESCRIBE shipping_items`);
    console.log("表结构：");
    console.table(rows);
  } catch (error) {
    console.error("错误:", error);
  } finally {
    process.exit();
  }
}

describeTable();
