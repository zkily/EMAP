-- 为stock_daily_trends表添加初期字段
ALTER TABLE `stock_daily_trends` 
ADD COLUMN `初期` int NULL DEFAULT 0 COMMENT '初期在庫数量' AFTER `date`; 