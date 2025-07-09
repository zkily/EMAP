// 外注管理路由
import { RouteRecordRaw } from 'vue-router'

const outsourcings: RouteRecordRaw = {
  path: '/outsourcing',
  name: 'Outsourcing',
  component: () => import('@/views/Outsourcing/index.vue'),
  meta: {
    title: '外注管理',
    icon: 'Briefcase',
    roles: ['admin', 'manager', 'staff'],
  },
  children: [
    {
      path: '',
      name: 'OutsourcingDashboard',
      component: () => import('@/views/Outsourcing/components/DashboardPanel.vue'),
      meta: {
        title: 'ダッシュボード',
        roles: ['admin', 'manager', 'staff']
      }
    },
    {
      path: 'orders',
      name: 'OutsourcingOrders',
      component: () => import('@/views/Outsourcing/components/OrderManagement.vue'),
      meta: {
        title: '注文管理',
        roles: ['admin', 'manager', 'staff']
      }
    },
    {
      path: 'suppliers',
      name: 'OutsourcingSuppliers',
      component: () => import('@/views/Outsourcing/components/SupplierManagement.vue'),
      meta: {
        title: '仕入先管理',
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'capability',
      name: 'OutsourcingCapability',
      component: () => import('@/views/Outsourcing/components/CapabilityMatrix.vue'),
      meta: {
        title: '能力マトリックス',
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'performance',
      name: 'OutsourcingPerformance',
      component: () => import('@/views/Outsourcing/components/PerformanceManagement.vue'),
      meta: {
        title: 'パフォーマンス管理',
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'inventory',
      name: 'OutsourcingInventory',
      component: () => import('@/views/Outsourcing/components/InventoryManagement.vue'),
      meta: {
        title: '在庫管理',
        roles: ['admin', 'manager', 'staff']
      }
    },
    {
      path: 'receiving',
      name: 'OutsourcingReceiving',
      component: () => import('@/views/Outsourcing/components/ReceivingInspection.vue'),
      meta: {
        title: '受領検査',
        roles: ['admin', 'manager', 'staff']
      }
    },
    {
      path: 'settlement',
      name: 'OutsourcingSettlement',
      component: () => import('@/views/Outsourcing/components/SettlementCost.vue'),
      meta: {
        title: '決済コスト',
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'analytics',
      name: 'OutsourcingAnalytics',
      component: () => import('@/views/Outsourcing/components/AnalysisReport.vue'),
      meta: {
        title: '分析レポート',
        roles: ['admin', 'manager']
      }
    }
  ]
}

export default outsourcings

