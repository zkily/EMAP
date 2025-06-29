# Smart-EMAP 智能企业管理平台

## 🎯 项目概述

Smart-EMAP是一个现代化的企业管理平台，专为制造业和供应链管理设计。系统提供受注管理、生产计划、出荷管理等核心功能，并配备完整的权限管理系统。

## ✨ 主要功能

### 核心业务模块

- 📋 **受注管理** - 订单处理和跟踪
- 📅 **生产计划** - 生产排程和资源管理
- 🚚 **出荷管理** - 发货和物流管理
- 👥 **人员管理** - 员工和组织管理
- 📊 **数据分析** - 业务报表和统计

### 权限管理系统

- 🔐 **角色权限管理** - 4种预设角色（admin、manager、user、guest）
- 🎫 **页面权限控制** - 细粒度页面访问控制
- 👤 **用户特殊权限** - 临时和永久特殊权限分配
- 📋 **权限模板** - 权限组合模板管理
- 📈 **权限统计** - 权限使用情况分析

## 🚀 快速开始

### 环境要求

- Node.js 16+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/your-repo/smart-emap.git
cd smart-emap
```

2. **安装依赖**

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

3. **数据库配置**

```bash
# 复制环境配置文件
cd backend
cp .env.example .env

# 编辑数据库配置
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=smart_emap
```

4. **初始化数据库**

```bash
# 创建数据库表结构
mysql -u root -p smart_emap < database/schema.sql

# 插入基础权限数据
mysql -u root -p smart_emap < database/permissions.sql
```

5. **添加样本数据**

```bash
cd backend
npm run sample-data
```

6. **启动服务**

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（新终端）
cd frontend
npm run dev
```

7. **访问系统**

- 前端地址：http://localhost:3000
- 后端API：http://localhost:5000

## 🔑 样本数据

系统提供了完整的样本数据用于测试和演示：

### 测试账户

| 用户名      | 密码         | 角色         | 说明                     |
| ----------- | ------------ | ------------ | ------------------------ |
| `admin`     | `admin123`   | 管理者       | 系统管理员，拥有所有权限 |
| `manager01` | `manager123` | マネージャー | 部门经理，拥有管理权限   |
| `user01`    | `user123`    | 一般ユーザー | 普通用户，基本操作权限   |
| `guest01`   | `guest123`   | ゲスト       | 访客用户，只读权限       |

### 权限体系

- **页面权限**：15个页面权限配置
- **功能权限**：30+个功能操作权限
- **权限模板**：5个预设权限模板
- **特殊权限**：用户临时权限示例

## 📖 使用指南

### 权限管理系统使用

1. **访问权限管理**

   - 使用admin账户登录
   - 访问：`/system/permission`

2. **角色权限配置**

   - 选择角色标签页
   - 按权限组选择权限
   - 支持批量操作和保存

3. **用户特殊权限**

   - 选择目标用户
   - 添加临时或永久权限
   - 设置过期时间和授权理由

4. **权限模板管理**
   - 创建权限组合模板
   - 应用模板到角色
   - 简化权限分配流程

详细使用说明请参考：[权限管理系统使用指南](./权限管理系统使用指南.md)

## 🏗️ 系统架构

### 技术栈

- **前端**：Vue 3 + TypeScript + Element Plus + Vite
- **后端**：Node.js + Express + MySQL
- **权限**：基于RBAC的权限控制系统
- **UI**：现代化响应式设计

### 项目结构

```
smart-emap/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── api/            # API接口
│   │   └── router/         # 路由配置
│   └── package.json
├── backend/                 # 后端项目
│   ├── routes/             # API路由
│   ├── middleware/         # 中间件
│   ├── models/            # 数据模型
│   ├── sample-data.js     # 样本数据脚本
│   └── package.json
├── database/               # 数据库文件
│   ├── schema.sql         # 表结构
│   └── permissions.sql    # 权限数据
└── README.md
```

## 🔐 权限系统特性

### 权限层级

1. **角色权限** - 基础权限通过角色分配
2. **用户权限** - 特殊权限个别分配
3. **页面权限** - 页面级访问控制
4. **功能权限** - 操作级权限控制

### 权限类型

- `page:*` - 页面访问权限
- `order:*` - 受注管理权限
- `plan:*` - 生产计划权限
- `shipping:*` - 出荷管理权限
- `data:*` - 数据操作权限
- `admin:*` - 管理功能权限

### 安全特性

- JWT令牌认证
- 权限中间件验证
- 权限缓存机制
- 审计日志记录

## 🎨 UI特色

### 权限管理页面

- 🎨 现代化毛玻璃设计
- 📱 完全响应式布局
- ⚡ 流畅的动画效果
- 🔍 直观的权限可视化
- 📊 实时统计分析

### 设计亮点

- 渐变色彩系统
- 卡片式布局
- 悬停交互效果
- 加载状态反馈
- 错误友好提示

## 🛠️ 开发指南

### 开发环境

```bash
# 后端开发模式
cd backend
npm run dev

# 前端开发模式
cd frontend
npm run dev
```

### 构建部署

```bash
# 前端构建
cd frontend
npm run build

# 后端启动
cd backend
npm start
```

### 数据库管理

```bash
# 重置样本数据
cd backend
npm run sample-data

# 备份数据库
mysqldump -u root -p smart_emap > backup.sql
```

## 📋 功能清单

### ✅ 已完成功能

- [x] 用户认证和授权
- [x] 角色权限管理
- [x] 页面权限控制
- [x] 用户特殊权限
- [x] 权限模板系统
- [x] 权限统计分析
- [x] 响应式UI设计
- [x] 样本数据系统

### 🔄 开发中功能

- [ ] 权限审计日志
- [ ] 权限申请流程
- [ ] 双因素认证
- [ ] API权限控制

### 📅 计划功能

- [ ] 权限到期提醒
- [ ] 批量用户导入
- [ ] 权限变更通知
- [ ] 移动端适配

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持与反馈

- 📧 邮箱：support@smart-emap.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-repo/smart-emap/issues)
- 📖 文档：[使用指南](./权限管理系统使用指南.md)

## 🎉 致谢

感谢所有为项目做出贡献的开发者和用户！

---

**版本**：v1.0.0  
**更新时间**：2024年12月  
**维护状态**：积极维护中
