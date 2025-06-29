import { pool as db } from "../../../db/connection.js";

// 获取全部设备
export async function getMachines(req, res) {
  try {
    const [rows] = await db.query(`SELECT * FROM machines ORDER BY id DESC`);
    res.json({
      success: true,
      data: {
        list: rows,
        total: rows.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 取得设备
export async function getMachineById(req, res) {
  const [rows] = await db.query(`SELECT * FROM machines WHERE id = ?`, [req.params.id]);
  res.json({ success: true, data: rows[0] });
}

// 新增设备
export async function createMachine(req, res) {
  const data = req.body;
  const [result] = await db.query(`INSERT INTO machines SET ?`, [data]);
  res.json({ success: true, data: { id: result.insertId } });
}

// 更新设备
export async function updateMachine(req, res) {
  const data = req.body;
  await db.query(`UPDATE machines SET ? WHERE id = ?`, [data, req.params.id]);
  res.json({ success: true, data: null });
}

// 删除设备
export async function deleteMachine(req, res) {
  await db.query(`DELETE FROM machines WHERE id = ?`, [req.params.id]);
  res.json({ success: true, data: null });
}
