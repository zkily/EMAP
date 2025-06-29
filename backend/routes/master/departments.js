// 部門マスタ
import express from "express";
import { pool as db } from "../../db/connection.js";
const router = express.Router();

// === 前端 api/master/departmentMaster.ts  ==

// 获取全部部门
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name FROM departments WHERE status = 1");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "部門一覧取得失敗", error: err.message });
  }
});

// 分页获取部门列表（包含上级名称）
router.get("/list", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    const [list] = await db.query(
      `
      SELECT d.*, p.name AS parent_name
      FROM departments d
      LEFT JOIN departments p ON d.parent_id = p.id
      ORDER BY d.id DESC
      LIMIT ?, ?
    `,
      [offset, pageSize],
    );

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM departments`);
    res.json({ success: true, data: list, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "部門リスト取得失敗", error: err.message });
  }
});

// 新增部门
router.post("/", async (req, res) => {
  const { name, parent_id, status } = req.body;
  try {
    await db.query(`INSERT INTO departments (name, parent_id, status) VALUES (?, ?, ?)`, [
      name,
      parent_id || null,
      status ?? 1,
    ]);
    res.json({ success: true, message: "部門追加成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "追加失敗", error: err.message });
  }
});

// 更新部门
router.put("/:id", async (req, res) => {
  const { name, parent_id, status } = req.body;
  try {
    await db.query(`UPDATE departments SET name = ?, parent_id = ?, status = ? WHERE id = ?`, [
      name,
      parent_id || null,
      status ?? 1,
      req.params.id,
    ]);
    res.json({ success: true, message: "部門更新成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "更新失敗", error: err.message });
  }
});

// 删除部门（可扩展：判断是否有子部门再允许删除）
router.delete("/:id", async (req, res) => {
  try {
    // 检查是否存在子部门
    const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM departments WHERE parent_id = ?", [
      req.params.id,
    ]);
    if (rows[0].cnt > 0) {
      return res
        .status(400)
        .json({ success: false, message: "子部門が存在するため削除できません" });
    }

    await db.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "部門削除成功" });
  } catch (err) {
    res.status(500).json({ success: false, message: "削除失敗", error: err.message });
  }
});

export default router;
