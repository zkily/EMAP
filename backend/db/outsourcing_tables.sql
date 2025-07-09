-- 外注管理モジュール用テーブル作成SQL
-- 外注管理の核心モジュール：プロセス可視化、在庫精度、コスト制御、品質追跡

-- 1. 外注厂商能力矩阵表
DROP TABLE IF EXISTS `outsourcing_supplier_capabilities`;
CREATE TABLE `outsourcing_supplier_capabilities` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `process_cd` varchar(50) NOT NULL COMMENT '工程CD',
  `capability_level` enum('A','B','C','D') DEFAULT 'C' COMMENT '能力レベル（A:優秀、B:良好、C:普通、D:要改善）',
  `monthly_capacity` int DEFAULT 0 COMMENT '月間処理能力（個/月）',
  `lead_time_days` int DEFAULT 0 COMMENT 'リードタイム（日）',
  `quality_rating` decimal(3,2) DEFAULT 0.00 COMMENT '品質評価（0.00-1.00）',
  `cost_rating` enum('高','中','低') DEFAULT '中' COMMENT 'コスト評価',
  `certification_info` text COMMENT '認証情報',
  `remarks` text COMMENT '備考',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_process` (`supplier_cd`, `process_cd`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_process_cd` (`process_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注厂商能力矩阵';

-- 2. 外注厂商绩效评级表
DROP TABLE IF EXISTS `outsourcing_supplier_performance`;
CREATE TABLE `outsourcing_supplier_performance` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `evaluation_period` varchar(7) NOT NULL COMMENT '評価期間（YYYY-MM）',
  `otd_rate` decimal(5,2) DEFAULT 0.00 COMMENT '納期遵守率（%）',
  `quality_ppm` decimal(10,2) DEFAULT 0.00 COMMENT '品質不良率（PPM）',
  `delivery_count` int DEFAULT 0 COMMENT '納入回数',
  `defect_count` int DEFAULT 0 COMMENT '不良発生回数',
  `total_amount` decimal(15,2) DEFAULT 0.00 COMMENT '総取引金額',
  `response_score` int DEFAULT 0 COMMENT '対応評価（1-5点）',
  `overall_rating` enum('S','A','B','C','D') DEFAULT 'C' COMMENT '総合評価',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_period` (`supplier_cd`, `evaluation_period`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_evaluation_period` (`evaluation_period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注厂商绩效评级';

-- 3. 外注价格合同表
DROP TABLE IF EXISTS `outsourcing_price_contracts`;
CREATE TABLE `outsourcing_price_contracts` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `contract_no` varchar(50) NOT NULL COMMENT '契約番号',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `product_cd` varchar(50) DEFAULT NULL COMMENT '製品CD（NULL=全製品対象）',
  `process_cd` varchar(50) NOT NULL COMMENT '工程CD',
  `unit_price` decimal(10,2) NOT NULL COMMENT '単価',
  `currency` varchar(10) DEFAULT 'JPY' COMMENT '通貨',
  `price_unit` varchar(20) DEFAULT '個' COMMENT '価格単位',
  `valid_from` date NOT NULL COMMENT '有効開始日',
  `valid_to` date NOT NULL COMMENT '有効終了日',
  `min_quantity` int DEFAULT 0 COMMENT '最小発注数量',
  `max_quantity` int DEFAULT 999999 COMMENT '最大発注数量',
  `payment_terms` varchar(100) COMMENT '支払条件',
  `contract_status` enum('有効','無効','期限切れ') DEFAULT '有効' COMMENT '契約状態',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contract_no` (`contract_no`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_product_cd` (`product_cd`),
  KEY `idx_process_cd` (`process_cd`),
  KEY `idx_valid_period` (`valid_from`, `valid_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注价格合同';

-- 4. 外注订单表
DROP TABLE IF EXISTS `outsourcing_orders`;
CREATE TABLE `outsourcing_orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_no` varchar(50) NOT NULL COMMENT '外注注文番号',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `product_cd` varchar(50) NOT NULL COMMENT '製品CD',
  `process_cd` varchar(50) NOT NULL COMMENT '工程CD',
  `quantity` int NOT NULL COMMENT '発注数量',
  `unit_price` decimal(10,2) NOT NULL COMMENT '単価',
  `total_amount` decimal(15,2) NOT NULL COMMENT '総金額',
  `currency` varchar(10) DEFAULT 'JPY' COMMENT '通貨',
  `order_date` date NOT NULL COMMENT '発注日',
  `requested_delivery_date` date NOT NULL COMMENT '希望納期',
  `confirmed_delivery_date` date DEFAULT NULL COMMENT '確定納期',
  `actual_delivery_date` date DEFAULT NULL COMMENT '実際納期',
  `order_status` enum('作成済','送信済','確認済','材料発送済','生産中','発送済','受領済','検査中','入庫済','完了','キャンセル') DEFAULT '作成済' COMMENT '注文状態',
  `priority` enum('緊急','高','中','低') DEFAULT '中' COMMENT '優先度',
  `work_order_id` int DEFAULT NULL COMMENT '関連製造指図ID',
  `material_supply_type` enum('有償','無償','混合') DEFAULT '無償' COMMENT '材料供給タイプ',
  `delivery_location` varchar(200) COMMENT '納入場所',
  `special_instructions` text COMMENT '特別指示',
  `remarks` text COMMENT '備考',
  `created_by` varchar(50) COMMENT '作成者',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_product_cd` (`product_cd`),
  KEY `idx_process_cd` (`process_cd`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_order_status` (`order_status`),
  KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注订单';

-- 5. 外注订单变更履历表
DROP TABLE IF EXISTS `outsourcing_order_changes`;
CREATE TABLE `outsourcing_order_changes` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id` int NOT NULL COMMENT '外注注文ID',
  `change_type` enum('数量変更','納期変更','価格変更','仕様変更','キャンセル','その他') NOT NULL COMMENT '変更タイプ',
  `old_value` text COMMENT '変更前値',
  `new_value` text COMMENT '変更後値',
  `change_reason` varchar(500) COMMENT '変更理由',
  `change_date` datetime NOT NULL COMMENT '変更日時',
  `changed_by` varchar(50) COMMENT '変更者',
  `supplier_confirmed` tinyint(1) DEFAULT 0 COMMENT '仕入先確認済み',
  `confirmation_date` datetime DEFAULT NULL COMMENT '確認日時',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_change_date` (`change_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注订单变更履历';

-- 6. 外注供料单表
DROP TABLE IF EXISTS `outsourcing_material_supplies`;
CREATE TABLE `outsourcing_material_supplies` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supply_no` varchar(50) NOT NULL COMMENT '供料単番号',
  `order_id` int NOT NULL COMMENT '外注注文ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `supply_date` date NOT NULL COMMENT '供料日',
  `supply_type` enum('有償','無償') NOT NULL COMMENT '供料タイプ',
  `total_value` decimal(15,2) DEFAULT 0.00 COMMENT '総価値',
  `supply_status` enum('計画中','準備中','発送済','受領確認済','完了') DEFAULT '計画中' COMMENT '供料状態',
  `delivery_method` varchar(100) COMMENT '配送方法',
  `tracking_no` varchar(100) COMMENT '追跡番号',
  `remarks` text COMMENT '備考',
  `created_by` varchar(50) COMMENT '作成者',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supply_no` (`supply_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_supply_date` (`supply_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注供料单';

-- 7. 外注供料明细表
DROP TABLE IF EXISTS `outsourcing_material_supply_details`;
CREATE TABLE `outsourcing_material_supply_details` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supply_id` int NOT NULL COMMENT '供料単ID',
  `material_cd` varchar(50) NOT NULL COMMENT '材料CD',
  `material_name` varchar(200) COMMENT '材料名',
  `required_quantity` decimal(10,3) NOT NULL COMMENT '必要数量',
  `supplied_quantity` decimal(10,3) DEFAULT 0.000 COMMENT '供料数量',
  `unit` varchar(20) COMMENT '単位',
  `unit_cost` decimal(10,2) DEFAULT 0.00 COMMENT '単価',
  `total_cost` decimal(15,2) DEFAULT 0.00 COMMENT '総コスト',
  `lot_no` varchar(50) COMMENT 'ロット番号',
  `expiry_date` date COMMENT '有効期限',
  `storage_location` varchar(100) COMMENT '保管場所',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  KEY `idx_supply_id` (`supply_id`),
  KEY `idx_material_cd` (`material_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注供料明细';

-- 8. 外注虚拟仓库库存表
DROP TABLE IF EXISTS `outsourcing_virtual_inventory`;
CREATE TABLE `outsourcing_virtual_inventory` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `material_cd` varchar(50) NOT NULL COMMENT '材料CD',
  `material_name` varchar(200) COMMENT '材料名',
  `current_quantity` decimal(10,3) DEFAULT 0.000 COMMENT '現在数量',
  `reserved_quantity` decimal(10,3) DEFAULT 0.000 COMMENT '引当数量',
  `available_quantity` decimal(10,3) DEFAULT 0.000 COMMENT '利用可能数量',
  `unit` varchar(20) COMMENT '単位',
  `average_cost` decimal(10,2) DEFAULT 0.00 COMMENT '平均コスト',
  `total_value` decimal(15,2) DEFAULT 0.00 COMMENT '総価値',
  `last_supply_date` date COMMENT '最終供料日',
  `last_consumption_date` date COMMENT '最終消費日',
  `safety_stock` decimal(10,3) DEFAULT 0.000 COMMENT '安全在庫',
  `reorder_point` decimal(10,3) DEFAULT 0.000 COMMENT '発注点',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_material` (`supplier_cd`, `material_cd`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_material_cd` (`material_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注虚拟仓库库存';

-- 9. 外注虚拟仓库库存变动履历表
DROP TABLE IF EXISTS `outsourcing_inventory_transactions`;
CREATE TABLE `outsourcing_inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `material_cd` varchar(50) NOT NULL COMMENT '材料CD',
  `transaction_type` enum('入庫','出庫','調整','盤点') NOT NULL COMMENT '取引タイプ',
  `quantity` decimal(10,3) NOT NULL COMMENT '数量（+/-）',
  `unit_cost` decimal(10,2) DEFAULT 0.00 COMMENT '単価',
  `total_cost` decimal(15,2) DEFAULT 0.00 COMMENT '総コスト',
  `reference_type` enum('供料単','外注注文','盤点','調整') COMMENT '参照タイプ',
  `reference_id` int COMMENT '参照ID',
  `reference_no` varchar(50) COMMENT '参照番号',
  `lot_no` varchar(50) COMMENT 'ロット番号',
  `transaction_date` datetime NOT NULL COMMENT '取引日時',
  `operator` varchar(50) COMMENT '操作者',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  PRIMARY KEY (`id`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_material_cd` (`material_cd`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_reference` (`reference_type`, `reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注虚拟仓库库存变动履历';

-- 10. 外注收货表
DROP TABLE IF EXISTS `outsourcing_receipts`;
CREATE TABLE `outsourcing_receipts` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `receipt_no` varchar(50) NOT NULL COMMENT '受領番号',
  `order_id` int NOT NULL COMMENT '外注注文ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `product_cd` varchar(50) NOT NULL COMMENT '製品CD',
  `receipt_date` date NOT NULL COMMENT '受領日',
  `receipt_time` time COMMENT '受領時間',
  `ordered_quantity` int NOT NULL COMMENT '発注数量',
  `received_quantity` int NOT NULL COMMENT '受領数量',
  `accepted_quantity` int DEFAULT 0 COMMENT '合格数量',
  `rejected_quantity` int DEFAULT 0 COMMENT '不合格数量',
  `receipt_status` enum('受領済','検査待ち','検査中','合格','不合格','部分合格') DEFAULT '受領済' COMMENT '受領状態',
  `delivery_note_no` varchar(50) COMMENT '納品書番号',
  `lot_no` varchar(50) COMMENT 'ロット番号',
  `storage_location` varchar(100) COMMENT '保管場所',
  `receiver` varchar(50) COMMENT '受領者',
  `inspector` varchar(50) COMMENT '検査者',
  `inspection_date` date COMMENT '検査日',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipt_no` (`receipt_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_product_cd` (`product_cd`),
  KEY `idx_receipt_date` (`receipt_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注收货';

-- 11. 外注质量检验表
DROP TABLE IF EXISTS `outsourcing_quality_inspections`;
CREATE TABLE `outsourcing_quality_inspections` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `inspection_no` varchar(50) NOT NULL COMMENT '検査番号',
  `receipt_id` int NOT NULL COMMENT '受領ID',
  `order_id` int NOT NULL COMMENT '外注注文ID',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `product_cd` varchar(50) NOT NULL COMMENT '製品CD',
  `inspection_date` date NOT NULL COMMENT '検査日',
  `inspector` varchar(50) NOT NULL COMMENT '検査者',
  `inspection_type` enum('全数検査','抜取検査','外観検査','機能検査') NOT NULL COMMENT '検査タイプ',
  `sample_size` int DEFAULT 0 COMMENT 'サンプル数',
  `inspected_quantity` int NOT NULL COMMENT '検査数量',
  `passed_quantity` int DEFAULT 0 COMMENT '合格数量',
  `failed_quantity` int DEFAULT 0 COMMENT '不合格数量',
  `defect_rate` decimal(5,2) DEFAULT 0.00 COMMENT '不良率（%）',
  `inspection_result` enum('合格','不合格','条件付合格') NOT NULL COMMENT '検査結果',
  `defect_types` text COMMENT '不良タイプ',
  `corrective_action` text COMMENT '是正措置',
  `remarks` text COMMENT '備考',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspection_no` (`inspection_no`),
  KEY `idx_receipt_id` (`receipt_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_inspection_date` (`inspection_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注质量检验';

-- 12. 外注财务结算表
DROP TABLE IF EXISTS `outsourcing_settlements`;
CREATE TABLE `outsourcing_settlements` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `settlement_no` varchar(50) NOT NULL COMMENT '決済番号',
  `supplier_cd` varchar(20) NOT NULL COMMENT '仕入先CD',
  `settlement_period_from` date NOT NULL COMMENT '決済期間開始',
  `settlement_period_to` date NOT NULL COMMENT '決済期間終了',
  `total_orders` int DEFAULT 0 COMMENT '総注文数',
  `total_quantity` int DEFAULT 0 COMMENT '総数量',
  `total_amount` decimal(15,2) DEFAULT 0.00 COMMENT '総金額',
  `material_cost` decimal(15,2) DEFAULT 0.00 COMMENT '材料費',
  `processing_cost` decimal(15,2) DEFAULT 0.00 COMMENT '加工費',
  `transportation_cost` decimal(15,2) DEFAULT 0.00 COMMENT '運送費',
  `other_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'その他費用',
  `tax_amount` decimal(15,2) DEFAULT 0.00 COMMENT '税額',
  `net_amount` decimal(15,2) DEFAULT 0.00 COMMENT '純額',
  `settlement_status` enum('作成済','確認済','支払済','完了') DEFAULT '作成済' COMMENT '決済状態',
  `invoice_no` varchar(50) COMMENT '請求書番号',
  `payment_date` date COMMENT '支払日',
  `payment_method` varchar(50) COMMENT '支払方法',
  `remarks` text COMMENT '備考',
  `created_by` varchar(50) COMMENT '作成者',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settlement_no` (`settlement_no`),
  KEY `idx_supplier_cd` (`supplier_cd`),
  KEY `idx_settlement_period` (`settlement_period_from`, `settlement_period_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注财务结算';

-- 13. 外注成本核算表
DROP TABLE IF EXISTS `outsourcing_cost_calculations`;
CREATE TABLE `outsourcing_cost_calculations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `calculation_no` varchar(50) NOT NULL COMMENT '原価計算番号',
  `order_id` int NOT NULL COMMENT '外注注文ID',
  `product_cd` varchar(50) NOT NULL COMMENT '製品CD',
  `quantity` int NOT NULL COMMENT '数量',
  `material_cost` decimal(15,2) DEFAULT 0.00 COMMENT '材料費',
  `processing_cost` decimal(15,2) DEFAULT 0.00 COMMENT '加工費',
  `transportation_cost` decimal(15,2) DEFAULT 0.00 COMMENT '運送費',
  `management_cost` decimal(15,2) DEFAULT 0.00 COMMENT '管理費',
  `quality_cost` decimal(15,2) DEFAULT 0.00 COMMENT '品質コスト',
  `other_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'その他コスト',
  `total_cost` decimal(15,2) DEFAULT 0.00 COMMENT '総コスト',
  `unit_cost` decimal(10,2) DEFAULT 0.00 COMMENT '単位コスト',
  `calculation_date` date NOT NULL COMMENT '計算日',
  `calculation_method` varchar(100) COMMENT '計算方法',
  `cost_allocation_basis` varchar(200) COMMENT 'コスト配分基準',
  `remarks` text COMMENT '備考',
  `created_by` varchar(50) COMMENT '作成者',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_calculation_no` (`calculation_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_product_cd` (`product_cd`),
  KEY `idx_calculation_date` (`calculation_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='外注成本核算';

-- 外键约束
ALTER TABLE `outsourcing_supplier_capabilities` ADD CONSTRAINT `fk_osc_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_supplier_capabilities` ADD CONSTRAINT `fk_osc_process` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_supplier_performance` ADD CONSTRAINT `fk_osp_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_price_contracts` ADD CONSTRAINT `fk_opc_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_price_contracts` ADD CONSTRAINT `fk_opc_process` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_orders` ADD CONSTRAINT `fk_oo_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_orders` ADD CONSTRAINT `fk_oo_process` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_order_changes` ADD CONSTRAINT `fk_ooc_order` FOREIGN KEY (`order_id`) REFERENCES `outsourcing_orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_material_supplies` ADD CONSTRAINT `fk_oms_order` FOREIGN KEY (`order_id`) REFERENCES `outsourcing_orders` (`id`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_material_supplies` ADD CONSTRAINT `fk_oms_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_material_supply_details` ADD CONSTRAINT `fk_omsd_supply` FOREIGN KEY (`supply_id`) REFERENCES `outsourcing_material_supplies` (`id`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_virtual_inventory` ADD CONSTRAINT `fk_ovi_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_inventory_transactions` ADD CONSTRAINT `fk_oit_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_receipts` ADD CONSTRAINT `fk_or_order` FOREIGN KEY (`order_id`) REFERENCES `outsourcing_orders` (`id`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_receipts` ADD CONSTRAINT `fk_or_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_quality_inspections` ADD CONSTRAINT `fk_oqi_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `outsourcing_receipts` (`id`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_quality_inspections` ADD CONSTRAINT `fk_oqi_order` FOREIGN KEY (`order_id`) REFERENCES `outsourcing_orders` (`id`) ON DELETE CASCADE;
ALTER TABLE `outsourcing_quality_inspections` ADD CONSTRAINT `fk_oqi_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_settlements` ADD CONSTRAINT `fk_os_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE CASCADE;

ALTER TABLE `outsourcing_cost_calculations` ADD CONSTRAINT `fk_occ_order` FOREIGN KEY (`order_id`) REFERENCES `outsourcing_orders` (`id`) ON DELETE CASCADE;

-- 初期データ挿入
-- サンプル外注厂商能力矩阵データ
INSERT INTO `outsourcing_supplier_capabilities` (`supplier_cd`, `process_cd`, `capability_level`, `monthly_capacity`, `lead_time_days`, `quality_rating`, `cost_rating`, `certification_info`) VALUES
('SUP001', 'PROC001', 'A', 10000, 7, 0.98, '中', 'ISO9001認証取得'),
('SUP001', 'PROC002', 'B', 5000, 10, 0.95, '高', 'ISO14001認証取得'),
('SUP002', 'PROC001', 'B', 8000, 5, 0.96, '低', 'JIS認証取得'),
('SUP002', 'PROC003', 'A', 12000, 14, 0.99, '中', 'ISO9001、ISO14001認証取得');

-- サンプル外注価格合同データ
INSERT INTO `outsourcing_price_contracts` (`contract_no`, `supplier_cd`, `process_cd`, `unit_price`, `valid_from`, `valid_to`, `min_quantity`, `max_quantity`) VALUES
('CNT2024001', 'SUP001', 'PROC001', 150.00, '2024-01-01', '2024-12-31', 100, 10000),
('CNT2024002', 'SUP001', 'PROC002', 200.00, '2024-01-01', '2024-12-31', 50, 5000),
('CNT2024003', 'SUP002', 'PROC001', 140.00, '2024-01-01', '2024-12-31', 200, 8000),
('CNT2024004', 'SUP002', 'PROC003', 300.00, '2024-01-01', '2024-12-31', 100, 12000);