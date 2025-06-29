import { db } from "../../../db/index.js";

// 获取全部生产批次
export async function apiGetBatchListAll(req, res) {
  const { product_cd, from_date, to_date, status } = req.query;

  const where = [];
  const params = [];

  if (product_cd) {
    where.push("product_cd = ?");
    params.push(product_cd);
  }
  if (from_date && to_date) {
    where.push("from_date >= ? AND to_date <= ?");
    params.push(from_date, to_date);
  }
  if (status) {
    where.push("status = ?");
    params.push(status);
  }

  const [rows] = await db.query(
    `
      SELECT * FROM production_batches
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY from_date ASC
    `,
    params
  );

  res.json({ success: true, data: rows });
}

// 生产批次锁定
export async function apiLockBatch(req, res) {
  const { id } = req.body;
  await db.query(
    `
      UPDATE production_batches SET locked = 1, status = '作業中' WHERE id = ?
    `,
    [id]
  );
  res.json({ success: true });
}

// 生产批次取消
export async function apiCancelBatch(req, res) {
  const { id } = req.body;
  await db.query(
    `
      UPDATE production_batches SET status = '取消済' WHERE id = ?
    `,
    [id]
  );
  res.json({ success: true });
}
