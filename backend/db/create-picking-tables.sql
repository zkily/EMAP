-- 出荷ピッキング管理系统数据库表结构
-- 创建日期: 2024年

-- ========== ピッキング任务表 ==========
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
    status ENUM('pending', 'picking', 'completed', 'shortage', 'cancelled') 
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
    updated_by VARCHAR(20) DEFAULT NULL COMMENT '更新者',
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    
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

-- ========== ピッキング履歴表 ==========
CREATE TABLE IF NOT EXISTS picking_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '履歴ID',
    picking_id VARCHAR(20) NOT NULL COMMENT 'ピッキングID',
    action_type ENUM('created', 'started', 'quantity_updated', 'completed', 'shortage_reported', 'cancelled') 
        NOT NULL COMMENT 'アクション種別',
    action_description TEXT DEFAULT NULL COMMENT 'アクション説明',
    old_values JSON DEFAULT NULL COMMENT '変更前の値',
    new_values JSON DEFAULT NULL COMMENT '変更後の値',
    action_by VARCHAR(20) NOT NULL COMMENT 'アクション実行者',
    action_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'アクション実行時間',
    
    INDEX idx_picking_id (picking_id),
    INDEX idx_action_type (action_type),
    INDEX idx_action_at (action_at),
    INDEX idx_action_by (action_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ピッキング作業履歴テーブル';

-- ========== ピッキング统计表（可选，用于性能优化） ==========
CREATE TABLE IF NOT EXISTS picking_stats_daily (
    stat_date DATE PRIMARY KEY COMMENT '統計日付',
    picker_id VARCHAR(20) NOT NULL COMMENT 'ピッキング担当者ID',
    total_tasks INT NOT NULL DEFAULT 0 COMMENT '総作業数',
    completed_tasks INT NOT NULL DEFAULT 0 COMMENT '完了作業数',
    shortage_tasks INT NOT NULL DEFAULT 0 COMMENT '在庫不足作業数',
    total_quantity INT NOT NULL DEFAULT 0 COMMENT '総数量',
    picked_quantity INT NOT NULL DEFAULT 0 COMMENT 'ピッキング済み数量',
    total_work_time INT NOT NULL DEFAULT 0 COMMENT '総作業時間（分）',
    avg_work_time DECIMAL(10,2) DEFAULT NULL COMMENT '平均作業時間（分）',
    efficiency_score DECIMAL(10,2) DEFAULT NULL COMMENT '効率スコア',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    
    UNIQUE KEY idx_date_picker (stat_date, picker_id),
    INDEX idx_picker_id (picker_id),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='ピッキング日別統計テーブル';

-- ========== 为现有表添加字段（如果需要） ==========

-- 为shipping_items表添加ピッキング状态字段（如果还没有）
ALTER TABLE shipping_items 
ADD COLUMN IF NOT EXISTS picking_status ENUM('not_generated', 'generated', 'in_progress', 'completed') 
DEFAULT 'not_generated' COMMENT 'ピッキング状態';

-- 为products表添加条码字段（如果还没有）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) DEFAULT NULL COMMENT '製品バーコード',
ADD INDEX IF NOT EXISTS idx_barcode (barcode);

-- 为product_stock表添加货架位置字段（如果还没有）
ALTER TABLE product_stock 
ADD COLUMN IF NOT EXISTS shelf_position VARCHAR(20) DEFAULT NULL COMMENT '棚位置';

-- ========== 触发器：自动更新ピッキング状态 ==========
DELIMITER $$

-- 当ピッキング任务创建时，更新shipping_items的状态
CREATE TRIGGER IF NOT EXISTS tr_picking_tasks_after_insert
AFTER INSERT ON picking_tasks
FOR EACH ROW
BEGIN
    UPDATE shipping_items 
    SET picking_status = 'generated'
    WHERE shipping_no_p = NEW.shipping_no_p;
END$$

-- 当ピッキング任务状态更新时，同步更新shipping_items状态
CREATE TRIGGER IF NOT EXISTS tr_picking_tasks_after_update
AFTER UPDATE ON picking_tasks
FOR EACH ROW
BEGIN
    DECLARE pallet_status VARCHAR(20);
    
    -- 检查托盘内所有任务的状态
    SELECT CASE 
        WHEN COUNT(*) = SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) THEN 'completed'
        WHEN SUM(CASE WHEN status IN ('picking', 'shortage') THEN 1 ELSE 0 END) > 0 THEN 'in_progress'
        ELSE 'generated'
    END INTO pallet_status
    FROM picking_tasks 
    WHERE shipping_no = NEW.shipping_no;
    
    -- 更新shipping_items状态
    UPDATE shipping_items 
    SET picking_status = pallet_status
    WHERE shipping_no = NEW.shipping_no;
END$$

-- 记录ピッキング任务的变更历史
CREATE TRIGGER IF NOT EXISTS tr_picking_tasks_history
AFTER UPDATE ON picking_tasks
FOR EACH ROW
BEGIN
    INSERT INTO picking_history (
        picking_id, action_type, action_description, 
        old_values, new_values, action_by
    ) VALUES (
        NEW.picking_id,
        CASE 
            WHEN OLD.status = 'pending' AND NEW.status = 'picking' THEN 'started'
            WHEN OLD.picked_quantity != NEW.picked_quantity THEN 'quantity_updated'
            WHEN OLD.status != 'completed' AND NEW.status = 'completed' THEN 'completed'
            WHEN OLD.status != 'shortage' AND NEW.status = 'shortage' THEN 'shortage_reported'
            WHEN OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN 'cancelled'
            ELSE 'updated'
        END,
        CONCAT('状態変更: ', OLD.status, ' → ', NEW.status),
        JSON_OBJECT(
            'status', OLD.status,
            'picked_quantity', OLD.picked_quantity,
            'remarks', OLD.remarks
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'picked_quantity', NEW.picked_quantity,
            'remarks', NEW.remarks
        ),
        NEW.updated_by
    );
