-- ピッキング履歴デモデータ
-- 作成日: 2024年

-- 先清理现有数据（可选）
-- DELETE FROM picking_tasks;

-- 插入演示用户数据（如果不存在）
INSERT IGNORE INTO users (username, password, name, role, status) VALUES
('picker001', '$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu', '田中太郎', 'picker', 1),
('picker002', '$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu', '佐藤花子', 'picker', 1),
('picker003', '$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu', '鈴木一郎', 'picker', 1),
('picker004', '$2b$10$6TUuWRcTZJBfhCKWDbcR9eKzydQbNIHzsmWLJ7EgOXEh5TRyFmKUu', '高橋美咲', 'picker', 1);

-- 插入演示ピッキング任务数据
INSERT INTO picking_tasks (
  picking_id, shipping_no_p, shipping_no, product_cd, product_name,
  confirmed_boxes, picked_quantity, location_cd, shelf_position,
  priority, status, picker_id, pallet_sequence,
  start_time, complete_time, remarks, created_by, created_at
) VALUES

-- 今日完成的任务
('PKG20241201001', 'SHP001-001', 'PAL001', 'P001', '製品A', 10, 10, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1, 
 '2024-12-01 08:30:00', '2024-12-01 08:45:00', '正常完了', 'admin', '2024-12-01 08:00:00'),

('PKG20241201002', 'SHP001-002', 'PAL001', 'P002', '製品B', 5, 5, 'A-01', 'A-01-02', 1, 'completed', 'picker001', 2,
 '2024-12-01 08:45:00', '2024-12-01 09:00:00', '正常完了', 'admin', '2024-12-01 08:00:00'),

('PKG20241201003', 'SHP002-001', 'PAL002', 'P003', '製品C', 8, 6, 'B-02', 'B-02-01', 2, 'shortage', 'picker002', 1,
 '2024-12-01 09:00:00', '2024-12-01 09:20:00', '在庫不足により6個のみピッキング', 'admin', '2024-12-01 08:30:00'),

('PKG20241201004', 'SHP003-001', 'PAL003', 'P004', '製品D', 12, 12, 'C-03', 'C-03-01', 2, 'completed', 'picker003', 1,
 '2024-12-01 09:30:00', '2024-12-01 09:50:00', '正常完了', 'admin', '2024-12-01 09:00:00'),

('PKG20241201005', 'SHP004-001', 'PAL004', 'P005', '製品E', 15, 0, 'D-04', 'D-04-01', 3, 'cancelled', 'picker004', 1,
 '2024-12-01 10:00:00', '2024-12-01 10:05:00', 'オーダーキャンセルのため中止', 'admin', '2024-12-01 09:30:00'),

-- 昨日完成的任务
('PKG20241130001', 'SHP005-001', 'PAL005', 'P001', '製品A', 20, 20, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1,
 '2024-11-30 14:00:00', '2024-11-30 14:25:00', '正常完了', 'admin', '2024-11-30 13:30:00'),

('PKG20241130002', 'SHP006-001', 'PAL006', 'P002', '製品B', 8, 8, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1,
 '2024-11-30 14:30:00', '2024-11-30 14:45:00', '正常完了', 'admin', '2024-11-30 14:00:00'),

('PKG20241130003', 'SHP007-001', 'PAL007', 'P003', '製品C', 6, 6, 'B-02', 'B-02-01', 1, 'completed', 'picker003', 1,
 '2024-11-30 15:00:00', '2024-11-30 15:12:00', '正常完了', 'admin', '2024-11-30 14:30:00'),

('PKG20241130004', 'SHP008-001', 'PAL008', 'P004', '製品D', 10, 8, 'C-03', 'C-03-01', 2, 'shortage', 'picker004', 1,
 '2024-11-30 15:30:00', '2024-11-30 15:50:00', '在庫不足により8個のみピッキング', 'admin', '2024-11-30 15:00:00'),

-- 一周前的任务
('PKG20241125001', 'SHP009-001', 'PAL009', 'P001', '製品A', 25, 25, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1,
 '2024-11-25 10:00:00', '2024-11-25 10:30:00', '正常完了', 'admin', '2024-11-25 09:30:00'),

