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