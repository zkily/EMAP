# Smart-ERP 项目结构

## 推荐的 Monorepo 结构

```
Smart-E-F/
├── frontend/                 # 前端 Vue.js 应用
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/                  # 后端 Node.js 应用
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   ├── config/          # 配置文件
│   │   └── app.js           # 应用入口
│   ├── package.json
│   ├── .env                 # 环境变量
│   └── ...
├── shared/                   # 共享代码（可选）
│   ├── types/               # TypeScript 类型定义
│   ├── constants/           # 常量
│   └── utils/               # 共享工具函数
├── docs/                     # 项目文档
├── scripts/                  # 构建和部署脚本
├── package.json             # 根目录 package.json（workspace 管理）
├── README.md
└── .gitignore
```

## 当前迁移步骤

### 1. 重新组织前端代码

```bash
# 创建 frontend 目录
mkdir frontend

# 移动前端文件到 frontend 目录
move src frontend/
move public frontend/
move package.json frontend/
move vite.config.ts frontend/
move tsconfig.*.json frontend/
move index.html frontend/
move eslint.config.ts frontend/
move .prettierrc.json frontend/
move vitest.config.ts frontend/
move playwright.config.ts frontend/
```

### 2. 设置后端结构

```bash
cd backend
npm init -y
npm install express cors dotenv mysql2 bcryptjs jsonwebtoken
npm install -D nodemon @types/node typescript ts-node
```

### 3. 创建根目录 workspace 配置

在根目录的 `package.json` 中配置 workspace：

```json
{
  "name": "smart-erp",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

## 优势

1. **统一管理**：一个仓库管理前后端代码
2. **共享依赖**：可以共享 TypeScript 类型定义
3. **简化部署**：统一的构建和部署流程
4. **版本同步**：前后端版本保持同步
5. **开发效率**：一个命令启动前后端服务

## 开发工作流

```bash
# 安装所有依赖
npm install

# 同时启动前后端开发服务器
npm run dev

# 只启动前后端
npm run dev:frontend
npm run dev:backend

# 构建整个项目
npm run build
```

## 环境配置

### 前端 (frontend/vite.config.ts)

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 后端 (backend/.env)

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_erp
JWT_SECRET=your_jwt_secret
```
