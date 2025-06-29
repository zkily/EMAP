import { db } from "../../../db/index.js";

// 设备下拉
export async function getAllMachines(req, res) {
  const [rows] = await db.query(`
    SELECT DISTINCT
  e.machine_cd,
  m.machine_name,
  p.process_name
FROM product_process_machine_efficiency e
LEFT JOIN machines m ON e.machine_cd = m.machine_cd
LEFT JOIN processes p ON e.process_cd = p.process_cd
ORDER BY e.machine_cd;
  `);
  res.json({ success: true, data: rows });
}

// 获取设备例外日
export async function getMachineException(req, res) {
  const { machine_cd } = req.query;
  if (!machine_cd) {
    return res
      .status(400)
      .json({ success: false, message: "machine_cd is required" });
  }
  const [rows] = await db.query(
    `SELECT * FROM machine_exceptions WHERE machine_cd = ? ORDER BY exception_date, start_time`,
    [machine_cd]
  );
  res.json({ success: true, data: rows });
}

// 添加例外日
export async function addMachineException(req, res) {
  const { machine_cd, exception_date, start_time, end_time, reason } = req.body;
  if (!machine_cd || !exception_date || !start_time || !end_time) {
    return res
      .status(400)
      .json({ success: false, message: "必要項目が不足しています" });
  }
  await db.query(
    `INSERT INTO machine_exceptions (machine_cd, exception_date, start_time, end_time, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [machine_cd, exception_date, start_time, end_time, reason]
  );
  res.json({ success: true });
}

// 删除例外日
export async function deleteMachineException(req, res) {
  const { id } = req.body;
  if (!id)
    return res.status(400).json({ success: false, message: "id is required" });
  await db.query(`DELETE FROM machine_exceptions WHERE id = ?`, [id]);
  res.json({ success: true });
}
