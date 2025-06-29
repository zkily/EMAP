-- 权限系统扩展迁移文件
-- 创建日期: 2024-01-01

-- 创建页面权限表
CREATE TABLE IF NOT EXISTS page_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_code VARCHAR(50) NOT NULL UNIQUE COMMENT '页面代码',
  page_name VARCHAR(100) NOT NULL COMMENT '页面名称',
  page_path VARCHAR(200) NOT NULL COMMENT '页面路径',
  module_name VARCHAR(50) NOT NULL COMMENT '所属模块',
  required_permission VARCHAR(50) COMMENT '必需权限代码',
  description TEXT COMMENT '页面描述',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_code (page_code),
  INDEX idx_module_name (module_name),
  FOREIGN KEY (required_permission) REFERENCES permissions(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面权限配置表';

-- 创建用户特殊权限表
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  permission_id INT NOT NULL COMMENT '权限ID',
  granted_by INT NOT NULL COMMENT '授权者ID',
  granted_reason VARCHAR(200) COMMENT '授权原因',
  expires_at TIMESTAMP NULL COMMENT '过期时间',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_permission (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户特殊权限表';

-- 创建权限模板表
CREATE TABLE IF NOT EXISTS permission_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_name VARCHAR(100) NOT NULL UNIQUE COMMENT '模板名称',
  template_description TEXT COMMENT '模板描述',
  template_data JSON NOT NULL COMMENT '权限配置数据',
  created_by INT NOT NULL COMMENT '创建者ID',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表';

-- 扩展现有权限数据
INSERT IGNORE INTO permissions (code, name, description) VALUES 
-- 页面访问权限
('page:order', '受注ページアクセス', '受注管理ページへのアクセス権限'),
('page:plan', '生産計画ページアクセス', '生産計画ページへのアクセス権限'),
('page:shipping', '出荷ページアクセス', '出荷管理ページへのアクセス権限'),
('page:system', 'システム管理ページアクセス', 'システム管理ページへのアクセス権限'),
('page:staff', '人員管理ページアクセス', '人員管理ページへのアクセス権限'),
('page:master', 'マスタ管理ページアクセス', 'マスタ管理ページへのアクセス権限'),

-- 通用操作权限
('data:create', 'データ作成', '新規データの作成権限'),
('data:read', 'データ閲覧', 'データの閲覧権限'),
('data:update', 'データ更新', 'データの更新権限'),
('data:delete', 'データ削除', 'データの削除権限'),
('data:export', 'データエクスポート', 'データのエクスポート権限'),
('data:import', 'データインポート', 'データのインポート権限'),

-- 高级权限
('admin:user-manage', 'ユーザー管理', 'ユーザーの管理権限'),
('admin:role-manage', 'ロール管理', 'ロールの管理権限'),
('admin:permission-manage', '権限管理', '権限の管理権限'),
('admin:system-config', 'システム設定', 'システム設定の管理権限'),
('admin:audit-log', '監査ログ', '監査ログの閲覧権限');

-- 初始化页面权限配置
INSERT IGNORE INTO page_permissions (page_code, page_name, page_path, module_name, required_permission, description) VALUES
('order_home', '受注管理メニュー', '/order/home', 'order', 'page:order', '受注管理のメインページ'),
('order_monthly', '月別受注管理', '/order/monthly', 'order', 'order:edit', '月別受注データの管理'),
('order_daily', '日別受注管理', '/order/daily', 'order', 'order:edit', '日別受注データの管理'),
('order_history', '受注履歴管理', '/order/daily-history', 'order', 'order:view', '受注履歴の閲覧'),
('order_dashboard', '受注ダッシュボード', '/order/dashboard', 'order', 'order:view', '受注データの分析表示'),

('plan_home', '生産計画メニュー', '/plan/home', 'plan', 'page:plan', '生産計画のメインページ'),
('plan_create', '生産計画作成', '/plan/create', 'plan', 'plan:create', '新規生産計画の作成'),
('plan_edit', '生産計画編集', '/plan/edit', 'plan', 'plan:edit', '生産計画の編集'),

('shipping_home', '出荷管理メニュー', '/shipping/home', 'shipping', 'page:shipping', '出荷管理のメインページ'),
('shipping_create', '出荷登録', '/shipping/create', 'shipping', 'shipping:create', '新規出荷の登録'),

('system_home', 'システム管理', '/system', 'system', 'page:system', 'システム管理のメインページ'),
('system_permission', '権限管理', '/system/permission', 'system', 'admin:permission-manage', '権限の管理'),
('system_user', 'ユーザー管理', '/system/users', 'system', 'admin:user-manage', 'ユーザーの管理'),

('staff_home', '人員管理', '/staff', 'staff', 'page:staff', '人員管理のメインページ'),
('master_home', 'マスタ管理', '/master', 'master', 'page:master', 'マスタ管理のメインページ');

-- 为现有角色添加新权限
-- Admin 拥有所有权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions 
WHERE code IN (
  'page:order', 'page:plan', 'page:shipping', 'page:system', 'page:staff', 'page:master',
  'data:create', 'data:read', 'data:update', 'data:delete', 'data:export', 'data:import',
  'admin:user-manage', 'admin:role-manage', 'admin:permission-manage', 'admin:system-config', 'admin:audit-log'
);

-- Manager 权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'manager', id FROM permissions 
WHERE code IN (
  'page:order', 'page:plan', 'page:shipping', 'page:staff',
  'data:create', 'data:read', 'data:update', 'data:export'
);

-- User 权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'user', id FROM permissions 
WHERE code IN (
  'page:order', 'page:plan',
  'data:read', 'data:create'
);

-- Guest 权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'guest', id FROM permissions 
WHERE code IN (
  'data:read'
);

-- 创建默认权限模板
INSERT IGNORE INTO permission_templates (template_name, template_description, template_data, created_by) VALUES
('基本ユーザー', '一般的なユーザー向けの基本権限セット', 
 JSON_ARRAY('data:read', 'data:create', 'page:order', 'page:plan'), 1),
('マネージャー', 'マネージャー向けの管理権限セット', 
 JSON_ARRAY('data:read', 'data:create', 'data:update', 'data:export', 'page:order', 'page:plan', 'page:shipping', 'page:staff'), 1),
('システム管理者', 'システム管理者向けの全権限セット', 
 JSON_ARRAY('admin:user-manage', 'admin:role-manage', 'admin:permission-manage', 'admin:system-config', 'admin:audit-log'), 1); 