END$$

DELIMITER ;

-- ========== 初始化数据 ==========

-- 插入一些示例ピッキング担当者（如果users表中没有的话）
INSERT IGNORE INTO users (user_id, user_name, email, role, department, is_active) VALUES
('picker001', 'ピッキング作業者A', 'picker001@company.com', 'picker', 'warehouse', 1),
('picker002', 'ピッキング作業者B', 'picker002@company.com', 'picker', 'warehouse', 1),
('picker003', 'ピッキング作業者C', 'picker003@company.com', 'picker', 'warehouse', 1);

-- ========== 索引优化建议 ==========

-- 复合索引：提高查询性能
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound1 ON picking_tasks (picker_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound2 ON picking_tasks (shipping_no, status);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_compound3 ON picking_tasks (status, created_at);

-- ========== 视图：便于查询 ==========

-- ピッキング作业概览视图
CREATE OR REPLACE VIEW v_picking_overview AS
SELECT 
    pt.picking_id,
    pt.shipping_no_p,
    pt.shipping_no,
    pt.product_cd,
    pt.product_name,
    pt.confirmed_boxes,
    pt.picked_quantity,
    pt.location_cd,
    pt.shelf_position,
    pt.priority,
    pt.status,
    pt.picker_id,
    u.user_name as picker_name,
    pt.start_time,
    pt.complete_time,
    TIMESTAMPDIFF(MINUTE, pt.start_time, COALESCE(pt.complete_time, NOW())) as work_duration,
    si.shipping_date,
    si.delivery_date,
    si.destination_cd,
    d.destination_name
FROM picking_tasks pt
LEFT JOIN users u ON pt.picker_id = u.user_id
LEFT JOIN shipping_items si ON pt.shipping_no_p = si.shipping_no_p
LEFT JOIN destinations d ON si.destination_cd = d.destination_cd;

-- 托盤進捗视图
CREATE OR REPLACE VIEW v_pallet_progress AS
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
    pt.picker_id,
    u.user_name as picker_name,
    MIN(pt.start_time) as start_time,
    MAX(pt.complete_time) as complete_time,
    ROUND((SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as completion_rate
FROM picking_tasks pt
LEFT JOIN users u ON pt.picker_id = u.user_id
WHERE pt.status IN ('pending', 'picking', 'completed', 'shortage')
GROUP BY pt.shipping_no, pt.picker_id, u.user_name;

-- ========== 存储过程：日别统计更新 ==========
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_update_daily_picking_stats(IN target_date DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_picker_id VARCHAR(20);
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT picker_id FROM picking_tasks 
        WHERE DATE(created_at) = target_date;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_picker_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO picking_stats_daily (
            stat_date, picker_id, total_tasks, completed_tasks, shortage_tasks,
            total_quantity, picked_quantity, total_work_time, avg_work_time, efficiency_score
        )
        SELECT 
            target_date,
            v_picker_id,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN status = 'shortage' THEN 1 ELSE 0 END) as shortage_tasks,
            SUM(confirmed_boxes) as total_quantity,
            SUM(picked_quantity) as picked_quantity,
            SUM(TIMESTAMPDIFF(MINUTE, start_time, complete_time)) as total_work_time,
            AVG(TIMESTAMPDIFF(MINUTE, start_time, complete_time)) as avg_work_time,
            ROUND((SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as efficiency_score
        FROM picking_tasks 
        WHERE picker_id = v_picker_id 
        AND DATE(created_at) = target_date
        ON DUPLICATE KEY UPDATE
            total_tasks = VALUES(total_tasks),
            completed_tasks = VALUES(completed_tasks),
            shortage_tasks = VALUES(shortage_tasks),
            total_quantity = VALUES(total_quantity),
            picked_quantity = VALUES(picked_quantity),
            total_work_time = VALUES(total_work_time),
            avg_work_time = VALUES(avg_work_time),
            efficiency_score = VALUES(efficiency_score),
            updated_at = NOW();
            
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- ========== 权限设置 ==========

-- 为ピッキング管理创建专门的权限
INSERT IGNORE INTO permissions (permission_id, permission_name, description, module) VALUES
('picking_view', 'ピッキング閲覧', 'ピッキング情報の閲覧権限', 'picking'),
('picking_create', 'ピッキング作成', 'ピッキングリスト作成権限', 'picking'),
('picking_execute', 'ピッキング実行', 'ピッキング作業実行権限', 'picking'),
('picking_manage', 'ピッキング管理', 'ピッキング管理権限', 'picking'),
('picking_report', 'ピッキング報告', 'ピッキング報告・分析権限', 'picking');

-- 注释：
-- 1. 此脚本创建了完整的ピッキング管理系统数据库结构
-- 2. 包含主表、历史表、统计表和相关视图
-- 3. 添加了触发器来自动维护数据一致性
-- 4. 包含了索引优化和权限设置
-- 5. 可根据实际需求调整字段类型和长度 