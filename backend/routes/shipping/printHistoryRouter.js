import express from "express";
import { query } from "../../db/connection.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// 获取打印履历列表
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      report_type = "",
      user_name = "",
      date_from = "",
      date_to = "",
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];

    // 报告类型筛选
    if (report_type) {
      whereClause += " AND report_type = ?";
      params.push(report_type);
    }

    // 用户名筛选
    if (user_name) {
      whereClause += " AND user_name LIKE ?";
      params.push(`%${user_name}%`);
    }

    // 日期范围筛选
    if (date_from) {
      whereClause += " AND DATE(print_date) >= ?";
      params.push(date_from);
    }

    if (date_to) {
      whereClause += " AND DATE(print_date) <= ?";
      params.push(date_to);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM print_history ${whereClause}`;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // 获取分页数据
    const dataSql = `
      SELECT
        id,
        report_type,
        report_title,
        user_id,
        user_name,
        print_date,
        filters,
        record_count,
        status,
        error_message,
        created_at
      FROM print_history
      ${whereClause}
      ORDER BY print_date DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const data = await query(dataSql, params);

    res.json({
      success: true,
      data: {
        list: data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取打印履历失败:", error);
    res.status(500).json({
      success: false,
      message: "获取打印履历失败",
      error: error.message,
    });
  }
});

// 记录打印履历
router.post("/history", authenticateToken, async (req, res) => {
  try {
    const {
      report_type,
      report_title,
      filters,
      record_count,
      status = "成功",
      error_message = null,
    } = req.body;

    const user = req.user;

    const sql = `
      INSERT INTO print_history (
        report_type,
        report_title,
        user_id,
        user_name,
        filters,
        record_count,
        status,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      report_type,
      report_title,
      user?.id || null,
      user?.name || user?.username || "未知用户",
      JSON.stringify(filters),
      record_count,
      status,
      error_message,
    ]);

    res.json({
      success: true,
      message: "打印履历记录成功",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("记录打印履历失败:", error);
    res.status(500).json({
      success: false,
      message: "记录打印履历失败",
      error: error.message,
    });
  }
});

// 删除打印履历
router.delete("/history/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const sql = "DELETE FROM print_history WHERE id = ?";
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "打印履历不存在",
      });
    }

    res.json({
      success: true,
      message: "打印履历删除成功",
    });
  } catch (error) {
    console.error("删除打印履历失败:", error);
    res.status(500).json({
      success: false,
      message: "删除打印履历失败",
      error: error.message,
    });
  }
});

// 批量删除打印履历
router.delete("/history/batch/:ids", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.params;
    const idArray = ids
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "无效的ID列表",
      });
    }

    const placeholders = idArray.map(() => "?").join(",");
    const sql = `DELETE FROM print_history WHERE id IN (${placeholders})`;
    const result = await query(sql, idArray);

    res.json({
      success: true,
      message: `成功删除${result.affectedRows}条打印履历`,
      data: {
        deletedCount: result.affectedRows,
      },
    });
  } catch (error) {
    console.error("批量删除打印履历失败:", error);
    res.status(500).json({
      success: false,
      message: "批量删除打印履历失败",
      error: error.message,
    });
  }
});

// 获取打印履历统计信息
router.get("/history/stats", authenticateToken, async (req, res) => {
  try {
    const { date_from = "", date_to = "" } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (date_from) {
      whereClause += " AND DATE(print_date) >= ?";
      params.push(date_from);
    }

    if (date_to) {
      whereClause += " AND DATE(print_date) <= ?";
      params.push(date_to);
    }

    // 总打印次数
    const totalSql = `SELECT COUNT(*) as total FROM print_history ${whereClause}`;
    const [totalResult] = await query(totalSql, params);

    // 按报告类型统计
    const typeSql = `
      SELECT
        report_type,
        COUNT(*) as count
      FROM print_history
      ${whereClause}
      GROUP BY report_type
      ORDER BY count DESC
    `;
    const typeStats = await query(typeSql, params);

    // 按用户统计
    const userSql = `
      SELECT
        user_name,
        COUNT(*) as count
      FROM print_history
      ${whereClause}
      GROUP BY user_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const userStats = await query(userSql, params);

    // 按状态统计
    const statusSql = `
      SELECT
        status,
        COUNT(*) as count
      FROM print_history
      ${whereClause}
      GROUP BY status
    `;
    const statusStats = await query(statusSql, params);

    res.json({
      success: true,
      data: {
        total: totalResult.total,
        byType: typeStats,
        byUser: userStats,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    console.error("获取打印履历统计失败:", error);
    res.status(500).json({
      success: false,
      message: "获取打印履历统计失败",
      error: error.message,
    });
  }
});

export default router;
