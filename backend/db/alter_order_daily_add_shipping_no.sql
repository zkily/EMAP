-- 为 order_daily 表添加 shipping_no 字段
ALTER TABLE order_daily 
ADD COLUMN shipping_no VARCHAR(50) NULL DEFAULT NULL COMMENT '出荷番号' 
AFTER confirmed_units;

-- 添加索引以提高查询性能
ALTER TABLE order_daily 
ADD INDEX idx_shipping_no (shipping_no);

-- 添加索引以提高检测未ピッキング数据的查询性能
ALTER TABLE order_daily 
ADD INDEX idx_confirmed_boxes_shipping_no (confirmed_boxes, shipping_no); 