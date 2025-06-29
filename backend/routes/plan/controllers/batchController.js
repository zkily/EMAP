import { db } from '../../../db/index.js'
import PDFDocument from 'pdfkit'
import { recalculateAndCheckProductStockLogic } from '../../stock/services/productStockService.js'
import { recalculateAndSnapshotWipStock } from '../../stock/services/wipStockService.js'
import { createPlansFromBatches } from '../services/createFromBatchService.js'

// 自动批次生成（在庫→WIP→批次）
export async function generateRangeAutoBatches(req, res) {
  // 把任意日期格式转成"YYYY-MM-DD"字符串
  function toDateString(date) {
    if (!date) return ''
    if (typeof date === 'string' && date.length > 10) return date.slice(0, 10)
    if (typeof date === 'string') return date
    if (date instanceof Date) return date.toISOString().slice(0, 10)
    return date
  }

  // 取前端传来的起止日期，并标准化格式
  const fromDate = toDateString(req.body.from_date)
  const toDate = toDateString(req.body.to_date)
  let generatedBatches = []

  try {
    // 先重新计算库存数据
    console.log('[generateRangeAutoBatches] 开始重新计算库存...')

    // 重新计算产品库存
    await recalculateAndCheckProductStockLogic()
    console.log('[generateRangeAutoBatches] 产品库存重新计算完成')

    // 重新计算WIP库存并保存快照
    await recalculateAndSnapshotWipStock()
    console.log('[generateRangeAutoBatches] WIP库存重新计算完成')

    // ① 查询目标期间内所有涉及的产品CD（按订单表去重）
    const [products] = await db.query(
      `
      SELECT DISTINCT product_cd
      FROM order_daily
      WHERE DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-', LPAD(day,2,'0')))
        BETWEEN ? AND ?`,
      [fromDate, toDate],
    )

    let createdCount = 0

    // ② 针对每个产品循环处理
    for (const { product_cd } of products) {
      // 取得该产品在区间内的所有订单
      const [ordersRaw] = await db.query(
        `
        SELECT *,
          DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-', LPAD(day,2,'0'))) AS order_date
        FROM order_daily
        WHERE product_cd = ?
          AND DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-', LPAD(day,2,'0')))
            BETWEEN ? AND ?
        ORDER BY year, month, day
      `,
        [product_cd, fromDate, toDate],
      )
      if (ordersRaw.length === 0) continue

      // 清空所有目标区间内订单的相关字段
      await db.query(
        `
        UPDATE order_daily
        SET batch_id = NULL, batch_no = NULL, supply_status = NULL, fulfilled_from_stock = 0, fulfilled_from_wip = 0
        WHERE product_cd = ?
          AND DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-', LPAD(day,2,'0'))) >= ?
      `,
        [product_cd, fromDate],
      )

      // ④ 订单格式化 & 初始化
      let orders = ordersRaw.map((o) => ({
        ...o,
        order_date: new Date(o.order_date),
        qty: 0, // 订单数量
        supplied: 0, // 已满足数量
        supply_status: null, // 供给状态
        fulfilled_from_stock: 0, // 库存满足量
        fulfilled_from_wip: 0, // WIP满足量
        supply_from_batch: null, // 来自哪个批次
        supply_from_batch_no: null,
      }))

      // ⑤ 找到最后一个"确定订单（confirmed）"的日期
      const confirmedOrders = orders.filter((o) => o.confirmed_units > 0)
      const lastConfirmedDate = confirmedOrders.length
        ? new Date(Math.max(...confirmedOrders.map((o) => new Date(o.order_date).getTime())))
        : null

      // ⑥ 订单量赋值：最后确定日期前都用confirmed_units，之后用forecast_units
      for (let o of orders) {
        if (!lastConfirmedDate || o.order_date <= lastConfirmedDate) {
          o.qty = o.confirmed_units || 0
        } else {
          o.qty = o.forecast_units || 0
        }
      }

      // ⑦ 优先用"在库"递减满足订单
      let stock = await getProductStock(product_cd)
      for (let o of orders) {
        if (o.qty <= 0) continue
        let remain = o.qty - o.supplied
        if (remain <= 0) continue
        if (stock > 0) {
          let fromStock = Math.min(remain, stock)
          o.supplied += fromStock
          o.fulfilled_from_stock += fromStock
          stock -= fromStock
          if (o.supplied >= o.qty) {
            o.supply_status = '在庫あり'
          }
        }
      }

      // ⑧ 用WIP（在制品库存）继续满足订单
      let wip = await getWipStock(product_cd)
      for (let o of orders) {
        if (o.qty <= 0 || o.supply_status) continue
        let remain = o.qty - o.supplied
        if (remain <= 0) continue
        if (wip > 0) {
          let fromWip = Math.min(remain, wip)
          o.supplied += fromWip
          o.fulfilled_from_wip += fromWip
          wip -= fromWip
          if (o.supplied >= o.qty) {
            o.supply_status = '生産中'
          }
        }
      }

      // ⑨ 用所有"未完成批次"的产量递减满足订单
      const [batches] = await db.query(
        `
        SELECT * FROM production_batches
        WHERE product_cd=?
          AND status IN ('未開始', '生産中', '計画済')
        ORDER BY from_date, id
      `,
        [product_cd],
      )
      for (const batch of batches) {
        let batchRemain = batch.actual_output_qty ?? batch.planned_qty
        for (let o of orders) {
          if (batchRemain <= 0) break
          if (o.supply_status || o.qty <= 0) continue
          let need = o.qty - o.supplied
          if (need <= 0) continue
          let take = Math.min(batchRemain, need)
          batchRemain -= take
          o.supplied += take
          o.supply_from_batch = batch.id
          o.supply_from_batch_no = batch.batch_no
          if (o.supplied >= o.qty) {
            o.supply_status = batch.batch_type || batch.status || '未開始'
          }
        }
      }

      // ⑩ 剩余订单分批自动生成新生产批次
      const lotSize = await getLotSize(product_cd)
      let batchIndex = 1
      let currentBatchQty = 0
      let batchOrderIds = []
      let batchOrderDates = []
      let lastSource = ''

      for (let o of orders) {
        if (o.supply_status || o.qty <= 0) continue
        let remain = o.qty - o.supplied
        if (remain <= 0) continue
        // 判断本批次是confirmed还是forecast
        let source =
          !lastConfirmedDate || o.order_date <= lastConfirmedDate ? 'confirmed' : 'forecast'

        while (remain > 0) {
          const remainSpace = lotSize - currentBatchQty
          if (remainSpace > 0) {
            const thisBatchTake = Math.min(remain, remainSpace)
            currentBatchQty += thisBatchTake
            remain -= thisBatchTake
            batchOrderIds.push(o.id)
            batchOrderDates.push(o.order_date)
            lastSource = source
          }
          if (currentBatchQty === lotSize) {
            // 生成批次号
            const batchFromDate = toDateString(batchOrderDates[0])
            const batchToDate = toDateString(batchOrderDates[batchOrderDates.length - 1])
            const is_forecast =
              lastSource === 'forecast' &&
              (!lastConfirmedDate || batchFromDate > toDateString(lastConfirmedDate))
            const suffix = is_forecast ? '-F' : ''
            const batch_no = `PB-${product_cd}-${batchFromDate}_to_${batchToDate}-${String(batchIndex).padStart(3, '0')}${suffix}`

            // 插入生产批次
            const [result] = await db.query(
              `INSERT INTO production_batches (batch_no, product_cd, planned_qty, actual_output_qty, from_date, to_date, status, batch_type, is_locked)
               VALUES (?, ?, ?, ?, ?, ?, '未開始', '自動', 0)`,
              [batch_no, product_cd, lotSize, lotSize, batchFromDate, batchToDate],
            )
            const batchId = result.insertId

            // 更新订单批次信息
            await db.query(
              `UPDATE order_daily SET batch_id=?, batch_no=?, supply_status='生産No.生成済'
                WHERE id IN (${batchOrderIds.join(',')})`,
              [batchId, batch_no],
            )

            // 记录到返回用的数组
            generatedBatches.push({
              batch_id: batchId,
              batch_no,
              product_cd,
              planned_qty: lotSize,
              actual_output_qty: lotSize,
              from_date: batchFromDate,
              to_date: batchToDate,
              status: '未開始',
              batch_type: '自動',
            })

            // 同步内存订单数据
            for (let id of batchOrderIds) {
              let tar = orders.find((e) => e.id === id)
              if (tar) {
                tar.supply_status = '生産No.生成済'
                tar.supply_from_batch = batchId
                tar.supply_from_batch_no = batch_no
              }
            }

            createdCount++
            currentBatchQty = 0
            batchOrderIds = []
            batchOrderDates = []
            batchIndex++
          }
        }
      }

      // ⑪ 最后一批未满的也生成
      if (currentBatchQty > 0 && batchOrderIds.length > 0) {
        const batchFromDate = toDateString(batchOrderDates[0])
        const batchToDate = toDateString(batchOrderDates[batchOrderDates.length - 1])
        const is_forecast =
          lastSource === 'forecast' &&
          (!lastConfirmedDate || batchFromDate > toDateString(lastConfirmedDate))
        const suffix = is_forecast ? '-F' : ''
        const batch_no = `PB-${product_cd}-${batchFromDate}_to_${batchToDate}-${String(batchIndex).padStart(3, '0')}${suffix}`

        const [result] = await db.query(
          `INSERT INTO production_batches (batch_no, product_cd, planned_qty, actual_output_qty, from_date, to_date, status, batch_type, is_locked)
            VALUES (?, ?, ?, ?, ?, ?, '未開始', '自動', 0)`,
          [batch_no, product_cd, lotSize, lotSize, batchFromDate, batchToDate],
        )
        const batchId = result.insertId

        await db.query(
          `UPDATE order_daily SET batch_id=?, batch_no=?, supply_status='生産No.生成済'
            WHERE id IN (${batchOrderIds.join(',')})`,
          [batchId, batch_no],
        )

        generatedBatches.push({
          batch_id: batchId,
          batch_no,
          product_cd,
          planned_qty: lotSize,
          actual_output_qty: 0,
          from_date: batchFromDate,
          to_date: batchToDate,
          status: '未開始',
          batch_type: '自動',
        })

        for (let id of batchOrderIds) {
          let tar = orders.find((e) => e.id === id)
          if (tar) {
            tar.supply_status = '生産No.生成済'
            tar.supply_from_batch = batchId
            tar.supply_from_batch_no = batch_no
          }
        }
        createdCount++
      }

      // ⑫ 最终：同步所有订单的满足状态
      for (let o of orders) {
        await db.query(
          `UPDATE order_daily SET fulfilled_from_stock=?, fulfilled_from_wip=?,
            batch_id=?, batch_no=?, supply_status=?
           WHERE id=?`,
          [
            o.fulfilled_from_stock || 0,
            o.fulfilled_from_wip || 0,
            o.supply_from_batch || null,
            o.supply_from_batch_no || null,
            o.supply_status || null,
            o.id,
          ],
        )
      }
    }

    // 自动生成工序计划
    if (generatedBatches.length > 0) {
      console.log('[generateRangeAutoBatches] 生産工程生成開始...')
      try {
        // 按产品分组批次
        const batchesByProduct = {}
        for (const batch of generatedBatches) {
          if (!batchesByProduct[batch.product_cd]) {
            batchesByProduct[batch.product_cd] = []
          }
          batchesByProduct[batch.product_cd].push(batch)
        }

        // 为每个产品生成工序计划
        const planResults = []
        for (const [product_cd, batches] of Object.entries(batchesByProduct)) {
          const totalQty = batches.reduce((sum, b) => sum + (b.planned_qty || 0), 0)
          const earliestDate = batches.reduce((earliest, b) => {
            const batchDate = new Date(b.from_date)
            return !earliest || batchDate < earliest ? batchDate : earliest
          }, null)

          const planData = {
            product_cd,
            planned_quantity: totalQty,
            latest_start_date: earliestDate?.toISOString().slice(0, 10),
            merged_batch_no: `MERGED-${product_cd}-${toDateString(earliestDate)}`,
            batch_nos: batches.map((b) => b.batch_no),
          }

          const result = await createPlansFromBatches([planData])
          planResults.push(...result)
        }

        console.log(
          `[generateRangeAutoBatches] 工序计划生成完成，共生成 ${planResults.length} 个计划`,
        )

        // 自动为工序计划分配机台和计算时间
        if (planResults.length > 0) {
          await autoAssignMachinesAndTimes(planResults)
        }
      } catch (planErr) {
        console.error('[generateRangeAutoBatches] 工序计划生成失败:', planErr)
        // 不影响批次生成的成功返回，只记录错误
      }
    }

    res.json({
      success: true,
      message: `生産No.生成完了 (${createdCount}件)`,
      data: { batches: generatedBatches },
    })
  } catch (err) {
    console.error(err)
    res.json({ success: false, message: '生産No.生成失敗', error: err.message, batches: [] })
  }
}

