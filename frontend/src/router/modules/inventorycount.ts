// 棚卸管理路由
import { RouteRecordRaw } from 'vue-router'

const InventoryCountRoutes: RouteRecordRaw = {
  path: '/inventorycount',
  name: 'InventoryCount',
  meta: { title: '棚卸管理', icon: 'TrendCharts' },
  redirect: '/inventorycount/home',
  component: () => import('@/views/InventoryCount/InventoryHome.vue'),
  children: [
    {
      path: 'home',
      name: 'InventoryCountHome',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸管理',
        group: '棚卸管理',
        icon: 'TrendCharts',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'create',
      name: 'InventoryCountCreate',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '新規棚卸単作成',
        group: '棚卸単管理',
        icon: 'Plus',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'list',
      name: 'InventoryCountList',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸単一覧',
        group: '棚卸単管理',
        icon: 'List',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 製品棚卸
    {
      path: 'product',
      name: 'ProductInventory',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '製品棚卸',
        group: '製品管理',
        icon: 'Box',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'product/create',
      name: 'ProductInventoryCreate',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '製品棚卸作成',
        group: '製品管理',
        icon: 'Plus',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'product/list',
      name: 'ProductInventoryList',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '製品棚卸一覧',
        group: '製品管理',
        icon: 'List',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 仕掛品棚卸
    {
      path: 'wip',
      name: 'WipInventory',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '仕掛品棚卸',
        group: '仕掛品管理',
        icon: 'Operation',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'wip/create',
      name: 'WipInventoryCreate',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '仕掛品棚卸作成',
        group: '仕掛品管理',
        icon: 'Plus',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'wip/list',
      name: 'WipInventoryList',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '仕掛品棚卸一覧',
        group: '仕掛品管理',
        icon: 'List',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 材料棚卸
    {
      path: 'material',
      name: 'MaterialInventory',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '材料棚卸',
        group: '材料管理',
        icon: 'Box',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'material/create',
      name: 'MaterialInventoryCreate',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '材料棚卸作成',
        group: '材料管理',
        icon: 'Plus',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'material/list',
      name: 'MaterialInventoryList',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '材料棚卸一覧',
        group: '材料管理',
        icon: 'List',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 部品棚卸
    {
      path: 'component',
      name: 'ComponentInventory',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '部品棚卸',
        group: '部品管理',
        icon: 'Setting',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'component/create',
      name: 'ComponentInventoryCreate',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '部品棚卸作成',
        group: '部品管理',
        icon: 'Plus',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'component/list',
      name: 'ComponentInventoryList',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '部品棚卸一覧',
        group: '部品管理',
        icon: 'List',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 統計分析
    {
      path: 'statistics',
      name: 'InventoryCountStatistics',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸統計',
        group: '統計分析',
        icon: 'TrendCharts',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'analytics',
      name: 'InventoryCountAnalytics',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸分析',
        group: '統計分析',
        icon: 'DataBoard',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'report',
      name: 'InventoryCountReport',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸レポート',
        group: '統計分析',
        icon: 'Document',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // 履歴管理
    {
      path: 'history',
      name: 'InventoryHistory',
      component: () => import('@/views/InventoryCount/InventoryCountHome.vue'),
      meta: {
        title: '棚卸履歴',
        group: '履歴管理',
        icon: 'Clock',
        roles: ['admin', 'manager', 'staff'],
      },
    },

  ],
}

export default InventoryCountRoutes
