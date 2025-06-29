import { pool as db } from "../../../db/connection.js";

//====  后端 processes.js  调用   ==

// 取得工程列表
export async function listProcesses(req, res) {
  const { page = 1, pageSize = 20, keyword = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  try {
    // 关键词模糊过滤
    const keywordSql = `%${keyword}%`;

    const [rows] = await db.query(
      `
      SELECT SQL_CALC_FOUND_ROWS *
      FROM processes
      WHERE process_cd LIKE ? OR process_name LIKE ?
      ORDER BY id ASC
      LIMIT ? OFFSET ?
      `,
      [keywordSql, keywordSql, parseInt(pageSize), offset],
    );

    const [[{ "FOUND_ROWS()": total }]] = await db.query("SELECT FOUND_ROWS()");

    res.json({
      success: true,
      data: {
        list: rows,
        total,
      },
    });
  } catch (err) {
    console.error("工程取得失敗:", err);
    res.status(500).json({ success: false, message: "工程取得失敗" });
  }
}

// 新增工程
export const createProcess = async (req, res) => {
  try {
    const { process_cd, process_name, short_name, category, is_outsource, default_cycle_sec } =
      req.body;

    // 检查是否已存在
    const [existing] = await db.query("SELECT process_cd FROM processes WHERE process_cd = ?", [
      process_cd,
    ]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "工程CDが既に存在します",
      });
    }

    // 插入新工序
    await db.query(
      `INSERT INTO processes (process_cd, process_name, short_name, category, is_outsource, default_cycle_sec, default_yield)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        process_cd,
        process_name,
        short_name,
        category,
        is_outsource ? 1 : 0,
        default_cycle_sec || 1,
        1.0,
      ],
    );

    res.json({
      success: true,
      message: "工程を登録しました",
    });
  } catch (error) {
    console.error("工程登録エラー:", error);
    res.status(500).json({
      success: false,
      message: "工程の登録に失敗しました",
    });
  }
};

// 更新工程
export async function updateProcess(req, res) {
  const id = req.params.id;
  const {
    process_cd,
    process_name,
    short_name,
    category,
    is_outsource = false,
    default_cycle_sec = 0,
    default_yield = 100,
  } = req.body;

  try {
    await db.query(
      `UPDATE processes SET process_cd = ?, process_name = ?, short_name = ?, category = ?, is_outsource = ?, default_cycle_sec = ?, default_yield = ?
         WHERE id = ?`,
      [
        process_cd,
        process_name,
        short_name,
        category,
        is_outsource ? 1 : 0,
        default_cycle_sec,
        default_yield,
        id,
      ],
    );

    res.json({ success: true, message: "更新成功" });
  } catch (err) {
    console.error("工程更新失敗:", err);
    res.status(500).json({ success: false, message: "更新に失敗しました" });
  }
}

// 删除工程
export async function deleteProcess(req, res) {
  const id = req.params.id;

  try {
    await db.query("DELETE FROM processes WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    console.error("工程削除失敗:", err);
    res.status(500).json({ success: false, message: "削除に失敗しました" });
  }
}

//====  后端  processesRouter.js  调用   ==

// 取得工程工序
export async function listRoutes(req, res) {
  const { page = 1, pageSize = 20, keyword = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  try {
    const keywordSql = `%${keyword}%`;

    const [rows] = await db.query(
      `
      SELECT SQL_CALC_FOUND_ROWS *
      FROM routes
      WHERE route_cd LIKE ? OR route_name LIKE ?
      ORDER BY id ASC
      LIMIT ? OFFSET ?
      `,
      [keywordSql, keywordSql, parseInt(pageSize), offset],
    );

    const [[{ "FOUND_ROWS()": total }]] = await db.query("SELECT FOUND_ROWS()");

    res.json({
      success: true,
      data: {
        list: rows,
        total,
      },
    });
  } catch (err) {
    console.error("ルート一覧取得エラー:", err);
    res.status(500).json({ success: false, message: "ルート一覧取得失敗" });
  }
}

// 新增工程工序
export async function createRoute(req, res) {
  const { route_cd, route_name, description = "", is_default = false } = req.body;
  try {
    // 重複チェック（可选）
    const [[exists]] = await db.query("SELECT id FROM routes WHERE route_cd = ?", [route_cd]);
    if (exists) {
      return res.status(400).json({ success: false, message: "ルートコードが既に存在します" });
    }

    await db.query(
      `INSERT INTO routes (route_cd, route_name, description, is_default)
         VALUES (?, ?, ?, ?)`,
      [route_cd, route_name, description, is_default ? 1 : 0],
    );
    res.json({ success: true, message: "登録成功" });
  } catch (err) {
    console.error("ルート登録失敗:", err);
    res.status(500).json({ success: false, message: "ルート登録に失敗しました" });
  }
}

// 更新工程工序
export async function updateRoute(req, res) {
  const id = req.params.id;
  const { route_cd, route_name, description = "", is_default = false } = req.body;

  try {
    await db.query(
      `UPDATE routes SET route_cd = ?, route_name = ?, description = ?, is_default = ?
         WHERE id = ?`,
      [route_cd, route_name, description, is_default ? 1 : 0, id],
    );

    res.json({ success: true, message: "更新成功" });
  } catch (err) {
    console.error("ルート更新失敗:", err);
    res.status(500).json({ success: false, message: "更新に失敗しました" });
  }
}

// 删除工程工序
export async function deleteRoute(req, res) {
  const id = req.params.id;

  try {
    await db.query("DELETE FROM routes WHERE id = ?", [id]);
    res.json({ success: true, message: "削除しました" });
  } catch (err) {
    console.error("ルート削除失敗:", err);
    res.status(500).json({ success: false, message: "削除に失敗しました" });
  }
}