// 自动为工序计划分配机台和计算时间
async function autoAssignMachinesAndTimes(planResults) {
  try {
    for (const plan of planResults) {
      // 获取该计划的所有工序步骤
      const [steps] = await db.query(
        `SELECT id, step_no, process_cd, planned_qty
         FROM production_plan_steps
         WHERE plan_id = ?
         ORDER BY step_no`,
        [plan.plan_id],
      )

      let currentStartTime = new Date()

      for (const step of steps) {
        // 获取最佳机台（效率最高的）
        const [[machineInfo]] = await db.query(
          `SELECT machine_cd, efficiency_per_hour
           FROM product_process_machine_efficiency
           WHERE product_cd = ? AND process_cd = ?
           ORDER BY efficiency_per_hour DESC
           LIMIT 1`,
          [plan.product_cd, step.process_cd],
        )

        if (machineInfo) {
          // 计算所需时间（小时）
          const requiredHours = step.planned_qty / machineInfo.efficiency_per_hour
          const endTime = new Date(currentStartTime.getTime() + requiredHours * 60 * 60 * 1000)

          // 更新工序步骤的机台和时间
          await db.query(
            `UPDATE production_plan_steps
             SET machine_cd = ?,
                 efficiency = ?,
                 start_time = ?,
                 end_time = ?,
                 status = 'planned'
             WHERE id = ?`,
            [
              machineInfo.machine_cd,
              machineInfo.efficiency_per_hour,
              currentStartTime.toISOString().slice(0, 19).replace('T', ' '),
              endTime.toISOString().slice(0, 19).replace('T', ' '),
              step.id,
            ],
          )

          // 下一个工序的开始时间 = 当前工序的结束时间
          currentStartTime = endTime
        }
      }
    }

    console.log(`[autoAssignMachinesAndTimes] 已为 ${planResults.length} 个计划分配机台和时间`)
  } catch (err) {
    console.error('[autoAssignMachinesAndTimes] 分配机台和时间失败:', err)
  }
}

