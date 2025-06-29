import express from "express";
import { pool as db } from "../../db/connection.js";

const router = express.Router();

// 取得全部排产计划
router.get("/", async (req, res) => {
  const { process_cd, machine_cd, product_cd, status, from_date, to_date } = req.query;
  let where = "WHERE 1=1";
  const params = [];

  if (process_cd) {
    where += " AND s.process_cd=?";
    params.push(process_cd);
  }
  if (machine_cd) {
    where += " AND s.machine_cd=?";
    params.push(machine_cd);
  }
  if (product_cd) {
    where += " AND s.product_cd=?";
    params.push(product_cd);
  }
  if (status) {
    where += " AND s.status=?";
    params.push(status);
  }
  if (from_date) {
    where += " AND s.plan_start>=?";
    params.push(from_date + " 00:00:00");
  }
  if (to_date) {
    where += " AND s.plan_start<=?";
    params.push(to_date + " 23:59:59");
  }

  const [rows] = await db.query(
    `
    SELECT s.*, p.product_name, m.machine_name, pr.process_name
    FROM production_schedules s
    LEFT JOIN products p ON s.product_cd = p.product_cd
    LEFT JOIN machines m ON s.machine_cd = m.machine_cd
    LEFT JOIN processes pr ON s.process_cd = pr.process_cd
    ${where}
    ORDER BY s.plan_start, s.product_cd, s.process_cd
  `,
    params,
  );
  res.json(rows);
});

// 单条更新
router.patch("/:id", async (req, res) => {
  const data = req.body;
  await db.query(
    `
    UPDATE production_schedules SET
      product_cd=?, process_cd=?, machine_cd=?, quantity=?, efficiency=?, plan_start=?, plan_end=?, status=?, actual_qty=?, item_no=?, defect_qty=?, defect_rate=?
    WHERE id=?
  `,
    [
      data.product_cd,
      data.process_cd,
      data.machine_cd,
      data.quantity,
      data.efficiency, // ★一定要带
      data.plan_start,
      data.plan_end,
      data.status,
      data.actual_qty,
      data.item_no,
      data.defect_qty || 0,
      data.defect_rate || 0,
      req.params.id,
    ],
  );
  res.json({ success: true });
});

