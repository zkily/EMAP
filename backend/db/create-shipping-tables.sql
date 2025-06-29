-- 出荷管理テーブル
CREATE TABLE IF NOT EXISTS shipping_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
  shipping_date DATE NOT NULL COMMENT '出荷日',
  delivery_date DATE NULL COMMENT '納入日',
  destination_cd VARCHAR(20) NOT NULL COMMENT '納入先コード',
  destination_name VARCHAR(100) NULL COMMENT '納入先名',
  product_cd VARCHAR(50) NOT NULL COMMENT '製品コード',
  product_name VARCHAR(100) NULL COMMENT '製品名',
  product_alias VARCHAR(100) NULL COMMENT '製品別名/納入日など追加情報',
  box_type VARCHAR(20) NULL COMMENT '箱種',
  confirmed_boxes INT NOT NULL DEFAULT 0 COMMENT '箱数',
  confirmed_units INT NOT NULL DEFAULT 0 COMMENT '出荷数量',
  unit VARCHAR(10) NOT NULL DEFAULT '本' COMMENT '単位',
  status VARCHAR(20) NOT NULL DEFAULT '未発行' COMMENT '状態（未発行/発行済/出荷済/キャンセル）',
  remarks TEXT NULL COMMENT '備考',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  UNIQUE KEY uk_shipping_no (shipping_no)
) COMMENT='出荷管理';

-- 出荷印刷記録テーブル
CREATE TABLE IF NOT EXISTS shipping_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipping_no VARCHAR(50) NOT NULL COMMENT '出荷番号',
  status VARCHAR(20) NOT NULL DEFAULT '発行済' COMMENT '状態',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '印刷日時',
  INDEX idx_shipping_no (shipping_no),
  INDEX idx_created_at (created_at)
) COMMENT='出荷印刷記録';

-- 添加出荷管理相关权限
INSERT INTO permissions (code, name, description) VALUES 
('shipping:access', '出荷管理アクセス', '出荷管理モジュールへのアクセス'),
('shipping:view', '出荷一覧表示', '出荷一覧の表示'),
('shipping:create', '出荷登録', '新規出荷の登録'),
('shipping:edit', '出荷編集', '出荷情報の編集'),
('shipping:delete', '出荷削除', '出荷の削除'),
('shipping:issue', '出荷発行', '出荷の発行');

-- 为admin角色添加所有出荷管理权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions WHERE code LIKE 'shipping:%';

-- 为manager角色添加出荷管理权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'manager', id FROM permissions 
WHERE code IN (
  'shipping:access', 'shipping:view', 'shipping:create', 
  'shipping:edit', 'shipping:issue'
);

-- 为user角色添加出荷查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'user', id FROM permissions 
WHERE code IN (
  'shipping:access', 'shipping:view'
); 