// 查询产品的批量大小
async function getLotSize(product_cd) {
  const [[row]] = await db.query(`SELECT lot_size FROM products WHERE product_cd = ?`, [product_cd])
  return row?.lot_size || 1000
}
// 查询库存数量
async function getProductStock(product_cd) {
  const [[row]] = await db.query(
    `SELECT SUM(quantity) AS qty FROM stock_products WHERE product_cd = ?`,
    [product_cd],
  )
  return row?.qty || 0
}
// 查询WIP在制品数量
async function getWipStock(product_cd) {
  const [[row]] = await db.query(
    `SELECT SUM(quantity) AS qty FROM stock_wip WHERE product_cd = ?`,
    [product_cd],
  )
  return row?.qty || 0
}

// 批次状态更新
export async function updateBatchStatus(req, res) {
  const { batch_id, status } = req.body
  try {
    await db.query(`UPDATE production_batches SET status = ? WHERE id = ?`, [status, batch_id])
    res.json({ success: true, message: '更新済' })
  } catch (e) {
    res.json({ success: false, message: '更新失敗', error: e.message })
  }
}

// 批次锁定/解锁
export async function toggleBatchLock(req, res) {
  const { batch_id, is_locked } = req.body
  let status = is_locked ? 'ロック済' : '未開始' // 或根据实际原状态决定
  await db.query(`UPDATE production_batches SET is_locked=?, status=? WHERE id=?`, [
    is_locked ? 1 : 0,
    status,
    batch_id,
  ])
  res.json({
    success: true,
    message: is_locked ? 'ロック完了' : 'ロック解除完了',
  })
}

