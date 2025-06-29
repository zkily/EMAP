// 製品工程ルート編集
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

//=== 前端　views/Master/productProcessRouterMaster   直接调用 ===

// 查询产品个别工程步骤（含设备信息）
router.get("/:product_cd/:route_cd", async (req, res) => {
  const { product_cd, route_cd } = req.params;
  try {
    // 1. 获取工程步骤
    const [steps] = await db.query(
      `SELECT s.*, p.process_name
         FROM product_route_steps s
         LEFT JOIN processes p ON s.process_cd = p.process_cd
         WHERE s.product_cd = ? AND s.route_cd = ?
         ORDER BY s.step_no`,
      [product_cd, route_cd],
    );

    // 2. 获取每个步骤的设备信息
    for (const step of steps) {
      const [machines] = await db.query(
        `SELECT id, machine_cd, machine_name, process_time_sec, setup_time
         FROM product_route_step_machines
         WHERE product_cd = ? AND route_cd = ? AND step_no = ?
         ORDER BY id`,
        [product_cd, route_cd, step.step_no],
      );
      step.machines = machines;
    }

    res.json({ success: true, data: steps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// 批量保存产品工程步骤（insert or update）
router.post("/bulk", async (req, res) => {
  const steps = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 获取第一条记录的product_cd和route_cd用于清理
    const { product_cd, route_cd } = steps[0];

    // 1. 删除现有的设备配置
    await connection.execute(
      "DELETE FROM product_route_step_machines WHERE product_cd = ? AND route_cd = ?",
      [product_cd, route_cd],
    );

    // 2. 删除现有的工程步骤
    await connection.execute(
      "DELETE FROM product_route_steps WHERE product_cd = ? AND route_cd = ?",
      [product_cd, route_cd],
    );

    // 3. 插入新的工程步骤和设备配置
    for (const step of steps) {
      // 插入工程步骤
      await connection.execute(
        `INSERT INTO product_route_steps
         (product_cd, route_cd, step_no, process_cd)
         VALUES (?, ?, ?, ?)`,
        [step.product_cd, step.route_cd, step.step_no, step.process_cd],
      );

      // 插入设备配置
      if (step.machines && step.machines.length > 0) {
        for (const machine of step.machines) {
          // 跳过空的设备记录
          if (!machine.machine_cd) continue;

          await connection.execute(
            `INSERT INTO product_route_step_machines
             (product_cd, route_cd, step_no, machine_cd, machine_name, process_time_sec, setup_time)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              step.product_cd,
              step.route_cd,
              step.step_no,
              machine.machine_cd,
              machine.machine_name,
              machine.process_time_sec || 0,
              machine.setup_time || 0,
            ],
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: "保存成功" });
  } catch (error) {
    await connection.rollback();
    console.error("保存失败:", error);
    res.status(500).json({ success: false, message: "保存失败", error: error.message });
  } finally {
    connection.release();
  }
});

// 单个产品取得
router.get("/:product_cd", async (req, res) => {
  const { product_cd } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT p.*, r.route_name
       FROM products p
       LEFT JOIN routes r ON p.route_cd = r.route_cd
       WHERE p.product_cd = ?`,
      [product_cd],
    );

    // if (!rows.length) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "製品が存在しません", data: null });
    // }

    res.json({ success: true, data: rows.length ? rows[0] : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// 查询指定 route_cd 的标准工程步骤
router.post("/:route_cd", async (req, res) => {
  const { route_cd } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT rs.step_no, rs.process_cd, p.process_name
        FROM route_steps rs
        LEFT JOIN processes p ON rs.process_cd = p.process_cd
        WHERE rs.route_cd = ?
        ORDER BY rs.step_no`,
      [route_cd],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// 获取工程列表
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT process_cd, process_name FROM processes ORDER BY process_cd`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// ========== 设备管理接口 ==========

// 1. 单个设备新增
router.post("/machines", async (req, res) => {
  const { product_cd, route_cd, step_no, machine_cd, machine_name, process_time_sec, setup_time } =
    req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO product_route_step_machines
       (product_cd, route_cd, step_no, machine_cd, machine_name, process_time_sec, setup_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product_cd,
        route_cd,
        step_no,
        machine_cd,
        machine_name,
        process_time_sec || 0,
        setup_time || 0,
      ],
    );

    // 返回新创建的记录
    const [newRecord] = await db.query(
      `SELECT id, product_cd, route_cd, step_no, machine_cd, machine_name, process_time_sec, setup_time
       FROM product_route_step_machines WHERE id = ?`,
      [result.insertId],
    );

    res.json({ success: true, data: newRecord[0] });
  } catch (error) {
    console.error("设备新增失败:", error);
    res.status(500).json({ success: false, message: "设备新增失败", error: error.message });
  }
});

// 2. 单个设备更新
router.put("/machines/:id", async (req, res) => {
  const { id } = req.params;
  const { product_cd, route_cd, step_no, machine_cd, machine_name, process_time_sec, setup_time } =
    req.body;

  try {
    await db.query(
      `UPDATE product_route_step_machines
       SET product_cd = ?, route_cd = ?, step_no = ?, machine_cd = ?,
           machine_name = ?, process_time_sec = ?, setup_time = ?
       WHERE id = ?`,
      [
        product_cd,
        route_cd,
        step_no,
        machine_cd,
        machine_name,
        process_time_sec || 0,
        setup_time || 0,
        id,
      ],
    );

    res.json({ success: true, message: "设备更新成功" });
  } catch (error) {
    console.error("设备更新失败:", error);
    res.status(500).json({ success: false, message: "设备更新失败", error: error.message });
  }
});

// 3. 单个设备删除
router.delete("/machines/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM product_route_step_machines WHERE id = ?`, [id]);

    res.json({ success: true, message: "设备删除成功" });
  } catch (error) {
    console.error("设备删除失败:", error);
    res.status(500).json({ success: false, message: "设备删除失败", error: error.message });
  }
});

export default router;
