import express from "express";
import { query } from "../../db/connection.js";

const router = express.Router();

/**
 * 获取所有交货目的地的列表及其负责人
 * GET /api/master/delivery-destinations
 */
export async function getDeliveryDestinations(req, res) {
  try {
    const sql = `
      SELECT
        dd.id,
        dd.destination_cd,
        dd.destination_name,
        COALESCE(dd.picker_id, '') as picker_id
      FROM delivery_destinations dd
      ORDER BY dd.destination_cd
    `;

    const results = await query(sql);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("获取交货目的地列表时出错:", error);
    res.status(500).json({
      success: false,
      message: "交货目的地データの取得に失敗しました",
      error: error.message,
    });
  }
}

/**
 * 更新指定交货目的地的负责人
 * PUT /api/master/delivery-destinations/:id
 */
export async function updateDestinationPicker(req, res) {
  const { id } = req.params;
  const { picker_id } = req.body;

  try {
    const sql = `
      UPDATE delivery_destinations
      SET picker_id = ?
      WHERE id = ?
    `;

    await query(sql, [picker_id || null, id]);
    res.json({
      success: true,
      message: "担当者を更新しました",
    });
  } catch (error) {
    console.error("更新交货目的地担当者时出错:", error);
    res.status(500).json({
      success: false,
      message: "担当者の更新に失敗しました",
      error: error.message,
    });
  }
}

// 导出路由
export default function (router) {
  router.get("/delivery-destinations", getDeliveryDestinations);
  router.put("/delivery-destinations/:id/picker", updateDestinationPicker);
}