// 生产批次列表
export async function getBatchList(req, res) {
  const { product_cd, from_date, to_date } = req.query

  try {
    const productCdParam = product_cd?.trim() || null
    const fromDateParam = from_date?.trim() || null
    const toDateParam = to_date?.trim() || null

    const [rows] = await db.query(
      `
      SELECT
        b.*,
        p.product_name
      FROM production_batches b
      LEFT JOIN products p ON b.product_cd = p.product_cd
      WHERE
        (? IS NULL OR b.product_cd = ?)
        AND (? IS NULL OR b.from_date >= ?)
        AND (? IS NULL OR b.to_date <= ?)
      ORDER BY b.from_date
      `,
      [productCdParam, productCdParam, fromDateParam, fromDateParam, toDateParam, toDateParam],
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('❌ バッチ一覧取得失敗:', err)
    res.status(500).json({ success: false, message: 'バッチ一覧の取得に失敗しました' })
  }
}

// 批次再生成
export async function rebuildBatch(req, res) {
  const { batch_id } = req.body
  const [[batch]] = await db.query(`SELECT * FROM production_batches WHERE id = ?`, [batch_id])
  if (!batch) return res.json({ success: false, message: 'バッチ見つからず' })

  // 删除原关联日订单中的 batch_id/no
  await db.query(
    `UPDATE order_daily SET batch_id = NULL, batch_no = NULL
    WHERE product_cd = ? AND order_date BETWEEN ? AND ? AND batch_id = ?`,
    [batch.product_cd, batch.from_date, batch.to_date, batch_id],
  )

  // 删除原批次
  await db.query(`DELETE FROM production_batches WHERE id = ?`, [batch_id])

  // 调用自动再生成逻辑（可复用 generateBatchesWithStock）
  req.body = {
    product_cd: batch.product_cd,
    from_date: batch.from_date,
    to_date: batch.to_date,
  }
  return generateBatchesWithStock(req, res)
}

// 批次删除
export async function deleteBatch(req, res) {
  const { batch_id } = req.body
  if (!batch_id) {
    return res.status(400).json({ success: false, message: 'batch_idは必須です' })
  }
  try {
    await db.query(`UPDATE order_daily SET batch_id = NULL, batch_no = NULL WHERE batch_id = ?`, [
      batch_id,
    ])
    const [result] = await db.query(`DELETE FROM production_batches WHERE id = ?`, [batch_id])
    if (result.affectedRows > 0) {
      res.json({ success: true, message: '削除成功' })
    } else {
      res.status(404).json({ success: false, message: '該当データがありません' })
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '削除失敗', error: err.message })
  }
}

