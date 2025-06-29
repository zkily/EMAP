// 在庫ファイル監視開始

import chokidar from "chokidar";
import mysql from "mysql2/promise";
import path from "path";
import  {importStockTransactions}  from "./importStockTransactions.js";

const excelPath = "//192.168.1.200/社内共有/02_生産管理部/Data/HDDT.xls";

async function logSystem(message) {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });
  await connection.execute(`INSERT INTO system_logs (message) VALUES (?)`, [
    message,
  ]);
  await connection.end();
}

export function startStockTransactionWatcher() {
  console.log(`📡 [importStockService] 在庫ファイル監視開始: ${excelPath}`);

  let timeout = null;
  const watcher = chokidar.watch(excelPath, {
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

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        await importStockTransactions();
        await logSystem(
          `[在庫ファイル監視] ファイル更新: ${path.basename(
            filePath
          )} → 自動入出庫取込 成功`
        );
      } catch (err) {
        await logSystem(
          `[在庫ファイル監視] ファイル更新: ${path.basename(
            filePath
          )} → エラー: ${err.message}`
        );
      }
    }, 5000);
  });

  watcher.on("error", (error) => {
    console.error(`❌ [importStockService] 監視エラー: ${error}`);
  });
}
