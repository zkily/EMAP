// import schedule from 'node-schedule'
// import { addSystemLog } from '../routes/system/system.js'
// import { syncDailyOrdersToShippingLogs } from '../routes/stock/services/orderSyncService.js'
// import { recalculateAndSnapshotWipStock } from '../routes/stock/services/wipStockService.js'
// import { recalculateStockAndSnapshot } from '../routes/stock/services/productStockService.js'
// import { createOrderHistorySnapshot } from '../routes/order/services/orderHistoryService.js'
// import { recalculateAndSnapshotMaterialStock } from '../routes/stock/services/materialStockService.js'
// import { autoFixAllMissingSnapshots } from '../routes/stock/services/autoFixAllMissingSnapshots.js'


// // ✅ 系统启动时补录最近缺失快照
// // 启动时统一补录缺失快照
// ;(async () => {
//   await autoFixAllMissingSnapshots(7)
// })()

// // ⏰ 可变量化 cron 表达式
// const SCHEDULE_TIMES = [
//   '00 09 * * *', // 每天 09:00
//   '00 17 * * *', // 每天 17:00
// ]

// // 📦 主归档任务执行器
// async function runArchiveJobs() {
//   const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
//   await addSystemLog(`[Scheduler][${now}] 📋 自動ジョブ開始`)
//   try {
//     await recalculateStockAndSnapshot()
//     await addSystemLog(`[Scheduler][${now}] ✅ 製品在庫保存 完了`)

//     await syncDailyOrdersToShippingLogs()
//     await addSystemLog(`[Scheduler][${now}] ✅ 出荷済み同期 完了`)

//     await recalculateAndSnapshotWipStock()
//     await addSystemLog(`[Scheduler][${now}] ✅ 仕掛在庫保存 完了`)

//     await recalculateAndSnapshotMaterialStock()
//     await addSystemLog(`[Scheduler][${now}] ✅ 材料在庫保存 完了`)
//   } catch (err) {
//     await addSystemLog(`[Scheduler][${now}] ❌ エラー: ${err.message}\n${err.stack}`)
//   }
// }

// // ✅ 定时注册归档任务
// SCHEDULE_TIMES.forEach((cron) => {
//   schedule.scheduleJob(cron, runArchiveJobs)
// })

// // ✅ 每月第3个工作日执行受注履历保存
// schedule.scheduleJob('00 10 * * 1-5', async () => {
//   try {
//     const currentDate = new Date()
//     const year = currentDate.getFullYear()
//     const month = currentDate.getMonth() + 1

//     const thirdWorkday = getThirdWorkdayOfMonth(year, month)
//     const today = new Date()
//     today.setHours(0, 0, 0, 0)
//     thirdWorkday.setHours(0, 0, 0, 0)

//     if (today.getTime() === thirdWorkday.getTime()) {
//       await addSystemLog(`[Scheduler] 本日は${month}月の第3営業日です。受注履歴の記録を開始します。`)
//       const result = await createOrderHistorySnapshot()
//       if (result.success) {
//         await addSystemLog(`[Scheduler] 受注履歴記録完了。${result.count}件の履歴を保存しました。`)
//       } else {
//         await addSystemLog(`[Scheduler] 受注履歴記録エラー: ${result.error}`)
//       }
//     }
//   } catch (err) {
//     await addSystemLog(`[Scheduler] 受注履歴記録エラー: ${err.message}\n${err.stack}`)
//   }
// })

// /**
//  * 指定年月的第3个工作日
//  */
// function getThirdWorkdayOfMonth(year, month) {
//   const date = new Date(year, month - 1, 1)
//   let workdayCount = 0
//   while (workdayCount < 3) {
//     const dayOfWeek = date.getDay()
//     if (dayOfWeek !== 0 && dayOfWeek !== 6) {
//       workdayCount++
//       if (workdayCount === 3) break
//     }
//     date.setDate(date.getDate() + 1)
//   }
//   return date
// }

// // ⛑ 捕获未处理的 Promise 错误
// process.on('unhandledRejection', (reason, p) => {
//   addSystemLog(`[Scheduler] 未捕获Promise异常: ${reason}\n${p}`)
// })