//获取单一批次信息
export async function getBatchDetail(req, res) {
  try {
    const { batch_id } = req.query

    if (!batch_id) {
      return res.json({
        success: false,
        message: 'バッチIDが指定されていません',
      })
    }

    const [[batch]] = await db.query(`SELECT * FROM production_batches WHERE id = ?`, [batch_id])

    if (!batch) {
      return res.json({
        success: false,
        message: '該当バッチが見つかりません',
      })
    }

    const [orders] = await db.query(
      `SELECT id, year, month, day, forecast_units, confirmed_units, supply_status, fulfilled_from_stock, fulfilled_from_wip
       FROM order_daily WHERE batch_id = ? ORDER BY year, month, day`,
      [batch_id],
    )

    orders.forEach((o) => {
      o.date = `${o.year}-${String(o.month).padStart(2, '0')}-${String(o.day).padStart(2, '0')}`
    })

    res.json({ success: true, data: { batch, orders } })
  } catch (error) {
    console.error('❌ getBatchDetailエラー:', error)
    res.status(500).json({
      success: false,
      message: 'サーバーエラー：詳細取得に失敗しました',
    })
  }
}

//获取该批次关联的订单
export async function getBatchOrders(req, res) {
  const { batch_id } = req.query
  const [rows] = await db.query(
    `
    SELECT * FROM order_daily WHERE batch_id = ? ORDER BY order_date
  `,
    [batch_id],
  )
  res.json({ success: true, data: rows })
}

// 动检测批次不良报警页面
export async function getBadBatchList(req, res) {
  const from_date = req.query.from_date || '2024-01-01'
  const to_date = req.query.to_date || '2099-12-31'
  const [rows] = await db.query(
    `SELECT * FROM production_batches
     WHERE planned_qty > 0
       AND actual_output_qty IS NOT NULL
       AND actual_output_qty < planned_qty
       AND from_date BETWEEN ? AND ?
     ORDER BY from_date DESC`,
    [from_date, to_date],
  )
  res.json({ success: true, data: rows })
}

// 新增加生成批次
export const addBatch = async (req, res) => {
  const {
    batch_no,
    product_cd,
    planned_qty,
    actual_output_qty,
    batch_type,
    from_date,
    to_date,
    status,
  } = req.body

  try {
    const [result] = await db.execute(
      `INSERT INTO production_batches
        (batch_no, product_cd, planned_qty, actual_output_qty, batch_type, from_date, to_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batch_no,
        product_cd,
        planned_qty,
        actual_output_qty || null,
        batch_type,
        from_date,
        to_date,
        status || '未開始',
      ],
    )
    res.json({ success: true, message: '追加成功', insertId: result.insertId })
  } catch (err) {
    res.status(500).json({ success: false, message: '追加失敗', error: err.message })
  }
}
