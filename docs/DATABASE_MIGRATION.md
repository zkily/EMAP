# 数据库迁移说明

本项目使用自定义的迁移工具来管理数据库结构的版本。

## 迁移文件

迁移文件位于 `backend/db/migrations` 目录下，按照数字顺序命名（例如：`001_create_users_table.js`）。

每个迁移文件包含两个导出函数：

- `up()`: 用于应用迁移，创建/修改表结构
- `down()`: 用于回滚迁移，撤销表结构变更

## 运行迁移

1. 首先确保数据库连接配置正确（`backend/db/connection.js`）

2. 执行以下命令运行所有未执行的迁移：

```bash
cd backend
node db/migrateUp.js
```

3. 如需回滚最近的迁移，执行：

```bash
cd backend
node db/migrateDown.js
```

## BOM表结构

BOM表（`bom`）的结构如下：

```sql
CREATE TABLE IF NOT EXISTS bom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL COMMENT '製品ID',
  component_id INT NOT NULL COMMENT '部品ID',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 COMMENT '数量',
  unit_price DECIMAL(10,2) DEFAULT NULL COMMENT '単価',
  note TEXT DEFAULT NULL COMMENT '備考',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_product_component (product_id, component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部品構成表（BOM）';
```

此表存储产品的物料清单信息，建立了产品与组件之间的关系。
