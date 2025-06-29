// 📥 在庫Excel取込（2025年5月1日以降のみ対象）

import xlsx from "xlsx";
import mysql from "mysql2/promise";

// ✅ 系统日志记录
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

// ✅ 读取最后导入位置
async function getLastImportStatus() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });
  const [rows] = await connection.execute(
    `SELECT last_register_date, last_register_time, last_update_seq
     FROM system_import_status WHERE module_name = 'stock_excel_import'`,
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : null;
}

// ✅ 更新导入位置
async function updateLastImportStatus(lastDate, lastTime, lastUpdateSeq) {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "136228508",
    database: "arai_db",
  });
  await connection.execute(
    `INSERT INTO system_import_status (module_name, last_register_date, last_register_time, last_update_seq)
     VALUES ('stock_excel_import', ?, ?, ?)
     ON DUPLICATE KEY UPDATE last_register_date = VALUES(last_register_date),
                             last_register_time = VALUES(last_register_time),
                             last_update_seq = VALUES(last_update_seq)`,
    [lastDate, lastTime, lastUpdateSeq],
  );
  await connection.end();
}

// ✅ 主处理函数
export async function importStockTransactions() {
  const excelPath = "//192.168.1.200/社内共有/02_生産管理部/Data/HDDT.xls";

  const parseTransactionTime = (dateStr, timeStr) => {
    const rawDate = dateStr?.toString() ?? "";
    const rawTime = timeStr?.toString().padStart(6, "0");
    const formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const formattedTime = `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:${rawTime.slice(4, 6)}`;
    return new Date(`${formattedDate}T${formattedTime}`);
  };

  try {
    const MIN_DATE = "20250601"; // ⛔ 最小处理日期：2025-06-01
    const lastStatus = await getLastImportStatus();
    const lastDate = lastStatus?.last_register_date ?? MIN_DATE;
    const lastTime = lastStatus?.last_register_time ?? "000000";
    const lastUpdateSeq = lastStatus?.last_update_seq ?? "";

    const workbook = xlsx.readFile(excelPath);
    await logSystem(`[在庫取込] Excel読み込み成功: ${excelPath}`);

    const connection = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "136228508",
      database: "arai_db",
    });

    const inRows = xlsx.utils.sheet_to_json(workbook.Sheets["入庫"] || {});
    const outRows = xlsx.utils.sheet_to_json(workbook.Sheets["出庫"] || {});

    if (!inRows.length && !outRows.length) {
      await logSystem("[在庫取込] Excelに有効な入庫・出庫データなし");
      await connection.end();
      return;
    }

    const processRows = async (rows, type) => {
      let inserted = 0,
        skipped = 0;
      let maxDate = lastDate,
        maxTime = lastTime,
        maxUpdateSeq = lastUpdateSeq;

      for (const row of rows) {
        const date = row["日付"]?.toString() ?? "";
        const product_cd = row["製品CD"];
        const quantity = Number(row["数量"]) * Number(row["入数"]);
        const operator_name = row["名前"] ?? "";
        const regDate = row["_登録日付"]?.toString() ?? "";
        // 获取完整的"_更新順"字段值
        const updateSeq = row["_更新順"]?.toString() ?? "";
        // 仍然需要提取时间部分用于创建transaction_time
        const regTime = updateSeq.length >= 15 ? updateSeq.substring(9, 15) : "000000";

        // ⛔ 日期过滤：跳过 2025-06-01 之前的数据
        if (date < MIN_DATE) {
          skipped++;
          continue;
        }

        // ✅ 增量判断 - 使用完整的_更新順字段进行比较
        if (
          regDate < lastDate ||
          (regDate === lastDate && regTime < lastTime) ||
          (regDate === lastDate &&
            regTime === lastTime &&
            updateSeq &&
            lastUpdateSeq &&
            updateSeq <= lastUpdateSeq)
        ) {
          skipped++;
          continue;
        }

        const transaction_time = parseTransactionTime(regDate, regTime);

        try {
          await connection.execute(
            `INSERT INTO stock_transaction_logs
             (stock_type, target_cd, location_cd, transaction_type, quantity, unit, transaction_time, remarks, process_cd, operator_name, update_seq)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              "製品",
              product_cd,
              "製品倉庫",
              type,
              quantity,
              "本",
              transaction_time,
              "ハンディターミナル",
              "KT13",
              operator_name || null,
              updateSeq || null,
            ],
          );
          inserted++;
          // 更新最大值
          if (
            regDate > maxDate ||
            (regDate === maxDate && regTime > maxTime) ||
            (regDate === maxDate && regTime === maxTime && updateSeq > maxUpdateSeq)
          ) {
            maxDate = regDate;
            maxTime = regTime;
            maxUpdateSeq = updateSeq;
          }
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") {
            skipped++;
            continue;
          } else {
            await logSystem(`[在庫取込][${type}] エラー: ${err.message}`);
            throw new Error(`[${type}] エラー: ${err.message}`);
          }
        }
      }

      await logSystem(`[在庫取込][${type}] 登録: ${inserted}件 / スキップ: ${skipped}件`);
      return { maxDate, maxTime, maxUpdateSeq };
    };

    let latest = { maxDate: lastDate, maxTime: lastTime, maxUpdateSeq: lastUpdateSeq };
    if (inRows.length) latest = await processRows(inRows, "入庫");
    if (outRows.length) latest = await processRows(outRows, "出庫");

    await updateLastImportStatus(latest.maxDate, latest.maxTime, latest.maxUpdateSeq);

    await connection.end();
    await logSystem("[在庫取込] Excel → 在庫履歴 増分取込完了");
  } catch (err) {
    await logSystem(`[在庫取込] エラー: ${err.message}`);
    throw err;
  }
}
