import { db } from "../../../db/index.js";

// 获取stock_wip表数据
export const getWipStockList = async ({ product_cd, process_cd, location_cd }) => {
  let sql = `
    SELECT
      w.product_cd,
      p.product_name,
      w.lot_no,
      w.process_cd,
      pr.process_name,
      rs.step_no,
      w.location_cd,
      w.quantity,
      w.updated_at
    FROM stock_wip w
    LEFT JOIN products p
      ON w.product_cd COLLATE utf8mb4_general_ci = p.product_cd COLLATE utf8mb4_general_ci
    LEFT JOIN processes pr
      ON w.process_cd COLLATE utf8mb4_general_ci = pr.process_cd COLLATE utf8mb4_general_ci
    LEFT JOIN product_route_steps rs
      ON w.product_cd COLLATE utf8mb4_general_ci = rs.product_cd COLLATE utf8mb4_general_ci
      AND w.process_cd COLLATE utf8mb4_general_ci = rs.process_cd COLLATE utf8mb4_general_ci
    WHERE 1 = 1
  `;

  const params = [];

  if (product_cd) {
    sql += " AND w.product_cd = ?";
    params.push(product_cd);
  }

  if (process_cd) {
    sql += " AND w.process_cd = ?";
    params.push(process_cd);
  }

  if (location_cd) {
    sql += " AND w.location_cd = ?";
    params.push(location_cd);
  }

  sql += " ORDER BY w.product_cd, rs.step_no, w.lot_no";

  const [rows] = await db.query(sql, params);
  return rows;
};

