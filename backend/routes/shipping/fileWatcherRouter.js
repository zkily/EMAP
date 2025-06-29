import express from "express";
import {
  startFileWatcher,
  stopFileWatcher,
  getWatcherStatus,
  manualProcessFile,
} from "./services/fileWatcherService.js";
import { query } from "../../db/connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * 启动文件监视器
 * POST /api/shipping/file-watcher/start
 */
router.post("/start", async (req, res) => {
  try {
    const result = startFileWatcher();
    const status = await getWatcherStatus();

    if (result) {
      res.json({
        success: true,
        data: {
          message: "ファイル監視器が正常に開始されました",
          status,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "ファイル監視器の開始に失敗しました",
        data: {
          status,
        },
      });
    }
  } catch (error) {
    console.error("启动文件监视器错误:", error);
    res.status(500).json({
      success: false,
      message: "ファイル監視器の開始中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 停止文件监视器
 * POST /api/shipping/file-watcher/stop
 */
router.post("/stop", async (req, res) => {
  try {
    stopFileWatcher();
    const status = await getWatcherStatus();

    res.json({
      success: true,
      data: {
        message: "ファイル監視器が正常に停止されました",
        status,
      },
    });
  } catch (error) {
    console.error("停止文件监视器错误:", error);
    res.status(500).json({
      success: false,
      message: "ファイル監視器の停止中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 获取文件监视器状态
 * GET /api/shipping/file-watcher/status
 */
router.get("/status", async (req, res) => {
  try {
    const status = await getWatcherStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("获取监视器状态错误:", error);
    res.status(500).json({
      success: false,
      message: "監視器状態の取得中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 手动处理文件
 * POST /api/shipping/file-watcher/process
 */
router.post("/process", async (req, res) => {
  try {
    await manualProcessFile();
    const status = await getWatcherStatus();

    res.json({
      success: true,
      data: {
        message: "ファイル処理が正常に完了しました",
        status,
      },
    });
  } catch (error) {
    console.error("手动处理文件错误:", error);
    res.status(500).json({
      success: false,
      message: "ファイル処理の実行中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 获取shipping_log表数据
 * GET /api/shipping/file-watcher/logs
 */
router.get("/logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // 获取总数
    const countSql = "SELECT COUNT(*) as total FROM shipping_log";
    const [countResult] = await query(countSql);
    const total = countResult.total;

    // 获取数据
    const dataSql = `
      SELECT
        id,
        project,
        date,
        datetime,
        model_no,
        person_in_charge,
        picking_no,
        product_name,
        product_code,
        product_name_2,
        quantity,
        shipping_quantity,
        created_at,
        updated_at
      FROM shipping_log
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const logs = await query(dataSql);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("获取日志数据错误:", error);
    res.status(500).json({
      success: false,
      message: "ログデータの取得中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 根据条件查询shipping_log数据
 * GET /api/shipping/file-watcher/logs/search
 */
router.get("/logs/search", async (req, res) => {
  try {
    const {
      picking_no,
      product_code,
      date_from,
      date_to,
      person_in_charge,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (picking_no) {
      whereConditions.push("picking_no LIKE ?");
      queryParams.push(`%${picking_no}%`);
    }

    if (product_code) {
      whereConditions.push("product_code LIKE ?");
      queryParams.push(`%${product_code}%`);
    }

    if (date_from) {
      whereConditions.push("date >= ?");
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push("date <= ?");
      queryParams.push(date_to);
    }

    if (person_in_charge) {
      whereConditions.push("person_in_charge LIKE ?");
      queryParams.push(`%${person_in_charge}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM shipping_log ${whereClause}`;
    const [countResult] = await query(countSql, queryParams);
    const total = countResult.total;

    // 获取数据
    const dataSql = `
      SELECT
        id,
        project,
        date,
        datetime,
        model_no,
        person_in_charge,
        picking_no,
        product_name,
        product_code,
        product_name_2,
        quantity,
        shipping_quantity,
        created_at,
        updated_at
      FROM shipping_log
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const searchParams = [...queryParams, parseInt(limit), offset];
    const logs = await query(dataSql, searchParams);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        searchParams: {
          picking_no,
          product_code,
          date_from,
          date_to,
          person_in_charge,
        },
      },
    });
  } catch (error) {
    console.error("搜索日志数据错误:", error);
    res.status(500).json({
      success: false,
      message: "ログデータの検索中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 删除指定日期之前的日志数据
 * DELETE /api/shipping/file-watcher/logs/cleanup
 */
router.delete("/logs/cleanup", async (req, res) => {
  try {
    const { before_date } = req.body;

    if (!before_date) {
      return res.status(400).json({
        success: false,
        message: "クリアする期限日を指定してください",
      });
    }

    const sql = "DELETE FROM shipping_log WHERE date < ?";
    const result = await query(sql, [before_date]);

    res.json({
      success: true,
      data: {
        message: `${result.affectedRows} 件のレコードを正常にクリアしました`,
        affectedRows: result.affectedRows,
      },
    });
  } catch (error) {
    console.error("清理日志数据错误:", error);
    res.status(500).json({
      success: false,
      message: "ログデータのクリア中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 手动去重数据库中的重复记录
 * POST /api/shipping/file-watcher/deduplicate
 */
router.post("/deduplicate", async (req, res) => {
  try {
    console.log("开始手动去重操作...");

    // 查找重复记录（保留最新的，删除旧的）
    const findDuplicatesSql = `
      SELECT
        picking_no, product_code, date,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY id DESC) as ids
      FROM shipping_log
      WHERE picking_no IS NOT NULL
        AND picking_no != ''
        AND product_code IS NOT NULL
        AND product_code != ''
        AND date IS NOT NULL
      GROUP BY picking_no, product_code, date
      HAVING count > 1
    `;

    const duplicates = await query(findDuplicatesSql);

    if (duplicates.length === 0) {
      return res.json({
        success: true,
        data: {
          message: "重複レコードは見つかりませんでした",
          duplicateGroups: 0,
          deletedRecords: 0,
        },
      });
    }

    let totalDeleted = 0;

    // 对每组重复记录，删除除最新记录外的所有记录
    for (const duplicate of duplicates) {
      const ids = duplicate.ids.split(",");
      const idsToDelete = ids.slice(1); // 保留第一个（最新的），删除其他的

      if (idsToDelete.length > 0) {
        const deleteSql = `DELETE FROM shipping_log WHERE id IN (${idsToDelete.map(() => "?").join(",")})`;
        const deleteResult = await query(deleteSql, idsToDelete);
        totalDeleted += deleteResult.affectedRows;

        console.log(
          `删除重复记录: ${duplicate.picking_no}_${duplicate.product_code}_${duplicate.date}, 删除了 ${deleteResult.affectedRows} 条`,
        );
      }
    }

    res.json({
      success: true,
      data: {
        message: `重複データの削除が完了しました。${totalDeleted} 件の重複レコードを削除しました`,
        duplicateGroups: duplicates.length,
        deletedRecords: totalDeleted,
      },
    });
  } catch (error) {
    console.error("手动去重错误:", error);
    res.status(500).json({
      success: false,
      message: "重複データの削除中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 获取重复记录统计
 * GET /api/shipping/file-watcher/duplicates/stats
 */
router.get("/duplicates/stats", async (req, res) => {
  try {
    // 查找重复记录统计
    const statsSql = `
      SELECT
        picking_no, product_code, date,
        COUNT(*) as count,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
      FROM shipping_log
      WHERE picking_no IS NOT NULL
        AND picking_no != ''
        AND product_code IS NOT NULL
        AND product_code != ''
        AND date IS NOT NULL
      GROUP BY picking_no, product_code, date
      HAVING count > 1
      ORDER BY count DESC, last_created DESC
      LIMIT 50
    `;

    const duplicateStats = await query(statsSql);

    // 总体统计
    const totalRecordsSql = "SELECT COUNT(*) as total FROM shipping_log";
    const [totalResult] = await query(totalRecordsSql);

    const totalDuplicatesSql = `
      SELECT SUM(duplicate_count - 1) as total_duplicates
      FROM (
        SELECT COUNT(*) as duplicate_count
        FROM shipping_log
        WHERE picking_no IS NOT NULL
          AND picking_no != ''
          AND product_code IS NOT NULL
          AND product_code != ''
          AND date IS NOT NULL
        GROUP BY picking_no, product_code, date
        HAVING duplicate_count > 1
      ) as dup_stats
    `;

    const [duplicateCountResult] = await query(totalDuplicatesSql);

    res.json({
      success: true,
      data: {
        totalRecords: totalResult.total,
        duplicateGroups: duplicateStats.length,
        totalDuplicateRecords: duplicateCountResult.total_duplicates || 0,
        duplicateDetails: duplicateStats,
      },
    });
  } catch (error) {
    console.error("获取重复记录统计错误:", error);
    res.status(500).json({
      success: false,
      message: "重複レコード統計の取得中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 同步shipping_log数据到picking_tasks表
 * POST /api/shipping/file-watcher/sync-to-picking
 */
router.post("/sync-to-picking", async (req, res) => {
  try {
    console.log("开始数据同步...");

    // 首先检查picking_tasks表是否存在
    const checkTableSql = `
      SELECT COUNT(*) as table_exists
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'picking_tasks'
    `;

    const [tableCheck] = await query(checkTableSql);

    if (tableCheck.table_exists === 0) {
      return res.status(400).json({
        success: false,
        message: "picking_tasksテーブルが存在しません。先にテーブルを作成してください。",
      });
    }

    // 检查两个表的基本数据
    const shippingLogCountSql =
      "SELECT COUNT(*) as count FROM shipping_log WHERE picking_no IS NOT NULL AND picking_no != ''";
    const pickingTasksCountSql = "SELECT COUNT(*) as count FROM picking_tasks";

    const [shippingLogCount] = await query(shippingLogCountSql);
    const [pickingTasksCount] = await query(pickingTasksCountSql);

    console.log(`shipping_log有效记录数: ${shippingLogCount.count}`);
    console.log(`picking_tasks记录数: ${pickingTasksCount.count}`);

    // 如果picking_tasks表为空，先创建一些基本记录
    if (pickingTasksCount.count === 0 && shippingLogCount.count > 0) {
      console.log("创建基本picking_tasks记录...");

      const createBasicTasksSql = `
        INSERT INTO picking_tasks (
          picking_id, shipping_no_p, shipping_no, product_cd, product_name,
          confirmed_boxes, picked_quantity, location_cd, shelf_position,
          priority, status, picker_id, pallet_sequence, created_by, created_at
        )
        SELECT
          CONCAT('PK', LPAD((ROW_NUMBER() OVER (ORDER BY picking_no)), 6, '0')) as picking_id,
          picking_no as shipping_no_p,
          picking_no as shipping_no,
          'PRODUCT001' as product_cd,
          'Sample Product' as product_name,
          1 as confirmed_boxes,
          0 as picked_quantity,
          'A01' as location_cd,
          '1-1' as shelf_position,
          2 as priority,
          'pending' as status,
          'system' as picker_id,
          1 as pallet_sequence,
          'sync_system' as created_by,
          NOW() as created_at
        FROM (
          SELECT DISTINCT picking_no
          FROM shipping_log
          WHERE picking_no IS NOT NULL AND picking_no != ''
          LIMIT 20
        ) sl
      `;

      const createResult = await query(createBasicTasksSql);
      console.log(`创建了 ${createResult.affectedRows} 条基本记录`);
    }

    // 执行同步更新
    const syncSql = `
       UPDATE picking_tasks pt
       INNER JOIN shipping_log sl ON pt.shipping_no_p = sl.picking_no
       SET
         pt.picker_id = sl.person_in_charge,
         pt.start_time = sl.datetime,
         pt.status = 'completed'
       WHERE pt.status = 'pending'
         AND sl.picking_no IS NOT NULL
         AND sl.person_in_charge IS NOT NULL
         AND sl.datetime IS NOT NULL
     `;

    const syncResult = await query(syncSql);
    console.log(`同步更新了 ${syncResult.affectedRows} 条记录`);

    // 获取最终统计
    const finalStats = await query(`
       SELECT
         COUNT(*) as total_tasks,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
       FROM picking_tasks
     `);

    const [stats] = finalStats;

    res.json({
      success: true,
      data: {
        message: `データ同期が完了しました。${syncResult.affectedRows} 件のピッキングタスクを更新しました`,
        syncedRecords: syncResult.affectedRows,
        statistics: {
          totalSyncedTasks: stats.completed_tasks || 0,
          totalShippingLogs: shippingLogCount.count || 0,
          totalPickers: 1,
        },
      },
    });
  } catch (error) {
    console.error("同步数据到picking_tasks错误:", error);
    res.status(500).json({
      success: false,
      message: "データ同期中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 同步shipping_log数据到picking_tasks表（简化版）
 * POST /api/shipping/file-watcher/sync-to-picking-simple
 */
router.post("/sync-to-picking-simple", async (req, res) => {
  try {
    console.log("开始简化版数据同步...");

    // 首先检查picking_tasks表是否存在
    const checkTableSql = `
      SELECT COUNT(*) as table_exists
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'picking_tasks'
    `;

    const [tableCheck] = await query(checkTableSql);

    if (tableCheck.table_exists === 0) {
      return res.status(400).json({
        success: false,
        message: "picking_tasksテーブルが存在しません。先にテーブルを作成してください。",
      });
    }

    // 检查两个表的基本数据
    const shippingLogCountSql =
      "SELECT COUNT(*) as count FROM shipping_log WHERE picking_no IS NOT NULL AND picking_no != ''";
    const pickingTasksCountSql = "SELECT COUNT(*) as count FROM picking_tasks";

    const [shippingLogCount] = await query(shippingLogCountSql);
    const [pickingTasksCount] = await query(pickingTasksCountSql);

    console.log(`shipping_log有效记录数: ${shippingLogCount.count}`);
    console.log(`picking_tasks记录数: ${pickingTasksCount.count}`);

    // 如果picking_tasks表为空，先创建一些基本记录
    if (pickingTasksCount.count === 0 && shippingLogCount.count > 0) {
      console.log("创建基本picking_tasks记录...");

      const createBasicTasksSql = `
        INSERT INTO picking_tasks (
          picking_id, shipping_no_p, shipping_no, product_cd, product_name,
          confirmed_boxes, picked_quantity, location_cd, shelf_position,
          priority, status, picker_id, pallet_sequence, created_by, created_at
        )
        SELECT
          CONCAT('PK', LPAD((ROW_NUMBER() OVER (ORDER BY picking_no)), 6, '0')) as picking_id,
          picking_no as shipping_no_p,
          picking_no as shipping_no,
          'PRODUCT001' as product_cd,
          'Sample Product' as product_name,
          1 as confirmed_boxes,
          0 as picked_quantity,
          'A01' as location_cd,
          '1-1' as shelf_position,
          2 as priority,
          'pending' as status,
          'system' as picker_id,
          1 as pallet_sequence,
          'sync_system' as created_by,
          NOW() as created_at
        FROM (
          SELECT DISTINCT picking_no
          FROM shipping_log
          WHERE picking_no IS NOT NULL AND picking_no != ''
          LIMIT 20
        ) sl
      `;

      const createResult = await query(createBasicTasksSql);
      console.log(`创建了 ${createResult.affectedRows} 条基本记录`);
    }

    // 执行简单的同步更新
    const simpleSyncSql = `
       UPDATE picking_tasks pt
       INNER JOIN shipping_log sl ON pt.shipping_no_p = sl.picking_no
       SET
         pt.picker_id = sl.person_in_charge,
         pt.start_time = sl.datetime,
         pt.status = 'completed'
       WHERE pt.status = 'pending'
         AND sl.picking_no IS NOT NULL
         AND sl.person_in_charge IS NOT NULL
         AND sl.datetime IS NOT NULL
     `;

    const syncResult = await query(simpleSyncSql);
    console.log(`同步更新了 ${syncResult.affectedRows} 条记录`);

    // 获取最终统计
    const finalStats = await query(`
       SELECT
         COUNT(*) as total_tasks,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
       FROM picking_tasks
     `);

    const [stats] = finalStats;

    res.json({
      success: true,
      data: {
        message: `簡易データ同期が完了しました。${syncResult.affectedRows} 件のタスクを更新しました`,
        syncedRecords: syncResult.affectedRows,
        totalTasks: stats.total_tasks,
        completedTasks: stats.completed_tasks,
        pendingTasks: stats.pending_tasks,
      },
    });
  } catch (error) {
    console.error("简化同步错误:", error);
    res.status(500).json({
      success: false,
      message: "データ同期中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 获取同步状态和统计信息
 * GET /api/shipping/file-watcher/sync-status
 */
router.get("/sync-status", async (req, res) => {
  try {
    // 首先检查picking_tasks表是否存在
    const checkTableSql = `
      SELECT COUNT(*) as table_exists
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'picking_tasks'
    `;

    const [tableCheck] = await query(checkTableSql);

    if (tableCheck.table_exists === 0) {
      // 表不存在，返回默认值
      return res.json({
        success: true,
        data: {
          availableForSync: 0,
          alreadySynced: 0,
          totalPickingTasks: 0,
          totalShippingLogs: 0,
          lastSyncTime: null,
          syncRate: 0,
          tableExists: false,
        },
      });
    }

    // 获取总的shipping_log数量
    const totalLogsSql = "SELECT COUNT(*) as total_logs FROM shipping_log";
    const [logsResult] = await query(totalLogsSql);

    // 获取总的picking_tasks数量
    const totalTasksSql = "SELECT COUNT(*) as total_tasks FROM picking_tasks";
    const [totalResult] = await query(totalTasksSql);

    // 如果picking_tasks表为空，返回基本信息
    if (totalResult.total_tasks === 0) {
      return res.json({
        success: true,
        data: {
          availableForSync: 0,
          alreadySynced: 0,
          totalPickingTasks: 0,
          totalShippingLogs: logsResult.total_logs || 0,
          lastSyncTime: null,
          syncRate: 0,
          tableExists: true,
        },
      });
    }

    // 获取可同步的记录数
    const availableForSyncSql = `
      SELECT COUNT(*) as available_count
      FROM picking_tasks pt
      INNER JOIN shipping_log sl ON pt.shipping_no_p = sl.picking_no
      WHERE pt.status != 'completed'
        AND sl.picking_no IS NOT NULL
        AND sl.picking_no != ''
        AND sl.person_in_charge IS NOT NULL
        AND sl.person_in_charge != ''
        AND sl.datetime IS NOT NULL
    `;

    const [availableResult] = await query(availableForSyncSql);

    // 获取已同步的记录数
    const syncedSql = `
      SELECT COUNT(*) as synced_count
      FROM picking_tasks pt
      WHERE pt.status = 'completed'
    `;

    const [syncedResult] = await query(syncedSql);

    // 获取最后同步时间 - 使用created_at作为替代
    const lastSyncSql = `
      SELECT MAX(created_at) as last_sync_time
      FROM picking_tasks
      WHERE status = 'completed'
    `;

    const [lastSyncResult] = await query(lastSyncSql);

    res.json({
      success: true,
      data: {
        availableForSync: availableResult.available_count || 0,
        alreadySynced: syncedResult.synced_count || 0,
        totalPickingTasks: totalResult.total_tasks || 0,
        totalShippingLogs: logsResult.total_logs || 0,
        lastSyncTime: lastSyncResult.last_sync_time || null,
        syncRate:
          totalResult.total_tasks > 0
            ? Math.round((syncedResult.synced_count / totalResult.total_tasks) * 100)
            : 0,
        tableExists: true,
      },
    });
  } catch (error) {
    console.error("获取同步状态错误:", error);
    res.status(500).json({
      success: false,
      message: "同期状態の取得中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 检查同步数据匹配情况
 * GET /api/shipping/file-watcher/sync-debug
 */
router.get("/sync-debug", async (req, res) => {
  try {
    // 检查shipping_log数据
    const shippingLogSql = `
      SELECT
        id, picking_no, person_in_charge, datetime,
        product_code, product_name, quantity
      FROM shipping_log
      WHERE picking_no IS NOT NULL AND picking_no != ''
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const shippingLogData = await query(shippingLogSql);

    // 检查picking_tasks数据
    const pickingTasksSql = `
      SELECT
        picking_id, shipping_no_p, picker_id, status,
        product_cd, product_name, confirmed_boxes
      FROM picking_tasks
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const pickingTasksData = await query(pickingTasksSql);

    // 检查匹配关系
    const matchingSql = `
      SELECT
        sl.picking_no as shipping_log_picking_no,
        sl.person_in_charge,
        sl.datetime,
        pt.shipping_no_p as picking_tasks_shipping_no_p,
        pt.picker_id,
        pt.status,
        CASE
          WHEN pt.picking_id IS NOT NULL THEN 'MATCHED'
          ELSE 'NOT_MATCHED'
        END as match_status
      FROM shipping_log sl
      LEFT JOIN picking_tasks pt ON pt.shipping_no_p = sl.picking_no
      WHERE sl.picking_no IS NOT NULL AND sl.picking_no != ''
      ORDER BY sl.created_at DESC
      LIMIT 20
    `;

    const matchingData = await query(matchingSql);

    res.json({
      success: true,
      data: {
        shippingLogData,
        pickingTasksData,
        matchingData,
        summary: {
          shippingLogCount: shippingLogData.length,
          pickingTasksCount: pickingTasksData.length,
          matchedCount: matchingData.filter((item) => item.match_status === "MATCHED").length,
          unmatchedCount: matchingData.filter((item) => item.match_status === "NOT_MATCHED").length,
        },
      },
    });
  } catch (error) {
    console.error("检查同步数据错误:", error);
    res.status(500).json({
      success: false,
      message: "同期データの確認中にエラーが発生しました",
      error: error.message,
    });
  }
});

/**
 * 创建picking_tasks表
 * POST /api/shipping/file-watcher/create-picking-table
 */
router.post("/create-picking-table", async (req, res) => {
  try {
    console.log("开始创建picking_tasks表...");

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, "../../db/create_picking_tasks_table.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    // 分割并执行每个SQL语句
    const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement.trim());
      }
    }

    console.log("picking_tasks表创建完成");

    res.json({
      success: true,
      data: {
        message: "picking_tasksテーブルが正常に作成されました",
      },
    });
  } catch (error) {
    console.error("创建picking_tasks表错误:", error);
    res.status(500).json({
      success: false,
      message: "picking_tasksテーブルの作成中にエラーが発生しました",
      error: error.message,
    });
  }
});

export default router;
