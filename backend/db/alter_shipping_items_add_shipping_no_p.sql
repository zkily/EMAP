-- 为 shipping_items 表添加 shipping_no_p 字段
ALTER TABLE shipping_items 
ADD COLUMN IF NOT EXISTS shipping_no_p VARCHAR(50) NULL DEFAULT NULL COMMENT '出荷項目唯一ID' 
AFTER shipping_no;

-- 添加索引以提高查询性能
ALTER TABLE shipping_items 
ADD INDEX IF NOT EXISTS idx_shipping_no_p (shipping_no_p); 