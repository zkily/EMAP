import { db, query as dbQuery } from "../../../db/index.js";
// import ExcelJS from "exceljs"; // 暂时注释掉，避免依赖错误

class PickingService {
  /**
   * 从shipping_items表获取数据并保存到picking_tasks表
   */

  // 基于shipping_no_p生成拣货任务ID
  generatePickingId(shippingNoP) {
    // 验证输入参数
    if (!shippingNoP) {
      throw new Error("shipping_no_p不能为空");
    }

    // 格式: PK + shipping_no_p
    return `PK${shippingNoP}`;
  }

  async syncShippingDataToPickingTasks() {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Step 1: Update existing picking_tasks from shipping_log
      const [updateResult] = await connection.query(`
        UPDATE picking_tasks pt
        JOIN shipping_log sl ON pt.shipping_no_p = sl.picking_no
        SET
          pt.start_time = sl.datetime,
          pt.picker_id = sl.person_in_charge,
          pt.picked_quantity = sl.quantity,
          pt.picked_no = sl.picking_no,
          pt.status = 'completed'
        WHERE
          pt.status IS NULL OR pt.status != 'completed'
      `);
      const updatedCount = updateResult.affectedRows;
      if (updatedCount > 0) {
        console.log(`shipping_logからのデータ更新: ${updatedCount}件のタスクを更新しました`);
      }

      // Step 2: Insert new tasks from shipping_items
      // First, check total data in shipping_items for logging
      const [totalShipping] = await connection.query(`
        SELECT COUNT(*) as total FROM shipping_items
        WHERE shipping_no_p IS NOT NULL AND confirmed_boxes > 0
      `);
      console.log(`shipping_itemsテーブルの総データ数: ${totalShipping[0].total}`);

      // Check existing tasks in picking_tasks for logging
      const [existingTasks] = await connection.query(`
        SELECT COUNT(*) as total FROM picking_tasks
      `);
      console.log(`picking_tasksテーブルの既存データ数: ${existingTasks[0].total}`);

      // Get new data from shipping_items that does not exist in picking_tasks
      const [shippingData] = await connection.query(`
        SELECT DISTINCT
          si.shipping_no_p,
          si.shipping_no,
          si.product_cd,
          si.product_name,
          si.confirmed_boxes,
          si.shipping_date,
          si.delivery_date,
          si.destination_cd,
          si.destination_name
        FROM shipping_items si
        LEFT JOIN picking_tasks pt ON si.shipping_no_p = pt.shipping_no_p
        WHERE pt.shipping_no_p IS NULL
        AND si.shipping_no_p IS NOT NULL
        AND si.confirmed_boxes > 0
        ORDER BY si.shipping_no, si.product_cd
      `);

      console.log(`同期可能データ数: ${shippingData.length}`);

      if (shippingData.length === 0) {
        await connection.commit();
        const message =
          updatedCount > 0
            ? `${updatedCount}件の既存タスクを更新しました。`
            : `新しい同期データがありません。`;
        return {
          success: true,
          message,
          syncedCount: 0,
          updatedCount,
        };
      }

      console.log(`同期対象データ数: ${shippingData.length}件`);

      // Batch insert into picking_tasks table
      let syncedCount = 0;

      for (const item of shippingData) {
        const pickingId = this.generatePickingId(item.shipping_no_p);

        await connection.query(
          `
          INSERT INTO picking_tasks (
            picking_id,
            shipping_no_p,
            shipping_no,
            product_cd,
            product_name,
            confirmed_boxes,
            shipping_date,
            delivery_date,
            destination_cd,
            destination_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            pickingId,
            item.shipping_no_p,
            item.shipping_no,
            item.product_cd,
            item.product_name,
            item.confirmed_boxes || 0,
            item.shipping_date || new Date().toISOString().slice(0, 10),
            item.delivery_date || new Date().toISOString().slice(0, 10),
            item.destination_cd || "",
            item.destination_name || "",
          ],
        );

        syncedCount++;
      }

      await connection.commit();

      console.log(`データ同期完了: ${syncedCount}件作成、${updatedCount}件更新`);

      return {
        success: true,
        message: `同期完了。${syncedCount}件のタスクを新規作成し、${updatedCount}件を更新しました。`,
        syncedCount,
        updatedCount,
      };
    } catch (error) {
      await connection.rollback();
      console.error("データ同期エラー:", error);
      throw new Error(`データ同期エラー: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 强制从shipping_items表获取数据并保存到picking_tasks表（先清空）
   */
  async forceSyncShippingDataToPickingTasks() {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 清空picking_tasks表
      await connection.query("DELETE FROM picking_tasks");
      console.log("picking_tasksテーブルをクリアしました");

      // 获取shipping_items中的所有有效数据
      const [shippingData] = await connection.query(`
        SELECT DISTINCT
          si.shipping_no_p,
          si.shipping_no,
          si.product_cd,
          si.product_name,
          si.confirmed_boxes,
          si.shipping_date,
          si.delivery_date,
          si.destination_cd,
          si.destination_name
        FROM shipping_items si
        WHERE si.shipping_no_p IS NOT NULL
        AND si.confirmed_boxes > 0
        ORDER BY si.shipping_no, si.product_cd
      `);

      console.log(`強制同期対象データ数: ${shippingData.length}件`);

      if (shippingData.length === 0) {
        await connection.commit();
        return {
          success: true,
          message: "shipping_itemsテーブルに有効なデータがありません",
          syncedCount: 0,
        };
      }

      // 批量插入到picking_tasks表
      let syncedCount = 0;

      for (const item of shippingData) {
        const pickingId = this.generatePickingId();

        await connection.query(
          `
          INSERT INTO picking_tasks (
            picking_id,
            shipping_no_p,
            shipping_no,
            product_cd,
            product_name,
            confirmed_boxes,
            shipping_date,
            delivery_date,
            destination_cd,
            destination_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            pickingId,
            item.shipping_no_p,
            item.shipping_no,
            item.product_cd,
            item.product_name,
            item.confirmed_boxes || 0,
            item.shipping_date || new Date().toISOString().slice(0, 10),
            item.delivery_date || new Date().toISOString().slice(0, 10),
            item.destination_cd || "",
            item.destination_name || "",
          ],
        );

        syncedCount++;
      }

      await connection.commit();

      console.log(`強制データ同期完了: ${syncedCount}件のタスクを作成しました`);

      return {
        success: true,
        message: `${syncedCount}件のピッキングタスクを強制同期しました`,
        syncedCount,
      };
    } catch (error) {
      await connection.rollback();
      console.error("強制データ同期エラー:", error);
      throw new Error(`強制データ同期エラー: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 获取可用于ピッキング的出荷数据
   */
  async getShippingItemsForPicking(params) {
    const {
      start_date,
      end_date,
      destination_cd,
      status,
      picking_status = "not_generated",
    } = params;

    let query = `
      SELECT
        si.shipping_no_p,
        si.shipping_no,
        si.product_cd,
        si.product_name,
        si.confirmed_units,
        si.confirmed_boxes,
        si.box_type,
        si.destination_cd,
        si.destination_name,
        si.shipping_date,
        si.delivery_date,
        si.status,
        CASE
          WHEN pt.shipping_no_p IS NOT NULL THEN 'generated'
          ELSE 'not_generated'
        END as picking_status
      FROM shipping_items si
      LEFT JOIN picking_tasks pt ON si.shipping_no_p = pt.shipping_no_p
      WHERE 1=1
    `;

    const queryParams = [];

    if (start_date) {
      query += ` AND si.shipping_date >= ?`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND si.shipping_date <= ?`;
      queryParams.push(end_date);
    }

    if (destination_cd) {
      query += ` AND si.destination_cd = ?`;
      queryParams.push(destination_cd);
    }

    if (status) {
      query += ` AND si.status = ?`;
      queryParams.push(status);
    }

    // 只获取未生成ピッキング的数据
    if (picking_status === "not_generated") {
      query += ` AND pt.shipping_no_p IS NULL`;
    }

    query += ` ORDER BY si.shipping_date, si.shipping_no, si.product_cd`;

    const result = await dbQuery(query, queryParams);
    return result;
  }

  /**
   * 获取picking_tasks数据用于页面显示
   */
  async getPickingTasksForDisplay(params) {
    const { start_date, end_date, destination_cd, status } = params;

    let query = `
      SELECT
        pt.shipping_no_p,
        pt.shipping_no,
        pt.product_cd,
        pt.product_name,
        pt.confirmed_boxes as confirmed_units,
        pt.confirmed_boxes,
        '' as box_type,
        pt.destination_cd,
        pt.destination_name,
        pt.shipping_date,
        pt.delivery_date,
        pt.status,
        pt.picker_id,
        COALESCE(u.name, pt.picker_id) as picker_name
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE 1=1
    `;

    const queryParams = [];

    if (start_date) {
      query += ` AND pt.shipping_date >= ?`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND pt.shipping_date <= ?`;
      queryParams.push(end_date);
    }

    if (destination_cd) {
      query += ` AND pt.destination_cd = ?`;
      queryParams.push(destination_cd);
    }

    if (status) {
      if (status === "未ピッキング") {
        query += ` AND pt.status = 'pending'`;
      } else if (status === "ピッキング済") {
        query += ` AND pt.status = 'completed'`;
      } else {
        query += ` AND pt.status = ?`;
        queryParams.push(status);
      }
    }

    query += ` ORDER BY pt.shipping_no, pt.product_cd`;

    const result = await dbQuery(query, queryParams);
    return result;
  }

  /**
   * 生成ピッキング任务
   */
  async generatePickingTasks(params) {
    const { shipping_nos, picker_id, priority, optimization, remarks, created_by } = params;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 获取选中托盘的所有项目
      const placeholders = shipping_nos.map(() => "?").join(",");
      const [shippingItems] = await connection.query(
        `
        SELECT
          si.shipping_no_p,
          si.shipping_no,
          si.product_cd,
          si.product_name,
          si.confirmed_units as confirmed_boxes,
          si.confirmed_boxes,
          ps.location_cd,
          ps.shelf_position,
          ps.current_stock
        FROM shipping_items si
        LEFT JOIN product_stock ps ON si.product_cd = ps.product_cd
        WHERE si.shipping_no IN (${placeholders})
        AND NOT EXISTS (
          SELECT 1 FROM picking_tasks pt WHERE pt.shipping_no_p = si.shipping_no_p
        )
        ORDER BY ${this.getOptimizationOrder(optimization)}
      `,
        shipping_nos,
      );

      if (shippingItems.length === 0) {
        throw new Error("選択した托盤にピッキング可能な項目がありません");
      }

      // 生成ピッキング任务
      const pickingTasks = [];
      let sequenceCounter = 1;

      for (const item of shippingItems) {
        const pickingId = this.generatePickingId();

        const taskData = {
          picking_id: pickingId,
          shipping_no_p: item.shipping_no_p,
          shipping_no: item.shipping_no,
          product_cd: item.product_cd,
          product_name: item.product_name,
          confirmed_boxes: item.confirmed_boxes,
          picked_quantity: 0,
          location_cd: item.location_cd || "UNKNOWN",
          shelf_position: item.shelf_position || "",
          priority: priority,
          status: "pending",
          picker_id: picker_id,
          pallet_sequence: sequenceCounter++,
          created_by: created_by,
          created_at: new Date(),
          remarks: remarks,
        };

        pickingTasks.push(taskData);

        // 插入ピッキング任务
        await connection.query(
          `
          INSERT INTO picking_tasks (
            picking_id, shipping_no_p, shipping_no, product_cd, product_name,
            confirmed_boxes, picked_quantity, location_cd, shelf_position,
            priority, status, picker_id, pallet_sequence, created_by, created_at, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            taskData.picking_id,
            taskData.shipping_no_p,
            taskData.shipping_no,
            taskData.product_cd,
            taskData.product_name,
            taskData.confirmed_boxes,
            taskData.picked_quantity,
            taskData.location_cd,
            taskData.shelf_position,
            taskData.priority,
            taskData.status,
            taskData.picker_id,
            taskData.pallet_sequence,
            taskData.created_by,
            taskData.created_at,
            taskData.remarks,
          ],
        );
      }

      await connection.commit();

      return {
        taskCount: pickingTasks.length,
        tasks: pickingTasks,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取ピッキング任务列表
   */
  async getPickingTasks(params) {
    const { picker_id, status, shipping_no, priority } = params;

    let query = `
      SELECT
        pt.*,
        TIMESTAMPDIFF(MINUTE, pt.start_time, COALESCE(pt.complete_time, NOW())) as work_duration
      FROM picking_tasks pt
      WHERE 1=1
    `;

    const queryParams = [];

    if (picker_id) {
      query += ` AND pt.picker_id = ?`;
      queryParams.push(picker_id);
    }

    if (status === "active") {
      query += ` AND pt.status IN ('pending', 'picking')`;
    } else if (status) {
      query += ` AND pt.status = ?`;
      queryParams.push(status);
    }

    if (shipping_no) {
      query += ` AND pt.shipping_no = ?`;
      queryParams.push(shipping_no);
    }

    if (priority) {
      query += ` AND pt.priority = ?`;
      queryParams.push(priority);
    }

    query += ` ORDER BY pt.priority ASC, pt.pallet_sequence ASC, pt.created_at ASC`;

    const result = await dbQuery(query, queryParams);
    return result;
  }

  /**
   * 获取托盘进度信息
   */
  async getPalletProgress(params) {
    const { picker_id } = params;

    let query = `
      SELECT
        pt.shipping_no,
        COUNT(*) as total_items,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_items,
        SUM(CASE WHEN pt.status = 'picking' THEN 1 ELSE 0 END) as picking_items,
        SUM(CASE WHEN pt.status = 'shortage' THEN 1 ELSE 0 END) as shortage_items,
        CASE
          WHEN SUM(CASE WHEN pt.status = 'shortage' THEN 1 ELSE 0 END) > 0 THEN 'shortage'
          WHEN COUNT(*) = SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) THEN 'completed'
          WHEN SUM(CASE WHEN pt.status = 'picking' THEN 1 ELSE 0 END) > 0 THEN 'picking'
          ELSE 'pending'
        END as pallet_status,
        u.name as picker_name,
        MIN(pt.start_time) as start_time,
        CASE
          WHEN COUNT(*) = SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END)
          THEN MAX(pt.complete_time)
          ELSE DATE_ADD(MIN(pt.start_time), INTERVAL (COUNT(*) * 5) MINUTE)
        END as estimated_completion
            FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE DATE(pt.shipping_date) = CURDATE()
        AND pt.product_name NOT LIKE '%加工%'
        AND pt.product_name NOT LIKE '%アーチ%'
        AND pt.product_name NOT LIKE '%料金%'
    `;

    const queryParams = [];

    if (picker_id) {
      query += ` AND pt.picker_id = ?`;
      queryParams.push(picker_id);
    }

    query += `
      AND pt.status IN ('pending', 'picking', 'completed', 'shortage')
      GROUP BY pt.shipping_no, u.name
      ORDER BY pallet_status DESC, start_time ASC
    `;

    const result = await dbQuery(query, queryParams);
    return result;
  }

  /**
   * 开始ピッキング任务
   */
  async startPickingTask(params) {
    const { picking_id, picker_id } = params;

    const result = await dbQuery(
      `
      UPDATE picking_tasks
      SET status = 'picking', picker_id = ?, start_time = NOW(), updated_at = NOW()
      WHERE picking_id = ? AND status = 'pending'
    `,
      [picker_id, picking_id],
    );

    return result.affectedRows > 0;
  }

  /**
   * 完成ピッキング任务
   */
  async completePickingTask(params) {
    const { picking_id, picked_quantity, remarks } = params;

    // 首先获取任务信息
    const task = await dbQuery(`SELECT * FROM picking_tasks WHERE picking_id = ?`, [picking_id]);

    if (!task || task.length === 0) {
      throw new Error("ピッキング任务が見つかりません");
    }

    const result = await dbQuery(
      `
      UPDATE picking_tasks
      SET
        status = 'completed',
        picked_quantity = ?,
        complete_time = NOW(),
        updated_at = NOW(),
        remarks = ?
      WHERE picking_id = ?
    `,
      [picked_quantity, remarks, picking_id],
    );

    return result.affectedRows > 0;
  }

  /**
   * 报告缺货
   */
  async reportShortage(params) {
    const { picking_id, shortage_quantity, remarks } = params;

    const result = await dbQuery(
      `
      UPDATE picking_tasks
      SET
        status = 'shortage',
        shortage_quantity = ?,
        complete_time = NOW(),
        updated_at = NOW(),
        remarks = ?
      WHERE picking_id = ?
    `,
      [shortage_quantity, remarks, picking_id],
    );

    return result.affectedRows > 0;
  }

  /**
   * 更新ピッキング数量
   */
  async updatePickingQuantity(params) {
    const { picking_id, picked_quantity } = params;

    const result = await dbQuery(
      `
      UPDATE picking_tasks
      SET picked_quantity = ?, updated_at = NOW()
      WHERE picking_id = ?
    `,
      [picked_quantity, picking_id],
    );

    return result.affectedRows > 0;
  }

  /**
   * 处理扫码
   */
  async processScan(params) {
    const { scan_code, picker_id, scan_type = "product" } = params;

    try {
      if (scan_type === "product") {
        // 产品扫码：查找匹配的ピッキング任务
        const productMatch = await dbQuery(
          `
          SELECT
            pt.*,
            ps.current_stock,
            ps.location_cd as stock_location,
            ps.shelf_position as stock_shelf
          FROM picking_tasks pt
          LEFT JOIN product_stock ps ON pt.product_cd = ps.product_cd
          WHERE pt.product_cd = ?
          AND pt.picker_id = ?
          AND pt.status IN ('pending', 'picking')
          ORDER BY pt.priority ASC, pt.created_at ASC
          LIMIT 1
        `,
          [scan_code, picker_id],
        );

        if (productMatch.length === 0) {
          return {
            success: false,
            message: "該当するピッキング任务が見つかりません",
            type: "no_match",
          };
        }

        const task = productMatch[0];

        // 自动开始任务（如果还未开始）
        if (task.status === "pending") {
          await this.startPickingTask({
            picking_id: task.picking_id,
            picker_id: picker_id,
          });
        }

        return {
          success: true,
          message: "製品がスキャンされました",
          type: "product_match",
          task: {
            ...task,
            status: "picking", // 更新状态
          },
        };
      } else if (scan_type === "pallet") {
        // 托盘扫码：查找匹配的托盘任务
        const palletMatch = await dbQuery(
          `
          SELECT
            shipping_no,
            COUNT(*) as total_items,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_items,
            SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as picking_items
          FROM picking_tasks
          WHERE shipping_no = ? AND picker_id = ?
          GROUP BY shipping_no
        `,
          [scan_code, picker_id],
        );

        if (palletMatch.length === 0) {
          return {
            success: false,
            message: "該当する托盤が見つかりません",
            type: "no_match",
          };
        }

        return {
          success: true,
          message: "托盤がスキャンされました",
          type: "pallet_match",
          pallet: palletMatch[0],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `スキャンエラー: ${error.message}`,
        type: "error",
      };
    }
  }

  /**
   * 获取进度数据
   */
  async getProgressData(params) {
    const { picker_id } = params;

    // 获取当天的统计数据（只显示当天，排除包含特定关键词的产品）
    const todayStatsQuery = `
      SELECT
        COUNT(*) as total_picking,
        SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_picking,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_picking,
        AVG(TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)) as avg_time,
        SUM(pt.picked_quantity) as total_picked,
        SUM(pt.confirmed_boxes) as total_required
      FROM picking_tasks pt
      WHERE DATE(pt.shipping_date) = CURDATE()
        AND pt.product_name NOT LIKE '%加工%'
        AND pt.product_name NOT LIKE '%アーチ%'
        AND pt.product_name NOT LIKE '%料金%'
      ${picker_id ? "AND pt.picker_id = ?" : ""}
    `;

    const queryParams = picker_id ? [picker_id] : [];
    const todayStats = await dbQuery(todayStatsQuery, queryParams);

    // 获取当天的托盘进度数据（只显示当天，排除包含特定关键词的产品）
    const palletProgressQuery = `
      SELECT
        pt.shipping_no,
        COUNT(*) as total_items,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_items,
        SUM(CASE WHEN pt.status = 'picking' THEN 1 ELSE 0 END) as picking_items,
        SUM(CASE WHEN pt.status = 'shortage' THEN 1 ELSE 0 END) as shortage_items,
        CASE
          WHEN SUM(CASE WHEN pt.status = 'shortage' THEN 1 ELSE 0 END) > 0 THEN 'shortage'
          WHEN COUNT(*) = SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) THEN 'completed'
          WHEN SUM(CASE WHEN pt.status = 'picking' THEN 1 ELSE 0 END) > 0 THEN 'picking'
          ELSE 'pending'
        END as pallet_status,
        u.name as picker_name,
        MIN(pt.start_time) as start_time,
        CASE
          WHEN COUNT(*) = SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END)
          THEN MAX(pt.complete_time)
          ELSE DATE_ADD(MIN(pt.start_time), INTERVAL (COUNT(*) * 5) MINUTE)
        END as estimated_completion
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE DATE(pt.shipping_date) = CURDATE()
      AND pt.status IN ('pending', 'picking', 'completed', 'shortage')
      AND pt.product_name NOT LIKE '%加工%'
      AND pt.product_name NOT LIKE '%アーチ%'
      AND pt.product_name NOT LIKE '%料金%'
      ${picker_id ? "AND pt.picker_id = ?" : ""}
      GROUP BY pt.shipping_no, u.name
      ORDER BY pallet_status DESC, start_time ASC
    `;

    const palletProgress = await dbQuery(palletProgressQuery, queryParams);

    const stats = todayStats[0] || {};

    console.log("Today stats from DB:", stats);
    console.log("Pallet progress from DB:", palletProgress);

    const result = {
      pallets: palletProgress || [],
      efficiency: {
        avgTime: Math.round(stats.avg_time || 0),
        perHour:
          stats.total_picking > 0 && stats.avg_time > 0 ? Math.round(60 / stats.avg_time) : 0,
        accuracy:
          stats.total_required > 0
            ? Math.round((stats.total_picked / stats.total_required) * 100)
            : 0,
      },
      overview: {
        total: stats.total_picking || 0,
        pending: stats.pending_picking || 0,
        completed: stats.completed_picking || 0,
      },
    };

    console.log("Returning progress data:", result);
    return result;
  }

  /**
   * 获取新的进度数据 - 重新设计
   */
  async getNewProgressData(params) {
    console.log("getNewProgressData called with params:", params);

    try {
      // 1. 获取パレット別進捗一覧数据（只显示当天，排除包含特定关键词的产品）
      const palletListQuery = `
        SELECT
          pt.shipping_no_p,
          pt.shipping_date,
          pt.product_name,
          pt.destination_name,
          pt.status,
          COALESCE(u.name, pt.picker_id) as picker_name,
          pt.picker_id
        FROM picking_tasks pt
        LEFT JOIN users u ON pt.picker_id = u.username
        WHERE DATE(pt.shipping_date) = CURDATE()
          AND pt.product_name NOT LIKE '%加工%'
          AND pt.product_name NOT LIKE '%アーチ%'
          AND pt.product_name NOT LIKE '%料金%'
        ORDER BY pt.shipping_no_p
      `;

      const palletList = await dbQuery(palletListQuery);

      // 2. 获取ピッキング進捗状況 - 按shipping_date分组的统计（排除包含特定关键词的产品）
      const progressStatsQuery = `
        SELECT
          pt.shipping_date,
          COUNT(*) as total_count,
          SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          ROUND(
            (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as completion_rate
        FROM picking_tasks pt
        WHERE pt.shipping_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
          AND pt.product_name NOT LIKE '%加工%'
          AND pt.product_name NOT LIKE '%アーチ%'
          AND pt.product_name NOT LIKE '%料金%'
        GROUP BY pt.shipping_date
        ORDER BY pt.shipping_date
      `;

      const progressStats = await dbQuery(progressStatsQuery);

      // 3. 获取当日总览数据（排除包含特定关键词的产品）
      const todayOverviewQuery = `
        SELECT
          COUNT(*) as total_today,
          SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_today,
          SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_today,
          ROUND(
            (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as today_completion_rate
        FROM picking_tasks pt
        WHERE DATE(pt.shipping_date) = CURDATE()
          AND pt.product_name NOT LIKE '%加工%'
          AND pt.product_name NOT LIKE '%アーチ%'
          AND pt.product_name NOT LIKE '%料金%'
      `;

      let todayOverview = (await dbQuery(todayOverviewQuery))[0];

      console.log("Database query results:");
      console.log("- palletList length:", palletList.length);
      console.log("- progressStats length:", progressStats.length);
      console.log("- todayOverview:", todayOverview);

      // 检查是否有数据，如果没有，则生成模拟数据
      let finalPalletList = palletList;
      let finalProgressStats = progressStats;
      let finalTodayOverview = todayOverview;

      // 修正条件：如果todayOverview存在但total_today为0或null，也应该使用模拟数据
      const hasValidData =
        palletList.length > 0 ||
        progressStats.length > 0 ||
        (todayOverview && todayOverview.total_today > 0);

      if (!hasValidData) {
        console.log("データベースに有効なデータがありません。モックデータを生成します。");

        const { mockPalletList, mockProgressStats, mockTodayOverview } =
          this.generateMockProgressData();
        finalPalletList = mockPalletList;
        finalProgressStats = mockProgressStats;
        finalTodayOverview = mockTodayOverview;

        console.log("Generated mock data:");
        console.log("- mockPalletList length:", mockPalletList.length);
        console.log("- mockProgressStats length:", mockProgressStats.length);
        console.log("- mockTodayOverview:", mockTodayOverview);
      }

      const result = {
        palletList: finalPalletList || [],
        progressStats: finalProgressStats || [],
        todayOverview: finalTodayOverview || {
          total_today: 0,
          pending_today: 0,
          completed_today: 0,
          today_completion_rate: 0,
        },
      };

      console.log("Returning new progress data:", result);
      return result;
    } catch (error) {
      console.error("Error in getNewProgressData:", error);
      throw error;
    }
  }

  /**
   * 生成模拟进度数据
   */
  generateMockProgressData() {
    const mockPalletList = [];
    const mockProgressStats = [];
    const today = new Date();

    // 生成 palletList 数据（只生成当天数据，排除包含特定关键词的产品名）
    const excludeKeywords = ["加工", "アーチ", "料金"];
    const productNames = [
      "製品 ABC",
      "製品 DEF",
      "製品 GHI",
      "製品 JKL",
      "商品 XYZ",
      "部品 QRS",
      "材料 TUV",
      "機器 WXY",
    ];

    for (let i = 0; i < 15; i++) {
      // 只生成当天的数据
      const status = Math.random() > 0.5 ? "completed" : "pending";
      const productName = `${productNames[i % productNames.length]}-${i + 1}`;

      // 确保产品名不包含排除的关键词
      let validProductName = productName;
      while (excludeKeywords.some((keyword) => validProductName.includes(keyword))) {
        const randomIndex = Math.floor(Math.random() * productNames.length);
        validProductName = `${productNames[randomIndex]}-${i + 1}`;
      }

      mockPalletList.push({
        shipping_no_p: `P240725-00${i + 1}`,
        shipping_date: today.toISOString().split("T")[0], // 只使用当天日期
        product_name: validProductName,
        destination_name: `納入先 XYZ-${i % 3}`,
        status: status,
        picker_name: status === "completed" ? "作業者A" : null,
        picker_id: status === "completed" ? "user01" : null,
      });
    }

    // 生成 progressStats 数据
    for (let i = -7; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const total = Math.floor(Math.random() * 30) + 20;
      const completed = Math.floor(Math.random() * total);
      mockProgressStats.push({
        shipping_date: date.toISOString().split("T")[0],
        total_count: total,
        pending_count: total - completed,
        completed_count: completed,
        completion_rate: Math.round((completed / total) * 100),
      });
    }

    // 生成 todayOverview 数据
    const todayStats = mockProgressStats.find(
      (stat) => stat.shipping_date === today.toISOString().split("T")[0],
    );
    const mockTodayOverview = {
      total_today: todayStats ? todayStats.total_count : 0,
      pending_today: todayStats ? todayStats.pending_count : 0,
      completed_today: todayStats ? todayStats.completed_count : 0,
      today_completion_rate: todayStats ? todayStats.completion_rate : 0,
    };

    return { mockPalletList, mockProgressStats, mockTodayOverview };
  }

  /**
   * 获取托盘任务
   */
  async getPalletTasks(params) {
    const { shipping_no, picker_id } = params;

    const result = await dbQuery(
      `
      SELECT * FROM picking_tasks
      WHERE shipping_no = ? AND picker_id = ?
      ORDER BY pallet_sequence ASC
    `,
      [shipping_no, picker_id],
    );

    return result;
  }

  /**
   * 获取托盘缺货信息
   */
  async getPalletShortages(params) {
    const { shipping_no, picker_id } = params;

    const result = await dbQuery(
      `
      SELECT * FROM picking_tasks
      WHERE shipping_no = ? AND picker_id = ? AND status = 'shortage'
      ORDER BY product_cd ASC
    `,
      [shipping_no, picker_id],
    );

    return result;
  }

  /**
   * 解决缺货
   */
  async resolveShortage(params) {
    const { picking_id, resolution_type, picked_quantity, remarks } = params;

    let updateQuery = "";
    let queryParams = [];

    if (resolution_type === "partial") {
      updateQuery = `
        UPDATE picking_tasks
        SET
          status = 'completed',
          picked_quantity = ?,
          complete_time = NOW(),
          updated_at = NOW(),
          remarks = ?
        WHERE picking_id = ?
      `;
      queryParams = [picked_quantity, remarks, picking_id];
    } else if (resolution_type === "skip") {
      updateQuery = `
        UPDATE picking_tasks
        SET
          status = 'cancelled',
          complete_time = NOW(),
          updated_at = NOW(),
          remarks = ?
        WHERE picking_id = ?
      `;
      queryParams = [remarks, picking_id];
    }

    const result = await dbQuery(updateQuery, queryParams);
    return result.affectedRows > 0;
  }

  /**
   * 完成托盘
   */
  async completePallet(params) {
    const { shipping_no, picker_id, completion_notes } = params;

    const result = await dbQuery(
      `
      UPDATE picking_tasks
      SET
        status = CASE
          WHEN status = 'picking' THEN 'completed'
          ELSE status
        END,
        complete_time = CASE
          WHEN status = 'picking' THEN NOW()
          ELSE complete_time
        END,
        updated_at = NOW(),
        remarks = CONCAT(IFNULL(remarks, ''), ' ', ?)
      WHERE shipping_no = ? AND picker_id = ?
    `,
      [completion_notes, shipping_no, picker_id],
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(params) {
    const { picker_id } = params;
    const today = new Date().toISOString().slice(0, 10);

    console.log("getTodayStats called with params:", params);
    console.log("Today date:", today);

    let query = `
      SELECT
        COUNT(*) as pickingTasks,
        SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'shortage' THEN 1 ELSE 0 END) as shortage
      FROM picking_tasks
      WHERE DATE(created_at) = ?
    `;

    const queryParams = [today];

    if (picker_id) {
      query += ` AND picker_id = ?`;
      queryParams.push(picker_id);
    }

    console.log("Executing query:", query);
    console.log("Query params:", queryParams);

    try {
      const result = await dbQuery(query, queryParams);
      console.log("Database query result:", result);

      const stats = result[0] || {};
      console.log("Parsed stats:", stats);

      const efficiency =
        stats.pickingTasks > 0 ? Math.round((stats.completed / stats.pickingTasks) * 100) : 0;

      const finalResult = {
        pickingTasks: stats.pickingTasks || 0,
        inProgress: stats.inProgress || 0,
        completed: stats.completed || 0,
        shortage: stats.shortage || 0,
        efficiency,
      };

      console.log("Final result:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("Database query error in getTodayStats:", error);
      throw error;
    }
  }

  /**
   * 获取日别效率数据 - 基于 shipping_date 计算完了率
   * 显示过去7天和未来3天的数据
   */
  async getDailyEfficiencyData(params) {
    const { picker_id } = params;

    console.log("getDailyEfficiencyData called with params:", params);

    try {
      let query = `
      SELECT
        pt.shipping_date as date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(
          (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as completion_rate,
        AVG(CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END) as avg_time
      FROM picking_tasks pt
      WHERE pt.shipping_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    `;

      const queryParams = [];

      // 添加作业者筛选
      if (picker_id) {
        query += ` AND pt.picker_id = ?`;
        queryParams.push(picker_id);
      }

      query += `
      GROUP BY pt.shipping_date
      ORDER BY pt.shipping_date ASC
    `;

      console.log("Daily efficiency query:", query);
      console.log("Query params:", queryParams);

      const result = await dbQuery(query, queryParams);
      console.log("Daily efficiency result:", result);

      // 格式化结果，确保日期格式正确
      const formattedResult = (result || []).map((item) => ({
        date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
        total_tasks: item.total_tasks || 0,
        completed_tasks: item.completed_tasks || 0,
        pending_tasks: item.pending_tasks || 0,
        picking_tasks: item.picking_tasks || 0,
        shortage_tasks: item.shortage_tasks || 0,
        completion_rate: parseFloat(item.completion_rate || 0),
        avg_time: parseFloat(item.avg_time || 0),
        efficiency_rate: parseFloat(item.completion_rate || 0), // 为前端兼容性添加
      }));

      console.log("Formatted daily efficiency result:", formattedResult);
      return formattedResult;
    } catch (error) {
      console.error("Error in getDailyEfficiencyData:", error);
      throw error;
    }
  }

  /**
   * 获取月别效率数据 - 基于 shipping_date 计算完了率
   * 显示过去12个月的数据
   */
  async getMonthlyEfficiencyData(params) {
    const { picker_id } = params;

    try {
      let query = `
      SELECT
        DATE_FORMAT(pt.shipping_date, '%Y-%m') as month,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(
          (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as completion_rate,
        AVG(CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END) as avg_time
      FROM picking_tasks pt
      WHERE pt.shipping_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    `;

      const queryParams = [];

      // 添加作业者筛选
      if (picker_id) {
        query += ` AND pt.picker_id = ?`;
        queryParams.push(picker_id);
      }

      query += `
      GROUP BY DATE_FORMAT(pt.shipping_date, '%Y-%m')
      ORDER BY DATE_FORMAT(pt.shipping_date, '%Y-%m') ASC
    `;

      console.log("Monthly efficiency query:", query);
      console.log("Query params:", queryParams);

      const result = await dbQuery(query, queryParams);
      console.log("Monthly efficiency result:", result);

      // 格式化结果
      const formattedResult = (result || []).map((item) => ({
        month: item.month || "",
        total_tasks: item.total_tasks || 0,
        completed_tasks: item.completed_tasks || 0,
        pending_tasks: item.pending_tasks || 0,
        picking_tasks: item.picking_tasks || 0,
        shortage_tasks: item.shortage_tasks || 0,
        completion_rate: parseFloat(item.completion_rate || 0),
        avg_time: parseFloat(item.avg_time || 0),
        efficiency_rate: parseFloat(item.completion_rate || 0), // 为前端兼容性添加
      }));

      console.log("Formatted monthly efficiency result:", formattedResult);
      return formattedResult;
    } catch (error) {
      console.error("Error in getMonthlyEfficiencyData:", error);
      throw error;
    }
  }

  /**
   * 获取周别效率数据 - 可选方法，按周显示
   */
  async getWeeklyEfficiencyData(params) {
    const { picker_id } = params;

    console.log("getWeeklyEfficiencyData called with params:", params);

    try {
      let query = `
      SELECT
        YEARWEEK(pt.shipping_date, 1) as week_number,
        DATE(DATE_SUB(pt.shipping_date, INTERVAL WEEKDAY(pt.shipping_date) DAY)) as week_start,
        DATE(DATE_ADD(DATE_SUB(pt.shipping_date, INTERVAL WEEKDAY(pt.shipping_date) DAY), INTERVAL 6 DAY)) as week_end,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(
          (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as completion_rate,
        AVG(CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END) as avg_time
      FROM picking_tasks pt
      WHERE pt.shipping_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
    `;

      const queryParams = [];

      if (picker_id) {
        query += ` AND pt.picker_id = ?`;
        queryParams.push(picker_id);
      }

      query += `
      GROUP BY YEARWEEK(pt.shipping_date, 1), week_start, week_end
      ORDER BY week_start ASC
    `;

      const result = await dbQuery(query, queryParams);

      const formattedResult = (result || []).map((item) => ({
        week: item.week_number,
        week_start: item.week_start ? new Date(item.week_start).toISOString().slice(0, 10) : "",
        week_end: item.week_end ? new Date(item.week_end).toISOString().slice(0, 10) : "",
        total_tasks: item.total_tasks || 0,
        completed_tasks: item.completed_tasks || 0,
        pending_tasks: item.pending_tasks || 0,
        completion_rate: parseFloat(item.completion_rate || 0),
        avg_time: parseFloat(item.avg_time || 0),
        efficiency_rate: parseFloat(item.completion_rate || 0),
      }));

      return formattedResult;
    } catch (error) {
      console.error("Error in getWeeklyEfficiencyData:", error);
      throw error;
    }
  }

  /**
   * 获取历史数据 - 完全修正版本
   * 确保不使用 LIMIT ? OFFSET ? 的 SQL 参数绑定
   */
  async getPickingHistory(params) {
    const { start_date, end_date, picker_id, status, page = 1, limit = 100 } = params;

    console.log("getPickingHistory called with params:", params);

    // 如果没有数据，返回空结果
    try {
      // 首先检查是否有任何picking_tasks数据
      const countResult = await dbQuery("SELECT COUNT(*) as count FROM picking_tasks");
      if (countResult[0].count === 0) {
        console.log("No picking_tasks data found, returning empty result");
        return {
          tasks: [],
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionRate: 0,
            avgTime: 0,
            accuracy: 0,
            productivity: 0,
          },
          topPerformers: [],
        };
      }
    } catch (error) {
      console.error("Error checking picking_tasks count:", error);
      return {
        tasks: [],
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          completionRate: 0,
          avgTime: 0,
          accuracy: 0,
          productivity: 0,
        },
        topPerformers: [],
      };
    }

    // 修改查询条件，避免使用DATE函数，改用范围查询
    let whereClause = `WHERE 1=1`;
    const queryParams = [];

    // 添加时间范围条件
    if (start_date) {
      whereClause += ` AND pt.created_at >= ?`;
      queryParams.push(start_date + " 00:00:00");
    }

    if (end_date) {
      whereClause += ` AND pt.created_at <= ?`;
      queryParams.push(end_date + " 23:59:59");
    }

    if (picker_id) {
      whereClause += ` AND pt.picker_id = ?`;
      queryParams.push(picker_id);
    }

    if (status) {
      whereClause += ` AND pt.status = ?`;
      queryParams.push(status);
    }

    console.log("Where clause:", whereClause);
    console.log("Query params:", queryParams);

    // 获取基础统计数据
    const baseStatsQuery = `
      SELECT
        COUNT(*) as totalTasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pendingTasks,
        AVG(CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END) as avgTime,
        ROUND(
          (SUM(CASE
            WHEN pt.picked_quantity IS NOT NULL AND pt.confirmed_boxes IS NOT NULL
                 AND pt.picked_quantity = pt.confirmed_boxes THEN 1
            ELSE 0
          END) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as accuracy
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      ${whereClause}
    `;

    console.log("Base stats query:", baseStatsQuery);

    const baseStats = await dbQuery(baseStatsQuery, queryParams);
    console.log("Base stats result:", baseStats);

    // 计算完成率
    const statsData = baseStats[0] || {};
    const completionRate =
      statsData.totalTasks > 0
        ? Math.round((statsData.completedTasks / statsData.totalTasks) * 100)
        : 0;

    // 获取top performers - 构建单独的参数数组
    let performersQuery = `
      SELECT
        pt.picker_id,
        COALESCE(u.name, pt.picker_id) as picker_name,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        AVG(CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END) as avg_time,
        ROUND(
          CASE
            WHEN COUNT(*) > 0
            THEN (SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
            ELSE 0
          END, 2
        ) as efficiency_score
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE 1=1
    `;

    const performersParams = [];
    if (start_date) {
      performersQuery += ` AND pt.created_at >= ?`;
      performersParams.push(start_date + " 00:00:00");
    }
    if (end_date) {
      performersQuery += ` AND pt.created_at <= ?`;
      performersParams.push(end_date + " 23:59:59");
    }

    performersQuery += `
      GROUP BY pt.picker_id, u.name
      HAVING COUNT(*) > 0
      ORDER BY efficiency_score DESC, completed_tasks DESC
    `;

    // 添加手动限制，而不是使用 LIMIT 参数
    console.log("Performers query:", performersQuery);
    console.log("Performers params:", performersParams);

    const allPerformers = await dbQuery(performersQuery, performersParams);
    const topPerformers = (allPerformers || []).slice(0, 5); // 手动取前5个
    console.log("Top performers result:", topPerformers);

    // 获取分页数据 - 完全避免使用 LIMIT 和 OFFSET 参数
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 100));
    const offset = Math.max(0, (pageNum - 1) * limitNum);

    console.log("Pagination values - page:", pageNum, "limit:", limitNum, "offset:", offset);

    // 获取所有任务数据，然后在 JavaScript 中进行分页
    let tasksQuery = `
      SELECT
        pt.picking_id,
        pt.shipping_no,
        pt.product_cd,
        pt.product_name,
        pt.confirmed_boxes,
        pt.picked_quantity,
        pt.location_cd,
        pt.picker_id,
        COALESCE(u.name, pt.picker_id) as picker_name,
        pt.status,
        pt.start_time,
        pt.complete_time,
        pt.remarks,
        pt.created_at,
        CASE
          WHEN pt.start_time IS NOT NULL AND pt.complete_time IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, pt.start_time, pt.complete_time)
          ELSE NULL
        END as work_time
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      ${whereClause}
      ORDER BY pt.created_at DESC
    `;

    // 使用相同的查询参数，不添加 LIMIT 和 OFFSET
    const tasksParams = [...queryParams];

    console.log("Tasks query (without LIMIT):", tasksQuery);
    console.log("Tasks params:", tasksParams);

    try {
      // 执行查询获取所有数据
      const allTasks = await dbQuery(tasksQuery, tasksParams);
      console.log("Total tasks found:", allTasks?.length || 0);

      // 在 JavaScript 中进行分页处理
      const tasks = (allTasks || []).slice(offset, offset + limitNum);
      console.log("Paginated tasks count:", tasks?.length || 0);

      const result = {
        tasks: tasks || [],
        stats: {
          totalTasks: statsData.totalTasks || 0,
          completedTasks: statsData.completedTasks || 0,
          pendingTasks: statsData.pendingTasks || 0,
          completionRate: completionRate,
          avgTime: Math.round(statsData.avgTime || 0),
          accuracy: Math.round(statsData.accuracy || 0),
          productivity: Math.round(statsData.productivity || 0),
        },
        topPerformers: topPerformers.map((p) => ({
          ...p,
          efficiency_score: Math.round(p.efficiency_score || 0),
        })),
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalItems: allTasks?.length || 0,
          totalPages: Math.ceil((allTasks?.length || 0) / limitNum),
        },
      };

      console.log("Final result summary:", {
        tasksCount: result.tasks.length,
        statsTotal: result.stats.totalTasks,
        performersCount: result.topPerformers.length,
      });

      return result;
    } catch (error) {
      console.error("Error in tasks query:", error);
      console.error("Failed query:", tasksQuery);
      console.error("Failed params:", tasksParams);

      // 返回空结果而不是抛出错误
      return {
        tasks: [],
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          completionRate: 0,
          avgTime: 0,
          accuracy: 0,
          productivity: 0,
        },
        topPerformers: [],
        pagination: {
          currentPage: 1,
          pageSize: limitNum,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * 获取担当者按目的地分组的绩效数据
   * @param {{start_date: string, end_date: string, picker_ids: string[]}} params
   */
  async getPerformanceByDestination(params) {
    const { start_date, end_date, picker_ids } = params;
    console.log("绩效服务接收参数:", params);

    let sql = `
      SELECT
        pt.picker_id,
        COALESCE(u.name, pt.picker_id) AS picker_name,
        pt.destination_name,
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM picking_tasks pt
      LEFT JOIN users u ON pt.picker_id = u.username
      WHERE pt.picker_id IS NOT NULL AND pt.picker_id != ''
    `;

    const queryParams = [];

    if (start_date && end_date) {
      sql += ` AND pt.shipping_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    if (picker_ids && picker_ids.length > 0) {
      sql += ` AND pt.picker_id IN (?)`;
      queryParams.push(picker_ids);
    }

    sql += `
      GROUP BY pt.picker_id, u.name, pt.destination_name
      ORDER BY picker_name, total_tasks DESC
    `;

    console.log("执行绩效查询SQL:", sql.replace(/\s+/g, " "));
    console.log("SQL参数:", queryParams);

    const flatResults = await dbQuery(sql, queryParams);

    const performanceData = flatResults.reduce((acc, row) => {
      let performer = acc.find((p) => p.picker_id === row.picker_id);
      if (!performer) {
        performer = {
          picker_id: row.picker_id,
          picker_name: row.picker_name,
          total_tasks: 0,
          total_completed: 0,
          destinations: [],
        };
        acc.push(performer);
      }

      performer.destinations.push({
        destination_name: row.destination_name || "N/A",
        total_tasks: parseInt(row.total_tasks, 10),
        completed_tasks: parseInt(row.completed_tasks, 10),
        completion_rate:
          row.total_tasks > 0
            ? parseFloat(((row.completed_tasks / row.total_tasks) * 100).toFixed(1))
            : 0,
      });

      performer.total_tasks += parseInt(row.total_tasks, 10);
      performer.total_completed += parseInt(row.completed_tasks, 10);

      return acc;
    }, []);

    performanceData.forEach((p) => {
      p.overall_completion_rate =
        p.total_tasks > 0 ? parseFloat(((p.total_completed / p.total_tasks) * 100).toFixed(1)) : 0;
    });

    performanceData.sort((a, b) => b.overall_completion_rate - a.overall_completion_rate);

    console.log("处理后的绩效数据:", JSON.stringify(performanceData, null, 2));
    return performanceData;
  }
}

export default new PickingService();
