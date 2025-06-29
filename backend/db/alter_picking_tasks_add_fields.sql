-- 为picking_tasks表添加缺失的字段
ALTER TABLE picking_tasks 
ADD COLUMN IF NOT EXISTS shipping_date DATE COMMENT '出荷日' AFTER shipping_no,
ADD COLUMN IF NOT EXISTS delivery_date DATE COMMENT '納期' AFTER shipping_date,
ADD COLUMN IF NOT EXISTS destination_cd VARCHAR(20) COMMENT '納入先コード' AFTER delivery_date,
ADD COLUMN IF NOT EXISTS destination_name VARCHAR(100) COMMENT '納入先名' AFTER destination_cd;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_picking_tasks_shipping_date ON picking_tasks (shipping_date);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_delivery_date ON picking_tasks (delivery_date);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_destination_cd ON picking_tasks (destination_cd); 