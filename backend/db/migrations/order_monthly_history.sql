-- order_monthly_history表の作成

CREATE TABLE IF NOT EXISTS `order_monthly_history` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '履歴ID',
  `order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '受注ID',
  `snapshot_date` date NOT NULL COMMENT '快照日期',
  `record_month` int NOT NULL COMMENT '记录月份',
  `record_year` int NOT NULL COMMENT '记录年份',
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先CD',
  `destination_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先名',
  `year` int NOT NULL COMMENT '订单年',
  `month` int NOT NULL COMMENT '订单月',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品名',
  `product_alias` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '製品別名',
  `forecast_units` int NULL DEFAULT 0 COMMENT '内示本数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_history_snapshot`(`order_id` ASC, `snapshot_date` ASC) USING BTREE,
  INDEX `idx_order_history_record`(`record_year` ASC, `record_month` ASC) USING BTREE,
  INDEX `idx_order_history_order`(`year` ASC, `month` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '月別受注履歴テーブル' ROW_FORMAT = DYNAMIC; 