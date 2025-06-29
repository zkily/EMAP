// 部品管理路由
import { RouteRecordRaw } from 'vue-router'

const parts: RouteRecordRaw = {
  path: 'parts',
  name: '部品管理',
  component: () => import('@/views/Parts/Parts.vue'),
  meta: { title: '部品管理', icon: 'Cpu',  roles: ['admin', 'manager', 'staff'], },

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

export default parts

