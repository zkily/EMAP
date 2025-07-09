-- 为stock_transaction_logs表的transaction_type字段添加初期枚举值
ALTER TABLE `stock_transaction_logs` 
MODIFY COLUMN `transaction_type` enum('入庫','出庫','調整','廃棄','保留','実績','初期') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作種別';

-- 为stock_transaction_logs_archive表的transaction_type字段也添加初期枚举值
ALTER TABLE `stock_transaction_logs_archive` 
MODIFY COLUMN `transaction_type` enum('入庫','出庫','調整','廃棄','保留','実績','初期') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作種別'; 