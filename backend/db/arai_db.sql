/*
 Navicat Premium Data Transfer

 Source Server         : smart-emap
 Source Server Type    : MySQL
 Source Server Version : 90200
 Source Host           : localhost:3306
 Source Schema         : arai_db

 Target Server Type    : MySQL
 Target Server Version : 90200
 File Encoding         : 65001

 Date: 25/05/2025 21:47:25
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for carriers
-- ----------------------------
DROP TABLE IF EXISTS `carriers`;
CREATE TABLE `carriers`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '運送便ID',
  `carrier_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '運送便CD',
  `carrier_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '運送便名称',
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '連絡人',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '電話番号',
  `shipping_time` time NULL DEFAULT NULL COMMENT '出荷時間',
  `report_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '報告No',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `status` tinyint NULL DEFAULT 1 COMMENT '状態（1=有効, 0=無効）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `carrier_cd`(`carrier_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '運送便マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for component_materials
-- ----------------------------
DROP TABLE IF EXISTS `component_materials`;
CREATE TABLE `component_materials`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `component_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部品コード（外部キー components.component_cd）',
  `material_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料コード（外部キー materials.material_cd）',
  `quantity` decimal(15, 4) NOT NULL DEFAULT 1.0000 COMMENT '使用数量',
  `unit_price` decimal(15, 4) NOT NULL DEFAULT 0.0000 COMMENT '材料単価（円）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_component_material`(`component_cd` ASC, `material_cd` ASC) USING BTREE,
  INDEX `idx_component_cd`(`component_cd` ASC) USING BTREE,
  INDEX `idx_material_cd`(`material_cd` ASC) USING BTREE,
  CONSTRAINT `fk_component_material_component` FOREIGN KEY (`component_cd`) REFERENCES `components` (`component_cd`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_component_material_material` FOREIGN KEY (`material_cd`) REFERENCES `materials` (`material_cd`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '部品材料構成' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for components
-- ----------------------------
DROP TABLE IF EXISTS `components`;
CREATE TABLE `components`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `component_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部品コード',
  `component_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部品名称',
  `spec_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '仕様／型',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '単位',
  `procurement_type` enum('内製','外製','購入') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '購入' COMMENT '調達区分',
  `supplier_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '仕入先CD（外部キー）',
  `lead_time_days` int NULL DEFAULT NULL COMMENT 'リードタイム（日）',
  `unit_price` decimal(15, 4) NULL DEFAULT 0.0000 COMMENT '単価（円）',
  `foreign_currency_price` decimal(15, 4) NULL DEFAULT 0.0000 COMMENT '外貨単価',
  `lot_size` int NULL DEFAULT 1 COMMENT '収容数（ロットサイズ）',
  `payment_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '決済種類',
  `end_of_life_flag` tinyint(1) NULL DEFAULT 0 COMMENT '終息（1=終息, 0=現行）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`, `component_cd`) USING BTREE,
  UNIQUE INDEX `component_cd`(`component_cd` ASC) USING BTREE,
  INDEX `component_cd_2`(`component_cd` ASC) USING BTREE,
  INDEX `fk_components_supplier`(`supplier_cd` ASC) USING BTREE,
  CONSTRAINT `fk_components_supplier` FOREIGN KEY (`supplier_cd`) REFERENCES `suppliers` (`supplier_cd`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '部品マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '顧客ID',
  `customer_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '顧客CD',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '顧客名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '電話番号',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '住所',
  `customer_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '顧客種別（corporate, individual, agency 等）',
  `status` tinyint NULL DEFAULT 1 COMMENT '状態（1=有効, 0=無効）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `customer_cd`(`customer_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '顧客マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for delivery_destinations
-- ----------------------------
DROP TABLE IF EXISTS `delivery_destinations`;
CREATE TABLE `delivery_destinations`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '納入先ID',
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先CD',
  `destination_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先名称',
  `customer_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '顧客CD（外部キー）',
  `carrier_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '運送会社CD（外部キー）',
  `delivery_lead_time` int NULL DEFAULT 0 COMMENT '納入リードタイム（日）',
  `issue_type` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '自動' COMMENT '発行区分',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '電話番号',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '住所',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态（1=启用, 0=停用）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `destination_cd`(`destination_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 118 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '納入先マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '部門ID（自動採番）',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部門名',
  `parent_id` int NULL DEFAULT NULL COMMENT '上位部門ID（NULLなら最上位）',
  `status` tinyint NULL DEFAULT 1 COMMENT '状態（1＝有効、0＝無効）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '部門マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for destination_holidays
-- ----------------------------
DROP TABLE IF EXISTS `destination_holidays`;
CREATE TABLE `destination_holidays`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `holiday_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_dest_date`(`destination_cd` ASC, `holiday_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 47 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '納入先の休日設定' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for destination_override_attendance
-- ----------------------------
DROP TABLE IF EXISTS `destination_override_attendance`;
CREATE TABLE `destination_override_attendance`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先マスタCD\r\n',
  `work_date` date NOT NULL COMMENT '土日の出勤日',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '理由',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_work_day`(`destination_cd` ASC, `work_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '納入先臨時出勤日マスタ（休日例外）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for machine_availability
-- ----------------------------
DROP TABLE IF EXISTS `machine_availability`;
CREATE TABLE `machine_availability`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `day_of_week` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '例：Monday、Tuesday',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for machine_exceptions
-- ----------------------------
DROP TABLE IF EXISTS `machine_exceptions`;
CREATE TABLE `machine_exceptions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `exception_date` date NOT NULL,
  `start_time` time NULL DEFAULT '00:00:00',
  `end_time` time NULL DEFAULT '23:59:59',
  `reason` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `is_holiday` tinyint NULL DEFAULT 0,
  `is_overtime` tinyint NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for machine_work_times
-- ----------------------------
DROP TABLE IF EXISTS `machine_work_times`;
CREATE TABLE `machine_work_times`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '設備CD',
  `work_date` date NOT NULL COMMENT '稼働日',
  `start_time` time NOT NULL COMMENT '開始時間',
  `end_time` time NOT NULL COMMENT '終了時間',
  `is_overtime` tinyint NULL DEFAULT 0 COMMENT '加班フラグ',
  `remark` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '備考',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_worktime`(`machine_cd` ASC, `work_date` ASC, `start_time` ASC, `end_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 74 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for machines
-- ----------------------------
DROP TABLE IF EXISTS `machines`;
CREATE TABLE `machines`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '设备CD',
  `machine_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '设备名称',
  `machine_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '设备种类（例：切断、焊接、检査等）',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT 'active' COMMENT '状态（active/inactive/maintenance）',
  `available_from` time NULL DEFAULT '08:00:00' COMMENT '可用开始时间',
  `available_to` time NULL DEFAULT '17:00:00' COMMENT '可用结束时间',
  `calendar_id` int NULL DEFAULT NULL COMMENT '所属カレンダーID（处理休假）',
  `efficiency` decimal(5, 2) NULL DEFAULT 100.00 COMMENT '效率（基准为100）',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `machine_cd`(`machine_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 85 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '設備マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for materials
-- ----------------------------
DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '材料ID',
  `material_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料CD',
  `material_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料名',
  `material_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料種類',
  `standard_spec` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '規格',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '単位（kg / 本 / m など）',
  `diameter` decimal(10, 2) NULL DEFAULT NULL COMMENT '直径（mm）',
  `thickness` decimal(10, 2) NULL DEFAULT NULL COMMENT '厚さ（mm）',
  `length` decimal(10, 2) NULL DEFAULT NULL COMMENT '長さ（mm）',
  `supply_classification` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支給区分（社内 / 支給）',
  `pieces_per_bundle` int NULL DEFAULT NULL COMMENT '束本数',
  `usegae` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用途',
  `supplier_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '仕入先CD（外部キー）',
  `unit_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '単重単価（円/kg 等）',
  `long_weight` decimal(10, 5) NULL DEFAULT NULL COMMENT '長尺単重（kg/本）',
  `single_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '一本単価（円）',
  `safety_stock` int NULL DEFAULT 0 COMMENT '安全在庫（単位数）',
  `lead_time` int NULL DEFAULT NULL COMMENT 'リードタイム（日）',
  `storage_location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '保管場所',
  `status` tinyint NULL DEFAULT 1 COMMENT '状態（1=有効, 0=無効）',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`, `material_cd`) USING BTREE,
  UNIQUE INDEX `material_cd`(`material_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 39 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_daily
-- ----------------------------
DROP TABLE IF EXISTS `order_daily`;
CREATE TABLE `order_daily`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日订单ID',
  `monthly_order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '月订单ID（order_monthly的order_id）',
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先CD',
  `destination_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先名',
  `year` int NOT NULL COMMENT '年',
  `month` int NOT NULL COMMENT '月',
  `day` int NOT NULL COMMENT '日',
  `weekday` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '曜日（日/月/火/水/木/金/土）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品名',
  `product_alias` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '製品別名',
  `forecast_units` int NULL DEFAULT 0 COMMENT '内示本数',
  `confirmed_boxes` int NULL DEFAULT 0 COMMENT '確定箱数',
  `confirmed_units` int NULL DEFAULT 0 COMMENT '確定本数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '未出荷' COMMENT '日別受注ステータス',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '備考',
  `unit_per_box` int NULL DEFAULT 0 COMMENT '1箱あたりの個数',
  `batch_id` int NULL DEFAULT NULL COMMENT '対応する生産バッチID',
  `batch_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'バッチ番号（表示用）',
  `supply_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `fulfilled_from_stock` int NULL DEFAULT 0,
  `fulfilled_from_wip` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_order_daily_monthly`(`monthly_order_id` ASC) USING BTREE,
  INDEX `idx_order_batch_id`(`batch_id` ASC) USING BTREE,
  CONSTRAINT `fk_order_daily_monthly` FOREIGN KEY (`monthly_order_id`) REFERENCES `order_monthly` (`order_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5875 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_log
-- ----------------------------
DROP TABLE IF EXISTS `order_log`;
CREATE TABLE `order_log`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ログID',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'アクション種別 (insert/update/error)',
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '対象タイプ (order_monthly/order_daily)',
  `target_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '対象ID (order_idなど)',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'ログメッセージ（成功やエラーメッセージ）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '注文関連操作ログ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_monthly
-- ----------------------------
DROP TABLE IF EXISTS `order_monthly`;
CREATE TABLE `order_monthly`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '月订单ID',
  `destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先CD',
  `destination_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '納入先名',
  `year` int NOT NULL COMMENT '年',
  `month` int NOT NULL COMMENT '月',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品名',
  `product_alias` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '製品別名',
  `forecast_units` int NULL DEFAULT 0 COMMENT '内示本数',
  `forecast_total_units` int NULL DEFAULT 0 COMMENT '日内示合計',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '受注ID',
  `forecast_diff` int NULL DEFAULT 0 COMMENT '内示差異（日内示合計-内示本数 ）',
  PRIMARY KEY (`id`, `order_id`) USING BTREE,
  UNIQUE INDEX `uq_order_monthly_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_order_monthly_destination`(`destination_cd` ASC, `year` ASC, `month` ASC) USING BTREE,
  INDEX `idx_order_monthly_product`(`product_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 293 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '月別受注テーブル' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for processes
-- ----------------------------
DROP TABLE IF EXISTS `processes`;
CREATE TABLE `processes`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工程ID',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程コード',
  `process_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程名称',
  `short_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '略称／2〜3文字表示用',
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `is_outsource` tinyint(1) NOT NULL DEFAULT 0 COMMENT '外注フラグ(1=外注)',
  `default_cycle_sec` float NOT NULL DEFAULT 0 COMMENT '標準サイクルタイム(秒)',
  `default_yield` decimal(6,3) NOT NULL DEFAULT 1.000 COMMENT '歩留(0〜1)',
  `capacity_unit` enum('pcs','kg','m') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pcs' COMMENT '能力単位',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '備考',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_outsource`(`is_outsource` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工程マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for product_process_machine_efficiency
-- ----------------------------
DROP TABLE IF EXISTS `product_process_machine_efficiency`;
CREATE TABLE `product_process_machine_efficiency`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'レコードID',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD',
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '設備CD',
  `efficiency` decimal(6, 0) NOT NULL COMMENT '生産効率（例：100.00 = 100個/時間）',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '本/時間' COMMENT '効率単位（例：個/時間、個/分）',
  `priority` int NULL DEFAULT 0 COMMENT '優先度（数値が小さいほど優先）',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `setup_time` int NULL DEFAULT 0 COMMENT '段取り時間（分）',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_product_process_machine`(`product_cd` ASC, `process_cd` ASC, `machine_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製品×工程×設備ごとの生産効率マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for product_route_steps
-- ----------------------------
DROP TABLE IF EXISTS `product_route_steps`;
CREATE TABLE `product_route_steps`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主キー',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '製品CD',
  `route_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ルートCD',
  `step_no` int NOT NULL COMMENT '順番',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '工程CD',
  `machine_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT '設備ID',
  `standard_cycle_time` decimal(10, 2) NULL DEFAULT NULL COMMENT '標準サイクルタイム(秒)',
  `setup_time` decimal(10, 2) NULL DEFAULT NULL COMMENT '段取り時間(秒)',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_product_route_step`(`product_cd` ASC, `route_cd` ASC, `step_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC COMMENT='製品別工程ルートステップ';

-- 製品別・ルート工程別の使用可能な機械および時間情報
CREATE TABLE product_route_step_machines (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- 主キー
  product_cd VARCHAR(50) NOT NULL,    -- 製品CD（対象製品）
  route_cd VARCHAR(50) NOT NULL,      -- 工程ルートCD
  step_no INT NOT NULL,               -- 工程ステップ番号
  machine_cd VARCHAR(50) NOT NULL,    -- 設備CD（使用する機械）
  machine_name VARCHAR(100),          -- 設備名（任意）
  process_time_sec INT NOT NULL DEFAULT 0,  -- 標準加工時間（秒単位）
  setup_time INT NOT NULL DEFAULT 0,        -- 段取り時間（分単位）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 作成日時
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 更新日時

  INDEX idx_step (product_cd, route_cd, step_no),  -- 製品＋ルート＋ステップによる検索用インデックス
  INDEX idx_machine (machine_cd),                  -- 機械CDによる検索用インデックス

  FOREIGN KEY (machine_cd) REFERENCES machines(machine_cd) ON DELETE CASCADE  -- 設備マスタへの外部キー制約
);
-- ----------------------------
-- Table structure for production_batch_merge
-- ----------------------------
DROP TABLE IF EXISTS `production_batch_merge`;
CREATE TABLE `production_batch_merge`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `quantity` int NOT NULL,
  `source_batch_id` int NULL DEFAULT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;


CREATE TABLE IF NOT EXISTS `production_batch_processes` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主キーID',
  `batch_id` int(11) NOT NULL COMMENT '生産バッチID（production_batches.id への外部キー）',
  `product_cd` varchar(50) NOT NULL COMMENT '製品コード',
  `route_cd` varchar(50) DEFAULT NULL COMMENT '工程ルートコード',
  `step_no` int(11) NOT NULL COMMENT '工程順序番号',
  `process_cd` varchar(50) NOT NULL COMMENT '工程コード',
  `process_name` varchar(100) DEFAULT NULL COMMENT '工程名',
  `planned_qty` int(11) DEFAULT 0 COMMENT '計画数量',
  `actual_qty` int(11) DEFAULT 0 COMMENT '実績数量',
  `status` varchar(20) DEFAULT '未開始' COMMENT '工程ステータス',
  `equipment_id` int(11) DEFAULT NULL COMMENT '割当設備ID',
  `equipment_cd` varchar(50) DEFAULT NULL COMMENT '設備コード',
  `equipment_name` varchar(100) DEFAULT NULL COMMENT '設備名',
  `start_date` date DEFAULT NULL COMMENT '開始日',
  `end_date` date DEFAULT NULL COMMENT '終了日',
  `process_time_sec` int(11) DEFAULT 0 COMMENT '処理時間（秒）',
  `setup_time` int(11) DEFAULT 0 COMMENT '段取時間（分）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_product_cd` (`product_cd`),
  KEY `idx_process_cd` (`process_cd`),
  KEY `idx_equipment_id` (`equipment_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_batch_processes_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生産バッチ工程明細テーブル';



-- ----------------------------
-- Table structure for production_batch_pool
-- ----------------------------
DROP TABLE IF EXISTS `production_batch_pool`;
CREATE TABLE `production_batch_pool`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `quantity` int NOT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `batch_no`(`batch_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 162 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for production_batches
-- ----------------------------
DROP TABLE IF EXISTS `production_batches`;
CREATE TABLE `production_batches`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'バッチID',
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'バッチ番号',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `planned_qty` int NOT NULL COMMENT '予定生産数',
  `actual_output_qty` int NULL DEFAULT NULL COMMENT '実際産出数（不良考慮後）',
  `batch_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '自動' COMMENT 'バッチ種別（自動, 補充, 返工）',
  `from_date` date NOT NULL COMMENT '注文起始日',
  `to_date` date NOT NULL COMMENT '注文終了日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '未開始' COMMENT 'ステータス（未開始、作業中、完了）',
  `is_locked` tinyint NULL DEFAULT 0 COMMENT 'ロック済（1=不能再自动修改）',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_batch_no`(`batch_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 336 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for production_plan_batches
-- ----------------------------
DROP TABLE IF EXISTS `production_plan_batches`;
CREATE TABLE `production_plan_batches`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NOT NULL,
  `merged_batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for production_plan_steps
-- ----------------------------
DROP TABLE IF EXISTS `production_plan_steps`;
CREATE TABLE `production_plan_steps`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `plan_id` int NOT NULL COMMENT '生产计划ID（关联 production_plans）',
  `step_no` int NOT NULL COMMENT '步骤顺序号',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工序CD（关联 processes）',
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分配机台（关联 machines）',
  `start_time` datetime NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime NULL DEFAULT NULL COMMENT '结束时间',
  `planned_qty` int NOT NULL DEFAULT 0 COMMENT '该步骤计划数量',
  `efficiency` decimal(5, 2) NULL DEFAULT NULL COMMENT '效率（单位/小时）',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft' COMMENT '状态（draft/scheduled/done等）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_plan_id`(`plan_id` ASC) USING BTREE,
  INDEX `idx_process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_machine_cd`(`machine_cd` ASC) USING BTREE,
  CONSTRAINT `fk_plan_steps_plan` FOREIGN KEY (`plan_id`) REFERENCES `production_plans` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_plan_steps_process` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '生产计划步骤表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for production_plans
-- ----------------------------
DROP TABLE IF EXISTS `production_plans`;
CREATE TABLE `production_plans`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `plan_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '计划编号（如：PL-20250521-001）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '产品CD（关联 products）',
  `plan_date` date NOT NULL COMMENT '计划生成日期',
  `latest_start_date` date NULL DEFAULT NULL COMMENT '最遅開始日',
  `total_qty` int NOT NULL DEFAULT 0 COMMENT '总计划数量',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft' COMMENT '状态（draft/confirmed/done等）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_plan_no`(`plan_no` ASC) USING BTREE,
  INDEX `idx_product_cd`(`product_cd` ASC) USING BTREE,
  CONSTRAINT `fk_production_plans_product` FOREIGN KEY (`product_cd`) REFERENCES `products` (`product_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '生产计划表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for production_schedules
-- ----------------------------
DROP TABLE IF EXISTS `production_schedules`;
CREATE TABLE `production_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '排産ID',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `process_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD',
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '設備CD',
  `quantity` int NOT NULL COMMENT '数量',
  `efficiency` decimal(6, 1) NULL DEFAULT 1.0 COMMENT '能率',
  `plan_start` datetime NULL DEFAULT NULL COMMENT '計画開始日時',
  `plan_end` datetime NULL DEFAULT NULL COMMENT '計画終了日時',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '未計画' COMMENT 'ステータス',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `item_no` int NOT NULL DEFAULT 1 COMMENT '設備内工程順',
  `actual_qty` int NULL DEFAULT 0 COMMENT '実績（完成数）',
  `defect_qty` int NULL DEFAULT 0 COMMENT '不良数（実績）',
  `defect_rate` decimal(6, 1) NULL DEFAULT 0.0 COMMENT '不良率（%）',
  `setup_time` int NOT NULL DEFAULT 0 COMMENT '段取り時間（分）',
  `plan_progress` int NOT NULL DEFAULT 0 COMMENT '計画進捗率（%）',
  `actual_progress` int NOT NULL DEFAULT 0 COMMENT '実績進捗率（%）',
  `progress_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '進捗状態(Ahead/On track/Delay)',
  `actual_start` datetime NULL DEFAULT NULL COMMENT '実際開始',
  `actual_end` datetime NULL DEFAULT NULL COMMENT '実際終了',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `product_cd`(`product_cd` ASC) USING BTREE,
  INDEX `process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `machine_cd`(`machine_cd` ASC) USING BTREE,
  CONSTRAINT `production_schedules_ibfk_1` FOREIGN KEY (`product_cd`) REFERENCES `products` (`product_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `production_schedules_ibfk_2` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `production_schedules_ibfk_3` FOREIGN KEY (`machine_cd`) REFERENCES `machines` (`machine_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '生産スケジュール明細（排産表）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '製品ID',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD（ユニークな製品コード）',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品名称',
  `product_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '製品種別（例：量産品 / 試作品）',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'カテゴリ（例：センサー、ケースなど）',
  `department_id` int NULL DEFAULT NULL COMMENT '所属部門ID（外部キー）',
  `delivery_destination_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '納入先CD（外部キー）',
  `process_count` int NULL DEFAULT 1 COMMENT '工程数（標準の製造工程数）',
  `lead_time` int NULL DEFAULT NULL COMMENT 'リードタイム（日数）',
  `lot_size` int NULL DEFAULT 1 COMMENT 'ロットサイズ（まとめて作る単位）',
  `is_multistage` tinyint(1) NULL DEFAULT 1 COMMENT '多段階工程フラグ（TRUE=多段階）',
  `priority` int NULL DEFAULT 2 COMMENT '製品の優先度（1=高, 2=中, 3=低）',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT 'ステータス（active / inactive）',
  `part_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '部品番号（部品連携時の識別子）',
  `vehicle_model` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '対応車種',
  `box_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '梱包タイプ（例：段ボール、プラ箱）',
  `unit_per_box` int NULL DEFAULT NULL COMMENT '1箱あたりの入数',
  `dimensions` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'サイズ（例：100x200x300）',
  `weight` decimal(10, 2) NULL DEFAULT NULL COMMENT '重量（kg 単位）',
  `material_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '使用材料CD（外部キー）',
  `cut_length` decimal(10, 2) NULL DEFAULT NULL COMMENT '切断長さ（mm）',
  `chamfer_length` decimal(10, 2) NULL DEFAULT NULL COMMENT '面取り長さ（mm）',
  `developed_length` decimal(10, 2) NULL DEFAULT NULL COMMENT '展開長さ（mm）',
  `take_count` int NULL DEFAULT NULL COMMENT '取り数（1材料あたりの取り個数）',
  `scrap_length` decimal(10, 2) NULL DEFAULT NULL COMMENT '端材長さ（mm）',
  `bom_id` int NULL DEFAULT NULL COMMENT 'BOM ID（構成マスタ参照）',
  `route_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '工程ルートID（外部キー）',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考欄',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `safety_days` int NULL DEFAULT NULL COMMENT '安全在庫日数',
  `unit_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '販売単価',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `product_cd`(`product_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 280 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製品マスタ（拡張版）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for route_steps
-- ----------------------------
DROP TABLE IF EXISTS `route_steps`;
CREATE TABLE `route_steps`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ルートステップID',
  `route_cd` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ルートID',
  `step_no` int NOT NULL COMMENT 'ステップ番号',
  `process_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '工程ID',
  `yield_percent` decimal(5, 2) NULL DEFAULT 100.00 COMMENT '歩留率（%）',
  `cycle_sec` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '標準サイクル（秒）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT '備考',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for routes
-- ----------------------------
DROP TABLE IF EXISTS `routes`;
CREATE TABLE `routes`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ルートID',
  `route_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ルートコード',
  `route_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ルート名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '説明',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '使用フラグ',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'デフォルトフラグ（製品に紐付く場合）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `route_cd`) USING BTREE,
  UNIQUE INDEX `route_cd`(`route_cd` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工程ルート（ヘッダ）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for setup_time_matrix
-- ----------------------------
DROP TABLE IF EXISTS `setup_time_matrix`;
CREATE TABLE `setup_time_matrix`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `to_product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `setup_time` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_setup`(`from_product_cd` ASC, `to_product_cd` ASC, `process_cd` ASC, `machine_cd` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for stock_daily_trends
-- ----------------------------
DROP TABLE IF EXISTS `stock_daily_trends`;
CREATE TABLE `stock_daily_trends`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `date` date NOT NULL,
  `入庫` int NULL DEFAULT 0,
  `出庫` int NULL DEFAULT 0,
  `調整` int NULL DEFAULT 0,
  `廃棄` int NULL DEFAULT 0,
  `保留` int NULL DEFAULT 0,
  `出荷` int NULL DEFAULT 0,
  `is_predicted` tinyint(1) NULL DEFAULT 0,
  `confirmed_units` int NULL DEFAULT 0,
  `forecast_units` int NULL DEFAULT 0,
  `差引累計` decimal(18, 0) NULL DEFAULT 0,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_trend`(`product_cd` ASC, `location_cd` ASC, `date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25200 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_dirty_flags
-- ----------------------------
DROP TABLE IF EXISTS `stock_dirty_flags`;
CREATE TABLE `stock_dirty_flags`  (
  `stock_type` enum('製品','材料','部品','在制品') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `target_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_type`, `target_cd`, `location_cd`, `lot_no`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '在庫再計算対象フラグ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_materials
-- ----------------------------
DROP TABLE IF EXISTS `stock_materials`;
CREATE TABLE `stock_materials`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '在庫レコードID',
  `material_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料CD',
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '保管場所CD（倉庫・現場など）',
  `quantity` decimal(10, 2) NOT NULL COMMENT '在庫数量（kg・mなど）',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '単位（kg, m, 枚など）',
  `last_updated` datetime NOT NULL COMMENT '最終更新日時',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_stock_materials_material`(`material_cd` ASC) USING BTREE,
  CONSTRAINT `fk_stock_materials_material` FOREIGN KEY (`material_cd`) REFERENCES `materials` (`material_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料在庫マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_product_snapshots
-- ----------------------------
DROP TABLE IF EXISTS `stock_product_snapshots`;
CREATE TABLE `stock_product_snapshots`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `snapshot_date` date NOT NULL,
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `quantity` decimal(15, 0) NOT NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `snapshot_date`(`snapshot_date` ASC, `product_cd` ASC, `location_cd` ASC, `lot_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1484 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '製品在庫 スナップショット' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_products
-- ----------------------------
DROP TABLE IF EXISTS `stock_products`;
CREATE TABLE `stock_products`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT 0,
  `last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT '' COMMENT 'ロット番号',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_stock_products_product`(`product_cd` ASC) USING BTREE,
  CONSTRAINT `fk_stock_products_product` FOREIGN KEY (`product_cd`) REFERENCES `products` (`product_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 8735 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_transaction_logs
-- ----------------------------
DROP TABLE IF EXISTS `stock_transaction_logs`;
CREATE TABLE `stock_transaction_logs`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '在庫操作履歴ID（自動採番）',
  `stock_type` enum('製品','材料','部品','仕掛品') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '在庫種別',
  `target_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '対象CD',
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '保管場所CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '工程CD',
  `lot_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号',
  `transaction_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `quantity` int NOT NULL COMMENT '操作数量',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '単位',
  `base_qty` int NULL DEFAULT NULL COMMENT '束あたりの本数',
  `related_doc_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '関連伝票種別',
  `related_doc_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '関連伝票番号',
  `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作担当者',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `transaction_time` datetime NOT NULL COMMENT '操作日時',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_transaction`(`target_cd` ASC, `transaction_time` ASC, `transaction_type` ASC) USING BTREE,
  INDEX `idx_type_target`(`stock_type` ASC, `target_cd` ASC) USING BTREE,
  INDEX `idx_location`(`location_cd` ASC) USING BTREE,
  INDEX `idx_time`(`transaction_time` ASC) USING BTREE,
  INDEX `idx_logs_stock_product`(`stock_type` ASC, `target_cd` ASC, `location_cd` ASC, `lot_no` ASC, `transaction_type` ASC, `transaction_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 193299 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '在庫入出庫履歴' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_transaction_logs_archive
-- ----------------------------
DROP TABLE IF EXISTS `stock_transaction_logs_archive`;
CREATE TABLE `stock_transaction_logs_archive`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '在庫操作履歴ID（自動採番）',
  `stock_type` enum('製品','材料','部品','仕掛品') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '在庫種別',
  `target_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '対象CD',
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '保管場所CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '工程CD',
  `lot_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号',
  `transaction_type` enum('入庫','出庫','調整','廃棄','保留','実績') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作種別',
  `quantity` int NOT NULL COMMENT '操作数量',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '単位',
  `related_doc_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '関連伝票種別',
  `related_doc_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '関連伝票番号',
  `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作担当者',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `transaction_time` datetime NOT NULL COMMENT '操作日時',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_transaction`(`target_cd` ASC, `transaction_time` ASC, `transaction_type` ASC) USING BTREE,
  INDEX `idx_type_target`(`stock_type` ASC, `target_cd` ASC) USING BTREE,
  INDEX `idx_location`(`location_cd` ASC) USING BTREE,
  INDEX `idx_time`(`transaction_time` ASC) USING BTREE,
  INDEX `idx_logs_stock_product`(`stock_type` ASC, `target_cd` ASC, `location_cd` ASC, `lot_no` ASC, `transaction_type` ASC, `transaction_time` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '在庫入出庫履歴' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_wip
-- ----------------------------
DROP TABLE IF EXISTS `stock_wip`;
CREATE TABLE `stock_wip`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'WIP在庫レコードID',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD（在制品は製品単位）',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD（例：切断、成型、めっきなど）',
  `quantity` int NOT NULL DEFAULT 0 COMMENT '在制品数量（単位：個）',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `step_no` int NULL DEFAULT NULL,
  `lot_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_stock_wip_product`(`product_cd` ASC) USING BTREE,
  INDEX `fk_stock_wip_process`(`process_cd` ASC) USING BTREE,
  CONSTRAINT `fk_stock_wip_process` FOREIGN KEY (`process_cd`) REFERENCES `processes` (`process_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_stock_wip_product` FOREIGN KEY (`product_cd`) REFERENCES `products` (`product_cd`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 49 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工程別在制品在庫マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_wip_snapshots
-- ----------------------------
DROP TABLE IF EXISTS `stock_wip_snapshots`;
CREATE TABLE `stock_wip_snapshots`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT 'ロット番号',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD',
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '保管場所CD',
  `quantity` int NOT NULL DEFAULT 0 COMMENT '数量',
  `calc_date` date NOT NULL COMMENT '快照日',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 45 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '仕掛在庫快照' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for suppliers
-- ----------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `supplier_cd` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '仕入先CD',
  `supplier_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '仕入先名',
  `supplier_kana` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '仕入先名カナ',
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '担当者名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '電話番号',
  `fax` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'FAX番号',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'メールアドレス',
  `postal_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '郵便番号',
  `address1` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '住所1（都道府県＋市区町村）',
  `address2` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '住所2（ビル名・部屋番号等）',
  `payment_terms` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支払条件（例：月末締め翌月末払い）',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'JPY' COMMENT '通貨（例：JPY, USD, EUR）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `supplier_cd`(`supplier_cd` ASC) USING BTREE,
  INDEX `supplier_cd_2`(`supplier_cd` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '仕入先マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for system_import_status
-- ----------------------------
DROP TABLE IF EXISTS `system_import_status`;
CREATE TABLE `system_import_status`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `last_product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `last_register_date` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `last_register_time` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `module_name`(`module_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 52 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '外部ファイル取込最終読取ポインタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for system_logs
-- ----------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 567 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = 'システムログ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `department_id` int NULL DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'ユーザーマスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_in_process_logs
-- ----------------------------
DROP TABLE IF EXISTS `work_in_process_logs`;
CREATE TABLE `work_in_process_logs`  (
  `wip_log_id` int NOT NULL AUTO_INCREMENT COMMENT '工程在庫入出庫ログID（自動採番）',
  `work_order_id` int NOT NULL COMMENT '製造指図ID（work_orders）',
  `work_order_step_id` int NOT NULL COMMENT '工程ステップID（work_order_steps）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号',
  `transaction_type` enum('入庫','出庫','移動','調整') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作区分',
  `quantity` int NOT NULL COMMENT '操作数量',
  `from_location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '移動元場所CD（移動/出庫時）',
  `to_location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '移動先場所CD（移動/入庫時）',
  `operator_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作業者CD',
  `operator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作業者名',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `transaction_time` datetime NOT NULL COMMENT '操作日時',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`wip_log_id`) USING BTREE,
  INDEX `idx_work_order_id`(`work_order_id` ASC) USING BTREE,
  INDEX `idx_product_cd`(`product_cd` ASC) USING BTREE,
  INDEX `idx_process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_lot_no`(`lot_no` ASC) USING BTREE,
  INDEX `idx_transaction_time`(`transaction_time` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工程在庫入出庫履歴' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_in_process_stock
-- ----------------------------
DROP TABLE IF EXISTS `work_in_process_stock`;
CREATE TABLE `work_in_process_stock`  (
  `wip_stock_id` int NOT NULL AUTO_INCREMENT COMMENT '工程在庫ID（自動採番）',
  `work_order_id` int NOT NULL COMMENT '製造指図ID（work_orders）',
  `work_order_step_id` int NOT NULL COMMENT '対象の工程ステップID（work_order_steps）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製造対象製品CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '現在の工程CD',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号',
  `quantity` int NOT NULL COMMENT '在庫数量（WIP数量）',
  `location_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '現在の保管場所（工程間倉庫・機械・エリアなど）',
  `status` enum('待機中','加工中','加工済','異常') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '待機中' COMMENT '工程在庫状態',
  `last_update` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最終更新日時',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`wip_stock_id`) USING BTREE,
  INDEX `idx_work_order_id`(`work_order_id` ASC) USING BTREE,
  INDEX `idx_product_cd`(`product_cd` ASC) USING BTREE,
  INDEX `idx_process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_location_cd`(`location_cd` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工程中間在庫（WIP）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_order_defects
-- ----------------------------
DROP TABLE IF EXISTS `work_order_defects`;
CREATE TABLE `work_order_defects`  (
  `defect_id` int NOT NULL AUTO_INCREMENT COMMENT '不良品履歴ID（自動採番）',
  `work_order_id` int NOT NULL COMMENT '製造指図ID（work_orders）',
  `work_order_step_id` int NOT NULL COMMENT '工程ステップID（work_order_steps）',
  `work_order_result_id` int NULL DEFAULT NULL COMMENT '実績ID（work_order_results）（nullable）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製品CD',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号',
  `defect_reason_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '不良理由CD',
  `defect_reason_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '不良理由名称',
  `quantity` int NOT NULL COMMENT '不良数量',
  `operator_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登録作業者CD',
  `operator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登録作業者名称',
  `detected_time` datetime NOT NULL COMMENT '不良発生日・時',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  PRIMARY KEY (`defect_id`) USING BTREE,
  INDEX `idx_work_order_id`(`work_order_id` ASC) USING BTREE,
  INDEX `idx_work_order_step_id`(`work_order_step_id` ASC) USING BTREE,
  INDEX `idx_product_cd`(`product_cd` ASC) USING BTREE,
  INDEX `idx_process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_lot_no`(`lot_no` ASC) USING BTREE,
  INDEX `idx_defect_reason_cd`(`defect_reason_cd` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製造工程不良品履歴' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_order_results
-- ----------------------------
DROP TABLE IF EXISTS `work_order_results`;
CREATE TABLE `work_order_results`  (
  `work_order_result_id` int NOT NULL AUTO_INCREMENT COMMENT '製造実績ID（自動採番）',
  `work_order_id` int NOT NULL COMMENT '製造指図ID（work_orders）',
  `work_order_step_id` int NOT NULL COMMENT '対象の製造工程ID（work_order_steps）',
  `result_date` date NOT NULL COMMENT '実績登録日',
  `start_time` datetime NULL DEFAULT NULL COMMENT '作業開始日時',
  `end_time` datetime NULL DEFAULT NULL COMMENT '作業終了日時',
  `completed_quantity` int NOT NULL DEFAULT 0 COMMENT '完成数量（良品数）',
  `defective_quantity` int NOT NULL DEFAULT 0 COMMENT '不良数量',
  `defect_reason_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '不良理由CD（nullable）',
  `defect_reason_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '不良理由名称',
  `operator_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作業者CD',
  `operator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作業者名称',
  `machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '使用設備CD',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`work_order_result_id`) USING BTREE,
  INDEX `idx_work_order_id`(`work_order_id` ASC) USING BTREE,
  INDEX `idx_work_order_step_id`(`work_order_step_id` ASC) USING BTREE,
  INDEX `idx_result_date`(`result_date` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製造工程実績' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_order_steps
-- ----------------------------
DROP TABLE IF EXISTS `work_order_steps`;
CREATE TABLE `work_order_steps`  (
  `work_order_step_id` int NOT NULL AUTO_INCREMENT COMMENT '製造指図工程明細ID（自動採番）',
  `work_order_id` int NOT NULL COMMENT '親製造指図ID（work_orders）',
  `step_no` int NOT NULL COMMENT '工程順（1、2、3…）',
  `process_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工程CD（processes.process_cd）',
  `process_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '工程名称（冗長保存）',
  `quantity` int NOT NULL COMMENT '工程対象数量（通常与work_orders.quantity一致）',
  `status` enum('未開始','進行中','完了','異常') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '未開始' COMMENT '工程進捗状態',
  `planned_start_date` date NULL DEFAULT NULL COMMENT '予定開始日',
  `planned_end_date` date NULL DEFAULT NULL COMMENT '予定完了日',
  `actual_start_date` date NULL DEFAULT NULL COMMENT '実際開始日',
  `actual_end_date` date NULL DEFAULT NULL COMMENT '実際完了日',
  `assigned_machine_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '割当設備CD（nullable）',
  `assigned_operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '担当作業者（nullable）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '備考',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`work_order_step_id`) USING BTREE,
  UNIQUE INDEX `uq_work_order_step`(`work_order_id` ASC, `step_no` ASC) USING BTREE,
  INDEX `idx_work_order_id`(`work_order_id` ASC) USING BTREE,
  INDEX `idx_process_cd`(`process_cd` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製造指図工程明細' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_orders
-- ----------------------------
DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders`  (
  `work_order_id` int NOT NULL AUTO_INCREMENT COMMENT '製造指図ID（自動採番）',
  `work_order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製造指図番号（ユーザー向けの管理番号）',
  `product_cd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '製造対象の製品CD',
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '製造対象の製品名称（冗長保存）',
  `plan_id` int NULL DEFAULT NULL COMMENT '関連する生産計画ID（nullable）',
  `quantity` int NOT NULL COMMENT '製造予定数量',
  `lot_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ロット番号（製造バッチ番号）',
  `status` enum('未開始','進行中','完了','中止') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '未開始' COMMENT '製造指図の進捗状態',
  `order_date` date NOT NULL COMMENT '指図発行日',
  `planned_start_date` date NULL DEFAULT NULL COMMENT '予定開始日',
  `planned_end_date` date NULL DEFAULT NULL COMMENT '予定完了日',
  `actual_start_date` date NULL DEFAULT NULL COMMENT '実際開始日',
  `actual_end_date` date NULL DEFAULT NULL COMMENT '実際完了日',
  `created_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作成者',
  `updated_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '更新者',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  PRIMARY KEY (`work_order_id`) USING BTREE,
  UNIQUE INDEX `work_order_no`(`work_order_no` ASC) USING BTREE,
  INDEX `idx_product_cd`(`product_cd` ASC) USING BTREE,
  INDEX `idx_plan_id`(`plan_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '製造指図マスタ' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Triggers structure for table order_monthly
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_order_monthly_before_insert`;
delimiter ;;
CREATE TRIGGER `trg_order_monthly_before_insert` BEFORE INSERT ON `order_monthly` FOR EACH ROW BEGIN
  SET NEW.order_id = CONCAT(
    NEW.year,
    LPAD(NEW.month, 2, '0'), -- 月补0（4变成04）
    NEW.destination_cd,
    NEW.product_cd
  );
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table order_monthly
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_order_monthly_before_update`;
delimiter ;;
CREATE TRIGGER `trg_order_monthly_before_update` BEFORE UPDATE ON `order_monthly` FOR EACH ROW BEGIN
  SET NEW.order_id = CONCAT(
    NEW.year,
    LPAD(NEW.month, 2, '0'), -- 月补0（4变成04）
    NEW.destination_cd,
    NEW.product_cd
  );
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
