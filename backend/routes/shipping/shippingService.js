// routes/shipping/shippingService.js
import { db } from "../../db/index.js";

// 標準レスポンス形式 (标准响应格式)
const standardResponse = (success, message = "", data = null) => {
  return { success, message, data };
};

// 既存の出荷番号取得（生成用） (已存在 shipping_no，用于生成用)
export async function getExistingShippingNos(req, res) {
  try {
    const { shipping_date, destination_cd } = req.query;

    if (!shipping_date || !destination_cd) {
      return res.status(400).json(standardResponse(false, "出荷日、納入先が必要です"));
    }

    const [rows] = await db.query(
      `
    SELECT shipping_no FROM shipping_items
      WHERE shipping_date = ? AND destination_cd = ?
    `,
      [shipping_date, destination_cd],
    );

    res.json(
      standardResponse(
        true,
        "",
        rows.map((r) => r.shipping_no),
      ),
    );
  } catch (error) {
    console.error("getExistingShippingNosでエラー:", error); // Error in getExistingShippingNos
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 出荷記録一覧取得 (出荷记录一览)
export async function getShippingItems(req, res) {
  try {
    const {
      shipping_date,
      end_date,
      delivery_date,
      destination_cd,
      product_cd,
      product_name,
      box_type,
      status,
      shipping_no,
    } = req.query;

    // クエリ条件の構築 (构建查询条件)
    let conditions = [];
    let params = [];

    if (shipping_date && shipping_date.trim() !== "") {
      if (end_date && end_date.trim() !== "") {
        // 日付範囲検索 (日期范围搜索)
        conditions.push("shipping_date BETWEEN ? AND ?");
        params.push(shipping_date);
        params.push(end_date);
      } else {
        conditions.push("shipping_date = ?");
        params.push(shipping_date);
      }
    }

    if (delivery_date && delivery_date.trim() !== "") {
      conditions.push("delivery_date = ?");
      params.push(delivery_date);
    }

    if (destination_cd && destination_cd.trim() !== "") {
      // 納入先が複数ある場合（カンマ区切り）に対応 (支持多个目的地，用逗号分隔)
      const destinations = destination_cd.split(",").map((cd) => cd.trim());
      if (destinations.length > 1) {
        conditions.push(`destination_cd IN (${destinations.map(() => "?").join(",")})`);
        params.push(...destinations);
      } else {
        conditions.push("destination_cd = ?");
        params.push(destination_cd);
      }
    }

    if (product_cd && product_cd.trim() !== "") {
      conditions.push("product_cd = ?");
      params.push(product_cd);
    }

    // 製品名による検索を追加 (添加按产品名搜索)
    if (product_name && product_name.trim() !== "") {
      conditions.push("product_name LIKE ?");
      params.push(`%${product_name}%`);
    }

    if (box_type && box_type.trim() !== "") {
      conditions.push("box_type = ?");
      params.push(box_type);
    }

    if (status && status.trim() !== "") {
      conditions.push("status = ?");
      params.push(status);
    }

    // 出荷番号による検索を追加 (添加按出货编号搜索)
    if (shipping_no && shipping_no.trim() !== "") {
      conditions.push("shipping_no LIKE ?");
      params.push(`%${shipping_no}%`);
    }

    // WHERE句の組み立て (组装WHERE子句)
    let whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const query = `
      SELECT
        id, shipping_no, product_cd, product_name, product_alias,
        destination_cd, destination_name, shipping_date, delivery_date, box_type,
        status, confirmed_boxes, confirmed_units, unit, remarks,
        created_at, updated_at
      FROM shipping_items
      ${whereClause}
      ORDER BY shipping_date DESC, shipping_no ASC
    `;

    // console.log("SQL Query:", query);
    // console.log("Query params:", params);

    const [rows] = await db.query(query, params);

    // 日付を文字列にフォーマットして、JSON直列化の問題を回避 (格式化日期为字符串，以避免JSON序列化问题)
    const formattedRows = rows.map((row) => {
      // 日付を安全にフォーマット (安全地格式化日期)
      const formatDate = (dateVal) => {
        if (!dateVal) return null;

        // すでに文字列形式の場合、そのまま返すか処理 (如果已经是字符串格式，直接返回或处理)
        if (typeof dateVal === "string") {
          // 文字列形式を標準化する必要がある場合、ここで処理 (如果需要标准化字符串格式，可以在这里处理)
          return dateVal;
        }

        // 日付オブジェクトかつtoISOStringメソッドがあるか確認 (检查是否是日期对象并且有toISOString方法)
        if (dateVal instanceof Date && typeof dateVal.toISOString === "function") {
          return dateVal.toISOString().split("T")[0];
        }

        // 他の形式だが日付に変換可能 (如果是其他格式但可以转换为日期)
        try {
          const date = new Date(dateVal);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        } catch (e) {
          // console.log("日付変換エラー:", e); // 日期转换错误
        }

        // 変換できない場合、元の値の文字列形式を返す (无法转换，返回原始值的字符串形式)
        return String(dateVal);
      };

      return {
        ...row,
        shipping_date: formatDate(row.shipping_date),
        delivery_date: formatDate(row.delivery_date),
        created_at: formatDate(row.created_at),
        updated_at: formatDate(row.updated_at),
      };
    });

    res.json(formattedRows);
  } catch (error) {
    console.error("getShippingItemsでエラー:", error); // Error in getShippingItems
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 出荷データの一括保存（パレット生成） (批量保存出荷数据，生成托盘)
export async function bulkInsertShippingItems(req, res) {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(standardResponse(false, "有効なデータがありません"));
    }

    // トランザクション開始 (开始事务)
    await db.query("START TRANSACTION");

    try {
      for (const item of items) {
        const {
          shipping_no,
          product_cd,
          product_name,
          product_alias,
          destination_cd,
          destination_name,
          shipping_date,
          delivery_date,
          box_type,
          confirmed_boxes,
          confirmed_units,
          unit,
          remarks,
        } = item;

        await db.query(
          `
      INSERT INTO shipping_items (
            shipping_no, product_cd, product_name, product_alias,
            destination_cd, destination_name, shipping_date, delivery_date, box_type,
            confirmed_boxes, confirmed_units, unit, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            shipping_no,
            product_cd,
            product_name,
            product_alias || null,
            destination_cd,
            destination_name,
            shipping_date,
            delivery_date || null,
            box_type || null,
            confirmed_boxes || 0,
            confirmed_units,
            unit || "本",
            remarks || null,
          ],
        );
      }

      // トランザクションのコミット (提交事务)
      await db.query("COMMIT");
      res.json(standardResponse(true, "出荷データを保存しました"));
    } catch (error) {
      // トランザクションのロールバック (回滚事务)
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("bulkInsertShippingItemsでエラー:", error); // Error in bulkInsertShippingItems
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 出荷詳細取得 (出荷详细获取) - 单条记录
export async function getShippingDetail(req, res) {
  try {
    const { shipping_no } = req.params;

    if (!shipping_no) {
      return res.status(400).json(standardResponse(false, "出荷番号が必要です"));
    }

    const [rows] = await db.query(
      `
    SELECT * FROM shipping_items WHERE shipping_no = ? LIMIT 1
    `,
      [shipping_no],
    );

    if (rows.length === 0) {
      return res.status(404).json(standardResponse(false, "出荷データが見つかりません"));
    }

    // 日付を安全にフォーマット (安全地格式化日期)
    const formatDate = (dateVal) => {
      if (!dateVal) return null;

      // すでに文字列形式の場合、そのまま返す (如果已经是字符串格式，直接返回)
      if (typeof dateVal === "string") {
        return dateVal;
      }

      // 日付オブジェクトかつtoISOStringメソッドがあるか確認 (检查是否是日期对象并且有toISOString方法)
      if (dateVal instanceof Date && typeof dateVal.toISOString === "function") {
        return dateVal.toISOString().split("T")[0];
      }

      // 他の形式だが日付に変換可能 (如果是其他格式但可以转换为日期)
      try {
        const date = new Date(dateVal);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      } catch (e) {
        // console.log("日付変換エラー:", e); // 日期转换错误
      }

      // 変換できない場合、元の値の文字列形式を返す (无法转换，返回原始值的字符串形式)
      return String(dateVal);
    };

    // 日付のフォーマット (格式化日期)
    const row = {
      ...rows[0],
      shipping_date: formatDate(rows[0].shipping_date),
      delivery_date: formatDate(rows[0].delivery_date),
      created_at: formatDate(rows[0].created_at),
      updated_at: formatDate(rows[0].updated_at),
    };

    res.json(row);
  } catch (error) {
    console.error("getShippingDetailでエラー:", error); // Error in getShippingDetail
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 出荷番号の全項目取得 (获取出荷番号的所有项目)
export async function getShippingItemsByNo(req, res) {
  try {
    const { shipping_no } = req.params;

    if (!shipping_no) {
      return res.status(400).json(standardResponse(false, "出荷番号が必要です"));
    }

    const [rows] = await db.query(
      `
    SELECT * FROM shipping_items WHERE shipping_no = ? ORDER BY product_cd ASC
    `,
      [shipping_no],
    );

    if (rows.length === 0) {
      return res.status(404).json(standardResponse(false, "出荷データが見つかりません"));
    }

    // 日付を安全にフォーマット (安全地格式化日期)
    const formatDate = (dateVal) => {
      if (!dateVal) return null;

      // すでに文字列形式の場合、そのまま返す (如果已经是字符串格式，直接返回)
      if (typeof dateVal === "string") {
        return dateVal;
      }

      // 日付オブジェクトかつtoISOStringメソッドがあるか確認 (检查是否是日期对象并且有toISOString方法)
      if (dateVal instanceof Date && typeof dateVal.toISOString === "function") {
        return dateVal.toISOString().split("T")[0];
      }

      // 他の形式だが日付に変換可能 (如果是其他格式但可以转换为日期)
      try {
        const date = new Date(dateVal);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      } catch (e) {
        // console.log("日付変換エラー:", e); // 日期转换错误
      }

      // 変換できない場合、元の値の文字列形式を返す (无法转换，返回原始值的字符串形式)
      return String(dateVal);
    };

    // 日付のフォーマット (格式化日期)
    const formattedRows = rows.map((row) => ({
      ...row,
      shipping_date: formatDate(row.shipping_date),
      delivery_date: formatDate(row.delivery_date),
      created_at: formatDate(row.created_at),
      updated_at: formatDate(row.updated_at),
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error("getShippingItemsByNo でエラー:", error);
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 出荷データ修正 (出荷修正)
export async function updateShippingItem(req, res) {
  const connection = await db.getConnection();
  try {
    const { shipping_no: oldShippingNo } = req.params;
    const {
      shipping_no: newShippingNo,
      shipping_date,
      delivery_date,
      destination_cd,
      destination_name,
      product_cd,
      product_name,
      confirmed_units,
      confirmed_boxes,
      box_type,
      remarks,
      shipping_no_changed,
    } = req.body;

    if (!oldShippingNo) {
      return res.status(400).json(standardResponse(false, "元の出荷番号が必要です"));
    }

    if (!newShippingNo) {
      return res.status(400).json(standardResponse(false, "新しい出荷番号が必要です"));
    }

    if (confirmed_units === undefined) {
      return res.status(400).json(standardResponse(false, "数量が必要です"));
    }

    await connection.beginTransaction();

    // レコードが存在するか確認 (检查记录是否存在)
    const [checkRows] = await connection.query(
      `SELECT * FROM shipping_items WHERE shipping_no = ?`,
      [oldShippingNo],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json(standardResponse(false, "出荷データが見つかりません"));
    }

    // 出荷データを更新
    await connection.query(
      `
      UPDATE shipping_items
      SET
        shipping_no = ?,
        shipping_date = ?,
        delivery_date = ?,
        destination_cd = ?,
        destination_name = ?,
        product_cd = ?,
        product_name = ?,
        confirmed_units = ?,
        confirmed_boxes = ?,
        box_type = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE shipping_no = ?
      `,
      [
        newShippingNo,
        shipping_date,
        delivery_date || null,
        destination_cd,
        destination_name,
        product_cd,
        product_name,
        confirmed_units,
        confirmed_boxes || 0,
        box_type || null,
        remarks || null,
        oldShippingNo,
      ],
    );

    // 出荷番号が変更された場合、order_dailyテーブルも更新
    if (shipping_no_changed) {
      console.log(`出荷番号を更新: ${oldShippingNo} -> ${newShippingNo}`);

      // 古い出荷番号を持つorder_dailyレコードを更新
      const [updateResult] = await connection.query(
        `UPDATE order_daily SET shipping_no = ? WHERE shipping_no = ?`,
        [newShippingNo, oldShippingNo],
      );

      console.log(`${updateResult.affectedRows}件のorder_dailyレコードを更新しました`);
    }

    await connection.commit();
    res.json(standardResponse(true, "出荷データを更新しました"));
  } catch (error) {
    await connection.rollback();
    console.error("updateShippingItemでエラー:", error); // Error in updateShippingItem
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました: " + error.message));
  } finally {
    connection.release();
  }
}

// 出荷データ一括更新 (批量更新出荷数据)
export async function batchUpdateShippingItems(req, res) {
  const connection = await db.getConnection();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(standardResponse(false, "更新するデータがありません"));
    }

    await connection.beginTransaction();

    let updatedCount = 0;

    for (const item of items) {
      const {
        id,
        shipping_no,
        product_cd,
        product_name,
        confirmed_units,
        confirmed_boxes,
        box_type,
        remarks,
      } = item;

      if (!id || !shipping_no || !product_cd) {
        await connection.rollback();
        return res.status(400).json(standardResponse(false, "必要な項目が不足しています"));
      }

      if (!confirmed_units || confirmed_units <= 0) {
        await connection.rollback();
        return res
          .status(400)
          .json(standardResponse(false, `製品CD: ${product_cd} の数量は1以上を入力してください`));
      }

      // 各項目を更新
      const [updateResult] = await connection.query(
        `
        UPDATE shipping_items
        SET
          product_name = ?,
          confirmed_units = ?,
          confirmed_boxes = ?,
          box_type = ?,
          remarks = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND shipping_no = ? AND product_cd = ?
        `,
        [
          product_name,
          confirmed_units,
          confirmed_boxes || 0,
          box_type || null,
          remarks || null,
          id,
          shipping_no,
          product_cd,
        ],
      );

      if (updateResult.affectedRows > 0) {
        updatedCount++;
      }
    }

    await connection.commit();
    res.json(standardResponse(true, `${updatedCount}件の出荷データを一括更新しました`));
  } catch (error) {
    await connection.rollback();
    console.error("batchUpdateShippingItemsでエラー:", error);
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました: " + error.message));
  } finally {
    connection.release();
  }
}

// 増強された出荷データ更新 (Enhanced shipping item update)
export async function updateShippingItemEnhanced(req, res) {
  const connection = await db.getConnection();
  try {
    const { shipping_no: oldShippingNo } = req.params;
    const {
      shipping_no: newShippingNo,
      shipping_date,
      delivery_date,
      destination_cd,
      destination_name,
      product_cd,
      product_name,
      confirmed_units,
      confirmed_boxes,
      box_type,
      remarks,
      shipping_no_changed,
      items, // 批量更新时的项目列表
    } = req.body;

    if (!oldShippingNo) {
      return res.status(400).json(standardResponse(false, "元の出荷番号が必要です"));
    }

    if (!newShippingNo) {
      return res.status(400).json(standardResponse(false, "新しい出荷番号が必要です"));
    }

    await connection.beginTransaction();

    // レコードが存在するか確認
    const [checkRows] = await connection.query(
      `SELECT * FROM shipping_items WHERE shipping_no = ?`,
      [oldShippingNo],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json(standardResponse(false, "出荷データが見つかりません"));
    }

    // 更新統計情報
    const updateStats = {
      shipping_items: 0,
      picking_tasks: 0,
      picking_list: 0,
      shipping_records: 0,
      order_daily: 0,
    };

    // 批量更新模式
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.confirmed_units || item.confirmed_units <= 0) {
          await connection.rollback();
          return res
            .status(400)
            .json(
              standardResponse(false, `製品CD: ${item.product_cd} の数量は1以上を入力してください`),
            );
        }

        // 更新 shipping_items
        const [updateResult] = await connection.query(
          `
          UPDATE shipping_items
          SET
            product_name = ?,
            confirmed_units = ?,
            confirmed_boxes = ?,
            box_type = ?,
            remarks = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND shipping_no = ? AND product_cd = ?
          `,
          [
            item.product_name,
            item.confirmed_units,
            item.confirmed_boxes || 0,
            item.box_type || null,
            item.remarks || null,
            item.id,
            oldShippingNo,
            item.product_cd,
          ],
        );

        if (updateResult.affectedRows > 0) {
          updateStats.shipping_items++;

          // 同时更新 picking 相关表的数量
          await connection.query(
            `UPDATE picking_tasks
             SET quantity = ?, boxes = ?
             WHERE shipping_no = ? AND product_cd = ?`,
            [item.confirmed_units, item.confirmed_boxes || 0, oldShippingNo, item.product_cd],
          );

          await connection.query(
            `UPDATE picking_list
             SET quantity = ?, boxes = ?
             WHERE shipping_no = ? AND product_cd = ?`,
            [item.confirmed_units, item.confirmed_boxes || 0, oldShippingNo, item.product_cd],
          );
        }
      }
    } else {
      // 单项更新模式
      if (confirmed_units === undefined) {
        await connection.rollback();
        return res.status(400).json(standardResponse(false, "数量が必要です"));
      }

      // 1. shipping_items テーブルを更新
      const [shippingUpdateResult] = await connection.query(
        `
        UPDATE shipping_items
        SET
          shipping_no = ?,
          shipping_date = ?,
          delivery_date = ?,
          destination_cd = ?,
          destination_name = ?,
          product_cd = ?,
          product_name = ?,
          confirmed_units = ?,
          confirmed_boxes = ?,
          box_type = ?,
          remarks = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE shipping_no = ?
        `,
        [
          newShippingNo,
          shipping_date,
          delivery_date || null,
          destination_cd,
          destination_name,
          product_cd,
          product_name,
          confirmed_units,
          confirmed_boxes || 0,
          box_type || null,
          remarks || null,
          oldShippingNo,
        ],
      );
      updateStats.shipping_items = shippingUpdateResult.affectedRows;
    }

    // 2. 出荷番号が変更された場合、関連テーブルも更新
    if (shipping_no_changed && oldShippingNo !== newShippingNo) {
      console.log(`出荷番号を更新: ${oldShippingNo} -> ${newShippingNo}`);

      // picking_tasks テーブルの出荷番号を更新
      const [pickingTasksResult] = await connection.query(
        `UPDATE picking_tasks SET shipping_no = ? WHERE shipping_no = ?`,
        [newShippingNo, oldShippingNo],
      );
      updateStats.picking_tasks = pickingTasksResult.affectedRows;
      console.log(`${updateStats.picking_tasks}件のpicking_tasksレコードを更新しました`);

      // picking_list テーブルの出荷番号を更新
      const [pickingListResult] = await connection.query(
        `UPDATE picking_list SET shipping_no = ? WHERE shipping_no = ?`,
        [newShippingNo, oldShippingNo],
      );
      updateStats.picking_list = pickingListResult.affectedRows;
      console.log(`${updateStats.picking_list}件のpicking_listレコードを更新しました`);

      // shipping_records テーブルの出荷番号を更新
      const [shippingRecordsResult] = await connection.query(
        `UPDATE shipping_records SET shipping_no = ? WHERE shipping_no = ?`,
        [newShippingNo, oldShippingNo],
      );
      updateStats.shipping_records = shippingRecordsResult.affectedRows;
      console.log(`${updateStats.shipping_records}件のshipping_recordsレコードを更新しました`);

      // order_daily テーブルの出荷番号を更新
      const [orderDailyResult] = await connection.query(
        `UPDATE order_daily SET shipping_no = ? WHERE shipping_no = ?`,
        [newShippingNo, oldShippingNo],
      );
      updateStats.order_daily = orderDailyResult.affectedRows;
      console.log(`${updateStats.order_daily}件のorder_dailyレコードを更新しました`);
    }

    await connection.commit();

    // 成功メッセージに統計情報を含める
    const summaryMessage =
      `出荷データを更新しました。` +
      (shipping_no_changed
        ? `更新件数: shipping_items(${updateStats.shipping_items}), ` +
          `picking_tasks(${updateStats.picking_tasks}), ` +
          `picking_list(${updateStats.picking_list}), ` +
          `shipping_records(${updateStats.shipping_records}), ` +
          `order_daily(${updateStats.order_daily})`
        : `更新件数: shipping_items(${updateStats.shipping_items})`);

    res.json(
      standardResponse(true, summaryMessage, {
        old_shipping_no: oldShippingNo,
        new_shipping_no: newShippingNo,
        update_stats: updateStats,
      }),
    );
  } catch (error) {
    await connection.rollback();
    console.error("updateShippingItemEnhancedでエラー:", error);
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました: " + error.message));
  } finally {
    connection.release();
  }
}

// 出荷番号の重複チェック関数
export async function validateShippingNoChange(req, res) {
  try {
    const { old_shipping_no, new_shipping_no } = req.body;

    if (!old_shipping_no || !new_shipping_no) {
      return res.status(400).json(standardResponse(false, "出荷番号が必要です"));
    }

    if (old_shipping_no === new_shipping_no) {
      return res.json(
        standardResponse(true, "出荷番号に変更はありません", {
          is_valid: true,
          needs_update: false,
        }),
      );
    }

    // 新しい出荷番号が既に存在するかチェック
    const [existingRows] = await db.query(
      `SELECT shipping_no FROM shipping_items WHERE shipping_no = ? AND shipping_no != ?`,
      [new_shipping_no, old_shipping_no],
    );

    if (existingRows.length > 0) {
      return res.json(
        standardResponse(false, "指定された出荷番号は既に存在します", {
          is_valid: false,
          needs_update: false,
        }),
      );
    }

    // 関連テーブルでの影響を確認
    const [relatedData] = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM picking_tasks WHERE shipping_no = ?) as picking_tasks_count,
        (SELECT COUNT(*) FROM picking_list WHERE shipping_no = ?) as picking_list_count,
        (SELECT COUNT(*) FROM shipping_records WHERE shipping_no = ?) as shipping_records_count,
        (SELECT COUNT(*) FROM order_daily WHERE shipping_no = ?) as order_daily_count
    `,
      [old_shipping_no, old_shipping_no, old_shipping_no, old_shipping_no],
    );

    res.json(
      standardResponse(true, "出荷番号の変更が可能です", {
        is_valid: true,
        needs_update: true,
        affected_tables: relatedData[0],
      }),
    );
  } catch (error) {
    console.error("validateShippingNoChangeでエラー:", error);
    res.status(500).json(standardResponse(false, "バリデーションエラーが発生しました"));
  }
}

// 出荷キャンセル (出荷取消)
export async function cancelShipping(req, res) {
  const connection = await db.getConnection();
  try {
    const { shipping_no } = req.params;

    if (!shipping_no) {
      return res.status(400).json(standardResponse(false, "出荷番号が必要です"));
    }

    await connection.beginTransaction();

    // レコードが存在するか確認 (检查记录是否存在)
    const [checkRows] = await connection.query(
      `SELECT * FROM shipping_items WHERE shipping_no = ?`,
      [shipping_no],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json(standardResponse(false, "出荷データが見つかりません"));
    }

    // 1. まず、picking_tasksテーブルから関連データを削除（shipping_no で照合）
    const [pickingTasksDeleteResult] = await connection.query(
      `DELETE FROM picking_tasks WHERE shipping_no = ?`,
      [shipping_no],
    );

    console.log(`${pickingTasksDeleteResult.affectedRows}件のpicking_tasksレコードを削除しました`);

    // 2. picking_listテーブルから関連データを削除（shipping_no で照合）
    const [pickingListDeleteResult] = await connection.query(
      `DELETE FROM picking_list WHERE shipping_no = ?`,
      [shipping_no],
    );

    console.log(`${pickingListDeleteResult.affectedRows}件のpicking_listレコードを削除しました`);

    // 3. order_dailyテーブルの出荷番号をクリア
    const [orderResult] = await connection.query(
      `UPDATE order_daily SET shipping_no = NULL WHERE shipping_no = ?`,
      [shipping_no],
    );

    console.log(`${orderResult.affectedRows}件のorder_dailyレコードの出荷番号をクリアしました`);

    // 4. 最後にshipping_itemsテーブルから削除
    const [deleteResult] = await connection.query(
      `DELETE FROM shipping_items WHERE shipping_no = ?`,
      [shipping_no],
    );

    console.log(`${deleteResult.affectedRows}件のshipping_itemsレコードを削除しました`);

    await connection.commit();
    res.json(standardResponse(true, "出荷をキャンセルしました"));
  } catch (error) {
    await connection.rollback();
    console.error("cancelShippingでエラー:", error); // Error in cancelShipping
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました: " + error.message));
  } finally {
    connection.release();
  }
}

// issueShippingメソッドは不要、テーブル構造にstatusフィールドがないため (不再需要issueShipping方法，因为表结构中没有status字段)
export async function issueShipping(req, res) {
  res
    .status(400)
    .json(standardResponse(false, "この機能は現在のデータベース構造ではサポートされていません"));
}

// 印刷記録の保存と状態更新
export async function recordPrintAndUpdateStatus(req, res) {
  try {
    const { shipping_numbers } = req.body;

    if (!Array.isArray(shipping_numbers) || shipping_numbers.length === 0) {
      return res.status(400).json(standardResponse(false, "出荷番号が必要です"));
    }

    // トランザクション開始
    await db.query("START TRANSACTION");

    try {
      // 1. shipping_recordsテーブルに印刷記録を保存
      for (const shipping_no of shipping_numbers) {
        // 重複チェック（同じ出荷番号で既に印刷記録がある場合はスキップ）
        const [existingRecord] = await db.query(
          "SELECT id FROM shipping_records WHERE shipping_no = ?",
          [shipping_no],
        );

        if (existingRecord.length === 0) {
          await db.query(
            `INSERT INTO shipping_records (shipping_no, status, created_at)
             VALUES (?, '発行済', NOW())`,
            [shipping_no],
          );
        }
      }

      // 2. shipping_itemsテーブルのstatusを'発行済'に更新
      const placeholders = shipping_numbers.map(() => "?").join(",");
      await db.query(
        `UPDATE shipping_items
         SET status = '発行済', updated_at = NOW()
         WHERE shipping_no IN (${placeholders})`,
        shipping_numbers,
      );

      // トランザクションのコミット
      await db.query("COMMIT");

      res.json(
        standardResponse(true, "印刷記録を保存し、状態を更新しました", {
          updated_count: shipping_numbers.length,
          shipping_numbers: shipping_numbers,
        }),
      );
    } catch (error) {
      // トランザクションのロールバック
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("印刷記録保存エラー:", error);
    res.status(500).json(standardResponse(false, "印刷記録の保存に失敗しました"));
  }
}

// 出荷一覧表データ取得 (获取出荷一览表数据)
export async function getShippingOverview(req, res) {
  try {
    const { date_from, date_to, destination_cds } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({ success: false, message: "日付範囲を指定してください" });
    }

    let query = `
      SELECT
        si.shipping_date,
        si.destination_cd,
        si.destination_name,
        si.product_name,
        si.confirmed_boxes AS quantity,
        si.confirmed_units AS units,
        si.box_type,
        si.delivery_date,
        si.shipping_no
      FROM
        shipping_items si
      WHERE
        si.shipping_date BETWEEN ? AND ?
    `;
    const params = [date_from, date_to];

    if (destination_cds) {
      const cds = destination_cds
        .split(",")
        .map((cd) => cd.trim())
        .filter(Boolean);
      if (cds.length > 0) {
        query += ` AND si.destination_cd IN (${cds.map(() => "?").join(",")})`;
        params.push(...cds);
      }
    }

    query += ` ORDER BY si.shipping_date, si.destination_name, si.shipping_no, si.product_name;`;

    const [rows] = await db.query(query, params);

    // 日付を 'YYYY-MM-DD' 形式にフォーマット
    const formattedData = rows.map((row) => ({
      ...row,
      shipping_date: row.shipping_date
        ? new Date(row.shipping_date).toISOString().split("T")[0]
        : null,
      delivery_date: row.delivery_date
        ? new Date(row.delivery_date).toISOString().split("T")[0]
        : null,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("getShippingOverviewでエラー:", error);
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました"));
  }
}

// 批量更新出荷番号 (批量更新出荷番号)
export async function batchUpdateShippingNo(req, res) {
  const connection = await db.getConnection();
  try {
    const { oldShippingNo, newShippingNo } = req.body;

    if (!oldShippingNo || !newShippingNo) {
      return res
        .status(400)
        .json(standardResponse(false, "古い出荷番号と新しい出荷番号が必要です"));
    }

    if (oldShippingNo === newShippingNo) {
      return res.status(400).json(standardResponse(false, "出荷番号に変更がありません"));
    }

    await connection.beginTransaction();

    // 新しい出荷番号が既に存在するかチェック
    const [existingRows] = await connection.query(
      `SELECT shipping_no FROM shipping_items WHERE shipping_no = ? LIMIT 1`,
      [newShippingNo],
    );

    if (existingRows.length > 0) {
      await connection.rollback();
      return res
        .status(400)
        .json(standardResponse(false, `出荷番号 ${newShippingNo} は既に存在します`));
    }

    // 古い出荷番号のレコードが存在するかチェック
    const [oldRows] = await connection.query(
      `SELECT shipping_no FROM shipping_items WHERE shipping_no = ?`,
      [oldShippingNo],
    );

    if (oldRows.length === 0) {
      await connection.rollback();
      return res.status(404).json(standardResponse(false, "更新対象の出荷データが見つかりません"));
    }

    // 1. shipping_itemsテーブルの出荷番号を更新
    const [shippingUpdateResult] = await connection.query(
      `UPDATE shipping_items SET shipping_no = ?, updated_at = CURRENT_TIMESTAMP WHERE shipping_no = ?`,
      [newShippingNo, oldShippingNo],
    );

    // 2. order_dailyテーブルの出荷番号も更新
    const [orderUpdateResult] = await connection.query(
      `UPDATE order_daily SET shipping_no = ? WHERE shipping_no = ?`,
      [newShippingNo, oldShippingNo],
    );

    // 3. picking_tasksテーブルの出荷番号も更新（shipping_no で照合）
    const [pickingTasksUpdateResult] = await connection.query(
      `UPDATE picking_tasks SET shipping_no = ? WHERE shipping_no = ?`,
      [newShippingNo, oldShippingNo],
    );

    // 4. picking_listテーブルの出荷番号も更新（shipping_no で照合）
    const [pickingListUpdateResult] = await connection.query(
      `UPDATE picking_list SET shipping_no = ? WHERE shipping_no = ?`,
      [newShippingNo, oldShippingNo],
    );

    // 5. shipping_recordsテーブルの出荷番号も更新
    const [recordUpdateResult] = await connection.query(
      `UPDATE shipping_records SET shipping_no = ? WHERE shipping_no = ?`,
      [newShippingNo, oldShippingNo],
    );

    await connection.commit();

    console.log(`出荷番号更新完了: ${oldShippingNo} -> ${newShippingNo}`);
    console.log(`- shipping_items: ${shippingUpdateResult.affectedRows}件`);
    console.log(`- order_daily: ${orderUpdateResult.affectedRows}件`);
    console.log(`- picking_tasks: ${pickingTasksUpdateResult.affectedRows}件`);
    console.log(`- picking_list: ${pickingListUpdateResult.affectedRows}件`);
    console.log(`- shipping_records: ${recordUpdateResult.affectedRows}件`);

    res.json(
      standardResponse(true, `出荷番号を ${oldShippingNo} から ${newShippingNo} に更新しました`, {
        updatedTables: {
          shipping_items: shippingUpdateResult.affectedRows,
          order_daily: orderUpdateResult.affectedRows,
          picking_tasks: pickingTasksUpdateResult.affectedRows,
          picking_list: pickingListUpdateResult.affectedRows,
          shipping_records: recordUpdateResult.affectedRows,
        },
      }),
    );
  } catch (error) {
    await connection.rollback();
    console.error("batchUpdateShippingNoでエラー:", error);
    res.status(500).json(standardResponse(false, "サーバーエラーが発生しました: " + error.message));
  } finally {
    connection.release();
  }
}
