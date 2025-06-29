import express from "express";
import pickingService from "./services/pickingService.js";
import { authenticateToken } from "../../middleware/auth.js";
import { initPickingTables, checkPickingTablesHealth } from "../../db/initPickingTables.js";

const router = express.Router();

// 应用认证中间件
// router.use(authenticateToken); // 临时注释用于测试

// ========== データ同期 ==========

/**
 * 从shipping_items同步数据到picking_tasks
 * POST /api/shipping/picking/sync-data
 */
router.post("/sync-data", async (req, res) => {
  try {
    const result = await pickingService.syncShippingDataToPickingTasks();

    res.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    console.error("データ同期失败:", error);
    res.status(500).json({
      success: false,
      message: "データ同期に失敗しました",
      error: error.message,
    });
  }
});

// 强制数据同步 - 清空picking_tasks后重新同步
router.post("/force-sync-data", async (req, res) => {
  try {
    const result = await pickingService.forceSyncShippingDataToPickingTasks();
    res.json(result);
  } catch (error) {
    console.error("強制データ同期失败:", error);
    res.status(500).json({
      success: false,
      message: "強制データ同期に失敗しました",
      error: error.message,
    });
  }
});

// ========== ピッキングリスト生成 ==========

/**
 * 获取可用于ピッキング的出荷数据
 * GET /api/shipping/picking/items/for-picking
 */
