import { db } from "../../../db/index.js";

/**
 * 批量同步日订单到流水表
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const batchShippingSyncService = async () => {
  const connection = await db.getConnection();
  let transaction = false;

  try {
    // 使用today模式
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const dateCondition = `AND year = ? AND month = ? AND day = ? AND status = '出荷済'`;
    const params = [year, month, day];

    // 开始事务
    await connection.beginTransaction();
    transaction = true;

    // 查询符合条件的记录数
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM order_daily
       WHERE confirmed_units > 0
       ${dateCondition}`,
      params,
    );
    const totalRecords = countRows[0].total;

    // 检查已同步的订单ID
    const [syncedIds] = await connection.query(
      `SELECT DISTINCT SUBSTRING_INDEX(remarks, ':', -1) as order_id
       FROM stock_transaction_logs
       WHERE remarks LIKE '日订单ID:%'`,
    );

    const syncedIdsSet = new Set();
    for (const row of syncedIds) {
      if (row.order_id) {
        syncedIdsSet.add(row.order_id);
      }
    }

    // 分批处理
    const batchSize = 500;
    let processedCount = 0;
    let shipCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 分批处理数据
    for (let offset = 0; offset < totalRecords; offset += batchSize) {
      const [shipOrders] = await connection.query(
        `SELECT * FROM order_daily
         WHERE confirmed_units > 0
         ${dateCondition}
         ORDER BY id DESC
         LIMIT ${offset}, ${batchSize}`,
        params,
      );

      for (const order of shipOrders) {
        processedCount++;

        // 检查是否已同步
        if (syncedIdsSet.has(order.id.toString())) {
          skipCount++;
          continue;
        }

        // 跳过confirmed_units为0的订单
        if (!order.confirmed_units || order.confirmed_units <= 0) {
          skipCount++;
          continue;
        }

        // 处理product_cd
        let modifiedProductCd = order.product_cd;
        if (modifiedProductCd && modifiedProductCd.length > 0) {
          modifiedProductCd = modifiedProductCd.slice(0, -1) + "1";
        }

        const remark = `日订单ID:${order.id}`;

        try {
          await connection.query(
            `INSERT INTO stock_transaction_logs
             (stock_type, target_cd, location_cd, transaction_type, quantity, unit,
              transaction_time, remarks, process_cd, operator_name, lot_no)
             VALUES ('製品', ?, '製品倉庫', '出荷', ?, '本',
             STR_TO_DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')), '%Y-%m-%d'),
             ?, '', '', '')`,
            [
              modifiedProductCd,
              order.confirmed_units ?? 0,
              order.year,
              order.month,
              order.day,
              remark,
            ],
          );
          shipCount++;
        } catch (insertErr) {
          if (insertErr.code === "ER_DUP_ENTRY") {
            skipCount++;
          } else {
            errorCount++;
          }
        }
      }

      // 每批次提交
      await connection.commit();
      transaction = false;
      await connection.beginTransaction();
      transaction = true;
    }

    // 最后一批提交
    if (transaction) {
      await connection.commit();
      transaction = false;
    }

    return {
      success: true,
      data: {
        totalRecords,
        processed: processedCount,
        inserted: shipCount,
        skipped: skipCount,
        errors: errorCount,
        message: `${shipCount}件の注文を同期しました（${skipCount}件スキップ、${errorCount}件エラー）`,
      },
    };
  } catch (err) {
    if (transaction) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("トランザクションのロールバックに失敗しました:", rollbackErr);
      }
    }

    return {
      success: false,
      error: "出荷履歴同期エラー: " + (err.message || err),
    };
  } finally {
    connection.release();
  }
};
