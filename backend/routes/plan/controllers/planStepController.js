import { db } from "../../../db/index.js";
import dayjs from "dayjs";

// 自动创建步骤;
export async function createPlanStepWithAutoEndTime(req, res) {
  const { plan_id, process_cd, machine_cd, start_time } = req.body;
  if (!plan_id || !process_cd || !machine_cd || !start_time)
    return res.status(400).json({ success: false, message: "缺少参数" });

  try {
    const [[plan]] = await db.query(
      `SELECT product_cd, planned_qty FROM production_plans WHERE id = ?`,
      [plan_id]
    );
    if (!plan) throw new Error("找不到计划");

    const [[eff]] = await db.query(
      `SELECT efficiency_per_hour FROM product_process_machine_efficiency
         WHERE product_cd = ? AND process_cd = ? AND machine_cd = ?`,
      [plan.product_cd, process_cd, machine_cd]
    );
    if (!eff) throw new Error("未设定效率");

    const hours = plan.planned_qty / eff.efficiency_per_hour;
    const end_time = new Date(
      new Date(start_time).getTime() + hours * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const [result] = await db.query(
      `INSERT INTO production_plan_steps (plan_id, process_cd, machine_cd, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, 'planned')`,
      [plan_id, process_cd, machine_cd, start_time, end_time]
    );

    res.json({
      success: true,
      data: { id: result.insertId, start_time, end_time },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 获取甘特图数据
export async function getGanttData(req, res) {
  const { from, to } = req.query;
  if (!from || !to)
    return res
      .status(400)
      .json({ success: false, message: "缺少 from/to 参数" });

  try {
    // 生产计划步骤
    const [rows] = await db.query(
      `
      SELECT
        s.id,
        s.machine_cd AS \`group\`,
        s.plan_id,
        s.process_cd,
        pr.product_name,
        ps.process_name,
        m.machine_name AS device_name,
        s.planned_qty AS quantity,
        CONCAT(pr.product_name, ' / ', ps.process_name, ' / ', m.machine_name) AS content,
        DATE_FORMAT(s.start_time, '%Y-%m-%dT%H:%i:%s') AS start,
        DATE_FORMAT(s.end_time, '%Y-%m-%dT%H:%i:%s') AS end,
        CONCAT('status-', s.status) AS className
      FROM production_plan_steps s
      JOIN production_plans pl ON s.plan_id = pl.id
      JOIN products pr ON pl.product_cd = pr.product_cd
      JOIN processes ps ON s.process_cd = ps.process_cd
      LEFT JOIN machines m ON s.machine_cd = m.machine_cd
      WHERE s.start_time BETWEEN ? AND ?
      ORDER BY s.machine_cd, s.start_time
      `,
      [from, to]
    );
    
  

    // 背景封锁数据
    let exceptions = [];
    try {
      [exceptions] = await db.query(
        `
          SELECT machine_cd, exception_date, start_time, end_time, reason
          FROM machine_exceptions
          WHERE exception_date BETWEEN ? AND ?
        `,
        [from, to]
      );
    } catch (e) {
      console.warn("⚠️ 无法读取 machine_exceptions 表，已忽略背景封锁数据");
    }

    const backgroundItems = exceptions
      .map((ex, index) => {
        try {
          const start = dayjs(`${ex.exception_date} ${ex.start_time}`).format(
            "YYYY-MM-DDTHH:mm:ss"
          );
          const end = dayjs(`${ex.exception_date} ${ex.end_time}`).format(
            "YYYY-MM-DDTHH:mm:ss"
          );

          if (!dayjs(start).isValid() || !dayjs(end).isValid()) return null;

          return {
            id: `bg-${index}`,
            group: ex.machine_cd,
            start,
            end,
            type: "background",
            className: "bg-disabled",
            title: ex.reason || "設備停止",
          };
        } catch (err) {
          console.error("构造 backgroundItem 错误:", ex, err);
          return null;
        }
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: [...rows, ...backgroundItems],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


// 甘特图拖拽更新
export async function updatePlanStepTime(req, res) {
  const { id, start_time, end_time, machine_cd } = req.body;
  if (!id || !start_time || !end_time)
    return res.status(400).json({ success: false, message: "缺少参数" });

  try {
    await db.query(
      `UPDATE production_plan_steps
         SET start_time = ?, end_time = ?, machine_cd = ?
         WHERE id = ?`,
      [start_time, end_time, machine_cd, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 获取任务用
export async function getAllPlans(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        id AS value,
        CONCAT(plan_no, ' / ', product_cd, ' / ', total_qty) AS label,
        product_cd,
        total_qty
      FROM production_plans
      ORDER BY id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ getAllPlans 查询失败:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}


// 新增任务用
export async function getEfficiency(req, res) {
  const { product_cd, process_cd, machine_cd } = req.query;
  const [[row]] = await db.query(
    `SELECT efficiency_per_hour FROM product_process_machine_efficiency
       WHERE product_cd = ? AND process_cd = ? AND machine_cd = ?`,
    [product_cd, process_cd, machine_cd]
  );
  res.json({ success: true, data: row || null });
}

// 获取所有工序选项
export async function getProcessOptions(req, res) {
  const [rows] = await db.query(`
      SELECT process_cd AS value, process_name AS label
      FROM processes
      ORDER BY process_cd
    `);
  res.json({ success: true, data: rows });
}

// 获取指定产品 × 工序下的全部机台 + 效率
export async function getMachineOptions(req, res) {
  const { product_cd, process_cd } = req.query;
  const [rows] = await db.query(
    `
      SELECT
        machine_cd AS value,
        CONCAT(machine_cd, '（', efficiency_per_hour, ' pcs/h）') AS label,
        efficiency_per_hour
      FROM product_process_machine_efficiency
      WHERE product_cd = ? AND process_cd = ?
      ORDER BY efficiency_per_hour DESC
    `,
    [product_cd, process_cd]
  );
  res.json({ success: true, data: rows });
}

// 工序顺序校验
export async function validateStepOrder(req, res) {
  const { plan_id, process_cd } = req.query;

  const [[plan]] = await db.query(
    `
      SELECT product_cd FROM production_plans WHERE id = ?
    `,
    [plan_id]
  );

  const [[product]] = await db.query(
    `
      SELECT route_id FROM products WHERE product_cd = ?
    `,
    [plan.product_cd]
  );

  const [[targetStep]] = await db.query(
    `
      SELECT step_no FROM route_steps
      WHERE route_id = ? AND process_cd = ?
    `,
    [product.route_id, process_cd]
  );

  const [existingSteps] = await db.query(
    `
      SELECT r.step_no, r.process_cd FROM production_plan_steps s
      JOIN route_steps r ON s.process_cd = r.process_cd
      WHERE s.plan_id = ? AND r.route_id = ?
    `,
    [plan_id, product.route_id]
  );

  const missedSteps = existingSteps
    .filter((step) => step.step_no < targetStep.step_no)
    .map((s) => s.process_cd);

  res.json({
    success: true,
    data: { valid: missedSteps.length === 0, missedSteps },
  });
}

// 拖拽之后工序顺序校验
export async function validateStepDrag(req, res) {
  const { step_id, plan_id, process_cd, new_start_time } = req.query;

  const [[plan]] = await db.query(
    `SELECT product_cd FROM production_plans WHERE id = ?`,
    [plan_id]
  );
  const [[product]] = await db.query(
    `SELECT route_id FROM products WHERE product_cd = ?`,
    [plan.product_cd]
  );
  const [[targetStep]] = await db.query(
    `
      SELECT step_no FROM route_steps
      WHERE route_id = ? AND process_cd = ?
    `,
    [product.route_id, process_cd]
  );

  const [priorSteps] = await db.query(
    `
      SELECT s.process_cd, s.end_time FROM production_plan_steps s
      JOIN route_steps r ON s.process_cd = r.process_cd
      WHERE s.plan_id = ?
        AND r.route_id = ?
        AND r.step_no < ?
    `,
    [plan_id, product.route_id, targetStep.step_no]
  );

  const conflict = priorSteps.find(
    (step) => new Date(step.end_time) > new Date(new_start_time)
  );

  res.json({
    success: true,
    data: {
      valid: !conflict,
      conflictStep: conflict?.process_cd || null,
    },
  });
}

// 机器运行日限制
export async function getMachineAvailability(req, res) {
  const { machine_cd } = req.query;
  const [rows] = await db.query(
    `
      SELECT * FROM machine_availability
      WHERE machine_cd = ?
    `,
    [machine_cd]
  );
  res.json({ success: true, data: rows });
}

// 设备的假日支持
export async function getMachineExceptions(req, res) {
  const { machine_cd } = req.query;
  const [rows] = await db.query(
    `
      SELECT * FROM machine_exceptions WHERE machine_cd = ?
    `,
    [machine_cd]
  );
  res.json({ success: true, data: rows });
}
