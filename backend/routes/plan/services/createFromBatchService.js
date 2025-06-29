import { db } from "../../../db/index.js";
import { v4 as uuidv4 } from "uuid";

// 定义日期函数
function toDateOnly(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // "2025-05-22"
}

// 计划生成函数
export async function createPlansFromBatches(plans) {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const created = [];

    for (const item of plans) {
      const { product_cd, latest_start_date, batch_nos = [] } = item;

      // 1. 获取 route_cd
      const [[productRow]] = await conn.query(
        `SELECT route_cd FROM products WHERE product_cd = ?`,
        [product_cd],
      );
      if (!productRow?.route_cd) {
        throw new Error(`产品 ${product_cd} 没有关联工程路线`);
      }

      // 2. 获取工程步骤
      const [steps] = await conn.query(
        `SELECT step_no, process_cd
         FROM route_steps
         WHERE route_cd = ?
         ORDER BY step_no ASC`,
        [productRow.route_cd],
      );
      if (steps.length === 0) {
        throw new Error(`产品 ${product_cd} 的工程路线无有效工序`);
      }

      // 3. 遍历每个批次，单独生成一个计划
      for (const batch_no of batch_nos) {
        // 3.1 查询该批次的数量
        const [[batchRow]] = await conn.query(
          `SELECT planned_qty FROM production_batches WHERE batch_no = ?`,
          [batch_no],
        );
        if (!batchRow) {
          throw new Error(`批次 ${batch_no} 不存在`);
        }

        const planned_quantity = batchRow.planned_qty;

        // 3.2 生成计划编号
        const plan_no = `PL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uuidv4().slice(0, 6)}`;
        const plan_date = new Date().toISOString().slice(0, 10);

        // 3.3 插入 production_plans 主记录
        const [planRes] = await conn.query(
          `INSERT INTO production_plans
           (plan_no, product_cd, plan_date, latest_start_date, total_qty, status)
           VALUES (?, ?, ?, ?, ?, 'draft')`,
          [plan_no, product_cd, plan_date, toDateOnly(latest_start_date), planned_quantity],
        );
        const plan_id = planRes.insertId;

        // 3.4 插入 plan_batch link
        await conn.query(
          `INSERT INTO production_plan_batches (plan_id, batch_no)
           VALUES (?, ?)`,
          [plan_id, batch_no],
        );

        // 3.5 更新批次状态为已计划
        await conn.query(
          `UPDATE production_batches
           SET status = '計画済'
           WHERE batch_no = ?`,
          [batch_no],
        );

        // 3.6 插入工序计划
        for (const step of steps) {
          const { step_no, process_cd } = step;

          const [[machineRow]] = await conn.query(
            `SELECT machine_cd, process_time_sec
             FROM product_route_step_machines
             WHERE product_cd = ? AND route_cd = ? AND step_no = ?
             ORDER BY process_time_sec ASC
             LIMIT 1`,
            [product_cd, productRow.route_cd, step_no],
          );

          await conn.query(
            `INSERT INTO production_plan_steps (
               plan_id, step_no, process_cd, machine_cd,
               planned_qty, efficiency, status
             ) VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
            [
              plan_id,
              step_no,
              process_cd,
              machineRow?.machine_cd || null,
              planned_quantity,
              machineRow?.process_time_sec ? 3600 / machineRow.process_time_sec : null,
            ],
          );
        }

        // 3.7 收集结果
        created.push({ plan_id, plan_no, product_cd, batch_no });
      }
    }

    await conn.commit();
    return created;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function fetchAll() {
  const [rows] = await db.query("SELECT * FROM production_batch_pool ORDER BY id DESC");
  return rows;
}

export async function insert({ product_cd, product_name, quantity }) {
  const batch_no = await generateBatchNo(product_cd);
  const [res] = await db.query(
    `
    INSERT INTO production_batch_pool (product_cd, product_name, quantity, batch_no)
    VALUES (?, ?, ?, ?)
  `,
    [product_cd, product_name, quantity, batch_no],
  );
  return { id: res.insertId, product_cd, product_name, quantity, batch_no };
}

export async function remove(id) {
  await db.query("DELETE FROM production_batch_pool WHERE id = ?", [id]);
}

export async function update(id, { quantity }) {
  await db.query(`UPDATE production_batch_pool SET quantity = ? WHERE id = ?`, [quantity, id]);
  const [[row]] = await db.query(`SELECT * FROM production_batch_pool WHERE id = ?`, [id]);
  return row;
}

async function generateBatchNo(product_cd) {
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count FROM production_batch_pool WHERE product_cd = ?`,
    [product_cd],
  );
  return `PB-${product_cd}-${String(count + 1).padStart(3, "0")}`;
}
