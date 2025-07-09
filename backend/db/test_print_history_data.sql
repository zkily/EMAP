-- 测试打印历史数据
-- 插入一些测试数据来验证日历界面的"発行済"状态显示

-- 清除现有的测试数据（可选）
DELETE FROM print_history WHERE report_type = 'shipping_calendar' AND user_name = '测试用户';

-- 插入测试数据
INSERT INTO print_history (
  report_type, 
  report_title, 
  user_name, 
  filters, 
  record_count, 
  status,
  print_date
) VALUES 
-- 2025年1月的一些测试数据
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-1-8 鈴鹿便',
  '测试用户',
  '{"dateRange": ["2025-01-08", "2025-01-08"], "destinationCds": ["DEST002"], "selectedGroup": 1}',
  5,
  '成功',
  '2025-01-08 10:30:00'
),
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-1-10 オワリ便',
  '测试用户',
  '{"dateRange": ["2025-01-10", "2025-01-10"], "destinationCds": ["DEST001"], "selectedGroup": 0}',
  3,
  '成功',
  '2025-01-10 14:20:00'
),
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-1-15 社内便',
  '测试用户',
  '{"dateRange": ["2025-01-15", "2025-01-15"], "destinationCds": ["DEST003"], "selectedGroup": 2}',
  8,
  '成功',
  '2025-01-15 09:45:00'
),
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-1-15 鈴鹿便',
  '测试用户',
  '{"dateRange": ["2025-01-15", "2025-01-15"], "destinationCds": ["DEST002"], "selectedGroup": 1}',
  4,
  '成功',
  '2025-01-15 16:10:00'
),
-- 2025年2月的一些测试数据
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-2-5 オワリ便',
  '测试用户',
  '{"dateRange": ["2025-02-05", "2025-02-05"], "destinationCds": ["DEST001"], "selectedGroup": 0}',
  6,
  '成功',
  '2025-02-05 11:20:00'
),
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2025-2-12 鈴鹿便',
  '测试用户',
  '{"dateRange": ["2025-02-12", "2025-02-12"], "destinationCds": ["DEST002"], "selectedGroup": 1}',
  2,
  '成功',
  '2025-02-12 13:35:00'
);

-- 验证插入的数据
SELECT 
  id,
  report_type,
  report_title,
  user_name,
  print_date,
  status
FROM print_history 
WHERE report_type = 'shipping_calendar' 
  AND user_name = '测试用户'
ORDER BY print_date DESC;

-- 显示统计信息
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = '成功' THEN 1 END) as success_count,
  COUNT(DISTINCT DATE(print_date)) as unique_dates
FROM print_history 
WHERE report_type = 'shipping_calendar' 
  AND user_name = '测试用户'; 