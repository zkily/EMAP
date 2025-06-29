import express from "express";
import { pool as db } from "../../db/connection.js";
import dayjs from "dayjs";
const router = express.Router();

// 日期函数：格式化为 YYYY-MM-DD
function toDateStr(dt) {
  if (!dt) return "";
  if (typeof dt === "string" && dt.length >= 10) return dt.slice(0, 10);
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 查询某设备某日班次
router.get("/", async (req, res) => {
  let {
    page = 1,
    limit = 30,
    machine_cd = "",
    machine_type = "",
    from_date = "",
    to_date = "",
    sortField = "machine_name",
    sortOrder = "asc",
  } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;
  const offset = (page - 1) * limit;

  // 防注入排序字段
  const allowedSortFields = ["machine_name", "work_date", "start_time", "end_time", "machine_cd"];
  if (!allowedSortFields.includes(sortField)) sortField = "machine_name";
  sortOrder = sortOrder && sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  // 拼接排序 SQL
  let orderBy = "";
  if (sortField === "machine_name") {
    orderBy = `m.machine_name ${sortOrder}, w.start_time ASC, w.id DESC`;
  } else if (sortField === "work_date") {
    orderBy = `w.work_date ${sortOrder}, w.start_time ASC, w.id DESC`;
  } else if (sortField === "start_time") {
    orderBy = `w.start_time ${sortOrder}, w.work_date DESC, w.id DESC`;
  } else if (sortField === "end_time") {
    orderBy = `w.end_time ${sortOrder}, w.start_time ASC, w.id DESC`;
  } else if (sortField === "machine_cd") {
    orderBy = `w.machine_cd ${sortOrder}, w.work_date DESC, w.start_time ASC`;
  } else {
    orderBy = `m.machine_name ASC, w.start_time ASC, w.id DESC`;
  }

  let where = "WHERE 1=1";
  const params = [];

  if (machine_cd) {
    where += " AND w.machine_cd = ?";
    params.push(machine_cd);
  }
  if (machine_type) {
    where += " AND m.machine_type = ?";
    params.push(machine_type);
  }
  if (from_date && to_date) {
    where += " AND w.work_date BETWEEN ? AND ?";
    params.push(from_date, to_date);
  } else if (from_date) {
    where += " AND w.work_date >= ?";
    params.push(from_date);
  } else if (to_date) {
    where += " AND w.work_date <= ?";
    params.push(to_date);
  }

  const sql = `
    SELECT w.*, m.machine_name, m.machine_type,
    CASE DAYOFWEEK(w.work_date)
      WHEN 1 THEN '日'
      WHEN 2 THEN '月'
      WHEN 3 THEN '火'
      WHEN 4 THEN '水'
      WHEN 5 THEN '木'
      WHEN 6 THEN '金'
      WHEN 7 THEN '土'
    END AS weekday_jp
    FROM machine_work_times w
    LEFT JOIN machines m ON w.machine_cd = m.machine_cd
    ${where}
    ORDER BY ${orderBy}
    LIMIT ?, ?
  `;
  params.push(offset, limit);

  const countSql = `
    SELECT COUNT(*) as total
    FROM machine_work_times w
    LEFT JOIN machines m ON w.machine_cd = m.machine_cd
    ${where}
  `;

  try {
    const [rows] = await db.query(sql, params);
    const [[{ total }]] = await db.query(countSql, params.slice(0, -2));
    res.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("[API Error] /api/machine_work_times:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 新增班次 - 支持多日期和多时间段
router.post("/", async (req, res) => {
  try {
    const d = req.body;
    // 检查必要字段
    if (!d.machine_cd || !d.work_dates || !d.work_dates.length) {
      return res.status(400).json({ success: false, message: "必須項目が不足しています" });
    }

    const results = [];
    const errors = [];

    // 创建记录的函数
    const createRecord = async (date, startTime, endTime, isOvertime) => {
      try {
        const formattedDate = toDateStr(date);

        // 查重
        const [exist] = await db.query(
          `SELECT id FROM machine_work_times WHERE machine_cd=? AND work_date=? AND start_time=? AND end_time=?`,
          [d.machine_cd, formattedDate, startTime, endTime],
        );

        if (exist.length > 0) {
          errors.push(`${formattedDate} ${startTime}-${endTime} はすでに存在します`);
          return null;
        }

        // 插入记录
        const [result] = await db.query(
          `INSERT INTO machine_work_times (machine_cd, work_date, start_time, end_time, is_overtime, remark)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [d.machine_cd, formattedDate, startTime, endTime, isOvertime ? 1 : 0, d.remark || ""],
        );

        return result.insertId;
      } catch (err) {
        errors.push(`${date} ${startTime}-${endTime}: ${err.message}`);
        return null;
      }
    };

    // 处理所有日期和时间段组合
    for (const date of d.work_dates) {
      // 处理标准时间段
      if (d.timeSlots && d.timeSlots.length > 0) {
        for (const slot of d.timeSlots) {
          if (slot.start_time && slot.end_time) {
            const id = await createRecord(date, slot.start_time, slot.end_time, false);
            if (id) results.push(id);
          }
        }
      }

      // 处理残業时间段
      const hasOvertime =
        d.overtimeSlots && d.overtimeSlots.some((s) => s.start_time && s.end_time);
      if (hasOvertime) {
        for (const slot of d.overtimeSlots) {
          if (slot.start_time && slot.end_time) {
            const id = await createRecord(date, slot.start_time, slot.end_time, true);
            if (id) results.push(id);
          }
        }
      }
    }

    // 返回结果
    if (results.length > 0) {
      return res.json({
        success: true,
        ids: results,
        errors: errors.length > 0 ? errors : undefined,
        message:
          errors.length > 0 ? `${results.length}件保存、${errors.length}件エラー` : undefined,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: errors.join("\n") || "保存失敗",
      });
    }
  } catch (e) {
    console.error("新規追加エラー:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 编辑班次 - 支持时间段
router.patch("/:id", async (req, res) => {
  try {
    const d = req.body;
    const id = req.params.id;

    // 检查必要字段
    if (!d.machine_cd || !d.work_date) {
      return res.status(400).json({ success: false, message: "必須項目が不足しています" });
    }

    const work_date = toDateStr(d.work_date);
    const machine_cd = d.machine_cd;
    const start_time = d.start_time;
    const end_time = d.end_time;
    const is_overtime = d.is_overtime ? 1 : 0;

    // 更新记录
    await db.query(
      `UPDATE machine_work_times SET machine_cd=?, work_date=?, start_time=?, end_time=?, is_overtime=?, remark=? WHERE id=?`,
      [machine_cd, work_date, start_time, end_time, is_overtime, d.remark || "", id],
    );

    res.json({ success: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.json({ success: false, message: "この時間帯は既に存在します。" });
    }
    res.status(500).json({ success: false, message: e.message });
  }
});

// 删除班次
router.delete("/:id", async (req, res) => {
  await db.query(`DELETE FROM machine_work_times WHERE id=?`, [req.params.id]);
  res.json({ success: true });
});

// 批量复制（复制指定日范围的班次到目标日范围/设备）
router.post("/copy", async (req, res) => {
  try {
    const { from_machine_cd, from_start, from_end, to_machine_cd, to_start, to_end } = req.body;

    // 源数据
    const [rows] = await db.query(
      `SELECT * FROM machine_work_times WHERE machine_cd=? AND work_date BETWEEN ? AND ? ORDER BY work_date, start_time`,
      [from_machine_cd, from_start, from_end],
    );
    const fromDays = dayjs(from_end).diff(dayjs(from_start), "day") + 1;
    const toDays = dayjs(to_end).diff(dayjs(to_start), "day") + 1;

    if (fromDays === 1 && toDays > 1) {
      // 复制一天到多天
      for (let i = 0; i < toDays; i++) {
        const targetDate = dayjs(to_start).add(i, "day").format("YYYY-MM-DD");
        for (const row of rows) {
          await db.query(
            `INSERT IGNORE INTO machine_work_times (machine_cd, work_date, start_time, end_time, is_overtime, remark)
               VALUES (?, ?, ?, ?, ?, ?)`,
            [to_machine_cd, targetDate, row.start_time, row.end_time, row.is_overtime, row.remark],
          );
        }
      }
      return res.json({ success: true });
    } else if (fromDays === toDays) {
      // 一一对应
      for (let i = 0; i < fromDays; i++) {
        const sourceDate = dayjs(from_start).add(i, "day").format("YYYY-MM-DD");
        const targetDate = dayjs(to_start).add(i, "day").format("YYYY-MM-DD");
        for (const row of rows.filter((r) => r.work_date === sourceDate)) {
          await db.query(
            `INSERT IGNORE INTO machine_work_times (machine_cd, work_date, start_time, end_time, is_overtime, remark)
               VALUES (?, ?, ?, ?, ?, ?)`,
            [to_machine_cd, targetDate, row.start_time, row.end_time, row.is_overtime, row.remark],
          );
        }
      }
      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "区間日数不一致" });
    }
  } catch (e) {
    console.error("異常:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 获取所有工程类型（去重）
router.get("/machine-types", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT machine_type FROM machines WHERE machine_type IS NOT NULL AND machine_type != ''",
    );
    const types = rows.map((r) => r.machine_type);
    res.json(types);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 获取所有设备列表
router.get("/machines", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM machines ORDER BY machine_type, machine_name");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
