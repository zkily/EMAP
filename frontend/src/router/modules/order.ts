// 受注管理路由
import { RouteRecordRaw } from 'vue-router'
import {
  Menu,
  PieChart,
  Truck,
  Activity,
  CalendarDays,
  User,
  History,
  FileText,
  LineChart,
} from 'lucide-vue-next'

const order: RouteRecordRaw = {
  path: '/order',
  name: 'Order',
  meta: { title: '受注管理' },
  redirect: '/order/home',
  children: [
    {
      path: 'home',
      name: 'OrderHome',
      component: () => import('@/views/Order/OrderHome.vue'),
      meta: { title: '受注管理メニュー', group: 'メインメニュー', icon: Menu },
    },
    {
      path: 'monthly',
      name: 'OrderMonthlyList',
      component: () => import('@/views/Order/OrderMonthlyList.vue'),
      meta: {
        title: '月別受注管理',
        group: '受注入力',
        icon: CalendarDays,
        permission: 'order:edit',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'daily',
      name: 'OrderDailyList',
      component: () => import('@/views/Order/OrderDailyList.vue'),
      meta: {
        title: '日別受注管理',
        group: '受注入力',
        icon: CalendarDays,
        permission: 'order:edit',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: '/order/daily-history',
      name: 'OrderDailyHistoryPage',
      component: () => import('@/views/Order/OrderDailyHistoryPage.vue'),
      meta: {
        title: '受注履歴管理',
        group: '受注履歴',
        icon: History,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: '/order/destination-history',
      name: 'DestinationOrderHistory',
      component: () => import('@/views/Order/OrderDestinationHistory.vue'),
      meta: {
        title: '納入先別受注履歴',
        group: '受注履歴',
        icon: Truck,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: '/order/customer-history',
      name: 'CustomerOrderHistory',
      component: () => import('@/views/Order/OrderCustomerHistory.vue'),
      meta: {
        title: '顧客別受注履歴',
        group: '受注履歴',
        icon: User,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: '/order/history-comparison',
      name: 'OrderHistoryComparison',
      component: () => import('@/views/Order/OrderHistoryComparison.vue'),
      meta: {
        title: '受注履歴比較',
        group: '受注履歴',
        icon: LineChart,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'dashboard',
      name: 'OrderDashboard',
      component: () => import('@/views/Order/OrderDashboardPage.vue'),
      meta: {
        title: '受注ダッシュボード',
        group: 'ダッシュボード',
        icon: PieChart,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    {
      path: 'order-kpi',
      name: 'OrderKpiDashboard',
      component: () => import('@/views/Order/OrderKpiDashboard.vue'),
      meta: {
        title: '受注KPIダッシュボード',
        group: 'ダッシュボード',
        icon: Activity,
        permission: 'order:view',
        roles: ['admin', 'manager', 'staff'],
      },
    },
    // {
    //   path: '/logs',
    //   name: 'OrderLogList',
    //   component: () => import('@/views/Order/components/OrderLogList.vue'),
    //   meta: {
    //     title: '日記',
    //     group: 'その他',
    //     icon: FileText,
    //     permission: 'order:view',
    //     roles: ['admin', 'manager', 'staff'],
    //   },
    // },
  ],
}
export default order
