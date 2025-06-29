// 快速演示数据插入脚本
import { query } from "../db/connection.js";

async function quickInsertDemo() {
  try {
    console.log("🚀 快速デモデータ挿入開始...\n");

    // 先清理现有的演示数据
    console.log("🧹 既存のデモデータクリア中...");
    await query('DELETE FROM picking_tasks WHERE picking_id LIKE "PKG2024%"');
    console.log("✅ クリア完了");

    // 插入演示数据
    console.log("📋 ピッキングタスクデータ挿入中...");

    // 今日完成的任务
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241201001', 'SHP001-001', 'PAL001', 'P001', '製品A', 10, 10, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1, '2024-12-01 08:30:00', '2024-12-01 08:45:00', '正常完了', 'admin'),
    ('PKG20241201002', 'SHP001-002', 'PAL001', 'P002', '製品B', 5, 5, 'A-01', 'A-01-02', 1, 'completed', 'picker001', 2, '2024-12-01 08:45:00', '2024-12-01 09:00:00', '正常完了', 'admin'),
    ('PKG20241201003', 'SHP002-001', 'PAL002', 'P003', '製品C', 8, 6, 'B-02', 'B-02-01', 2, 'completed', 'picker002', 1, '2024-12-01 09:00:00', '2024-12-01 09:20:00', '正常完了', 'admin'),
    ('PKG20241201004', 'SHP003-001', 'PAL003', 'P004', '製品D', 12, 12, 'C-03', 'C-03-01', 2, 'completed', 'picker003', 1, '2024-12-01 09:30:00', '2024-12-01 09:50:00', '正常完了', 'admin')`);

    // 昨日完成的任务
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241130001', 'SHP005-001', 'PAL005', 'P001', '製品A', 20, 20, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1, '2024-11-30 14:00:00', '2024-11-30 14:25:00', '正常完了', 'admin'),
    ('PKG20241130002', 'SHP006-001', 'PAL006', 'P002', '製品B', 8, 8, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1, '2024-11-30 14:30:00', '2024-11-30 14:45:00', '正常完了', 'admin'),
    ('PKG20241130003', 'SHP007-001', 'PAL007', 'P003', '製品C', 6, 6, 'B-02', 'B-02-01', 1, 'completed', 'picker003', 1, '2024-11-30 15:00:00', '2024-11-30 15:12:00', '正常完了', 'admin')`);

    // 一周前的任务
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241125001', 'SHP009-001', 'PAL009', 'P001', '製品A', 25, 25, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1, '2024-11-25 10:00:00', '2024-11-25 10:30:00', '正常完了', 'admin'),
    ('PKG20241125002', 'SHP010-001', 'PAL010', 'P002', '製品B', 12, 12, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1, '2024-11-25 11:00:00', '2024-11-25 11:20:00', '正常完了', 'admin'),
    ('PKG20241125003', 'SHP011-001', 'PAL011', 'P005', '製品E', 18, 18, 'D-04', 'D-04-01', 1, 'completed', 'picker003', 1, '2024-11-25 13:00:00', '2024-11-25 13:35:00', '正常完了', 'admin')`);

    // 待機中の任务
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241201006', 'SHP012-001', 'PAL012', 'P001', '製品A', 15, 0, 'A-01', 'A-01-01', 1, 'pending', 'picker001', 1, NULL, NULL, NULL, 'admin'),
    ('PKG20241201007', 'SHP013-001', 'PAL013', 'P002', '製品B', 10, 0, 'A-01', 'A-01-02', 2, 'pending', 'picker002', 1, NULL, NULL, NULL, 'admin'),
    ('PKG20241201008', 'SHP014-001', 'PAL014', 'P003', '製品C', 7, 0, 'B-02', 'B-02-01', 2, 'pending', 'picker003', 1, NULL, NULL, NULL, 'admin')`);

    // ピッキング中の任务
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241201009', 'SHP015-001', 'PAL015', 'P004', '製品D', 20, 5, 'C-03', 'C-03-01', 1, 'picking', 'picker004', 1, '2024-12-01 11:30:00', NULL, 'ピッキング進行中', 'admin'),
    ('PKG20241201010', 'SHP016-001', 'PAL016', 'P005', '製品E', 14, 8, 'D-04', 'D-04-01', 2, 'picking', 'picker001', 1, '2024-12-01 12:00:00', NULL, 'ピッキング進行中', 'admin')`);

    // 月初のデータ（月別統計用）
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241101001', 'SHP017-001', 'PAL017', 'P001', '製品A', 30, 30, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1, '2024-11-01 09:00:00', '2024-11-01 09:40:00', '正常完了', 'admin'),
    ('PKG20241101002', 'SHP018-001', 'PAL018', 'P002', '製品B', 16, 16, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1, '2024-11-01 10:00:00', '2024-11-01 10:25:00', '正常完了', 'admin')`);

    // 前月のデータ
    await query(`INSERT INTO picking_tasks (
      picking_id, shipping_no_p, shipping_no, product_cd, product_name,
      confirmed_boxes, picked_quantity, location_cd, shelf_position,
      priority, status, picker_id, pallet_sequence,
      start_time, complete_time, remarks, created_by
    ) VALUES
    ('PKG20241015001', 'SHP020-001', 'PAL020', 'P004', '製品D', 18, 18, 'C-03', 'C-03-01', 2, 'completed', 'picker004', 1, '2024-10-15 14:00:00', '2024-10-15 14:30:00', '正常完了', 'admin'),
    ('PKG20241015002', 'SHP021-001', 'PAL021', 'P005', '製品E', 24, 24, 'D-04', 'D-04-01', 1, 'completed', 'picker001', 1, '2024-10-15 15:00:00', '2024-10-15 15:45:00', '正常完了', 'admin')`);

    console.log("✅ ピッキングタスクデータ挿入完了");

    // 显示插入结果
    const results = await query(`
      SELECT
        '挿入完了' as message,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as picking_tasks
      FROM picking_tasks
      WHERE picking_id LIKE 'PKG2024%'
    `);

    console.log("\n📊 挿入結果:");
    console.log(results[0]);
    console.log("\n🎉 デモデータ挿入が完了しました！");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.error("スタックトレース:", error.stack);
  }
}

// 実行
quickInsertDemo();
