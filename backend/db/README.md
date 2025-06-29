# Smart-EMAP 数据库管理方案

这个目录包含了 Smart-EMAP 项目的数据库管理方案，包括连接、迁移、种子和备份工具。

## 目录结构

```
db/
├── backup/           # 数据库备份工具和备份文件
│   ├── backup.js     # 备份命令行工具
│   └── snapshots/    # 备份文件存放目录
├── connection.js     # 数据库连接管理
├── index.js          # 旧的数据库连接文件（将被替换）
├── migrate.js        # 迁移命令行工具
├── migrations/       # 数据库迁移文件
│   ├── migrationManager.js  # 迁移管理器
│   └── 001_create_users_table.js  # 示例迁移
├── models/           # 数据库模型
│   └── index.js      # 模型集合
├── schema/           # 数据库结构文档
│   ├── schema.js     # 结构导出工具
│   └── database_schema.md  # 自动生成的数据库文档
├── seed.js           # 种子命令行工具
├── seeds/            # 数据库种子
│   ├── seedManager.js  # 种子管理器
│   └── 001_demo_data.js  # 示例种子数据
└── README.md         # 本文档
```

## 设置

1. 创建环境配置文件：

   复制 `.env.template` 到以下文件，并根据环境设置适当的值：

   - `.env.development` - 开发环境
   - `.env.test` - 测试环境
   - `.env.production` - 生产环境

   示例：

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=smart_emap_dev
   DB_CONNECTION_LIMIT=10
   ```

2. 在应用启动时，将根据环境变量 `NODE_ENV` 加载相应的配置文件：
   - `NODE_ENV=development` (默认) - 加载 `.env.development`
   - `NODE_ENV=test` - 加载 `.env.test`
   - `NODE_ENV=production` - 加载 `.env.production`

## 数据库迁移

数据库迁移用于管理数据库结构的变更，并保持变更的版本控制。

### 命令

```bash
# 应用所有未应用的迁移
node migrate.js up

# 回滚最后一个迁移
node migrate.js down

# 刷新所有迁移（回滚所有再重新应用）
node migrate.js refresh

# 查看迁移状态
node migrate.js status

# 创建新的迁移文件
node migrate.js create <name>
```

### 迁移文件结构

每个迁移文件都包含 `up` 和 `down` 两个函数：

```javascript
export async function up(connection) {
  // 在此处编写向前迁移的SQL
  const sql = `CREATE TABLE ...`;
  await connection.execute(sql);
}

export async function down(connection) {
  // 在此处编写回滚迁移的SQL
  const sql = `DROP TABLE ...`;
  await connection.execute(sql);
}
```

## 数据库种子

数据库种子用于填充测试数据或初始化必要的数据。

### 命令

```bash
# 应用所有未应用的种子
node seed.js up

# 重置所有种子
node seed.js reset

# 刷新所有种子（重置并重新应用）
node seed.js refresh

# 查看种子状态
node seed.js status

# 创建新的种子文件
node seed.js create <name>
```

### 种子文件结构

每个种子文件都包含 `run` 和 `reset` 两个函数：

```javascript
export async function run(connection) {
  // 在此处编写插入数据的SQL
  const sql = `INSERT INTO ...`;
  await connection.execute(sql, [params]);
}

export async function reset(connection) {
  // 在此处编写重置数据的SQL
  const sql = `DELETE FROM ...`;
  await connection.execute(sql);
}
```

## 数据库备份

数据库备份工具用于创建、管理和恢复数据库备份。

### 命令

```bash
# 创建新备份
node backup.js create

# 列出所有备份
node backup.js list

# 从备份恢复
node backup.js restore <filename>

# 压缩旧备份（默认7天前）
node backup.js compress [days]
```

### 自动备份

可以在应用程序启动时设置自动备份：

```javascript
import { scheduleBackups } from "./db/backup/backup.js";

// 设置每天凌晨自动备份
scheduleBackups("0 0 * * *");
```

## 数据库模型

数据库模型提供了访问数据库表的高级API。

### 使用示例

```javascript
import { User } from "./db/models/index.js";

// 查找用户
const user = await User.findById(1);
const userByName = await User.findByUsername("admin");

// 创建用户
const userId = await User.create({
  username: "newuser",
  email: "user@example.com",
  password: hashedPassword,
  role: "staff",
});

// 更新用户
await User.update(userId, {
  first_name: "新名字",
  last_name: "新姓氏",
});

// 获取用户列表（分页）
const users = await User.findAll(1, 10, { role: "staff" });
```

## 数据库结构管理

数据库结构管理工具用于导出和记录数据库结构。

### 使用示例

```javascript
import schemaManager from "./db/schema/schema.js";

// 导出数据库结构为JSON
await schemaManager.exportSchemaToJson();

// 导出创建表的SQL语句
await schemaManager.exportCreateTableStatements();

// 导出数据库文档（Markdown格式）
await schemaManager.exportSchemaDocumentation();
```

## 最佳实践

1. **版本控制**：

   - 所有迁移文件和种子文件应该纳入版本控制
   - 环境配置文件（.env.\*）不应该提交到版本控制
   - 备份文件不应该提交到版本控制

2. **迁移命名**：

   - 迁移文件应该使用有意义的名称，例如 `create_users_table`、`add_index_to_users`
   - 迁移文件会自动添加时间戳前缀

3. **数据库安全**：

   - 使用环境变量存储敏感信息，如数据库密码
   - 确保生产环境的数据库用户权限最小化
   - 定期备份数据库

4. **测试**：
   - 在应用迁移到生产环境前，应在测试环境中测试
   - 确保每个迁移的 `down` 函数能正确回滚变更
