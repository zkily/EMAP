import { db } from "../../../db/index.js";

import { createPlansFromBatches } from "../services/createFromBatchService.js";

export async function createPlanFromBatch(req, res) {
  try {
    const plans = req.body.plans;
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ success: false, message: "无计划数据" });
    }

    const result = await createPlansFromBatches(plans);
    res.json({ success: true, message: "计划生成成功", data: result });
  } catch (err) {
    console.error("[计划生成失败]", err);
    res.status(500).json({ success: false, message: err.message });
  }
}


import * as service from "../services/createFromBatchService.js";

export const getBatchPool = async (req, res) => {
  const list = await service.fetchAll();
  res.json({ success: true, data: list });
};

export const addBatch = async (req, res) => {
  const batch = await service.insert(req.body);
  res.json({ success: true, data: batch });
};

export const deleteBatch = async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true });
};

export const updateBatch = async (req, res) => {
  const batch = await service.update(req.params.id, req.body);
  res.json({ success: true, data: batch });
};
  

// 中间用
export const getAllMergedBatches = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM production_batch_merge
      ORDER BY created_at DESC
    `)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const saveMergedBatch = async (req, res) => {
  try {
    const { product_cd, product_name, quantity, source_batch_id, batch_no } = req.body
    if (!product_cd || !quantity || !batch_no) {
      return res.status(400).json({ success: false, message: '必要な項目が不足しています' })
    }

    const [result] = await db.query(`
      INSERT INTO production_batch_merge
        (product_cd, product_name, quantity, source_batch_id, batch_no)
      VALUES (?, ?, ?, ?, ?)
    `, [product_cd, product_name, quantity, source_batch_id, batch_no])

    res.json({
      success: true,
      data: { id: result.insertId, product_cd, product_name, quantity, batch_no }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const deleteMergedBatch = async (req, res) => {
  try {
    const { id } = req.params
    await db.query(`DELETE FROM production_batch_merge WHERE id = ?`, [id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}



// 从生产批次表里读取数据到计划列表里
export async function syncFromProductionBatches(req, res) {
  try {
    // 1. 从 production_batches LEFT JOIN products 获取 status = '未開始' 的数据
    const [rows] = await db.query(`
      SELECT
        b.batch_no,
        b.product_cd,
        b.planned_qty AS quantity,
        p.product_name
      FROM production_batches b
      LEFT JOIN products p ON b.product_cd = p.product_cd
      WHERE b.status = '未開始'
    `);

    if (!rows.length) {
      return res.json({
        success: true,
        message: "未開始の予定生産Noが存在しません",
      });
    }

    // 2. 查询 batch_pool 中已存在的 batch_no
    const [existingRows] = await db.query(`
      SELECT batch_no FROM production_batch_pool
    `);
    const existingSet = new Set(existingRows.map((r) => r.batch_no));

    // 3. 筛选出未存在的批次
    const newBatches = rows.filter((r) => !existingSet.has(r.batch_no));

    if (newBatches.length === 0) {
      return res.json({
        success: true,
        message: "すべての生産Noは既に読込済みです",
      });
    }

    // 4. 插入未存在的数据
    const insertValues = newBatches.map((r) => [
      r.batch_no,
      r.product_cd,
      r.product_name || "",
      r.quantity,
    ]);

    await db.query(
      `
      INSERT INTO production_batch_pool (batch_no, product_cd, product_name, quantity)
      VALUES ?
    `,
      [insertValues]
    );

    res.json({
      success: true,
      message: `${newBatches.length} 件の生産Noを追加しました`,
    });
  } catch (err) {
    console.error("予定生産No読込失敗:", err);
    res
      .status(500)
      .json({ success: false, message: "サーバーエラー：読込に失敗しました" });
  }
}

