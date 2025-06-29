-- 盘点管理相关数据表创建脚本

-- 1. 創建產品表 (products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_code` varchar(50) NOT NULL COMMENT '製品编码',
  `product_name` varchar(200) NOT NULL COMMENT '製品名称',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
  `category` varchar(50) DEFAULT NULL COMMENT '产品分类',
  `unit` varchar(20) NOT NULL COMMENT '计量单位',
  `standard_cost` decimal(15,4) DEFAULT NULL COMMENT '标准成本',
  `selling_price` decimal(15,4) DEFAULT NULL COMMENT '销售价格',
  `stock_quantity` decimal(15,4) NOT NULL DEFAULT '0.0000' COMMENT '库存数量',
  `safety_stock` decimal(15,4) DEFAULT NULL COMMENT '安全库存',
  `lead_time` int(11) DEFAULT NULL COMMENT '生产提前期（天）',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态：0-停用，1-启用',
  `remark` text COMMENT '备注',
  `created_by` varchar(50) NOT NULL COMMENT '创建人',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新人',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_code` (`product_code`),
  KEY `idx_product_category` (`category`),
  KEY `idx_product_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='製品表';

-- 2. 創建工程表 (processes)
CREATE TABLE IF NOT EXISTS `processes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `process_code` varchar(50) NOT NULL COMMENT '工程编码',
  `process_name` varchar(100) NOT NULL COMMENT '工程名称',
  `department_id` int(11) DEFAULT NULL COMMENT '所属部门ID',
  `department_name` varchar(100) DEFAULT NULL COMMENT '所属部门名称',
  `sequence` int(11) DEFAULT NULL COMMENT '工序顺序',
  `standard_time` decimal(10,2) DEFAULT NULL COMMENT '标准工时（分钟）',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态：0-停用，1-启用',
  `remark` text COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_code` (`process_code`),
  KEY `idx_process_department` (`department_id`),
  KEY `idx_process_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工程表';

-- 3. 創建仕掛品表 (work_in_progress)
CREATE TABLE IF NOT EXISTS `work_in_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wip_code` varchar(50) NOT NULL COMMENT '仕掛品编码',
  `product_id` int(11) NOT NULL COMMENT '关联製品ID',
  `product_code` varchar(50) NOT NULL COMMENT '製品编码',
  `product_name` varchar(200) NOT NULL COMMENT '製品名称',
  `process_id` int(11) NOT NULL COMMENT '当前工程ID',
  `process_name` varchar(100) NOT NULL COMMENT '当前工程名称',
  `department_id` int(11) DEFAULT NULL COMMENT '所在部门ID',
  `department_name` varchar(100) DEFAULT NULL COMMENT '所在部门名称',
  `lot_no` varchar(50) DEFAULT NULL COMMENT '批次号',
  `quantity` decimal(15,4) NOT NULL DEFAULT '0.0000' COMMENT '在制数量',
  `unit` varchar(20) NOT NULL COMMENT '计量单位',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `planned_finish_date` date DEFAULT NULL COMMENT '计划完成日期',
  `actual_finish_date` date DEFAULT NULL COMMENT '实际完成日期',
  `completion_rate` decimal(5,2) DEFAULT '0.00' COMMENT '完成率（%）',
  `cost_amount` decimal(15,2) DEFAULT '0.00' COMMENT '成本金额',
  `status` enum('planning','in_progress','completed','cancelled') NOT NULL DEFAULT 'planning' COMMENT '状态',
  `remark` text COMMENT '备注',
  `created_by` varchar(50) NOT NULL COMMENT '创建人',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新人',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_wip_product` (`product_id`),
  KEY `idx_wip_process` (`process_id`),
  KEY `idx_wip_department` (`department_id`),
  KEY `idx_wip_status` (`status`),
  KEY `idx_wip_lot` (`lot_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仕掛品表';

-- 4. 創建部品表 (components)
CREATE TABLE IF NOT EXISTS `components` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `component_code` varchar(50) NOT NULL COMMENT '部品编码',
  `component_name` varchar(200) NOT NULL COMMENT '部品名称',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
  `category` varchar(50) DEFAULT NULL COMMENT '部品分类',
  `unit` varchar(20) NOT NULL COMMENT '计量单位',
  `standard_cost` decimal(15,4) DEFAULT NULL COMMENT '标准成本',
  `purchase_price` decimal(15,4) DEFAULT NULL COMMENT '采购价格',
  `stock_quantity` decimal(15,4) NOT NULL DEFAULT '0.0000' COMMENT '库存数量',
  `safety_stock` decimal(15,4) DEFAULT NULL COMMENT '安全库存',
  `supplier_id` int(11) DEFAULT NULL COMMENT '主供应商ID',
  `supplier_name` varchar(100) DEFAULT NULL COMMENT '主供应商名称',
  `lead_time` int(11) DEFAULT NULL COMMENT '采购提前期（天）',
  `min_order_qty` decimal(15,4) DEFAULT NULL COMMENT '最小订购量',
  `is_critical` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否关键部品',
  `storage_location` varchar(100) DEFAULT NULL COMMENT '存储位置',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态：0-停用，1-启用',
  `remark` text COMMENT '备注',
  `created_by` varchar(50) NOT NULL COMMENT '创建人',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新人',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_component_code` (`component_code`),
  KEY `idx_component_category` (`category`),
  KEY `idx_component_supplier` (`supplier_id`),
  KEY `idx_component_status` (`status`),
  KEY `idx_component_critical` (`is_critical`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部品表';

-- 5. 創建盘点单主表 (inventory_counts)
CREATE TABLE IF NOT EXISTS `inventory_counts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `count_no` varchar(50) NOT NULL COMMENT '盘点单号',
  `count_date` date NOT NULL COMMENT '盘点日期',
  `count_type` enum('product','wip','material','component') NOT NULL COMMENT '盘点类型',
  `department_id` int(11) DEFAULT NULL COMMENT '部门ID（仕掛品专用）',
  `department_name` varchar(100) DEFAULT NULL COMMENT '部门名称',
  `process_id` int(11) DEFAULT NULL COMMENT '工程ID（仕掛品专用）',
  `process_name` varchar(100) DEFAULT NULL COMMENT '工程名称',
  `location_id` int(11) DEFAULT NULL COMMENT '库位ID',
  `location_name` varchar(100) DEFAULT NULL COMMENT '库位名称',
  `status` enum('draft','counting','completed','cancelled') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `count_person` varchar(50) NOT NULL COMMENT '盘点人',
  `check_person` varchar(50) DEFAULT NULL COMMENT '复核人',
  `remark` text COMMENT '备注',
  `created_by` varchar(50) NOT NULL COMMENT '创建人',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新人',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_count_no` (`count_no`),
  KEY `idx_count_type` (`count_type`),
  KEY `idx_count_status` (`status`),
  KEY `idx_count_date` (`count_date`),
  KEY `idx_count_department` (`department_id`),
  KEY `idx_count_process` (`process_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点单主表';

-- 6. 創建盘点明细表 (inventory_count_details)
CREATE TABLE IF NOT EXISTS `inventory_count_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `count_id` int(11) NOT NULL COMMENT '盘点单ID',
  `item_id` int(11) NOT NULL COMMENT '物品ID',
  `item_code` varchar(50) NOT NULL COMMENT '物品编码',
  `item_name` varchar(200) NOT NULL COMMENT '物品名称',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) NOT NULL COMMENT '计量单位',
  `book_quantity` decimal(15,4) NOT NULL DEFAULT '0.0000' COMMENT '账面数量',
  `actual_quantity` decimal(15,4) DEFAULT NULL COMMENT '实盘数量',
  `difference_quantity` decimal(15,4) DEFAULT NULL COMMENT '差异数量',
  `unit_price` decimal(15,4) DEFAULT NULL COMMENT '单价',
  `difference_amount` decimal(15,2) DEFAULT NULL COMMENT '差异金额',
  `batch_no` varchar(50) DEFAULT NULL COMMENT '批次号',
  `location_code` varchar(50) DEFAULT NULL COMMENT '库位编码',
  `remark` text COMMENT '备注',
  `is_counted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已盘点',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_detail_count` (`count_id`),
  KEY `idx_detail_item` (`item_id`),
  KEY `idx_detail_code` (`item_code`),
  KEY `idx_detail_counted` (`is_counted`),
  CONSTRAINT `fk_detail_count` FOREIGN KEY (`count_id`) REFERENCES `inventory_counts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点明细表';

-- 7. 創建盘点差异处理记录表 (inventory_adjustments)
CREATE TABLE IF NOT EXISTS `inventory_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `count_id` int(11) NOT NULL COMMENT '盘点单ID',
  `adjustment_no` varchar(50) NOT NULL COMMENT '调整单号',
  `adjustment_date` date NOT NULL COMMENT '调整日期',
  `adjustment_type` enum('profit','loss') NOT NULL COMMENT '调整类型：profit-盘盈, loss-盘亏',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '调整总金额',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `approve_person` varchar(50) DEFAULT NULL COMMENT '审核人',
  `approve_date` date DEFAULT NULL COMMENT '审核日期',
  `remark` text COMMENT '备注',
  `created_by` varchar(50) NOT NULL COMMENT '创建人',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_adjustment_no` (`adjustment_no`),
  KEY `idx_adjustment_count` (`count_id`),
  KEY `idx_adjustment_type` (`adjustment_type`),
  KEY `idx_adjustment_status` (`status`),
  KEY `idx_adjustment_date` (`adjustment_date`),
  CONSTRAINT `fk_adjustment_count` FOREIGN KEY (`count_id`) REFERENCES `inventory_counts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点差异处理记录表';

-- 8. 創建部门表 (departments) - 如果不存在
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_code` varchar(50) NOT NULL COMMENT '部门编码',
  `department_name` varchar(100) NOT NULL COMMENT '部门名称',
  `parent_id` int(11) DEFAULT NULL COMMENT '上级部门ID',
  `level` int(11) DEFAULT '1' COMMENT '部门层级',
  `manager` varchar(50) DEFAULT NULL COMMENT '部门负责人',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态：0-停用，1-启用',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `remark` text COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_department_code` (`department_code`),
  KEY `idx_department_parent` (`parent_id`),
  KEY `idx_department_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 9. 創建库位表 (locations) - 如果不存在
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_code` varchar(50) NOT NULL COMMENT '库位编码',
  `location_name` varchar(100) NOT NULL COMMENT '库位名称',
  `warehouse_id` int(11) DEFAULT NULL COMMENT '仓库ID',
  `warehouse_name` varchar(100) DEFAULT NULL COMMENT '仓库名称',
  `location_type` varchar(50) DEFAULT NULL COMMENT '库位类型',
  `capacity` decimal(15,4) DEFAULT NULL COMMENT '容量',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态：0-停用，1-启用',
  `remark` text COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_location_code` (`location_code`),
  KEY `idx_location_warehouse` (`warehouse_id`),
  KEY `idx_location_type` (`location_type`),
  KEY `idx_location_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库位表';

-- 10. 插入示例数据

-- 插入部门数据
INSERT IGNORE INTO `departments` (`department_code`, `department_name`, `manager`, `status`) VALUES
('PROD', '生产部', '张三', 1),
('QC', '品质部', '李四', 1),
('WARE', '仓储部', '王五', 1),
('MAINT', '维修部', '赵六', 1);

-- 插入工程数据
INSERT IGNORE INTO `processes` (`process_code`, `process_name`, `department_id`, `department_name`, `sequence`, `standard_time`, `status`) VALUES
('P001', '切割工程', 1, '生产部', 1, 30.00, 1),
('P002', '焊接工程', 1, '生产部', 2, 45.00, 1),
('P003', '打磨工程', 1, '生产部', 3, 20.00, 1),
('P004', '涂装工程', 1, '生产部', 4, 60.00, 1),
('P005', '组装工程', 1, '生产部', 5, 90.00, 1),
('Q001', '首检工程', 2, '品质部', 6, 15.00, 1),
('Q002', '终检工程', 2, '品质部', 7, 25.00, 1);

-- 插入库位数据
INSERT IGNORE INTO `locations` (`location_code`, `location_name`, `warehouse_id`, `warehouse_name`, `location_type`, `status`) VALUES
('A01-01', 'A区1排1列', 1, '主仓库', '原材料区', 1),
('A01-02', 'A区1排2列', 1, '主仓库', '原材料区', 1),
('B01-01', 'B区1排1列', 1, '主仓库', '半成品区', 1),
('B01-02', 'B区1排2列', 1, '主仓库', '半成品区', 1),
('C01-01', 'C区1排1列', 1, '主仓库', '成品区', 1),
('C01-02', 'C区1排2列', 1, '主仓库', '成品区', 1),
('D01-01', 'D区1排1列', 2, '备料仓库', '部品区', 1),
('D01-02', 'D区1排2列', 2, '备料仓库', '部品区', 1);

-- 插入产品示例数据
INSERT IGNORE INTO `products` (`product_code`, `product_name`, `specification`, `category`, `unit`, `standard_cost`, `selling_price`, `stock_quantity`, `safety_stock`, `lead_time`, `status`, `created_by`) VALUES
('PRD001', '电机组件A型', '220V/50Hz/1500RPM', '电机类', 'PCS', 1200.00, 1500.00, 150.0000, 20.0000, 7, 1, 'admin'),
('PRD002', '电机组件B型', '380V/50Hz/3000RPM', '电机类', 'PCS', 1800.00, 2200.00, 80.0000, 15.0000, 10, 1, 'admin'),
('PRD003', '控制面板标准型', '7寸触摸屏', '控制类', 'PCS', 800.00, 1000.00, 200.0000, 30.0000, 14, 1, 'admin');

-- 插入部品示例数据
INSERT IGNORE INTO `components` (`component_code`, `component_name`, `specification`, `category`, `unit`, `standard_cost`, `purchase_price`, `stock_quantity`, `safety_stock`, `supplier_name`, `lead_time`, `min_order_qty`, `is_critical`, `status`, `created_by`) VALUES
('CMP001', '螺栓M8x20', 'M8x20不锈钢', '紧固件', 'PCS', 0.50, 0.60, 5000.0000, 500.0000, '五金供应商A', 3, 1000.0000, 0, 1, 'admin'),
('CMP002', '轴承6205', '深沟球轴承', '轴承类', 'PCS', 25.00, 30.00, 200.0000, 20.0000, '轴承供应商B', 7, 50.0000, 1, 1, 'admin'),
('CMP003', '电缆线3芯', '3x2.5mm²铜芯', '电气类', 'M', 8.50, 10.00, 1000.0000, 100.0000, '电缆供应商C', 5, 100.0000, 1, 1, 'admin');

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS `idx_inventory_counts_composite` ON `inventory_counts` (`count_type`, `status`, `count_date`);
CREATE INDEX IF NOT EXISTS `idx_inventory_count_details_composite` ON `inventory_count_details` (`count_id`, `is_counted`, `item_code`);
CREATE INDEX IF NOT EXISTS `idx_work_in_progress_composite` ON `work_in_progress` (`department_id`, `process_id`, `status`);

-- 创建视图方便查询
CREATE OR REPLACE VIEW `v_inventory_count_summary` AS
SELECT 
    ic.id,
    ic.count_no,
    ic.count_date,
    ic.count_type,
    ic.status,
    ic.count_person,
    ic.check_person,
    ic.department_name,
    ic.process_name,
    COUNT(icd.id) as detail_count,
    SUM(CASE WHEN icd.is_counted = 1 THEN 1 ELSE 0 END) as counted_count,
    SUM(CASE WHEN icd.is_counted = 0 THEN 1 ELSE 0 END) as uncounted_count,
    SUM(CASE WHEN icd.difference_quantity != 0 THEN 1 ELSE 0 END) as difference_count,
    SUM(icd.difference_amount) as total_difference_amount,
    CASE 
        WHEN COUNT(icd.id) = 0 THEN 0
        ELSE ROUND(SUM(CASE WHEN icd.is_counted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(icd.id), 2)
    END as progress_rate
FROM inventory_counts ic
LEFT JOIN inventory_count_details icd ON ic.id = icd.count_id
GROUP BY ic.id, ic.count_no, ic.count_date, ic.count_type, ic.status, ic.count_person, ic.check_person, ic.department_name, ic.process_name;

COMMIT; 