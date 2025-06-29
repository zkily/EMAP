-- 出荷印刷記録テーブル
CREATE TABLE IF NOT EXISTS shipping_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
  status VARCHAR(20) NOT NULL DEFAULT '発行済' COMMENT '状態',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '印刷日時',
  INDEX idx_shipping_no (shipping_no),
  INDEX idx_created_at (created_at)
) COMMENT='出荷印刷記録'; 