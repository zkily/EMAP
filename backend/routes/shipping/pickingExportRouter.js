import express from "express";
import { query as dbQuery } from "../../db/connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 标准响应格式
function standardResponse(success, message, data = null) {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.log(`创建目录失败: ${dirPath}, 错误: ${error.message}`);
    throw error;
  }
}

// 生成CSV内容
function generateCSVContent(data) {
  if (!data || data.length === 0) {
    return "shipping_no_p,shipping_no,product_cd,product_name,confirmed_boxes\n";
  }

  // CSV头部
  const headers = ["shipping_no_p", "shipping_no", "product_cd", "product_name", "confirmed_boxes"];
  let csvContent = headers.join(",") + "\n";

  // CSV数据行
  data.forEach((row) => {
    const csvRow = headers.map((header) => {
      let value = row[header] || "";
      // 如果值包含逗号、引号、换行符或日文字符，需要用引号包围并转义
      if (
        typeof value === "string" &&
        (value.includes(",") ||
          value.includes('"') ||
          value.includes("\n") ||
          /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(value))
      ) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csvContent += csvRow.join(",") + "\n";
  });

  return csvContent;
}

// 将shipping_items数据复制到picking_list并导出CSV
router.post("/export-picking-csv", async (req, res) => {
  try {
    console.log("开始处理picking数据导出请求...");

    // 1. 先创建picking_list表（如果不存在）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS picking_list (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        shipping_no_p VARCHAR(50) NOT NULL COMMENT '出荷項目唯一ID',
        shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
        product_cd VARCHAR(50) NOT NULL COMMENT '製品コード',
        product_name VARCHAR(100) NOT NULL COMMENT '製品名',
        confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '箱数',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',

        UNIQUE KEY uk_shipping_product (shipping_no_p, product_cd),
        INDEX idx_shipping_no (shipping_no),
        INDEX idx_product_cd (product_cd)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='ピッキングリスト データ保存用テーブル'
    `;

    await dbQuery(createTableSQL);
    console.log("picking_list表检查/创建完成");

    // 2. 查询shipping_items中的数据
    const shippingItemsSQL = `
      SELECT
        shipping_no_p,
        shipping_no,
        product_cd,
        product_name,
        confirmed_boxes
      FROM shipping_items
      WHERE shipping_no_p IS NOT NULL
      AND shipping_no IS NOT NULL
      AND product_cd IS NOT NULL
      ORDER BY shipping_no, product_cd
    `;

    const shippingItems = await dbQuery(shippingItemsSQL);
    console.log(`从shipping_items表中查询到${shippingItems.length}条数据`);

    if (shippingItems.length === 0) {
      return res.json(
        standardResponse(true, "没有找到可导出的数据", {
          copiedCount: 0,
          csvFilePath: null,
        }),
      );
    }

    // 3. 将数据复制到picking_list表（使用INSERT IGNORE避免重复）
    let copiedCount = 0;
    for (const item of shippingItems) {
      try {
        const insertSQL = `
          INSERT IGNORE INTO picking_list
          (shipping_no_p, shipping_no, product_cd, product_name, confirmed_boxes)
          VALUES (?, ?, ?, ?, ?)
        `;

        const result = await dbQuery(insertSQL, [
          item.shipping_no_p,
          item.shipping_no,
          item.product_cd,
          item.product_name,
          item.confirmed_boxes,
        ]);

        if (result.affectedRows > 0) {
          copiedCount++;
        }
      } catch (error) {
        console.log(`跳过重复数据: ${item.shipping_no_p} - ${item.product_cd}`);
      }
    }

    console.log(`成功复制${copiedCount}条新数据到picking_list表`);

    // 4. 从picking_list表查询所有数据用于生成CSV
    const pickingListSQL = `
      SELECT
        shipping_no_p,
        shipping_no,
        product_cd,
        product_name,
        confirmed_boxes
      FROM picking_list
      ORDER BY shipping_no, product_cd
    `;

    const pickingListData = await dbQuery(pickingListSQL);
    console.log(`从picking_list表中查询到${pickingListData.length}条数据用于CSV导出`);

    // 5. 生成CSV文件
    const csvContent = generateCSVContent(pickingListData);

    // 6. 确保输出文件夹存在（使用C盘本地路径）
    const localPath = "//192.168.1.200/社内共有/02_生産管理部/Data/BT-data/送信";

    // 使用本地路径
    ensureDirectoryExists(localPath);
    console.log(`使用本地输出路径: ${localPath}`);

    // 7. 生成固定文件名（覆盖旧文件）
    const fileName = "PickingMaster.csv";
    const filePath = path.join(localPath, fileName);

    // 8. 写入CSV文件（添加UTF-8 BOM以支持日文）
    const csvContentWithBOM = "\uFEFF" + csvContent; // 添加UTF-8 BOM
    fs.writeFileSync(filePath, csvContentWithBOM, "utf8");
    console.log(`CSV文件已保存到: ${filePath}`);

    // 9. 返回成功响应
    res.json(
      standardResponse(true, "ピッキングデータのエクスポートが完了しました", {
        copiedCount: copiedCount,
        totalDataCount: pickingListData.length,
        csvFilePath: filePath,
        fileName: fileName,
        exportTime: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("导出picking数据时发生错误:", error);
    console.error("错误堆栈:", error.stack);
    res
      .status(500)
      .json(standardResponse(false, "エクスポート処理中にエラーが発生しました: " + error.message));
  }
});

// 获取picking_list表的数据概览
router.get("/picking-list-summary", async (req, res) => {
  try {
    // 检查表是否存在
    const tableExistsSQL = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'picking_list'
    `;

    const tableExists = await dbQuery(tableExistsSQL);

    if (tableExists[0].count === 0) {
      return res.json(
        standardResponse(true, "picking_listテーブルが存在しません", {
          tableExists: false,
          totalCount: 0,
          latestRecord: null,
        }),
      );
    }

    // 获取总数
    const countSQL = "SELECT COUNT(*) as total FROM picking_list";
    const countResult = await dbQuery(countSQL);

    // 获取最新记录
    const latestSQL = `
      SELECT * FROM picking_list
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const latestResult = await dbQuery(latestSQL);

    res.json(
      standardResponse(true, "picking_listテーブルの概要を取得しました", {
        tableExists: true,
        totalCount: countResult[0].total,
        latestRecord: latestResult[0] || null,
      }),
    );
  } catch (error) {
    console.error("获取picking_list概要时发生错误:", error);
    res
      .status(500)
      .json(standardResponse(false, "概要取得中にエラーが発生しました: " + error.message));
  }
});

export default router;
