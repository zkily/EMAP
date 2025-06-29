-- 删除现有的唯一约束
ALTER TABLE `stock_transaction_logs` 
DROP INDEX `uniq_transaction`;

-- 添加新的唯一约束，包含update_seq字段
ALTER TABLE `stock_transaction_logs` 
ADD CONSTRAINT `uniq_transaction` UNIQUE KEY (`target_cd`, `transaction_time`, `transaction_type`, `update_seq`);

-- 同样修改归档表的唯一约束
ALTER TABLE `stock_transaction_logs_archive` 
DROP INDEX `uniq_transaction`;

ALTER TABLE `stock_transaction_logs_archive` 
ADD CONSTRAINT `uniq_transaction` UNIQUE KEY (`target_cd`, `transaction_time`, `transaction_type`, `update_seq`); 