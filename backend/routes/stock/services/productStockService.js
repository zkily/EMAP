import { db } from "../../../db/index.js";

// 组合调用 再计算 + 异常检测 + 报警 + 库存快照 + 流水归档
export async function recalculateStockAndSnapshot() {
  // 1. 再计算 + 异常检测 + 报警
  const result = await recalculateAndCheckProductStockLogic();
  // 2. 快照最新库存+流水归档
  const snapCount = await runStockArchiveJob();
  // 3. 返回
  return {
    ...result,
    snapshotSaved: snapCount,
  };
}

// 再计算 + 异常检测 + 报警
export async function recalculateAndCheckProductStockLogic() {
  // 删除当天的快照数据
  const today = new Date().toISOString().slice(0, 10);
  await db.query(`DELETE FROM stock_product_snapshots WHERE snapshot_date = ?`, [today]);

  // 清空库存表重新计算
  await db.query(`DELETE FROM stock_products`);
  let updatedCount = 0;

  // 1. 快照+后续流水计算即时库存
  const [snapshots] = await db.query(`
  SELECT t1.product_cd, t1.location_cd, t1.snapshot_date, t1.quantity AS snapshot_qty
  FROM stock_product_snapshots t1
  INNER JOIN (
    SELECT product_cd, location_cd, MAX(snapshot_date) AS max_date
    FROM stock_product_snapshots
    GROUP BY product_cd, location_cd
  ) t2
  ON t1.product_cd = t2.product_cd
  AND t1.location_cd = t2.location_cd
  AND t1.snapshot_date = t2.max_date
`);

  for (const snap of snapshots) {
    const [deltaRows] = await db.query(
      `SELECT IFNULL(SUM(
        CASE transaction_type
          WHEN '入庫' THEN quantity
          WHEN '出庫' THEN -quantity
          WHEN '調整' THEN quantity
          WHEN '廃棄' THEN -quantity
          WHEN '保留' THEN -quantity
          WHEN '出荷' THEN -quantity
          WHEN '取消' THEN quantity
          WHEN '初期' THEN quantity
          ELSE 0
        END
      ), 0) AS delta_qty
      FROM stock_transaction_logs
      WHERE stock_type = '製品'
        AND target_cd = ?
        AND location_cd = ?
        AND DATE(transaction_time) > ?
      `,
      [snap.product_cd, snap.location_cd, snap.snapshot_date],
    );
    const deltaQty = Number(deltaRows[0].delta_qty);
    const finalQty = Number(snap.snapshot_qty) + deltaQty;
    if (finalQty !== 0) {
      await db.query(
        `REPLACE INTO stock_products (product_cd, location_cd, quantity) VALUES (?, ?, ?)`,
        [snap.product_cd, snap.location_cd, finalQty],
      );
      updatedCount++;
    }
  }

  // 2. 仅流水、无快照的库存项
  const [deltaOnlyRows] = await db.query(`
    SELECT
      target_cd AS product_cd,
      location_cd,
      SUM(
        CASE transaction_type
          WHEN '入庫' THEN quantity
          WHEN '出庫' THEN -quantity
          WHEN '調整' THEN quantity
          WHEN '廃棄' THEN -quantity
          WHEN '保留' THEN -quantity
          WHEN '出荷' THEN -quantity
          WHEN '取消' THEN quantity
          WHEN '初期' THEN quantity
          ELSE 0
        END
      ) AS total_quantity
    FROM stock_transaction_logs
    WHERE stock_type = '製品'
      AND NOT EXISTS (
        SELECT 1 FROM stock_product_snapshots s
        WHERE s.product_cd = stock_transaction_logs.target_cd
          AND s.location_cd = stock_transaction_logs.location_cd
      )
      AND NOT EXISTS (
        SELECT 1 FROM stock_products p
        WHERE p.product_cd = stock_transaction_logs.target_cd
        AND p.location_cd = stock_transaction_logs.location_cd
      )
    GROUP BY target_cd, location_cd
    HAVING total_quantity != 0
  `);

  for (const row of deltaOnlyRows) {
    await db.query(
      `REPLACE INTO stock_products (product_cd, location_cd, quantity)
       VALUES (?, ?, ?)`,
      [row.product_cd, row.location_cd, row.total_quantity],
    );
    updatedCount++;
  }

  // 3. 异常检测
  const [negativeStock] = await db.query(`
    SELECT s.product_cd, p.product_name, s.location_cd, s.quantity
    FROM stock_products s
    LEFT JOIN products p ON s.product_cd = p.product_cd
    WHERE s.quantity < 0
  `);

  const [multiLocations] = await db.query(`
    SELECT s.product_cd, p.product_name, COUNT(DISTINCT s.location_cd) AS location_count
    FROM stock_products s
    LEFT JOIN products p ON s.product_cd = p.product_cd
    GROUP BY s.product_cd
    HAVING location_count > 1
  `);

  const duplicateLots = [];

  const [stockList] = await db.query(`
    SELECT
      sp.product_cd,
      p.product_name,
      d.destination_name,
      sp.location_cd,
      sp.quantity,
      p.unit_per_box,
      p.box_type,
      CASE
        WHEN p.unit_per_box > 0 THEN FLOOR(sp.quantity / p.unit_per_box)
        ELSE 0
      END as boxes
    FROM stock_products sp
    LEFT JOIN products p ON sp.product_cd = p.product_cd
    LEFT JOIN delivery_destinations d ON p.delivery_destination_cd = d.destination_cd
    ORDER BY sp.product_cd, sp.location_cd
  `);

  // 统计各种箱型数量
  const [boxTypeStats] = await db.query(`
    SELECT
      p.box_type,
      SUM(CASE WHEN p.unit_per_box > 0 THEN FLOOR(sp.quantity / p.unit_per_box) ELSE 0 END) as total_boxes
    FROM stock_products sp
    LEFT JOIN products p ON sp.product_cd = p.product_cd
    WHERE p.box_type IS NOT NULL AND p.box_type != ''
    GROUP BY p.box_type
    ORDER BY total_boxes DESC
  `);

  // 自动报警
  await alarmAbnormalStock({ negativeStock, multiLocations });

  return {
    message: "在庫再計算が完了しました",
    updatedCount,
    executedAt: new Date().toISOString(),
    anomalies: {
      negativeStock,
      multiLocations,
      duplicateLots,
    },
    stockList,
    boxTypeStats,
  };
}

