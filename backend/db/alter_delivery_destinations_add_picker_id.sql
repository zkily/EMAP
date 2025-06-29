-- 为 delivery_destinations 表添加 picker_id 字段
ALTER TABLE delivery_destinations
ADD COLUMN picker_id VARCHAR(50) NULL COMMENT '担当者ID';

-- 添加索引
CREATE INDEX idx_picker_id ON delivery_destinations(picker_id); 