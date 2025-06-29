# Smart-EMAP 权限管理系统

## 概述

Smart-EMAP 权限管理系统是一个功能完整的企业级权限管理解决方案，提供了角色权限管理、页面权限控制、用户特殊权限、权限模板管理等功能。系统采用现代化的Web技术栈，界面美观，操作便捷。

## 功能特性

### 🔐 核心权限功能

- **角色权限管理** - 为不同角色配置权限集合
- **页面权限控制** - 细粒度的页面访问控制
- **用户特殊权限** - 为特定用户授予额外权限
- **权限模板管理** - 创建和应用权限组合模板
- **权限统计分析** - 权限使用情况的可视化统计

### 🎯 高级功能

- **权限继承** - 角色权限与用户特殊权限的智能组合
- **权限过期** - 支持临时权限的自动过期机制
- **批量操作** - 高效的批量权限管理
- **权限审计** - 完整的权限变更日志
- **模板应用** - 快速应用预设权限组合

### 🎨 用户体验

- **现代化UI** - 基于Element Plus的美观界面
- **响应式设计** - 完美适配各种设备屏幕
- **实时反馈** - 操作状态的即时反馈
- **多语言支持** - 日语界面（可扩展其他语言）

## 技术架构

### 前端技术栈

- **Vue 3** - 现代化的前端框架
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - 企业级UI组件库
- **Vue Router** - 单页面应用路由管理
- **Axios** - HTTP客户端库

### 后端技术栈

- **Node.js** - JavaScript运行时环境
- **Express.js** - Web应用框架
- **MySQL** - 关系型数据库
- **JWT** - 身份验证令牌
- **bcrypt** - 密码加密库

## 快速开始

### 环境要求

- Node.js 16.0+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd Smart-EMAP
```

2. **安装依赖**

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **数据库配置**

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑.env文件，配置数据库连接信息
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=smart_emap
```

4. **数据库初始化**

```bash
# 运行数据库迁移
node simple-migration.js

# 插入样本数据
node sample-data/permission-sample-data.js insert
```

5. **启动服务**

```bash
# 启动后端服务
npm run dev

# 新开终端，启动前端服务
cd ../frontend
npm run dev
```

6. **访问系统**

- 前端地址：http://localhost:3000
- 权限管理页面：http://localhost:3000/system/permissions
- 演示页面：http://localhost:3000/system/demo

## 测试账户

系统提供了以下测试账户：

| 用户名   | 密码     | 角色         | 特殊权限      | 说明       |
| -------- | -------- | ------------ | ------------- | ---------- |
| admin    | password | 管理者       | 所有权限      | 系统管理员 |
| manager1 | password | マネージャー | +系统设置     | 部门管理员 |
| manager2 | password | マネージャー | 无            | 标准经理   |
| user1    | password | 一般ユーザー | +数据导出     | 报表制作员 |
| user2    | password | 一般ユーザー | +临时删除权限 | 数据整理员 |
| user3    | password | 一般ユーザー | +临时优化权限 | 效率改善员 |
| guest1   | password | ゲスト       | 无            | 只读用户   |

## 功能详解

### 1. 角色权限管理

**功能说明：**

- 为系统中的4种角色（管理者、マネージャー、一般ユーザー、ゲスト）配置权限
- 支持按权限类型分组显示
- 提供全选、全不选、按组选择等批量操作

**使用方法：**

1. 登录系统（建议使用admin账户）
2. 进入权限管理页面
3. 选择要配置的角色标签页
4. 勾选或取消勾选相应权限
5. 点击"権限を保存"按钮保存配置

### 2. 页面权限管理

**功能说明：**

- 为系统中的各个页面配置访问所需的权限
- 按模块分组显示页面列表
- 支持批量更新页面权限配置

**使用方法：**

1. 切换到"ページ権限管理"标签页
2. 选择要配置的模块
3. 为页面选择所需权限或编辑页面描述
4. 点击"ページ权限を保存"按钮保存更改

### 3. 用户特殊权限管理

**功能说明：**

- 为特定用户授予超出其角色权限的额外权限
- 支持设置权限过期时间
- 可添加权限授予理由
- 支持撤销用户特殊权限

