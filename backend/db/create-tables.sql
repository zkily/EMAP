-- 权限系统相关表
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id VARCHAR(20) NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 初始化权限数据
INSERT INTO permissions (code, name, description) VALUES 
('order:access', '受注管理アクセス', '受注管理モジュールへのアクセス'),
('order:view', '受注一覧表示', '受注一覧の表示'),
('order:create', '受注登録', '新規受注の登録'),
('order:edit', '受注編集', '受注情報の編集'),
('order:delete', '受注削除', '受注の削除'),
('order:approve', '受注承認', '受注の承認'),
('order:view-price', '価格表示', '価格情報の表示'),
('order:view-cost', 'コスト表示', 'コスト情報の表示'),
('plan:access', '生産計画アクセス', '生産計画モジュールへのアクセス'),
('plan:view', '計画一覧表示', '生産計画一覧の表示'),
('plan:create', '計画登録', '新規生産計画の登録'),
('plan:edit', '計画編集', '生産計画の編集'),
('plan:delete', '計画削除', '生産計画の削除'),
('plan:approve', '計画承認', '生産計画の承認'),
('system:access', 'システム管理アクセス', 'システム管理モジュールへのアクセス'),
('system:user-manage', 'ユーザー管理', 'ユーザーの管理'),
('system:role-manage', 'ロール管理', 'ロールの管理'),
('system:permission-manage', '権限管理', '権限の管理');

-- 初始化admin角色所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions;

-- 初始化manager角色权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'manager', id FROM permissions 
WHERE code IN (
  'order:access', 'order:view', 'order:create', 'order:edit', 'order:approve', 'order:view-price',
  'plan:access', 'plan:view', 'plan:create', 'plan:edit', 'plan:approve'
);

-- 初始化user角色权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'user', id FROM permissions 
WHERE code IN (
  'order:access', 'order:view', 'order:create', 'plan:access', 'plan:view'
);

-- 初始化guest角色权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'guest', id FROM permissions 
WHERE code IN (
  'order:view', 'plan:view'
);

-- 添加product_type字段到order_monthly表
ALTER TABLE order_monthly ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) NULL COMMENT '製品タイプ' AFTER product_name;

-- 添加product_type字段到order_daily表
ALTER TABLE order_daily ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) NULL COMMENT '製品タイプ' AFTER product_name; 