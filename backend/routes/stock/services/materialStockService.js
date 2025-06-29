// routes/stock/services/materialStockService.js
import { db } from "../../../db/index.js";


/**
 * 材料在库再计算 + 快照保存（用于 Scheduler）
 */
export async function recalculateAndSnapshotMaterialStock() {
  // 1. 清空当前在库表
  await db.query('DELETE FROM stock_materials')

  // 2. 获取材料快照
  const [snapshots] = await db.query(`
    SELECT material_cd, location_cd, SUM(quantity) AS quantity, MAX(snapshot_time) AS snapshot_time
    FROM stock_material_snapshots
    GROUP BY material_cd, location_cd
  `)
  const snapshotMap = new Map()
  for (const s of snapshots) {
    const key = `${s.material_cd}__${s.location_cd}`
    snapshotMap.set(key, {
      quantity: Number(s.quantity),
      snapshot_time: s.snapshot_time
    })
  }

  // 3. 获取所有材料 × 仓库组合
  const [targets] = await db.query(`
    SELECT DISTINCT material_cd, location_cd
    FROM stock_transaction_logs
  `)

  for (const target of targets) {
    const { material_cd, location_cd } = target
    const key = `${material_cd}__${location_cd}`
    let baseQty = 0
    let fromDate = '2024-01-01'

    if (snapshotMap.has(key)) {
      baseQty = snapshotMap.get(key).quantity
      fromDate = snapshotMap.get(key).snapshot_time
    }

    // 4. 从快照时间之后的流水汇总
    const [rows] = await db.query(`
      SELECT transaction_type, SUM(qty_change) AS sum
      FROM stock_transaction_logs
      WHERE material_cd = ? AND location_cd = ? AND transaction_time > ?
      GROUP BY transaction_type
    `, [material_cd, location_cd, fromDate])

    let inQty = 0, outQty = 0, discardQty = 0, reserveQty = 0, adjustQty = 0
    for (const row of rows) {
      const sum = Number(row.sum)
      switch (row.transaction_type) {
        case '入庫': inQty += sum; break
        case '出庫': outQty += sum; break
        case '廃棄': discardQty += sum; break
        case '保留': reserveQty += sum; break
        case '調整': adjustQty += sum; break
      }
    }

    const finalQty = baseQty + inQty - outQty - discardQty - reserveQty + adjustQty
    if (finalQty === 0) continue

    await db.query(`
      INSERT INTO stock_materials (material_cd, location_cd, quantity)
      VALUES (?, ?, ?)
    `, [material_cd, location_cd, finalQty])
  }

  // 5. 快照保存（先删再存）
  await db.query(`
    DELETE FROM stock_material_snapshots
    WHERE DATE(snapshot_time) = CURDATE()
  `)

  const [currentStocks] = await db.query(`
    SELECT material_cd, location_cd, quantity
    FROM stock_materials
  `)

  for (const stock of currentStocks) {
    await db.query(`
      INSERT INTO stock_material_snapshots (material_cd, location_cd, quantity, snapshot_time)
      VALUES (?, ?, ?, NOW())
    `, [stock.material_cd, stock.location_cd, stock.quantity])
  }

  return { success: true, count: currentStocks.length }
}
