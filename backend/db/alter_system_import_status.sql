-- 在system_import_status表中添加last_update_seq字段，用于存储最新处理的完整_更新順值
ALTER TABLE `system_import_status` 
ADD COLUMN `last_update_seq` VARCHAR(50) NULL COMMENT '最終更新順序（Excel _更新順の完全値）' AFTER `last_register_time`; 