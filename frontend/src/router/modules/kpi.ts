// 生産指標路由
import { RouteRecordRaw } from 'vue-router'

const kpi: RouteRecordRaw = {
  path: 'kpi',
  name: '生産指標',
  component: () => import('@/views/KPI/KPI.vue'),
  meta: { title: '生産指標', icon: 'DataAnalysis', roles: ['admin', 'manager', 'staff'] },
    // children: [
  //   {
  //     path: 'create',
  //     name: '受注入力',
  //     component: () => import('@/views/Order/OrderCreate.vue'),
  //     meta: {
  //       title: '受注入力',
  //       roles: ['admin', 'buyer']
  //     }
  //   },]
}

export default kpi