// 新增
router.post("/", async (req, res) => {
  const data = req.body;

  // 1. 查找同工程同设备下的最大 item_no
  const [[maxRow]] = await db.query(
    `SELECT MAX(item_no) AS max_no FROM production_schedules WHERE process_cd=? AND machine_cd=?`,
    [data.process_cd, data.machine_cd],
  );
  // 2. 计算新顺序号
  const nextItemNo = (maxRow?.max_no || 0) + 1;

  // 3. 插入时用自动顺序号
  await db.query(
    `INSERT INTO production_schedules
      (product_cd, process_cd, machine_cd, quantity, efficiency, defect_qty, defect_rate, plan_start, plan_end, status, item_no)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.product_cd,
      data.process_cd,
      data.machine_cd,
      data.quantity,
      data.efficiency,
      data.defect_qty || 0,
      data.defect_rate || 0,
      data.plan_start,
      data.plan_end,
      data.status || "未開始",
      nextItemNo,
    ],
  );
  res.json({ success: true, item_no: nextItemNo });
});

// 删除
router.delete("/:id", async (req, res) => {
  await db.query("DELETE FROM production_schedules WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// 能率
router.get("/efficiency", async (req, res) => {
  const { product_cd, process_cd, machine_cd } = req.query;
  const [[row]] = await db.query(
    `SELECT efficiency, unit FROM product_process_machine_efficiency WHERE product_cd=? AND process_cd=? AND machine_cd=?`,
    [product_cd, process_cd, machine_cd],
  );
  if (row) {
    res.json({ success: true, efficiency: row.efficiency, unit: row.unit });
  } else {
    res.json({ success: true, efficiency: 1.0, unit: "個/時間" }); // 默认1.0
  }
});

// 拖拽顺序
router.post("/batch-update-item-no", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.json({ success: false, message: "No items" });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of items) {
      await conn.query("UPDATE production_schedules SET item_no=? WHERE id=?", [
        item.item_no,
        item.id,
      ]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
});

// 获取要生成批次
// / 查询可用的生产批次
router.get("/production-batches", async (req, res) => {
  // 前端会传 process_cd, machine_cd
  const { process_cd, machine_cd } = req.query;
  try {
    const [rows] = await db.query(
      `
      SELECT b.batch_no, b.product_cd, p.product_name, b.planned_qty
      FROM production_batches b
      LEFT JOIN products p ON p.product_cd = b.product_cd
      WHERE b.status = '未開始'
        AND b.process_cd = ?
        AND b.machine_cd = ?
      ORDER BY b.batch_no
    `,
      [process_cd, machine_cd],
    );
    res.json({ success: true, list: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 批量生成计划
router.post("/create-batch-plans", async (req, res) => {
  const { process_cd, machine_cd, batch_nos } = req.body;
  if (!process_cd || !machine_cd || !batch_nos?.length) {
    return res.status(400).json({ success: false, message: "参数不足" });
  }

  try {
    // 1. 批量查找选中的 batch 信息
    const [batches] = await db.query(
      `
      SELECT b.batch_no, b.product_cd, p.product_name, b.planned_qty
      FROM production_batches b
      LEFT JOIN products p ON p.product_cd = b.product_cd
      WHERE b.batch_no IN (?)
    `,
      [batch_nos],
    );

    // 2. 查询工艺效率（假设你有 product_process_machine_efficiency 表）
    // 可按 batch 循环获取，也可一次查全量后 Map 匹配
    let effMap = new Map();
    if (batches.length > 0) {
      const [effRows] = await db.query(
        `
        SELECT * FROM product_process_machine_efficiency
        WHERE process_cd = ? AND machine_cd = ? AND product_cd IN (?)
      `,
        [process_cd, machine_cd, batches.map((b) => b.product_cd)],
      );
      for (const r of effRows) {
        effMap.set(r.product_cd, { efficiency: r.efficiency, unit: r.unit });
      }
    }

    // 3. 生成多条计划
    const planRows = [];
    const now = new Date();
    let planStart = now; // 可自定义，或让用户在前端指定

    for (const batch of batches) {
      // 查能率（优先用查到的，否则默认1.0）
      const eff = effMap.get(batch.product_cd) || { efficiency: 1.0, unit: "" };
      // 计算结束时间
      const hours = batch.planned_qty / (eff.efficiency || 1);
      const start = new Date(planStart);
      const end = new Date(start.getTime() + hours * 3600 * 1000);
      // MySQL DATETIME 格式
      function toMySQLDateTime(dt) {
        if (!dt) return "";
        const pad = (n) => (n < 10 ? "0" + n : n);
        return (
          [dt.getFullYear(), pad(dt.getMonth() + 1), pad(dt.getDate())].join("-") +
          " " +
          [pad(dt.getHours()), pad(dt.getMinutes()), pad(dt.getSeconds())].join(":")
        );
      }

      planRows.push([
        process_cd,
        machine_cd,
        batch.product_cd,
        batch.batch_no,
        batch.planned_qty,
        eff.efficiency,
        toMySQLDateTime(start),
        toMySQLDateTime(end),
        "未開始",
      ]);
      // 下一个计划的开始时间可递推（假设按顺序排产）
      planStart = end;
    }

    // 4. 插入 production_schedules（或 production_plan_steps 表）
    const [result] = await db.query(
      `
      INSERT INTO production_schedules
        (process_cd, machine_cd, product_cd, batch_no, quantity, efficiency, plan_start, plan_end, status)
      VALUES ?
    `,
      [planRows],
    );

    res.json({ success: true, message: "生成完了", inserted: result.affectedRows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

//批量生成生产计划
router.post("/create-batch-plans", async (req, res) => {
  const { process_cd, machine_cd, batch_nos } = req.body;
  if (
    !process_cd ||
    !machine_cd ||
    !batch_nos ||
    !Array.isArray(batch_nos) ||
    batch_nos.length === 0
  ) {
    return res.status(400).json({ success: false, message: "パラメータ不正" });
  }

  const conn = await req.db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 逐个读取批次并生成计划
    for (const batch_no of batch_nos) {
      const [[batch]] = await conn.query(
        `SELECT * FROM production_batches WHERE batch_no=? AND process_cd=? AND machine_cd=? FOR UPDATE`,
        [batch_no, process_cd, machine_cd],
      );
      if (!batch) continue;

      // 查能率 (例：可根据你的实际业务去查，下面为示例)
      const [effRows] = await conn.query(
        `SELECT efficiency FROM product_process_machine_efficiency WHERE product_cd=? AND process_cd=? AND machine_cd=? LIMIT 1`,
        [batch.product_cd, process_cd, machine_cd],
      );
      const efficiency = effRows[0]?.efficiency || 1;

      // 计划时间（此处举例直接用当前时间和效率推算）
      const now = new Date();
      const plan_start = now;
      const hours = batch.planned_qty / (efficiency || 1);
      const plan_end = new Date(now.getTime() + hours * 3600 * 1000);

      // 插入计划（根据你实际的 production_schedules 字段调整）
      await conn.query(
        `INSERT INTO production_schedules
          (product_cd, process_cd, machine_cd, quantity, plan_start, plan_end, efficiency, batch_no, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '未開始')`,
        [
          batch.product_cd,
          process_cd,
          machine_cd,
          batch.planned_qty,
          plan_start,
          plan_end,
          efficiency,
          batch_no,
        ],
      );

      // 同时把批次状态更新为"已計画"
      await conn.query(`UPDATE production_batches SET status='已計画' WHERE batch_no=?`, [
        batch_no,
      ]);
    }

    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
});

// 辅助日期格式化
// function formatDate(dt) {
//   if (!dt) return null
//   const d = new Date(dt)
//   const pad = n => (n < 10 ? '0' + n : n)
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
// }

// 自动推算全部排程计划，设备/工序/顺序依赖 item_no 字段

const STANDARD_WORK_START = 8; // 08:00
const STANDARD_WORK_END = 17; // 17:00

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}
function nextWorkday(date) {
  let d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return d;
}
function buildTimeSlots(workTimes) {
  return workTimes.map((row) => ({
    start: new Date(`${row.work_date}T${row.start_time}`),
    end: new Date(`${row.work_date}T${row.end_time}`),
    is_overtime: row.is_overtime,
  }));
}
function fillExtraTimeSlots(
  lastDate,
  needMinutes,
  timePerDay = [STANDARD_WORK_START, STANDARD_WORK_END],
) {
  let slots = [];
  let remain = needMinutes;
  let curDate = nextWorkday(lastDate);
  while (remain > 0) {
    const start = new Date(curDate);
    start.setHours(timePerDay[0], 0, 0, 0);
    const end = new Date(curDate);
    end.setHours(timePerDay[1], 0, 0, 0);
    const minutes = (end - start) / 60000;
    slots.push({ start, end, is_overtime: 0 });
    remain -= minutes;
    curDate = nextWorkday(curDate);
  }
  return slots;
}
function findNextSlot(time, slots) {
  for (let slot of slots) {
    if (time < slot.end) {
      return { start: time > slot.start ? time : slot.start, slot };
    }
  }
  return null;
}
function calcPlanEnd(start, durationMins, slots) {
  let remain = durationMins;
  let cur = new Date(start);
  for (let slot of slots) {
    if (cur > slot.end) continue;
    let slotStart = cur > slot.start ? cur : slot.start;
    let availableMins = (slot.end - slotStart) / 60000;
    if (remain <= availableMins) {
      return new Date(slotStart.getTime() + remain * 60000);
    } else {
      remain -= availableMins;
      cur = slot.end;
    }
  }
  return cur;
}
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
// 查询setup_time，如果要扩展用setup矩阵，这里可加入from_product_cd/to_product_cd
async function getSetupTime(process_cd, machine_cd, prev_prod, next_prod) {
  // 段取り时间查 setup_time 字段，无则返回0
  const [[row]] = await db.query(
    `SELECT setup_time FROM product_process_machine_efficiency
     WHERE process_cd=? AND machine_cd=? AND product_cd=? LIMIT 1`,
    [process_cd, machine_cd, next_prod],
  );
  return row ? Number(row.setup_time) : 0;
}

// 自动排产
export async function autoSchedulePlans(db, process_cd, machine_cd) {
  try {
    const [plans] = await db.query(
      `
      SELECT * FROM production_schedules
      WHERE process_cd=? AND machine_cd=?
      ORDER BY item_no ASC
    `,
      [process_cd, machine_cd],
    );

    if (!plans.length) return { success: false, message: "无可排产计划" };

    const [finishedPlans] = await db.query(
      `
      SELECT * FROM production_schedules
      WHERE process_cd=? AND machine_cd=? AND status='完了'
      ORDER BY plan_end DESC LIMIT 1
    `,
      [process_cd, machine_cd],
    );

    let startFrom = null;
    if (finishedPlans.length) {
      startFrom = new Date(finishedPlans[0].plan_end);
    } else {
      startFrom = new Date(plans[0].plan_start || Date.now());
    }

    const [workTimes] = await db.query(
      `
      SELECT work_date, start_time, end_time, is_overtime
      FROM machine_work_times
      WHERE machine_cd = ? AND work_date >= ?
      ORDER BY work_date, start_time
    `,
      [machine_cd, formatDate(startFrom).slice(0, 10)],
    );

    let slots = buildTimeSlots(workTimes);
    let prevEnd = startFrom;
    let prevPlan = null;

    for (let i = 0; i < plans.length; i++) {
      let plan = plans[i];
      if (plan.status === "完了") {
        prevPlan = plan;
        prevEnd = new Date(plan.plan_end);
        continue;
      }
      let setup_time = 0;
      if (prevPlan && plan.product_cd !== prevPlan.product_cd) {
        setup_time = await getSetupTime(
          plan.process_cd,
          plan.machine_cd,
          prevPlan.product_cd,
          plan.product_cd,
        );
      }
      let found = findNextSlot(new Date(prevEnd.getTime() + setup_time * 60000), slots);
      if (!found) {
        const lastSlot = slots.length ? slots[slots.length - 1].end : prevEnd;
        const extraSlots = fillExtraTimeSlots(lastSlot, 99999);
        slots = slots.concat(extraSlots);
        found = findNextSlot(new Date(prevEnd.getTime() + setup_time * 60000), slots);
      }
      let planStart = found.start;
      const eff = Number(plan.efficiency) || 1.0;
      const qty = Number(plan.quantity) || 0;
      let prodMins = (qty / eff) * 60;
      let planEnd = calcPlanEnd(planStart, prodMins, slots);
      while ((planEnd - planStart) / 60000 < prodMins) {
        const lastSlot = slots[slots.length - 1].end;
        const extraSlots = fillExtraTimeSlots(lastSlot, prodMins - (planEnd - planStart) / 60000);
        slots = slots.concat(extraSlots);
        planEnd = calcPlanEnd(planStart, prodMins, slots);
      }
      console.log(
        `排产${plan.id} 计划：start=${formatDate(planStart)}, end=${formatDate(planEnd)}`,
      );
      await db.query(
        `UPDATE production_schedules SET plan_start=?, plan_end=?, setup_time=? WHERE id=?`,
        [formatDate(planStart), formatDate(planEnd), setup_time, plan.id],
      );
      prevPlan = plan;
      prevEnd = planEnd;
    }

    return { success: true, message: "自動排产完了" };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// 新增：全部工序设备的自动排产
router.post("/auto-schedule", async (req, res) => {
  try {
    // 先查出所有不同的工序+设备组合
    const [rows] = await db.query(`
      SELECT DISTINCT process_cd, machine_cd
      FROM production_schedules
      WHERE status != '完了'
    `);
    if (!rows.length) {
      return res.json({ success: false, message: "没有可排产的工序设备组合" });
    }

    // 逐个调用
    let results = [];
    for (const row of rows) {
      const result = await autoSchedulePlans(db, row.process_cd, row.machine_cd);
      results.push({ ...row, ...result });
    }
    res.json({ success: true, message: "全表排产已完成", results });
  } catch (err) {
    console.error("批量自动排产异常:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 计划/实际进度分析
function getScheduleProgress(plan) {
  const now = new Date();
  const planStart = new Date(plan.plan_start);
  const planEnd = new Date(plan.plan_end);
  const actual = Number(plan.actual_qty) || 0;
  const defect = Number(plan.defect_qty) || 0;
  const planQty = Number(plan.quantity) || 0;

  // 计划进度
  let planProgress = 0;
  if (now <= planStart) planProgress = 0;
  else if (now >= planEnd) planProgress = 100;
  else planProgress = Math.round(((now - planStart) / (planEnd - planStart)) * 100);

  // 实际进度
  let actualProgress = planQty > 0 ? Math.round(((actual + defect) / planQty) * 100) : 0;

  // 状态
  let status = "On track";
  const threshold = 5;
  if (actualProgress > planProgress + threshold) status = "Ahead";
  else if (actualProgress < planProgress - threshold) status = "Delay";

  return { planProgress, actualProgress, status };
}
router.post("/analyze-progress", analyzeAllProgress);

// 批量进度分析并保存
async function analyzeAllProgress(req, res) {
  // 可加筛选条件
  const [plans] = await db.query(`SELECT * FROM production_schedules`);
  for (const plan of plans) {
    const { planProgress, actualProgress, status } = getScheduleProgress(plan);
    await db.query(
      `
      UPDATE production_schedules
      SET plan_progress=?, actual_progress=?, progress_status=?
      WHERE id=?
    `,
      [planProgress, actualProgress, status, plan.id],
    );
  }
  res.json({ success: true, message: "進捗分析完了" });
}

// 中文注释：各类主数据下拉
router.get("/products", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM products ORDER BY product_cd");
  res.json(rows);
});
router.get("/processes", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM processes ORDER BY process_cd");
  res.json(rows);
});
router.get("/machines", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM machines ORDER BY machine_cd");
  res.json(rows);
});

// 日期格式化函数
function toMySQLDateTime(val) {
  if (!val) return null;
  // 如果已经是 'YYYY-MM-DD HH:mm' 或 'YYYY-MM-DD HH:mm:ss' 直接返回
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(val)) return val;
  // 如果是 ISO 字符串 '2025-05-23T05:31:00.000Z'，转为 'YYYY-MM-DD HH:mm:ss'
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  // 注意 getMonth 是 0 开头
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
    " " +
    [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":")
  );
}

export default router;
