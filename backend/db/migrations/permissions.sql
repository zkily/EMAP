-- 権限マスタテーブル
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT, -- 権限ID（自動採番）
  code VARCHAR(50) NOT NULL UNIQUE,  -- 権限コード（例：order:view）
  name VARCHAR(100) NOT NULL,        -- 権限名（日本語名など）
  description TEXT,                  -- 権限の説明
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 作成日時
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新日時
);

-- ロールと権限の紐付けテーブル
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT, -- 紐付けID（自動採番）
  role_id VARCHAR(20) NOT NULL,      -- ロールID（例：admin, manager, user, guest）
  permission_id INT NOT NULL,        -- 権限ID（permissionsテーブルの外部キー）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 作成日時
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE -- 外部キー制約
); 