router.get("/items/for-picking", async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      destination_cd,
      status,
      picking_status = "not_generated",
    } = req.query;

    const result = await pickingService.getShippingItemsForPicking({
      start_date,
      end_date,
      destination_cd,
      status,
      picking_status,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取ピッキング用出荷数据失败:", error);
    res.status(500).json({
      success: false,
      message: "データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取picking_tasks数据用于页面显示
 * GET /api/shipping/picking/tasks/for-display
 */
router.get("/tasks/for-display", async (req, res) => {
  try {
    const { start_date, end_date, destination_cd, status } = req.query;

    const result = await pickingService.getPickingTasksForDisplay({
      start_date,
      end_date,
      destination_cd,
      status,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取ピッキング任务数据失败:", error);
    res.status(500).json({
      success: false,
      message: "ピッキング任务データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 生成ピッキングリスト
 * POST /api/shipping/picking/generate
 */
router.post("/generate", async (req, res) => {
  try {
    const { shipping_nos, picker_id, priority = 2, optimization = "distance", remarks } = req.body;

    if (!shipping_nos || shipping_nos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "托盤を選択してください",
      });
    }

    if (!picker_id) {
      return res.status(400).json({
        success: false,
        message: "担当者を選択してください",
      });
    }

    const result = await pickingService.generatePickingTasks({
      shipping_nos,
      picker_id,
      priority,
      optimization,
      remarks,
      created_by: req.user?.user_id || "system",
    });

    res.json({
      success: true,
      data: result,
      message: `${result.taskCount}件のピッキング作業を生成しました`,
    });
  } catch (error) {
    console.error("ピッキングリスト生成失败:", error);
    res.status(500).json({
      success: false,
      message: "ピッキングリスト生成に失敗しました",
      error: error.message,
    });
  }
});

// ========== ピッキング作業管理 ==========

/**
 * 获取ピッキング任务列表
 * GET /api/shipping/picking/tasks
 */
router.get("/tasks", async (req, res) => {
  try {
    const { picker_id, status = "active", shipping_no, priority } = req.query;

    const result = await pickingService.getPickingTasks({
      picker_id,
      status,
      shipping_no,
      priority,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("ピッキング作業取得失败:", error);
    res.status(500).json({
      success: false,
      message: "ピッキング作業の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取托盘进度信息
 * GET /api/shipping/picking/pallet-progress
 */
router.get("/pallet-progress", async (req, res) => {
  try {
    const { picker_id } = req.query;

    const result = await pickingService.getPalletProgress({ picker_id });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("托盤進捗取得失败:", error);
    res.status(500).json({
      success: false,
      message: "托盤進捗の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 开始ピッキング任务
 * PUT /api/shipping/picking/tasks/:picking_id/start
 */
router.put("/tasks/:picking_id/start", async (req, res) => {
  try {
    const { picking_id } = req.params;

    const result = await pickingService.startPickingTask({
      picking_id,
      started_by: req.user?.user_id || "system",
    });

    res.json({
      success: true,
      data: result,
      message: "ピッキング作業を開始しました",
    });
  } catch (error) {
    console.error("ピッキング作業開始失败:", error);
    res.status(500).json({
      success: false,
      message: "ピッキング作業開始に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 完成ピッキング任务
 * PUT /api/shipping/picking/tasks/:picking_id/complete
 */
router.put("/tasks/:picking_id/complete", async (req, res) => {
  try {
    const { picking_id } = req.params;
    const { picked_quantity, remarks } = req.body;

    const result = await pickingService.completePickingTask({
      picking_id,
      picked_quantity,
      remarks,
      completed_by: req.user?.user_id || "system",
    });

    res.json({
      success: true,
      data: result,
      message: "ピッキング作業を完了しました",
    });
  } catch (error) {
    console.error("ピッキング作業完了失败:", error);
    res.status(500).json({
      success: false,
      message: "ピッキング作業完了に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 报告库存不足
 * PUT /api/shipping/picking/tasks/:picking_id/shortage
 */
router.put("/tasks/:picking_id/shortage", async (req, res) => {
  try {
    const { picking_id } = req.params;
    const { shortage_reason, shortage_quantity, remarks } = req.body;

    const result = await pickingService.reportShortage({
      picking_id,
      shortage_quantity,
      remarks: shortage_reason || remarks,
    });

    res.json({
      success: true,
      data: result,
      message: "在庫不足を報告しました",
    });
  } catch (error) {
    console.error("在庫不足報告失败:", error);
    res.status(500).json({
      success: false,
      message: "在庫不足報告に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 更新ピッキング数量
 * PUT /api/shipping/picking/tasks/:picking_id/quantity
 */
router.put("/tasks/:picking_id/quantity", async (req, res) => {
  try {
    const { picking_id } = req.params;
    const { picked_quantity, remarks } = req.body;

    const result = await pickingService.updatePickingQuantity({
      picking_id,
      picked_quantity,
    });

    res.json({
      success: true,
      data: result,
      message: "数量を更新しました",
    });
  } catch (error) {
    console.error("数量更新失败:", error);
    res.status(500).json({
      success: false,
      message: "数量更新に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 扫码处理
 * POST /api/shipping/picking/scan
 */
router.post("/scan", async (req, res) => {
  try {
    const { barcode, picker_id, scan_code, scan_type = "product" } = req.body;
    const code = barcode || scan_code;

    if (!code || !picker_id) {
      return res.status(400).json({
        success: false,
        message: "バーコードと担当者IDが必要です",
      });
    }

    const result = await pickingService.processScan({
      scan_code: code,
      picker_id,
      scan_type,
    });

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    console.error("スキャン処理失败:", error);
    res.status(500).json({
      success: false,
      message: "スキャン処理でエラーが発生しました",
      error: error.message,
    });
  }
});

// ========== 進捗管理 ==========

/**
 * 获取托盘任务详情
 * GET /api/shipping/picking/pallets/:shipping_no/tasks
 */
router.get("/pallets/:shipping_no/tasks", async (req, res) => {
  try {
    const { shipping_no } = req.params;
    const { picker_id } = req.query;

    const result = await pickingService.getPalletTasks({
      shipping_no,
      picker_id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("托盤作業取得失败:", error);
    res.status(500).json({
      success: false,
      message: "托盤作業の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取托盘库存不足问题
 * GET /api/shipping/picking/pallets/:shipping_no/shortages
 */
router.get("/pallets/:shipping_no/shortages", async (req, res) => {
  try {
    const { shipping_no } = req.params;
    const { picker_id } = req.query;

    const result = await pickingService.getPalletShortages({
      shipping_no,
      picker_id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("托盤不足問題取得失败:", error);
    res.status(500).json({
      success: false,
      message: "托盤不足問題の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 解决库存不足问题
 * PUT /api/shipping/picking/tasks/:picking_id/resolve-shortage
 */
router.put("/tasks/:picking_id/resolve-shortage", async (req, res) => {
  try {
    const { picking_id } = req.params;
    const { resolution_type, picked_quantity, remarks } = req.body;

    const result = await pickingService.resolveShortage({
      picking_id,
      resolution_type,
      picked_quantity,
      remarks,
    });

    res.json({
      success: true,
      data: result,
      message: "問題を解決しました",
    });
  } catch (error) {
    console.error("問題解決失败:", error);
    res.status(500).json({
      success: false,
      message: "問題解決に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 完成托盘
 * PUT /api/shipping/picking/pallets/:shipping_no/complete
 */
router.put("/pallets/:shipping_no/complete", async (req, res) => {
  try {
    const { shipping_no } = req.params;
    const { picker_id, completion_notes } = req.body;

    const result = await pickingService.completePallet({
      shipping_no,
      picker_id,
      completion_notes,
    });

    res.json({
      success: true,
      data: result,
      message: "托盤を完了しました",
    });
  } catch (error) {
    console.error("托盤完了失败:", error);
    res.status(500).json({
      success: false,
      message: "托盤完了に失敗しました",
      error: error.message,
    });
  }
});

// ========== 图表数据端点 ==========

/**
 * 日別効率データ取得
 * GET /api/shipping/picking/daily-efficiency
 */
router.get("/daily-efficiency", async (req, res) => {
  try {
    console.log("📈 日別効率データ取得API呼び出し:", req.query);

    const params = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      picker_id: req.query.picker_id,
    };

    const data = await pickingService.getDailyEfficiencyData(params);

    console.log("📈 日別効率データ取得成功:", data?.length || 0, "件");

    res.json({
      success: true,
      data: data || [],
      message: `${data?.length || 0}件の日別効率データを取得しました`,
    });
  } catch (error) {
    console.error("📈 日別効率データ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "日別効率データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 月別効率データ取得
 * GET /api/shipping/picking/monthly-efficiency
 */
router.get("/monthly-efficiency", async (req, res) => {
  try {
    console.log("📊 月別効率データ取得API呼び出し:", req.query);

    const params = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      picker_id: req.query.picker_id,
    };

    const data = await pickingService.getMonthlyEfficiencyData(params);

    console.log("📊 月別効率データ取得成功:", data?.length || 0, "件");

    res.json({
      success: true,
      data: data || [],
      message: `${data?.length || 0}件の月別効率データを取得しました`,
    });
  } catch (error) {
    console.error("📊 月別効率データ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "月別効率データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 未ピッキングタスク取得
 * GET /api/shipping/picking/pending-tasks
 */
router.get("/pending-tasks", async (req, res) => {
  try {
    console.log("⏳ 未ピッキングタスク取得API呼び出し:", req.query);

    const params = {
      picker_id: req.query.picker_id,
    };

    // 未ピッキングタスクを取得（ステータスがpendingまたはpickingのもの）
    const tasks = await pickingService.getPickingTasks({
      ...params,
      status: "active", // pendingとpickingの両方を取得
    });

    console.log("⏳ 未ピッキングタスク取得成功:", tasks?.length || 0, "件");

    res.json({
      success: true,
      data: tasks || [],
      message: `${tasks?.length || 0}件の未ピッキングタスクを取得しました`,
    });
  } catch (error) {
    console.error("⏳ 未ピッキングタスク取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "未ピッキングタスクの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * ピッキング済タスク取得
 * GET /api/shipping/picking/completed-tasks
 */
router.get("/completed-tasks", async (req, res) => {
  try {
    console.log("✅ ピッキング済タスク取得API呼び出し:", req.query);

    const params = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      picker_id: req.query.picker_id,
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    };

    // ピッキング済タスクを取得（ステータスがcompletedのもの）
    const tasks = await pickingService.getPickingTasks({
      ...params,
      status: "completed",
    });

    // 日時でソートして返却
    const sortedTasks = (tasks || []).sort((a, b) => {
      const dateA = new Date(a.complete_time || a.created_at);
      const dateB = new Date(b.complete_time || b.created_at);
      return dateB - dateA; // 降順（新しい順）
    });

    console.log("✅ ピッキング済タスク取得成功:", sortedTasks?.length || 0, "件");

    res.json({
      success: true,
      data: sortedTasks || [],
      message: `${sortedTasks?.length || 0}件のピッキング済タスクを取得しました`,
    });
  } catch (error) {
    console.error("✅ ピッキング済タスク取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "ピッキング済タスクの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 担当者選択肢取得
 * GET /api/shipping/picking/pickers
 */
router.get("/pickers", async (req, res) => {
  try {
    console.log("👥 担当者選択肢取得API呼び出し");

    // picking_tasksテーブルから担当者リストを取得
    const { query: dbQuery } = await import("../../db/index.js");

    const query = `
      SELECT
        pt.picker_id as id,
        COALESCE(u.name, pt.picker_id) as name,
        COUNT(*) as task_count
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE pt.picker_id IS NOT NULL AND pt.picker_id != ''
      GROUP BY pt.picker_id, u.name
      ORDER BY task_count DESC, pt.picker_id
    `;

    const pickers = await dbQuery(query);

    console.log("👥 担当者選択肢取得成功:", pickers?.length || 0, "人");

    res.json({
      success: true,
      data: pickers || [],
      message: `${pickers?.length || 0}人の担当者を取得しました`,
    });
  } catch (error) {
    console.error("👥 担当者選択肢取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "担当者選択肢の取得に失敗しました",
      error: error.message,
    });
  }
});

// ========== 进度和统计 ==========

/**
 * 获取进度数据
 * GET /api/shipping/picking/progress
 */
router.get("/progress", async (req, res) => {
  try {
    const { picker_id, date } = req.query;

    const result = await pickingService.getProgressData({
      picker_id,
      date,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("進捗データ取得失败:", error);
    res.status(500).json({
      success: false,
      message: "進捗データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取新设计的进度数据
 * GET /api/shipping/picking/new-progress
 */
router.get("/new-progress", async (req, res) => {
  try {
    const result = await pickingService.getNewProgressData({});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("新進捗データ取得失败:", error);
    res.status(500).json({
      success: false,
      message: "進捗データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取简单统计数据
 * GET /api/shipping/picking/simple-stats
 */
router.get("/simple-stats", async (req, res) => {
  try {
    const { picker_id } = req.query;

    const result = await pickingService.getTodayStats({ picker_id });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("簡単統計取得失败:", error);
    res.status(500).json({
      success: false,
      message: "簡単統計の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取今日统计
 * GET /api/shipping/picking/stats/today
 */
router.get("/stats/today", async (req, res) => {
  try {
    const { picker_id } = req.query;

    const result = await pickingService.getTodayStats({ picker_id });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("今日統計取得失败:", error);
    res.status(500).json({
      success: false,
      message: "今日統計の取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取历史数据
 * GET /api/shipping/picking/history
 */
router.get("/history", async (req, res) => {
  try {
    const { start_date, end_date, picker_id, status, page = 1, limit = 100 } = req.query;

    const result = await pickingService.getPickingHistory({
      start_date,
      end_date,
      picker_id,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("履歴データ取得失败:", error);
    res.status(500).json({
      success: false,
      message: "履歴データの取得に失敗しました",
      error: error.message,
    });
  }
});

/**
 * 导出历史数据
 * GET /api/shipping/picking/history/export
 */
router.get("/history/export", async (req, res) => {
  try {
    const { start_date, end_date, picker_id, status } = req.query;

    const result = await pickingService.exportPickingHistory({
      start_date,
      end_date,
      picker_id,
      status,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=picking_history_${start_date}_${end_date}.xlsx`,
    );
    res.send(result);
  } catch (error) {
    console.error("履歴エクスポート失败:", error);
    res.status(500).json({
      success: false,
      message: "履歴エクスポートに失敗しました",
      error: error.message,
    });
  }
});

/**
 * 获取担当者按目的地分组的绩效数据
 * GET /api/shipping/picking/performance-by-destination
 */
router.get("/performance-by-destination", async (req, res) => {
  try {
    const { start_date, end_date, picker_ids } = req.query;

    const result = await pickingService.getPerformanceByDestination({
      start_date,
      end_date,
      picker_ids: picker_ids ? picker_ids.split(",") : [],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("绩效数据取得失败:", error);
    res.status(500).json({
      success: false,
      message: "绩效数据的取得に失敗しました",
      error: error.message,
    });
  }
});

// ========== 数据库管理 ==========

/**
 * 检查数据库表健康状态
 * GET /api/shipping/picking/db/health
 */
router.get("/db/health", async (req, res) => {
  try {
    const health = await checkPickingTablesHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error("数据库健康检查失败:", error);
    res.status(500).json({
      success: false,
      message: "データベース健康チェックに失敗しました",
      error: error.message,
    });
  }
});

/**
 * 初始化数据库表
 * POST /api/shipping/picking/db/init
 */
router.post("/db/init", async (req, res) => {
  try {
    const result = await initPickingTables();

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message:
          result.tablesCreated > 0
            ? `${result.tablesCreated}個のテーブルを作成しました`
            : "テーブルは既に存在します",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "データベース初期化に失敗しました",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("数据库初始化失败:", error);
    res.status(500).json({
      success: false,
      message: "データベース初期化に失敗しました",
      error: error.message,
    });
  }
});

export default router;
