// 工程工序マスタ、編集
import express from "express";
import { pool as db } from "../../db/connection.js";
import {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
} from "./controllers/processController.js";
const router = express.Router();

// === 前端 api/master/processRouterMaster.ts  ==

//-------------------工程工序編集--------------------

// ルート基本情報取得
router.get("/info", async (req, res) => {
  const routeCd = (req.query.route_cd || "").trim();
  if (!routeCd) return res.json({ success: false, message: "route_cd必須", data: null });

  const [rows] = await db.query("SELECT * FROM routes WHERE route_cd = ?", [routeCd]);
  if (!rows.length)
    return res.json({
      success: false,
      message: `ルートが見つかりません(${routeCd})`,
      data: null,
    });

  res.json({ success: true, message: "OK", data: rows[0] });
});

// ルートステップ一覧取得
router.get("/steps", async (req, res) => {
  const routeCd = (req.query.route_cd || "").trim();
  if (!routeCd) return res.json({ success: false, message: "route_cd必須", data: [] });

  const [rows] = await db.query(
    `
      SELECT rs.*, p.process_name
      FROM route_steps rs
      LEFT JOIN processes p ON rs.process_cd = p.process_cd
      WHERE rs.route_cd = ?
      ORDER BY rs.step_no
    `,
    [routeCd],
  );

  res.json({ success: true, message: "OK", data: rows });
});

// ステップ順序保存
router.post("/steps/reorder", async (req, res) => {
  const { route_cd, steps } = req.body;
  if (!route_cd || !Array.isArray(steps))
    return res.json({ success: false, message: "パラメータ不足", data: null });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const step of steps) {
      await conn.query("UPDATE route_steps SET step_no = ? WHERE id = ? AND route_cd = ?", [
        step.step_no,
        step.id,
        route_cd,
      ]);
    }
    await conn.commit();
    res.json({ success: true, message: "順序保存成功", data: null });
  } catch (err) {
    await conn.rollback();
    res.json({ success: false, message: err.message, data: null });
  } finally {
    conn.release();
  }
});

// ステップ追加
router.post("/steps", async (req, res) => {
  const { route_cd, step_no, process_cd, yield_percent, cycle_sec, remarks } = req.body;
  if (!route_cd || !step_no || !process_cd)
    return res.json({ success: false, message: "必須項目不足", data: null });

  await db.query(
    `
      INSERT INTO route_steps (route_cd, step_no, process_cd, yield_percent, cycle_sec, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [route_cd, step_no, process_cd, yield_percent ?? 100, cycle_sec ?? 0, remarks ?? ""],
  );

  res.json({ success: true, message: "登録成功", data: null });
});

// ステップ編集
router.put("/steps/:id", async (req, res) => {
  const { id } = req.params;
  const { step_no, process_cd, yield_percent, cycle_sec, remarks } = req.body;

  await db.query(
    `
      UPDATE route_steps SET step_no = ?, process_cd = ?, yield_percent = ?, cycle_sec = ?, remarks = ?
      WHERE id = ?
    `,
    [step_no, process_cd, yield_percent ?? 100, cycle_sec ?? 0, remarks ?? "", id],
  );

  res.json({ success: true, message: "更新成功", data: null });
});

// ステップ削除
router.delete("/steps", async (req, res) => {
  const routeCd = (req.query.route_cd || "").trim();
  const id = req.query.id;
  if (!routeCd || !id) return res.json({ success: false, message: "パラメータ不足", data: null });

  await db.query("DELETE FROM route_steps WHERE id = ? AND route_cd = ?", [id, routeCd]);
  res.json({ success: true, message: "削除成功", data: null });
});

//-------------------工程工序CRUD（放在最后避免路由冲突）--------------------
// 取得工程工序列表
router.get("/", listRoutes);

// 新增工程工序
router.post("/", createRoute);

// 更新工程工序
router.put("/:id", updateRoute);

// 删除工程工序
router.delete("/:id", deleteRoute);

export default router;