// 报警（还没有做）
export async function alarmAbnormalStock({ negativeStock, multiLocations }) {
  if (negativeStock?.length > 0) {
    // 这里用console报警，换成发邮件等即可
    console.warn("【报警】负库存：", negativeStock);
    // await sendMail("负库存报警", JSON.stringify(negativeStock, null, 2));
  }
  if (multiLocations?.length > 0) {
    console.warn("【报警】同一产品多仓库：", multiLocations);
  }
}

// 库存快照
export async function snapshotProductStocks() {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // 删除当天已有快照，避免重复
  await db.query(`DELETE FROM stock_product_snapshots WHERE snapshot_date = ?`, [today]);

  // 获取最新库存数据
  const [rows] = await db.query(`SELECT * FROM stock_products`);

  if (rows.length) {
    // 添加快照时间戳的注释记录，方便调试
    await db.query(`INSERT INTO system_logs (message) VALUES (?)`, [
      `生成库存快照：${rows.length}件，时间：${now.toISOString()}`,
    ]);

    // 插入快照数据
    const inserts = rows.map((r) => [
      today,
      r.product_cd,
      r.location_cd,
      r.lot_no || "",
      r.quantity,
    ]);
    await db.query(
      `INSERT INTO stock_product_snapshots (snapshot_date, product_cd, location_cd, lot_no, quantity) VALUES ?`,
      [inserts],
    );
  }

  return rows.length;
}

// 流水归档
export async function runStockArchiveJob() {
  const today = new Date().toISOString().slice(0, 10);

  // 1. 创建快照（如需和前面的快照合并，注释掉本步）
  await snapshotProductStocks();

  // 2. 归档1个月前的数据
  const [result] = await db.query(`
    INSERT INTO stock_transaction_logs_archive
    SELECT * FROM stock_transaction_logs
    WHERE transaction_time < DATE_SUB(NOW(), INTERVAL 1 MONTH)
  `);

  // 3. 删除实时表中的老数据
  const [delResult] = await db.query(`
    DELETE FROM stock_transaction_logs
    WHERE transaction_time < DATE_SUB(NOW(), INTERVAL 1 MONTH)
  `);

  return {
    archived: result.affectedRows,
    deleted: delResult.affectedRows,
    archiveDate: today,
  };
}