('PKG20241125002', 'SHP010-001', 'PAL010', 'P002', '製品B', 12, 12, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1,
 '2024-11-25 11:00:00', '2024-11-25 11:20:00', '正常完了', 'admin', '2024-11-25 10:30:00'),

('PKG20241125003', 'SHP011-001', 'PAL011', 'P005', '製品E', 18, 18, 'D-04', 'D-04-01', 1, 'completed', 'picker003', 1,
 '2024-11-25 13:00:00', '2024-11-25 13:35:00', '正常完了', 'admin', '2024-11-25 12:30:00'),

-- 待機中の任务
('PKG20241201006', 'SHP012-001', 'PAL012', 'P001', '製品A', 15, 0, 'A-01', 'A-01-01', 1, 'pending', 'picker001', 1,
 NULL, NULL, NULL, 'admin', '2024-12-01 10:30:00'),

('PKG20241201007', 'SHP013-001', 'PAL013', 'P002', '製品B', 10, 0, 'A-01', 'A-01-02', 2, 'pending', 'picker002', 1,
 NULL, NULL, NULL, 'admin', '2024-12-01 10:45:00'),

('PKG20241201008', 'SHP014-001', 'PAL014', 'P003', '製品C', 7, 0, 'B-02', 'B-02-01', 2, 'pending', 'picker003', 1,
 NULL, NULL, NULL, 'admin', '2024-12-01 11:00:00'),

-- ピッキング中の任务
('PKG20241201009', 'SHP015-001', 'PAL015', 'P004', '製品D', 20, 5, 'C-03', 'C-03-01', 1, 'picking', 'picker004', 1,
 '2024-12-01 11:30:00', NULL, 'ピッキング進行中', 'admin', '2024-12-01 11:15:00'),

('PKG20241201010', 'SHP016-001', 'PAL016', 'P005', '製品E', 14, 8, 'D-04', 'D-04-01', 2, 'picking', 'picker001', 1,
 '2024-12-01 12:00:00', NULL, 'ピッキング進行中', 'admin', '2024-12-01 11:45:00'),

-- 月初のデータ（月別統計用）
('PKG20241101001', 'SHP017-001', 'PAL017', 'P001', '製品A', 30, 30, 'A-01', 'A-01-01', 1, 'completed', 'picker001', 1,
 '2024-11-01 09:00:00', '2024-11-01 09:40:00', '正常完了', 'admin', '2024-11-01 08:30:00'),

('PKG20241101002', 'SHP018-001', 'PAL018', 'P002', '製品B', 16, 16, 'A-01', 'A-01-02', 2, 'completed', 'picker002', 1,
 '2024-11-01 10:00:00', '2024-11-01 10:25:00', '正常完了', 'admin', '2024-11-01 09:30:00'),

('PKG20241101003', 'SHP019-001', 'PAL019', 'P003', '製品C', 22, 20, 'B-02', 'B-02-01', 1, 'shortage', 'picker003', 1,
 '2024-11-01 11:00:00', '2024-11-01 11:30:00', '在庫不足により20個のみピッキング', 'admin', '2024-11-01 10:30:00'),

-- 前月のデータ
('PKG20241015001', 'SHP020-001', 'PAL020', 'P004', '製品D', 18, 18, 'C-03', 'C-03-01', 2, 'completed', 'picker004', 1,
 '2024-10-15 14:00:00', '2024-10-15 14:30:00', '正常完了', 'admin', '2024-10-15 13:30:00'),

('PKG20241015002', 'SHP021-001', 'PAL021', 'P005', '製品E', 24, 24, 'D-04', 'D-04-01', 1, 'completed', 'picker001', 1,
 '2024-10-15 15:00:00', '2024-10-15 15:45:00', '正常完了', 'admin', '2024-10-15 14:30:00');

-- 更新统计信息
UPDATE picking_tasks SET updated_at = NOW() WHERE updated_at IS NULL;

-- 显示插入结果
SELECT 
  '插入完了' as message,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
  SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as picking_tasks,
  SUM(CASE WHEN status = 'shortage' THEN 1 ELSE 0 END) as shortage_tasks,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks
FROM picking_tasks; 