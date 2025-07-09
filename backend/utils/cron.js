import schedule from "node-schedule";
import { addSystemLog } from "../routes/system/system.js";
import { batchShippingSyncService } from "../routes/order/services/orderSyncService.js"; //出荷済み同期
import { recalculateStockAndSnapshot } from "../routes/stock/services/productStockService.js"; //製品在庫快照保存

import { recalculateAndSnapshotWipStock } from "../routes/stock/services/wipStockService.js"; //仕掛在庫保存
import { createOrderHistorySnapshot } from "../routes/order/services/orderHistoryService.js"; //受注履歴保存
import { recalculateAndSnapshotMaterialStock } from "../routes/stock/services/materialStockService.js"; //材料在庫保存

// 可变量化 cron 表达式
const SCHEDULE_TIMES = [
  // "00 09 * * *", // 09:00 每天
  "30 18 * * *", // 18:30 每天
];

// 归档定时任务统一封装
async function runArchiveJobs() {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  await addSystemLog(`[Scheduler][${now}] 📋 自動ジョブ開始`);
  try {
    await recalculateStockAndSnapshot();
    await addSystemLog(`[Scheduler][${now}] ✅ 製品在庫保存 完了`);

    const syncResult = await batchShippingSyncService();
    if (syncResult.success) {
      await addSystemLog(`[Scheduler][${now}] ✅ 出荷済み同期 完了: ${syncResult.data.message}`);
    } else {
      await addSystemLog(`[Scheduler][${now}] ❌ 出荷済み同期 エラー: ${syncResult.error}`);
    }

    await recalculateAndSnapshotWipStock();
    await addSystemLog(`[Scheduler][${now}] ✅ 仕掛在庫保存 完了`);

    await recalculateAndSnapshotMaterialStock();
    await addSystemLog(`[Scheduler][${now}] ✅ 材料在庫保存 完了`);
  } catch (err) {
    await addSystemLog(`[Scheduler][${now}] ❌ エラー: ${err.message}\n${err.stack}`);
  }
}

// 统一注册多个定时任务
SCHEDULE_TIMES.forEach((cron) => {
  schedule.scheduleJob(cron, runArchiveJobs);
});

// 每月第3个工作日运行月受注履歴保存（检查每天是否是第3个工作日）
schedule.scheduleJob("00 10 * * 1-5", async () => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // 获取每月第3个工作日
    const thirdWorkday = getThirdWorkdayOfMonth(year, month);

    // 检查今天是否是第3个工作日
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    thirdWorkday.setHours(0, 0, 0, 0);

    if (today.getTime() === thirdWorkday.getTime()) {
      await addSystemLog(
        `[Scheduler] 本日は${month}月の第3営業日です。受注履歴の記録を開始します。`,
      );
      const result = await createOrderHistorySnapshot();
      if (result.success) {
        await addSystemLog(`[Scheduler] 受注履歴記録完了。${result.count}件の履歴を保存しました。`);
      } else {
        await addSystemLog(`[Scheduler] 受注履歴記録エラー: ${result.error}`);
      }
    }
  } catch (err) {
    await addSystemLog(`[Scheduler] 受注履歴記録エラー: ${err.message}\n${err.stack}`);
  }
});

/**
 * 获取指定月份的第3个工作日
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Date} - 第3个工作日
 */
function getThirdWorkdayOfMonth(year, month) {
  // 从月初开始
  const date = new Date(year, month - 1, 1);
  let workdayCount = 0;

  while (workdayCount < 3) {
    // 检查是否是工作日（排除周六周日）
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workdayCount++;
      if (workdayCount === 3) {
        break; // 找到第3个工作日
      }
    }
    // 前进一天
    date.setDate(date.getDate() + 1);
  }

  return date;
}

// 可选：全局未捕获异常日志
process.on("unhandledRejection", (reason, p) => {
  addSystemLog(`[Scheduler] 未捕获Promise异常: ${reason}\n${p}`);
});
