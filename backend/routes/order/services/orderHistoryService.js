import { db } from "../../../db/index.js";
import { addSystemLog } from "../../system/system.js";

/**
 * 获取指定月份的第N个工作日
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {number} n - 第几个工作日 (默认3)
 * @returns {Date} - 工作日日期
 */
function getNthWorkdayOfMonth(year, month, n = 3) {
  // 从月初开始
  const date = new Date(year, month - 1, 1);
  let workdayCount = 0;

  while (workdayCount < n) {
    // 检查是否是工作日（排除周六周日）
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workdayCount++;
      if (workdayCount === n) {
        break; // 找到第n个工作日
      }
    }
    // 前进一天
    date.setDate(date.getDate() + 1);
  }

  return date;
}

/**
 * 创建所有未来月份订单的历史快照
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function createOrderHistorySnapshot() {
  const connection = await db.getConnection();
  let snapshotCount = 0;

  try {
    await connection.beginTransaction();

    const currentDate = new Date();
    const recordYear = currentDate.getFullYear();
    const recordMonth = currentDate.getMonth() + 1;
    const snapshotDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // 获取未来月份的订单数据（当月及以后）
    const [orders] = await connection.query(
      `SELECT * FROM order_monthly
       WHERE (year > ? OR (year = ? AND month >= ?))`,
      [recordYear, recordYear, recordMonth],
    );

    if (orders.length > 0) {
      // 构建插入语句的参数数组
      const insertValues = orders.map((order) => [
        order.order_id,
        snapshotDate,
        recordMonth,
        recordYear,
        order.destination_cd,
        order.destination_name,
        order.year,
        order.month,
        order.product_cd,
        order.product_name,
        order.product_alias || "",
        order.forecast_units || 0,
      ]);

      // 批量插入历史记录
      const [result] = await connection.query(
        `INSERT INTO order_monthly_history
         (order_id, snapshot_date, record_month, record_year, destination_cd,
         destination_name, year, month, product_cd, product_name, product_alias, forecast_units)
         VALUES ?`,
        [insertValues],
      );

      snapshotCount = result.affectedRows;

      // 记录系统日志
      await connection.query(
        `INSERT INTO order_log (action, target_type, target_id, message)
         VALUES (?, ?, ?, ?)`,
        [
          "snapshot",
          "order_monthly",
          "-",
          `${snapshotDate}に${snapshotCount}件の受注履歴を記録しました`,
        ],
      );

      await connection.commit();
      await addSystemLog(`[受注履歴] ${snapshotDate}に${snapshotCount}件の受注履歴を記録しました`);

      return { success: true, count: snapshotCount };
    } else {
      await connection.commit();
      await addSystemLog("[受注履歴] 記録対象の受注データが存在しません");
      return { success: true, count: 0 };
    }
  } catch (error) {
    await connection.rollback();
    console.error("受注履歴の記録に失敗しました:", error);
    await addSystemLog(`[受注履歴] エラー: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

/**
 * 根据年月获取订单历史比较数据
 * @param {Object} params - 参数对象
 * @param {number} params.year - 订单年份
 * @param {number} params.month - 订单月份
 * @param {number} params.baseRecordMonth - 基准记录月份
 * @param {number} params.baseRecordYear - 基准记录年份
 * @param {number} params.compareRecordMonth - 比较记录月份
 * @param {number} params.compareRecordYear - 比较记录年份
 * @returns {Promise<Array>} 比较结果
 */
export async function getOrderHistoryComparison(params) {
  const { year, month, baseRecordMonth, baseRecordYear, compareRecordMonth, compareRecordYear } =
    params;

  try {
    // 获取基准月份的最新快照
    const [baseSnapshots] = await db.query(
      `SELECT * FROM order_monthly_history
       WHERE year = ? AND month = ?
       AND record_month = ? AND record_year = ?
       ORDER BY snapshot_date DESC`,
      [year, month, baseRecordMonth, baseRecordYear],
    );

    // 获取比较月份的最新快照
    const [compareSnapshots] = await db.query(
      `SELECT * FROM order_monthly_history
       WHERE year = ? AND month = ?
       AND record_month = ? AND record_year = ?
       ORDER BY snapshot_date DESC`,
      [year, month, compareRecordMonth, compareRecordYear],
    );

    // 构建产品映射
    const baseMap = new Map();
    baseSnapshots.forEach((item) => {
      baseMap.set(item.order_id, item);
    });

    const compareMap = new Map();
    compareSnapshots.forEach((item) => {
      compareMap.set(item.order_id, item);
    });

    // 合并所有order_id
    const allOrderIds = new Set([...baseMap.keys(), ...compareMap.keys()]);

    // 构建比较结果
    const comparisonResults = [];

    for (const orderId of allOrderIds) {
      const base = baseMap.get(orderId);
      const compare = compareMap.get(orderId);

      // 只有在两个时间点都有数据时才比较
      if (base && compare) {
        comparisonResults.push({
          order_id: orderId,
          destination_cd: base.destination_cd,
          destination_name: base.destination_name,
          product_cd: base.product_cd,
          product_name: base.product_name,
          year: base.year,
          month: base.month,
          base_snapshot_date: base.snapshot_date,
          compare_snapshot_date: compare.snapshot_date,
          base_forecast: base.forecast_units,
          compare_forecast: compare.forecast_units,
          forecast_diff: compare.forecast_units - base.forecast_units,
          base_record: `${base.record_year}年${base.record_month}月`,
          compare_record: `${compare.record_year}年${compare.record_month}月`,
        });
      }
    }

    return comparisonResults;
  } catch (error) {
    console.error("受注履歴比較の取得に失敗しました:", error);
    throw error;
  }
}
