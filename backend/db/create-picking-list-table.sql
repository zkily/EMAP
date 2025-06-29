-- 创建picking_list表
CREATE TABLE IF NOT EXISTS picking_list (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    shipping_no_p VARCHAR(50) NOT NULL COMMENT '出荷項目唯一ID',
    shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
    product_cd VARCHAR(50) NOT NULL COMMENT '製品コード',
    product_name VARCHAR(100) NOT NULL COMMENT '製品名',
    confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '箱数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    
    -- 防止重复数据的唯一索引
    UNIQUE KEY uk_shipping_product (shipping_no_p, product_cd),
    INDEX idx_shipping_no (shipping_no),
    INDEX idx_product_cd (product_cd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ピッキングリスト データ保存用テーブル'; 