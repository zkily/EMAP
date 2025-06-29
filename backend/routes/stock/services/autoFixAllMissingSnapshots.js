// import { db } from "../../../db/index.js";
// import { addSystemLog } from '../../system/system.js'
// // import { autoFixMissingMaterialSnapshots } from './materialSnapshotAutoFix.js'
// // import { autoFixMissingProductSnapshots } from './productSnapshotAutoFix.js'
// // import { autoFixMissingWipSnapshots } from './wipSnapshotAutoFix.js'

// /**
//  * 启动时统一补录所有库存快照（材料＋製品＋仕掛）
//  */
// export async function autoFixAllMissingSnapshots(days = 7) {
//   await addSystemLog(`[AutoFix] 🛠 快照補完チェック開始（${days}日）`)
//   try {
//     await autoFixMissingProductSnapshots(days)
//     await addSystemLog(`[AutoFix] ✅ 製品在庫快照補完 完了`)

//     await autoFixMissingMaterialSnapshots(days)
//     await addSystemLog(`[AutoFix] ✅ 材料在庫快照補完 完了`)

//     await autoFixMissingWipSnapshots(days)
//     await addSystemLog(`[AutoFix] ✅ 仕掛在庫快照補完 完了`)
//   } catch (err) {
//     await addSystemLog(`[AutoFix] ❌ 快照補完エラー: ${err.message}\n${err.stack}`)
//   }
// }


// // 材料缺失快照补录函数
// export async function autoFixMissingMaterialSnapshots(days = 7) {
//   const today = new Date()
//   let totalInserted = 0

//   for (let i = 0; i < days; i++) {
//     const date = new Date(today)
//     date.setDate(today.getDate() - i)
//     const dateStr = date.toISOString().substring(0, 10)

//     const [existing] = await db.query(`
//       SELECT 1 FROM stock_material_snapshots
//       WHERE DATE(snapshot_time) = ?
//       LIMIT 1
//     `, [dateStr])

//     if (existing.length) continue

//     const [rows] = await db.query(`
//       SELECT material_cd, location_cd, quantity
//       FROM stock_materials
//     `)

//     for (const row of rows) {
//       await db.query(`
//         INSERT INTO stock_material_snapshots
//         (material_cd, location_cd, quantity, snapshot_time)
//         VALUES (?, ?, ?, ?)
//       `, [row.material_cd, row.location_cd, row.quantity, `${dateStr} 23:59:59`])
//     }

//     totalInserted += rows.length
//   }

//   return { success: true, inserted: totalInserted }
// }


// // 产品缺失快照补录函数
// export async function autoFixMissingProductSnapshots(days = 7) {
//   const today = new Date()
//   let totalInserted = 0

//   for (let i = 0; i < days; i++) {
//     const date = new Date(today)
//     date.setDate(today.getDate() - i)
//     const dateStr = date.toISOString().substring(0, 10)

//     const [existing] = await db.query(`
//       SELECT 1 FROM stock_product_snapshots
//       WHERE DATE(snapshot_time) = ?
//       LIMIT 1
//     `, [dateStr])

//     if (existing.length) continue

//     const [rows] = await db.query(`
//       SELECT product_cd, location_cd, quantity
//       FROM stock_products
//     `)

//     for (const row of rows) {
//       await db.query(`
//         INSERT INTO stock_product_snapshots
//         (product_cd, location_cd, quantity, snapshot_time)
//         VALUES (?, ?, ?, ?)
//       `, [row.product_cd, row.location_cd, row.quantity, `${dateStr} 23:59:59`])
//     }

//     totalInserted += rows.length
//   }

//   return { success: true, inserted: totalInserted }
// }

// // wip缺失快照补录函数
// export async function autoFixMissingWipSnapshots(days = 7) {
//   const today = new Date()
//   let totalInserted = 0

//   for (let i = 0; i < days; i++) {
//     const date = new Date(today)
//     date.setDate(today.getDate() - i)
//     const dateStr = date.toISOString().substring(0, 10)

//     const [existing] = await db.query(`
//       SELECT 1 FROM stock_wip_snapshots
//       WHERE DATE(snapshot_time) = ?
//       LIMIT 1
//     `, [dateStr])

//     if (existing.length) continue

//     const [rows] = await db.query(`
//       SELECT product_cd, process_cd, quantity
//       FROM stock_wip
//     `)

//     for (const row of rows) {
//       await db.query(`
//         INSERT INTO stock_wip_snapshots
//         (product_cd, process_cd, quantity, snapshot_time)
//         VALUES (?, ?, ?, ?)
//       `, [row.product_cd, row.process_cd, row.quantity, `${dateStr} 23:59:59`])
//     }

//     totalInserted += rows.length
//   }

//   return { success: true, inserted: totalInserted }
// }
