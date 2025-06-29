import { Router } from "express";
import { pool as db } from "../../db/connection.js";

const router = Router();

// POST /api/stock/materials/recalculate-and-check
// 初期起算日（无快照时使用）
const INITIAL_DATE = "2025-06-01";

// 主接口：再计算材料在库 + 异常检测
router.post("/recalculate-and-check", async (req, res) => {
  try {
    // 清空旧在库表
    await db.query("DELETE FROM stock_materials");

    // 取得材料 + 仓库快照数据
    const [snapshots] = await db.query(`
      SELECT material_cd, location_cd, SUM(quantity) AS quantity, MAX(snapshot_time) AS snapshot_time
      FROM stock_material_snapshots
      GROUP BY material_cd, location_cd
    `);

    const snapshotMap = new Map();
    for (const s of snapshots) {
      const key = `${s.material_cd}__${s.location_cd}`;
      snapshotMap.set(key, {
        quantity: Number(s.quantity),
        snapshot_time: s.snapshot_time,
      });
    }

    // 所有实际出现过的材料 + 仓库组合
    const [targets] = await db.query(`
      SELECT DISTINCT target_cd, location_cd
      FROM stock_transaction_logs
    `);

    let updatedCount = 0;

    for (const target of targets) {
      const { target_cd, location_cd } = target;
      const key = `${target_cd}__${location_cd}`;

      let baseQty = 0;
      let fromDate = INITIAL_DATE;

      // 如果有快照，作为初期
      if (snapshotMap.has(key)) {
        baseQty = snapshotMap.get(key).quantity;
        fromDate = snapshotMap.get(key).snapshot_time;
      }

      // 查询从 fromDate 起的流水明细
      const [rows] = await db.query(
        `
        SELECT transaction_type, SUM(quantity) AS sum
        FROM stock_transaction_logs
        WHERE target_cd = ? AND location_cd = ? AND transaction_time > ?
        GROUP BY transaction_type
      `,
        [target_cd, location_cd, fromDate],
      );

      // 初始化各类型汇总
      let inQty = 0,
        outQty = 0,
        discardQty = 0,
        reserveQty = 0,
        adjustQty = 0;

      for (const row of rows) {
        const sum = Number(row.sum);
        switch (row.transaction_type) {
          case "入庫":
            inQty += sum;
            break;
          case "出庫":
            outQty += sum;
            break;
          case "廃棄":
            discardQty += sum;
            break;
          case "保留":
            reserveQty += sum;
            break;
          case "調整":
            adjustQty += sum;
            break;
        }
      }

      // 在库 = 初期 + 入库 - 出库 - 废弃 - 保留 ± 调整
      const finalQty = baseQty + inQty - outQty - discardQty - reserveQty + adjustQty;
      if (finalQty === 0) continue;

      // 获取单位信息
      const [materialInfo] = await db.query(
        `
        SELECT unit FROM stock_transaction_logs
        WHERE target_cd = ? AND unit IS NOT NULL
        LIMIT 1
      `,
        [target_cd],
      );

      const unit = materialInfo?.[0]?.unit || "PCS";

      await db.query(
        `
        INSERT INTO stock_materials (material_cd, location_cd, quantity, unit, last_updated)
        VALUES (?, ?, ?, ?, NOW())
      `,
        [target_cd, location_cd, finalQty, unit],
      );

      updatedCount++;
    }

    // 异常检测部分
    const [negativeStock] = await db.query(`
      SELECT s.*, m.material_name
      FROM stock_materials s
      LEFT JOIN materials m ON s.material_cd = m.material_cd
      WHERE s.quantity < 0
    `);

    const [multiLocations] = await db.query(`
      SELECT s.material_cd, m.material_name, COUNT(DISTINCT s.location_cd) AS location_count
      FROM stock_materials s
      LEFT JOIN materials m ON s.material_cd = m.material_cd
      GROUP BY s.material_cd
      HAVING location_count > 1
    `);

    const [duplicateLots] = await db.query(`
      SELECT material_cd, location_cd, COUNT(*) AS count
      FROM stock_materials
      GROUP BY material_cd, location_cd
      HAVING count > 1
    `);

    const [stockList] = await db.query(`
      SELECT s.*, m.material_name
      FROM stock_materials s
      LEFT JOIN materials m ON s.material_cd = m.material_cd
    `);

    res.json({
      message: `在库再計算完成，共 ${updatedCount} 件`,
      updatedCount,
      executedAt: new Date(),
      anomalies: {
        negativeStock,
        multiLocations,
        duplicateLots,
      },
      stockList,
    });
  } catch (err) {
    console.error("[材料在库再计算] エラー:", err);
    res.status(500).json({ message: "在库再計算失敗" });
  }
});

// 获取单个材料详情
router.get("/materials/:materialCd", async (req, res) => {
  try {
    const { materialCd } = req.params;
    const [rows] = await db.query("SELECT * FROM materials WHERE material_cd = ?", [materialCd]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "材料が見つかりません",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("获取材料详情失败:", error);
    res.status(500).json({
      success: false,
      message: "材料情報の取得に失敗しました",
    });
  }
});

export default router;
