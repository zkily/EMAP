-- 溶接出荷管理示例数据
-- 在 shipping_items 表中插入一些溶接相关的产品数据

INSERT INTO shipping_items (
  shipping_no, shipping_date, delivery_date, destination_cd, destination_name,
  product_cd, product_name, confirmed_boxes, confirmed_units, unit, status
) VALUES 
-- 溶接产品示例数据
('WS2024-001', '2024-01-15', '2024-01-16', 'DEST01', 'Honda Motor Co.', 
 'WELD-001', '溶接ロッド 3.2mm', 5, 100, '本', '発行済'),
 
('WS2024-002', '2024-01-15', '2024-01-16', 'DEST02', 'Toyota Motor Corp.', 
 'WELD-002', 'アルミ溶接ワイヤ', 3, 75, '本', '発行済'),
 
('WS2024-003', '2024-01-16', '2024-01-17', 'DEST01', 'Honda Motor Co.', 
 'WELD-001', '溶接ロッド 3.2mm', 8, 160, '本', '発行済'),
 
('WS2024-004', '2024-01-16', '2024-01-17', 'DEST03', 'Nissan Motor Co.', 
 'WELD-003', 'ステンレス溶接棒', 4, 80, '本', '発行済'),

('WS2024-005', '2024-01-17', '2024-01-18', 'DEST02', 'Toyota Motor Corp.', 
 'WELD-002', 'アルミ溶接ワイヤ', 6, 120, '本', '発行済'),
 
('WS2024-006', '2024-01-17', '2024-01-18', 'DEST04', 'Mazda Motor Corp.', 
 'WELD-004', 'WELDING ELECTRODE', 7, 140, '本', '発行済'),

('WS2024-007', '2024-01-18', '2024-01-19', 'DEST01', 'Honda Motor Co.', 
 'WELD-001', '溶接ロッド 3.2mm', 10, 200, '本', '発行済'),
 
('WS2024-008', '2024-01-18', '2024-01-19', 'DEST05', 'Subaru Corp.', 
 'WELD-005', 'チタン溶接材料', 2, 40, '本', '発行済'),

('WS2024-009', '2024-01-19', '2024-01-20', 'DEST03', 'Nissan Motor Co.', 
 'WELD-003', 'ステンレス溶接棒', 5, 100, '本', '発行済'),
 
('WS2024-010', '2024-01-19', '2024-01-20', 'DEST02', 'Toyota Motor Corp.', 
 'WELD-002', 'アルミ溶接ワイヤ', 9, 180, '本', '発行済'),

-- 更多日期的数据，用于测试期间查询
('WS2024-011', '2024-01-22', '2024-01-23', 'DEST01', 'Honda Motor Co.', 
 'WELD-001', '溶接ロッド 3.2mm', 6, 120, '本', '発行済'),
 
('WS2024-012', '2024-01-22', '2024-01-23', 'DEST04', 'Mazda Motor Corp.', 
 'WELD-004', 'WELDING ELECTRODE', 4, 80, '本', '発行済'),

('WS2024-013', '2024-01-23', '2024-01-24', 'DEST05', 'Subaru Corp.', 
 'WELD-005', 'チタン溶接材料', 3, 60, '本', '発行済'),
 
('WS2024-014', '2024-01-23', '2024-01-24', 'DEST02', 'Toyota Motor Corp.', 
 'WELD-002', 'アルミ溶接ワイヤ', 7, 140, '本', '発行済'),

('WS2024-015', '2024-01-24', '2024-01-25', 'DEST03', 'Nissan Motor Co.', 
 'WELD-003', 'ステンレス溶接棒', 8, 160, '本', '発行済'),

-- 最近的数据用于当月测试
('WS2024-016', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'DEST01', 'Honda Motor Co.', 
 'WELD-001', '溶接ロッド 3.2mm', 5, 100, '本', '発行済'),
 
('WS2024-017', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'DEST02', 'Toyota Motor Corp.', 
 'WELD-002', 'アルミ溶接ワイヤ', 4, 80, '本', '発行済'),

('WS2024-018', DATE_SUB(CURDATE(), INTERVAL 1 DAY), CURDATE(), 'DEST04', 'Mazda Motor Corp.', 
 'WELD-004', 'WELDING ELECTRODE', 6, 120, '本', '発行済'),
 
('WS2024-019', DATE_SUB(CURDATE(), INTERVAL 1 DAY), CURDATE(), 'DEST05', 'Subaru Corp.', 
 'WELD-005', 'チタン溶接材料', 3, 60, '本', '発行済'),

('WS2024-020', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'DEST03', 'Nissan Motor Co.', 
 'WELD-003', 'ステンレス溶接棒', 7, 140, '本', '発行済');

-- 创建一些非溶接产品，用于验证筛选功能
INSERT INTO shipping_items (
  shipping_no, shipping_date, delivery_date, destination_cd, destination_name,
  product_cd, product_name, confirmed_boxes, confirmed_units, unit, status
) VALUES 
('NS2024-001', '2024-01-15', '2024-01-16', 'DEST01', 'Honda Motor Co.', 
 'NORM-001', '通常製品A', 10, 200, '本', '発行済'),
 
('NS2024-002', '2024-01-16', '2024-01-17', 'DEST02', 'Toyota Motor Corp.', 
 'NORM-002', '通常製品B', 8, 160, '本', '発行済');

COMMIT; 