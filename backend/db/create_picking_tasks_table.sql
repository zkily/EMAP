-- 创建picking_tasks表（如果不存在）
CREATE TABLE IF NOT EXISTS picking_tasks (
    picking_id VARCHAR(20) PRIMARY KEY COMMENT 'ピッキングID（唯一标识）',
    shipping_no_p VARCHAR(50) NOT NULL COMMENT '出荷項目唯一ID（关联shipping_items表）',
    shipping_no VARCHAR(30) NOT NULL COMMENT '托盤番号（可重复）',
    product_cd VARCHAR(20) NOT NULL COMMENT '製品コード',
    product_name VARCHAR(100) NOT NULL COMMENT '製品名',
    confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '必要数量',
    picked_quantity INT NOT NULL DEFAULT 0 COMMENT 'ピッキング済み数量',
    location_cd VARCHAR(20) DEFAULT NULL COMMENT '保管場所コード',
    shelf_position VARCHAR(20) DEFAULT NULL COMMENT '棚位置',
    priority TINYINT NOT NULL DEFAULT 2 COMMENT '優先度（1:高 2:中 3:低）',
    status ENUM('pending', 'picking', 'completed', 'shortage', 'cancelled', '済') 
        NOT NULL DEFAULT 'pending' COMMENT '状態',
    picker_id VARCHAR(20) NOT NULL COMMENT 'ピッキング担当者ID',
    pallet_sequence INT NOT NULL DEFAULT 1 COMMENT '托盤内序列号',
    
    -- 时间字段
    start_time DATETIME DEFAULT NULL COMMENT 'ピッキング開始時間',
    complete_time DATETIME DEFAULT NULL COMMENT 'ピッキング完了時間',
    
    -- 库存不足相关
    shortage_reason TEXT DEFAULT NULL COMMENT '在庫不足理由',
    shortage_quantity INT DEFAULT NULL COMMENT '不足数量',
    shortage_reported_at DATETIME DEFAULT NULL COMMENT '不足報告時間',
    
    -- 备注和审计字段
    remarks TEXT DEFAULT NULL COMMENT '備考',
    created_by VARCHAR(20) NOT NULL COMMENT '作成者',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    
    -- 索引
    INDEX idx_shipping_no_p (shipping_no_p),
    INDEX idx_shipping_no (shipping_no),
    INDEX idx_product_cd (product_cd),
    INDEX idx_picker_id (picker_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_complete_time (complete_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ピッキング作業管理テーブル';

-- 为shipping_items表添加ピッキング状态字段（如果还没有）
ALTER TABLE shipping_items 
ADD COLUMN IF NOT EXISTS picking_status ENUM('not_generated', 'generated', 'in_progress', 'completed') 
DEFAULT 'not_generated' COMMENT 'ピッキング状態';

-- 复合索引：提高查询性能
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound1 ON picking_tasks (picker_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound2 ON picking_tasks (shipping_no, status);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound3 ON picking_tasks (status, created_at); 