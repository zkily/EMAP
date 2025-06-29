# Picking功能路由和菜单配置

## 📋 概述

本文档描述了为Smart-EMAP系统的Picking（ピッキング）功能自动生成的路由和菜单配置。

## 🛣️ 路由配置

### 主要路由

| 路由路径                           | 组件名称               | 页面标题             | 权限              | 角色                 |
| ---------------------------------- | ---------------------- | -------------------- | ----------------- | -------------------- |
| `/shipping/picking`                | `ShippingPickingHome`  | ピッキング管理       | `picking:view`    | admin, manager, user |
| `/shipping/picking/list-generator` | `PickingListGenerator` | ピッキングリスト生成 | `picking:create`  | admin, manager, user |
| `/shipping/picking/workspace`      | `PickingWorkspace`     | ピッキング作業       | `picking:execute` | admin, manager, user |
| `/shipping/picking/progress`       | `PickingProgress`      | ピッキング進捗       | `picking:view`    | admin, manager, user |
| `/shipping/picking/history`        | `PickingHistory`       | ピッキング履歴       | `picking:view`    | admin, manager, user |

### 路由分组

所有picking相关路由都归属于 `ピッキング管理` 分组，便于统一管理和权限控制。

## 🎯 菜单配置

### 菜单结构

```
出荷管理
├── 出荷一覧
├── ========== ピッキング管理 ==========
├── ピッキング管理 (首页)
├── ピッキングリスト生成
├── ピッキング作業
├── ピッキング進捗
├── ピッキング履歴
├── ========== ダッシュボード ==========
├── 出荷ダッシュボード
└── 出荷KPI
```

### 图标配置

| 菜单项               | 图标         | 说明                   |
| -------------------- | ------------ | ---------------------- |
| ピッキング管理       | `Package`    | 包装盒，代表货物管理   |
| ピッキングリスト生成 | `ListChecks` | 检查清单，代表生成任务 |
| ピッキング作業       | `QrCode`     | 二维码，代表扫码作业   |
| ピッキング進捗       | `BarChart3`  | 柱状图，代表进度统计   |
| ピッキング履歴       | `History`    | 历史记录，代表历史数据 |

## 🌐 国际化配置

### 日文 (ja.ts)

```typescript
shipping: {
  root: '出荷管理',
  list: '出荷一覧',
  dashboard: '出荷ダッシュボード',
  kpi: '出荷KPI',
  picking: {
    home: 'ピッキング管理',
    generator: 'ピッキングリスト生成',
    workspace: 'ピッキング作業',
    progress: 'ピッキング進捗',
    history: 'ピッキング履歴',
  },
},
```

### 中文 (zh.ts)

```typescript
shipping: {
  root: '出货管理',
  list: '出货清单',
  dashboard: '出货仪表盘',
  kpi: '出货KPI',
  picking: {
    home: '拣货管理',
    generator: '拣货清单生成',
    workspace: '拣货作业',
    progress: '拣货进度',
    history: '拣货历史',
  },
},
```

## 🔐 权限配置

### 权限类型

- `picking:view` - 查看权限（查看进度、历史等）
- `picking:create` - 创建权限（生成拣货清单）
- `picking:execute` - 执行权限（执行拣货作业）

### 角色权限

| 角色      | 权限范围                  |
| --------- | ------------------------- |
| `admin`   | 所有picking功能的完整权限 |
| `manager` | 所有picking功能的完整权限 |
| `user`    | 所有picking功能的完整权限 |
| `guest`   | 无picking功能权限         |

## 📁 文件结构

```
frontend/src/
├── router/modules/
│   └── shipping.ts          # 出荷管理路由配置
├── constants/
│   └── menuList.ts          # 菜单配置
├── locales/
│   ├── ja.ts               # 日文国际化
│   └── zh.ts               # 中文国际化
├── views/Shipping/
│   ├── ShippingPickingHome.vue
│   └── components/
│       ├── PickingListGenerator.vue
│       ├── PickingWorkspace.vue
│       ├── PickingProgress.vue
│       └── PickingHistory.vue
└── utils/
    └── routeGenerator.ts    # 路由生成工具
```

## 🔧 使用方法

### 1. 访问Picking功能

用户可以通过以下方式访问Picking功能：

1. **侧边栏菜单**: 出荷管理 → ピッキング管理相关菜单项
2. **直接URL访问**: `/shipping/picking/*`
3. **程序内跳转**: 使用`router.push()`方法

### 2. 权限验证

系统会自动验证用户权限：

```typescript
// 路由守卫会检查用户角色
if (Array.isArray(to.meta?.roles) && !to.meta.roles.includes(role)) {
  ElMessage.error("アクセス権限がありません");
  next("/403");
}
```

### 3. 菜单显示

侧边栏组件会根据用户角色自动过滤显示的菜单项：

```typescript
const filteredMenu = computed(() => {
  return menuList.filter((item) => item.roles.includes(userRole.value));
});
```

## 🧪 测试验证

运行验证脚本检查配置正确性：

```bash
# 在frontend目录下运行
npm run type-check
```

或者使用我们创建的验证脚本：

```typescript
// 在浏览器控制台运行
import("./scripts/validateRoutes.ts");
```

## 📝 维护说明

### 添加新的Picking子功能

1. **添加路由**：在 `frontend/src/router/modules/shipping.ts` 中添加新路由
2. **添加菜单**：在 `frontend/src/constants/menuList.ts` 中添加菜单项
3. **添加国际化**：在 `frontend/src/locales/` 中添加翻译
4. **创建组件**：在 `frontend/src/views/Shipping/components/` 中创建新组件

### 修改权限配置

1. 在路由的 `meta.permission` 中定义新权限
2. 在后端权限系统中配置对应权限
3. 更新角色权限映射关系

## 🚀 自动化特性

本配置支持以下自动化特性：

1. **自动权限验证**：路由守卫自动检查用户权限
2. **自动菜单过滤**：根据用户角色自动显示/隐藏菜单
3. **自动国际化**：支持中日文自动切换
4. **自动图标渲染**：菜单和路由自动显示对应图标
5. **自动面包屑**：根据路由层级自动生成导航面包屑

## ✅ 配置完成清单

- [x] 路由配置 (`frontend/src/router/modules/shipping.ts`)
- [x] 菜单配置 (`frontend/src/constants/menuList.ts`)
- [x] 日文国际化 (`frontend/src/locales/ja.ts`)
- [x] 中文国际化 (`frontend/src/locales/zh.ts`)
- [x] 权限配置 (路由meta中的roles和permission)
- [x] 图标配置 (Lucide图标集成)
- [x] 路由验证工具 (`frontend/src/utils/routeGenerator.ts`)
- [x] 测试脚本 (`frontend/src/scripts/validateRoutes.ts`)

所有picking功能的前端路由和菜单配置已自动生成并集成到系统中！🎉
