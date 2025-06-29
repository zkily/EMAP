// 生産スケジュール路由
import { RouteRecordRaw } from 'vue-router'

const productionSchedule: RouteRecordRaw = {
  path: 'production-schedule',
  name: '生産スケジュール',
  component: () => import('@/views/ProductionSchedule/ProductionSchedule.vue'),
  meta: {
    title: '生産スケジュール',
    icon: 'Timer',
    roles: ['admin', 'manager', 'staff'],
  },

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

export default productionSchedule
