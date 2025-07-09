import express from "express";
import { pool as db } from "../../db/connection.js";
import {
  addStockTransaction,
  getProductStockTrend,
  getDailyTrendData,
  getAllProductStockTrends,
  getStockDepletionDates,
  deleteStockLog,
  clearStockTrends,
  getNegativeStockData,
} from "./controllers/productStockcontroller.js";
import { recalculateStockAndSnapshot } from "./services/productStockService.js"; // 製品在庫快照保存
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import iconv from "iconv-lite";

const router = express.Router();

// CSV行解析函数（引用符とエスケープ処理対応）
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされた引用符
        current += '"';
        i += 2;
        continue;
      } else {
        // 引用符の開始または終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // フィールド区切り
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
    i++;
  }

  // 最後のフィールドを追加
  result.push(current.trim());

  return result;
}

//============== 入出庫手动录入  和  入出庫履歴取得 =======================
// 入出庫履歴取得
router.get("/logs", async (req, res) => {
  const {
    stock_type,
    transaction_type, // 👈 确保取得
    keyword = "",
    location_cd,
    date_range = [],
    page = 1,
    pageSize = 20,
  } = req.query;

  const [startDate, endDate] = Array.isArray(date_range) ? date_range : [null, null];

  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  const values = [];

  // ✅ 条件句拼接（针对主数据查询）
  if (stock_type) {
    conditions.push("l.stock_type = ?");
    values.push(stock_type);
  }
  if (transaction_type) {
    conditions.push("l.transaction_type = ?");
    values.push(transaction_type);
  }
  if (location_cd) {
    conditions.push("l.location_cd LIKE ?");
    values.push(`%${location_cd}%`);
  }
  if (startDate && endDate) {
    conditions.push("DATE(l.transaction_time) BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }
  if (keyword) {
    conditions.push(`(
      l.target_cd LIKE ?
      OR (l.stock_type IN ('製品', '在制品') AND p.product_name LIKE ?)
      OR (l.stock_type = '材料' AND m.material_name LIKE ?)
      OR (l.stock_type = '部品' AND c.component_name LIKE ?)
    )`);
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  try {
    // ✅ 获取分页数据
    const [rows] = await db.query(
      `
      SELECT
        l.*,
        CASE
          WHEN l.stock_type IN ('製品', '在制品') THEN p.product_name
          WHEN l.stock_type = '材料' THEN m.material_name
          WHEN l.stock_type = '部品' THEN c.component_name
          ELSE ''
        END AS target_name,
        pr.process_name
      FROM stock_transaction_logs l
      LEFT JOIN products p ON l.stock_type IN ('製品', '在制品') AND l.target_cd = p.product_cd
      LEFT JOIN materials m ON l.stock_type = '材料' AND l.target_cd = m.material_cd
      LEFT JOIN components c ON l.stock_type = '部品' AND l.target_cd = c.component_cd
      LEFT JOIN processes pr ON l.process_cd = pr.process_cd
      ${whereClause}
      ORDER BY l.transaction_time DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset],
    );

    // ✅ 获取总数（也加入 transaction_type 条件）
    const countConditions = [];
    const countValues = [];

    if (stock_type) {
      countConditions.push("stock_type = ?");
      countValues.push(stock_type);
    }
    if (transaction_type) {
      countConditions.push("transaction_type = ?");
      countValues.push(transaction_type);
    }
    if (location_cd) {
      countConditions.push("location_cd LIKE ?");
      countValues.push(`%${location_cd}%`);
    }
    if (startDate && endDate) {
      countConditions.push("DATE(transaction_time) BETWEEN ? AND ?");
      countValues.push(startDate, endDate);
    }
    if (keyword) {
      countConditions.push(`(
        target_cd LIKE ?
        OR (stock_type IN ('製品', '在制品') AND EXISTS (
          SELECT 1 FROM products p WHERE p.product_cd = target_cd AND p.product_name LIKE ?
        ))
        OR (stock_type = '材料' AND EXISTS (
          SELECT 1 FROM materials m WHERE m.material_cd = target_cd AND m.material_name LIKE ?
        ))
        OR (stock_type = '部品' AND EXISTS (
          SELECT 1 FROM components c WHERE c.component_cd = target_cd AND c.component_name LIKE ?
        ))
      )`);
      countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const countWhere = countConditions.length ? "WHERE " + countConditions.join(" AND ") : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM stock_transaction_logs ${countWhere}`,
      countValues,
    );

    res.json({
      success: true,
      data: {
        list: rows,
        total: Number(total),
      },
    });
  } catch (err) {
    console.error("在庫ログ取得エラー:", err);
    res.status(500).json({
      success: false,
      message: "在庫ログ取得失敗",
      error: err,
    });
  }
});

// 全体在庫入出庫
router.post("/transaction", addStockTransaction);

// 在庫ログ削除
router.delete("/logs/:id", deleteStockLog);

// EXCEL読取製品倉庫入出庫
router.post("/import-stock", async (req, res) => {
  console.log("📥 CSV取込API呼び出し開始");

  try {
    // 手动处理CSV文件
    const result = await manualProcessCSVFiles();

    if (result && result.message === "CSVファイルが見つかりません") {
      console.log("⚠️ CSVファイルが見つからないため、警告レスポンスを返します");
      res.json({
        success: true,
        message: "CSVファイルが見つかりませんが、処理は正常に完了しました",
        warning: true,
        data: result,
      });
    } else {
      console.log("✅ CSV取込正常完了");
      res.json({ success: true, message: "CSV在庫ファイル取込完了" });
    }
  } catch (err) {
    console.error("❌ CSV取込API エラー:", err);
    console.error("エラースタック:", err.stack);
    res.status(500).json({
      success: false,
      message: err.message || "内部サーバーエラー",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

// 手动处理CSV文件的函数
async function manualProcessCSVFiles() {
  console.log("🚀 手動CSV取込開始...");

  const stockInCsvPath =
    "\\\\192.168.1.200\\社内共有\\02_生産管理部\\Data\\BT-data\\受信\\StockIn.csv";
  const stockOutCsvPath =
    "\\\\192.168.1.200\\社内共有\\02_生産管理部\\Data\\BT-data\\受信\\StockOut.csv";

  console.log("📁 CSVファイルパス:");
  console.log("  StockIn:", stockInCsvPath);
  console.log("  StockOut:", stockOutCsvPath);

  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });

  try {
    let totalProcessed = 0;
    let totalSkipped = 0;

    // 处理StockIn.csv和StockOut.csv
    const csvFiles = [stockInCsvPath, stockOutCsvPath];
    let foundFiles = 0;

    for (const csvFilePath of csvFiles) {
      try {
        if (!fs.existsSync(csvFilePath)) {
          console.log(`⚠️ ファイルが見つかりません: ${path.basename(csvFilePath)}`);
          console.log(`   フルパス: ${csvFilePath}`);
          continue;
        }
        console.log(`📂 ファイル確認OK: ${path.basename(csvFilePath)}`);
        foundFiles++;
      } catch (pathError) {
        console.error(`❌ ファイルパスエラー: ${path.basename(csvFilePath)}`, pathError);
        continue;
      }

      // CSVファイルを読み込む（複数エンコーディング対応）
      let csvContent = "";
      const buffer = fs.readFileSync(csvFilePath);
      const encodings = ["shift_jis", "cp932", "utf-8", "euc-jp"];

      for (const encoding of encodings) {
        try {
          csvContent = iconv.decode(buffer, encoding);

          // 日本語文字が正しく読み込めているかチェック
          if (csvContent.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
            console.log(
              `✅ ${path.basename(csvFilePath)} エンコーディング ${encoding} で読み込み成功`,
            );
            break;
          }
        } catch (err) {
          console.log(
            `⚠️ ${path.basename(csvFilePath)} エンコーディング ${encoding} で読み込み失敗`,
          );
          continue;
        }
      }

      // フォールバック: UTF-8で読み込み
      if (!csvContent) {
        csvContent = buffer.toString("utf-8");
        console.log(`⚠️ ${path.basename(csvFilePath)} フォールバック: UTF-8で読み込み`);
      }

      const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

      // デバッグ用: 最初の数行を表示
      console.log(`📋 [手動CSV取込] ${path.basename(csvFilePath)} CSV内容（最初の3行）:`);
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        console.log(`   行${i + 1}: ${lines[i]}`);
      }

      let processedCount = 0;
      let skippedCount = 0;

      // ヘッダー行をスキップ（最初の行）
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // 空行をスキップ

        // CSV解析の改善（引用符とエスケープ処理）
        const columns = parseCsvLine(line);

        if (columns.length >= 9) {
          // CSV列の解析
          const transactionType = columns[0]; // 第1列: transaction_type
          const date = columns[1]; // 第2列: 日付
          const time = columns[2]; // 第3列: 時間
          const targetCd = columns[5]; // 第6列: target_cd
          const relatedDocNo = columns[4]; // 第5列: related_doc_no
          const quantity1 = parseFloat(columns[7]) || 0; // 第8列: 数量1
          const quantity2 = parseFloat(columns[8]) || 0; // 第9列: 数量2

          // デバッグ用: transaction_typeの値を表示
          if (i <= 3) {
            console.log(`   transaction_type (行${i}): "${transactionType}"`);
          }

          // transaction_time = 第2列 + 第3列を結合
          const transactionTime = `${date} ${time}`;

          // 日付フィルタ: 2025/07/01以降のデータのみ処理
          const transactionDate = new Date(date);
          const filterDate = new Date("2025-06-30");

          if (transactionDate < filterDate) {
            skippedCount++;
            continue; // 2025/07/01より前のデータはスキップ
          }

          // 重複チェック用の唯一IDを生成（データベース用）
          const uniqueId = `${targetCd}_${transactionTime}_${transactionType}_${relatedDocNo}`;

          // データベースで重複チェック
          const [existingRows] = await connection.execute(
            `SELECT id FROM stock_transaction_logs WHERE remarks = ? LIMIT 1`,
            [uniqueId],
          );

          if (existingRows.length > 0) {
            skippedCount++;
            if (i <= 5) {
              console.log(`   🔄 重複スキップ (行${i}): uniqueId="${uniqueId}"`);
            }
            continue; // 重複データはスキップ
          }

          // quantity = 第8列 * 第9列
          const quantity = Math.round(quantity1 * quantity2);

          // stock_transaction_logsテーブルに挿入（remarksフィールドに唯一IDを保存）
          const insertQuery = `
            INSERT INTO stock_transaction_logs
            (stock_type, target_cd, location_cd, process_cd, transaction_type, quantity, unit, transaction_time, related_doc_no, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await connection.execute(insertQuery, [
            "製品", // stock_type
            targetCd, // target_cd
            "製品倉庫", // location_cd
            "KT13", // process_cd
            transactionType, // transaction_type
            quantity, // quantity
            "本", // unit
            transactionTime, // transaction_time
            relatedDocNo, // related_doc_no
            uniqueId, // remarks（唯一ID）
          ]);

          processedCount++;
          if (i <= 5) {
            console.log(`   ✅ 新規追加 (行${i}): uniqueId="${uniqueId}"`);
          }
        }
      }

      const fileName = path.basename(csvFilePath);
      console.log(
        `✅ [手動CSV取込] ${fileName} 処理完了: ${processedCount}件処理, ${skippedCount}件スキップ（重複/日付フィルタ）`,
      );

      totalProcessed += processedCount;
      totalSkipped += skippedCount;
    }

    // 检查是否找到任何文件
    if (foundFiles === 0) {
      console.log("⚠️ 処理対象のCSVファイルが見つかりませんでした");
      // 仍然记录到系统日志
      await connection.execute(`INSERT INTO system_logs (message) VALUES (?)`, [
        `[手動CSV取込] ファイルが見つかりません`,
      ]);
      return { processed: 0, skipped: 0, message: "CSVファイルが見つかりません" };
    }

    // システムログに記録
    await connection.execute(`INSERT INTO system_logs (message) VALUES (?)`, [
      `[手動CSV取込] 処理完了: ${totalProcessed}件処理, ${totalSkipped}件スキップ`,
    ]);

    console.log(
      `🎉 手動CSV取込完了: 総処理件数 ${totalProcessed}件, 総スキップ件数 ${totalSkipped}件`,
    );

    // 如果没有找到任何文件，返回警告信息
    if (totalProcessed === 0 && totalSkipped === 0) {
      console.log("⚠️ 処理対象のCSVファイルが見つかりませんでした");
      return { processed: 0, skipped: 0, message: "CSVファイルが見つかりません" };
    }
  } catch (error) {
    console.error(`❌ 手動CSV取込エラー:`, error);
    // エラーログも記録
    await connection.execute(`INSERT INTO system_logs (message) VALUES (?)`, [
      `[手動CSV取込] エラー: ${error.message}`,
    ]);
    throw error;
  } finally {
    await connection.end();
  }
}

//==============          =======================

// 一体化组合调用 再计算 + 异常检测 + 报警 + 库存快照 + 流水归档
router.post("/products/recalculate-and-check", async (req, res) => {
  try {
    const result = await recalculateStockAndSnapshot();
    res.json({
      success: true,
      message: result.message || "在庫再計算が完了しました",
      data: result, // 所有业务字段都包进 data 里
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 製品在庫推移計算--选择
router.get("/product-trend", getProductStockTrend);

// 製品在庫推移計算--全製品
router.get("/product-trend/all", getAllProductStockTrends);

// 清空在庫推移表
router.post("/clear-trends", clearStockTrends);

// 获取负库存数据
router.get("/negative-stock", getNegativeStockData);

// キャッシュ読取（前端ページ用）
router.get("/daily-trends", getDailyTrendData);

// 出荷枯渇予測
router.get("/stock-depletion-dates", getStockDepletionDates);

// 製品倉庫履歴検索
router.get("/snapshots", async (req, res) => {
  const { product_cd, location_cd, start_date, end_date } = req.query;
  let conditions = [];
  let params = [];

  if (product_cd) {
    conditions.push("s.product_cd = ?");
    params.push(product_cd);
  }
  if (location_cd) {
    conditions.push("s.location_cd = ?");
    params.push(location_cd);
  }
  if (start_date && end_date) {
    conditions.push("s.snapshot_date BETWEEN ? AND ?");
    params.push(start_date, end_date);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await db.query(
      `
    SELECT
      DATE_FORMAT(s.snapshot_date, '%Y-%m-%d') AS snapshot_date,
      s.product_cd,
      p.product_name,
      s.location_cd,
      s.lot_no,
      s.quantity
    FROM stock_product_snapshots s
    LEFT JOIN products p ON s.product_cd = p.product_cd
    ${where}
    ORDER BY s.snapshot_date, s.product_cd, s.location_cd
  `,
      params,
    );

    res.json({
      success: true,
      message: "OK",
      data: rows, // ✅ 注意加 data
    });
  } catch (err) {
    console.error("❌ 在庫スナップショット取得失敗:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
});

export default router;
