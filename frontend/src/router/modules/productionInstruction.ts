// 生産進捗路由
import { RouteRecordRaw } from 'vue-router'

const productionProgress: RouteRecordRaw = {
  path: 'production-Instruction',
  name: '生産指示',
  component: () => import('@/views/ProductionInstruction/ProductionInstruction.vue'),
  meta: {
    title: '生産指示',
    icon: 'Histogram',
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

export default productionProgress