// 返回工程字段顺序
export const getProcessOrder = async (req, res) => {
  try {
    const [rows] = await db.query(`
    SELECT DISTINCT process_cd, MIN(step_no) AS step_no
    FROM product_route_steps
    GROUP BY process_cd
    ORDER BY step_no
  `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[getProcessOrder] 取得失敗:", err);
    res.status(500).json({
      success: false,
      message: "工程順序取得失敗",
      detail: err.message,
    });
  }
};

// WIP在库再计算 和 WIP快照保存
export const recalculateAndSnapshotWipStock = async (logSystem = console.log) => {
  const today = new Date().toISOString().slice(0, 10);
  const logWithTime = (msg) => {
    const timestamp = new Date().toISOString();
    if (typeof logSystem === "function") {
      logSystem(`[${timestamp}] ${msg}`);
    } else {
      console.log(`[${timestamp}] ${msg}`);
    }
  };

  try {
    logWithTime("WIP在庫再計算開始");

    // 0. 清空WIP表
    await db.query(`DELETE FROM stock_wip`);
    logWithTime("既存WIP在庫データクリア完了");

    // 1. 获取工程顺序
    const [routeSteps] = await db.query(`
      SELECT product_cd, process_cd, step_no
      FROM product_route_steps
      ORDER BY product_cd, step_no
    `);

    if (!routeSteps.length) {
      logWithTime("警告: 工程順序データが見つかりません");
      return 0;
    }

    logWithTime(`工程順序データ取得完了: ${routeSteps.length}件`);

    const routeMap = {};
    for (const row of routeSteps) {
      if (!routeMap[row.product_cd]) routeMap[row.product_cd] = [];
      routeMap[row.product_cd][row.step_no - 1] = row.process_cd;
    }

    // 2. 汇总履历
    const [logs] = await db.query(`
      SELECT stock_type, target_cd AS product_cd, process_cd,
             transaction_type, SUM(quantity) AS quantity
      FROM stock_transaction_logs
      WHERE stock_type IN ('仕掛品', '製品')
      GROUP BY stock_type, target_cd, process_cd, transaction_type
    `);

    logWithTime(`在庫履歴データ取得完了: ${logs.length}件`);

    const dataMap = {}; // key = product_cd__process_cd
    for (const log of logs) {
      const { stock_type, product_cd, process_cd = "FINAL", transaction_type, quantity } = log;

      const key = `${product_cd}__${process_cd}`;
      dataMap[key] ||= {
        product_cd,
        process_cd,
        実績: 0,
        不良: 0,
        廃棄: 0,
        保留: 0,
        調整: 0,
        入庫: 0,
        初期: 0,
      };

      const entry = dataMap[key];
      if (stock_type === "仕掛品") {
        if (["実績", "不良", "廃棄", "保留", "初期", "調整"].includes(transaction_type)) {
          entry[transaction_type] += Number(quantity);
        }
      } else if (stock_type === "製品" && transaction_type === "入庫") {
        entry.入庫 += Number(quantity);
      }
    }

    logWithTime("在庫データマッピング完了");

    // 3. 差引在庫計算
    const insertRows = [];
    for (const product_cd in routeMap) {
      const processList = routeMap[product_cd];
      for (let i = 0; i < processList.length; i++) {
        const proc = processList[i];
        const nextProc = processList[i + 1];
        const key = `${product_cd}__${proc}`;
        const nextKey = nextProc ? `${product_cd}__${nextProc}` : null;

        // 统一默认值处理
        const defaultValues = {
          実績: 0,
          不良: 0,
          廃棄: 0,
          保留: 0,
          調整: 0,
          入庫: 0,
          初期: 0,
        };

        const thisEntry = dataMap[key] || { ...defaultValues };
        const nextEntry = nextKey ? dataMap[nextKey] || { ...defaultValues } : { ...defaultValues };

        let qty = 0;
        if (i === 0) {
          // 首道工序
          qty =
            thisEntry.実績 -
            nextEntry.実績 -
            thisEntry.保留 +
            thisEntry.初期 +
            thisEntry.調整 -
            nextEntry.不良 -
            thisEntry.廃棄;
        } else if (i === processList.length - 1) {
          // 最终工序
          qty =
            thisEntry.実績 -
            thisEntry.入庫 -
            thisEntry.保留 +
            thisEntry.初期 -
            thisEntry.廃棄 +
            thisEntry.調整;
        } else {
          // 中间工序
          qty =
            thisEntry.実績 -
            nextEntry.実績 -
            nextEntry.不良 -
            thisEntry.保留 +
            thisEntry.初期 -
            thisEntry.廃棄 +
            thisEntry.調整;
        }

        // 仅在数量不为0时添加记录
        if (qty !== 0) {
          insertRows.push([product_cd, "", proc, "", qty]);
        }
      }
    }

    logWithTime(`在庫計算完了: ${insertRows.length}件のデータが生成されました`);

    // 4. 写入 WIP 表
    if (insertRows.length > 0) {
      await db.query(
        `INSERT INTO stock_wip (product_cd, lot_no, process_cd, location_cd, quantity) VALUES ?`,
        [insertRows],
      );
      logWithTime(`WIP在庫テーブル更新完了: ${insertRows.length}件`);
    } else {
      logWithTime("WIP在庫データなし");
    }

    // 5. 保存快照（先删后存，防重复）
    await db.query(`DELETE FROM stock_wip_snapshots WHERE calc_date = ?`, [today]);
    logWithTime(`本日(${today})の既存スナップショットを削除しました`);

    if (insertRows.length > 0) {
      const snapshotRows = insertRows.map((row) => [...row, today]);
      await db.query(
        `INSERT INTO stock_wip_snapshots (product_cd, lot_no, process_cd, location_cd, quantity, calc_date) VALUES ?`,
        [snapshotRows],
      );
      logWithTime(`スナップショット保存完了: ${snapshotRows.length}件`);
    }

    // 6. 日志
    const msg = `[WIP在庫再計算+快照] ${today} 保存 ${insertRows.length} 件`;
    logWithTime(msg);

    return insertRows.length;
  } catch (error) {
    logWithTime(`WIP在庫再計算エラー: ${error.message}`);
    throw error;
  }
};