**使用方法：**

1. 切换到"ユーザー特別権限"标签页
2. 选择要管理的用户
3. 点击"権限追加"按钮添加新权限
4. 设置权限、理由和过期时间
5. 点击"権限追加"确认

### 4. 权限模板管理

**功能说明：**

- 创建权限组合模板，方便重复使用
- 支持将模板应用到角色
- 提供预设的业务模板

**使用方法：**

1. 切换到"権限テンプレート"标签页
2. 点击"新規テンプレート作成"创建模板
3. 设置模板名称、描述和权限组合
4. 使用"適用"按钮将模板应用到角色

### 5. 权限统计

**功能说明：**

- 显示权限使用统计信息
- 提供角色权限分布图表
- 展示权限使用频率排行

## 权限代码规范

系统采用 `模块:操作` 的权限代码格式：

### 业务模块权限

- `order:*` - 受注管理相关权限
- `plan:*` - 生産計画相关权限
- `shipping:*` - 出荷管理相关权限

### 系统管理权限

- `system:*` - システム管理相关权限
- `data:*` - データ操作相关权限
- `page:*` - ページアクセス相关权限
- `admin:*` - 管理者機能相关权限

## 数据库结构

### 核心表结构

1. **permissions** - 权限定义表
2. **role_permissions** - 角色权限关联表
3. **page_permissions** - 页面权限配置表
4. **user_permissions** - 用户特殊权限表
5. **permission_templates** - 权限模板表

详细的数据库结构请参考 `backend/db/migrations/` 目录下的迁移文件。

## API接口

### 基础权限管理

- `GET /api/permissions` - 获取所有权限
- `GET /api/roles/:role/permissions` - 获取角色权限
- `POST /api/roles/:role/permissions` - 更新角色权限

### 页面权限管理

- `GET /api/page-permissions/grouped` - 获取分组页面权限
- `POST /api/page-permissions/batch-update` - 批量更新页面权限

### 用户特殊权限管理

- `GET /api/users/:userId/permissions` - 获取用户特殊权限
- `POST /api/users/:userId/permissions` - 添加用户特殊权限
- `DELETE /api/users/:userId/permissions/:permissionId` - 撤销用户权限

### 权限模板管理

- `GET /api/templates` - 获取权限模板
- `POST /api/templates` - 创建权限模板
- `POST /api/templates/:id/apply-to-role/:role` - 应用模板到角色

### 权限统计

- `GET /api/statistics` - 获取权限使用统计

## 开发指南

### 添加新权限

1. 在数据库中插入新的权限记录
2. 更新前端权限列表
3. 在需要的地方添加权限检查

### 扩展角色类型

1. 修改角色配置数组
2. 更新数据库角色权限配置
3. 调整UI显示逻辑

### 自定义权限检查

```javascript
// 后端权限检查示例
import { requirePermission } from "../middleware/auth.js";

// 在路由中使用
router.get("/api/orders", requirePermission("order:view"), (req, res) => {
  // 处理请求
});

// 前端权限检查示例
import { checkPermission } from "@/utils/permission";

// 在组件中使用
if (checkPermission("order:create")) {
  // 显示创建按钮
}
```

## 部署说明

### 生产环境部署

1. **构建前端**

```bash
cd frontend
npm run build
```

2. **配置nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **启动后端服务**

```bash
cd backend
npm start
```

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

## 故障排除

### 常见问题

**Q: 登录后无法访问权限管理页面？**
A: 确保用户具有 `system:roles` 权限，或使用admin账户登录。

**Q: 权限修改后没有生效？**
A: 检查是否点击了保存按钮，并确认用户重新登录以刷新权限缓存。

**Q: 样本数据插入失败？**
A: 检查数据库连接配置和权限，确保数据库已正确初始化。

**Q: 页面权限配置不生效？**
A: 确认前端路由中已添加相应的权限检查中间件。

### 日志查看

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看数据库日志
tail -f /var/log/mysql/error.log
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

## 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 实现基础权限管理功能
- 添加权限模板管理
- 完成用户特殊权限功能
- 提供权限统计分析

---

**感谢使用 Smart-EMAP 权限管理系统！** 🎉
