-- 在stock_transaction_logs表中添加update_seq字段，用于存储完整的_更新順值
ALTER TABLE `stock_transaction_logs` 
ADD COLUMN `update_seq` VARCHAR(50) NULL COMMENT '更新順序（Excel _更新順フィールド値）' AFTER `transaction_time`;

-- 如果需要在archive表中也添加相同字段
ALTER TABLE `stock_transaction_logs_archive` 
ADD COLUMN `update_seq` VARCHAR(50) NULL COMMENT '更新順序（Excel _更新順フィールド値）' AFTER `transaction_time`;

-- 对update_seq字段添加索引以提高查询性能
CREATE INDEX `idx_update_seq` ON `stock_transaction_logs` (`update_seq`);
CREATE INDEX `idx_update_seq` ON `stock_transaction_logs_archive` (`update_seq`); 