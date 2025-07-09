-- 初始化打印历史表
-- 如果表不存在则创建，如果存在则跳过

-- 创建打印历史表
CREATE TABLE IF NOT EXISTS print_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL COMMENT '报告类型',
  report_title VARCHAR(255) NOT NULL COMMENT '报告标题',
  user_id INT NULL COMMENT '用户ID',
  user_name VARCHAR(100) NOT NULL COMMENT '用户名',
  print_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '打印时间',
  filters JSON NULL COMMENT '过滤条件',
  record_count INT DEFAULT 0 COMMENT '记录数量',
  status ENUM('成功', '失败', '取消') DEFAULT '成功' COMMENT '状态',
  error_message TEXT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_report_type (report_type),
  INDEX idx_user_id (user_id),
  INDEX idx_print_date (print_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打印历史表';

-- 插入一些测试数据（可选）
INSERT IGNORE INTO print_history (
  report_type, 
  report_title, 
  user_name, 
  filters, 
  record_count, 
  status
) VALUES 
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2024-01-15 オワリ便',
  'テストユーザー',
  '{"dateRange": ["2024-01-15", "2024-01-15"], "destinationCds": ["DEST001"], "selectedGroup": 0}',
  5,
  '成功'
),
(
  'shipping_calendar',
  '出荷報告書カレンダー - 2024-01-16 鈴鹿便',
  'テストユーザー',
  '{"dateRange": ["2024-01-16", "2024-01-16"], "destinationCds": ["DEST002"], "selectedGroup": 1}',
  3,
  '成功'
);

-- 验证表创建成功
SELECT 'print_history table created successfully' as message;
SELECT COUNT(*) as record_count FROM print_history; 