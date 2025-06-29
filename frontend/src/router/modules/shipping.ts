// 出荷管理路由
import { RouteRecordRaw } from 'vue-router'
import {
  Menu,
  PieChart,
  Truck,
  Activity,
  Package,
  ClipboardList,
  History,
  FileText,
  LineChart,
  QrCode,
  ListChecks,
  BarChart3,
  Clock,
  Users,
} from 'lucide-vue-next'

const shipping: RouteRecordRaw = {
  path: '/shipping',
  name: 'Shipping',
  meta: { title: '出荷管理' },
  redirect: '/shipping/home',
  children: [
    {
      path: 'home',
      name: 'ShippingHome',
      component: () => import('@/views/Shipping/ShippingHome.vue'),
      meta: { title: '出荷管理メニュー', group: 'メインメニュー', icon: Menu },
    },
    {
      path: 'list',
      name: 'ShippingList',
      component: () => import('@/views/Shipping/ShippingList.vue'),
      meta: {
        title: '出荷一覧',
        group: '出荷管理',
        icon: ClipboardList,
        permission: 'shipping:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'overview',
      name: 'ShippingOverview',
      component: () => import('@/views/Shipping/ShippingOverview.vue'),
      meta: {
        title: '出荷一覧表',
        group: '出荷管理',
        icon: FileText,
        permission: 'shipping:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },

    {
      path: 'picking',
      name: 'ShippingPickingHome',
      component: () => import('@/views/Shipping/ShippingPickingHome.vue'),
      meta: {
        title: 'ピッキング管理',
        group: 'ピッキング管理',
        icon: Package,
        permission: 'picking:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // {
    //   path: 'picking/list-generator',
    //   name: 'PickingListGenerator',
    //   component: () => import('@/views/Shipping/components/PickingListGenerator.vue'),
    //   meta: {
    //     title: 'ピッキングリスト生成',
    //     group: 'ピッキング管理',
    //     icon: ListChecks,
    //     permission: 'picking:create',
    //     roles: ['admin', 'manager', 'user'],
    //   },
    // },
    // {
    //   path: 'picking/workspace',
    //   name: 'PickingWorkspace',
    //   component: () => import('@/views/Shipping/components/PickingWorkspace.vue'),
    //   meta: {
    //     title: 'ピッキング作業',
    //     group: 'ピッキング管理',
    //     icon: QrCode,
    //     permission: 'picking:execute',
    //     roles: ['admin', 'manager', 'user'],
    //   },
    // },
    // {
    //   path: 'picking/progress',
    //   name: 'PickingProgress',
    //   component: () => import('@/views/Shipping/components/PickingProgress.vue'),
    //   meta: {
    //     title: 'ピッキング進捗',
    //     group: 'ピッキング管理',
    //     icon: BarChart3,
    //     permission: 'picking:view',
    //     roles: ['admin', 'manager', 'user'],
    //   },
    // },
    // {
    //   path: 'picking/history',
    //   name: 'PickingHistory',
    //   component: () => import('@/views/Shipping/components/PickingHistory.vue'),
    //   meta: {
    //     title: 'ピッキング履歴',
    //     group: 'ピッキング管理',
    //     icon: History,
    //     permission: 'picking:view',
    //     roles: ['admin', 'manager', 'user'],
    //   },
    // },

    // {
    //   path: 'dashboard',
    //   name: 'ShippingDashboard',
    //   component: () => import('@/views/Shipping/ShippingHome.vue'), // 需要创建专门的仪表板组件
    //   meta: {
    //     title: '出荷ダッシュボード',
    //     group: 'ダッシュボード',
    //     icon: PieChart,
    //     permission: 'shipping:view',
    //     roles: ['admin', 'manager', 'staff'],
    //   },
    // },
    // {
    //   path: 'kpi',
    //   name: 'ShippingKpi',
    //   component: () => import('@/views/Shipping/ShippingHome.vue'), // 需要创建专门的KPI组件
    //   meta: {
    //     title: '出荷KPI',
    //     group: 'ダッシュボード',
    //     icon: Activity,
    //     permission: 'shipping:view',
    //     roles: ['admin', 'manager', 'staff'],
    //   },
    // },
  ],
}
export default shipping
