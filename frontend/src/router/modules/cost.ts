// 原価管理路由
import { RouteRecordRaw } from 'vue-router'

const cost: RouteRecordRaw = {
  path: 'cost',
  name: '原価管理',
  component: () => import('@/views/Cost/Cost.vue'),
  meta: { title: '原価管理', icon: 'Coin', roles: ['admin', 'manager', 'staff'] },
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

export default cost
