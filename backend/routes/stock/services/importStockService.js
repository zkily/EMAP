// CSV在庫ファイル監視開始

import chokidar from "chokidar";
import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";
import iconv from "iconv-lite";

const stockInCsvPath =
  "\\\\192.168.1.200\\社内共有\\02_生産管理部\\Data\\BT-data\\受信\\StockIn.csv";
const stockOutCsvPath =
  "\\\\192.168.1.200\\社内共有\\02_生産管理部\\Data\\BT-data\\受信\\StockOut.csv";

async function logSystem(message) {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });
  await connection.execute(`INSERT INTO system_logs (message) VALUES (?)`, [message]);
  await connection.end();
}

async function parseCSVAndSaveToDatabase(csvFilePath) {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });

  try {
    // CSVファイルを読み込む（複数のエンコーディングを試行）
    let csvContent = "";
    const encodings = ["shift_jis", "cp932", "utf-8", "euc-jp"];

    for (const encoding of encodings) {
      try {
        const buffer = fs.readFileSync(csvFilePath);
        csvContent = iconv.decode(buffer, encoding);

        // 日本語文字が正しく読み込めているかチェック
        if (csvContent.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
          console.log(`✅ [importStockService] エンコーディング ${encoding} で読み込み成功`);
          break;
        }
      } catch (err) {
        console.log(`⚠️ [importStockService] エンコーディング ${encoding} で読み込み失敗`);
        continue;
      }
    }

    // フォールバック: UTF-8で読み込み
    if (!csvContent) {
      csvContent = fs.readFileSync(csvFilePath, "utf-8");
      console.log(`⚠️ [importStockService] フォールバック: UTF-8で読み込み`);
    }

    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    let processedCount = 0;
    let skippedCount = 0;

    // デバッグ用: 最初の数行を表示
    console.log(`📋 [importStockService] CSV内容（最初の3行）:`);
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      console.log(`   行${i + 1}: ${lines[i]}`);
    }

    // ヘッダー行をスキップ（最初の行）
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

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
          console.log(`   transaction_type (行${i + 1}): "${transactionType}"`);
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
      `✅ [importStockService] ${fileName} CSV処理完了: ${processedCount}件処理, ${skippedCount}件スキップ（重複/日付フィルタ）`,
    );
  } catch (error) {
    console.error(`❌ [importStockService] CSV処理エラー:`, error);
    throw error;
  } finally {
    await connection.end();
  }
}

// CSV行を正しく解析する関数（引用符やカンマを適切に処理）
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // カンマ区切り
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // 最後のフィールドを追加
  result.push(current.trim());

  return result;
}

export function startStockTransactionWatcher() {
  console.log(`📡 [importStockService] CSV在庫ファイル監視開始:`);
  console.log(`   - StockIn: ${stockInCsvPath}`);
  console.log(`   - StockOut: ${stockOutCsvPath}`);

  // 両方のCSVファイルを監視
  const watchPaths = [stockInCsvPath, stockOutCsvPath];
  const timeouts = new Map();

  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    usePolling: true,
    interval: 2000,
    awaitWriteFinish: {
      stabilityThreshold: 3000,
      pollInterval: 100,
    },
  });

  watcher.on("change", (filePath) => {
    console.log(`📥 検知: ${path.basename(filePath)} 更新`);

    // ファイルごとに個別のタイムアウトを管理
    if (timeouts.has(filePath)) {
      clearTimeout(timeouts.get(filePath));
    }

    const timeout = setTimeout(async () => {
      try {
        await parseCSVAndSaveToDatabase(filePath);
        await logSystem(
          `[CSV在庫ファイル監視] ファイル更新: ${path.basename(filePath)} → 自動CSV取込 成功`,
        );
      } catch (err) {
        await logSystem(
          `[CSV在庫ファイル監視] ファイル更新: ${path.basename(filePath)} → エラー: ${err.message}`,
        );
      } finally {
        timeouts.delete(filePath);
      }
    }, 5000);

    timeouts.set(filePath, timeout);
  });

  watcher.on("error", (error) => {
    console.error(`❌ [importStockService] 監視エラー: ${error}`);
  });
}
