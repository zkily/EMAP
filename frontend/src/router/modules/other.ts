// その他管理路由
import { RouteRecordRaw } from 'vue-router'

const other: RouteRecordRaw = {
  path: 'other',
  name: 'その他管理',
  component: () => import('@/views/Other/Other.vue'),
  meta: { title: 'その他管理', icon: 'Menu', roles: ['admin', 'manager', 'staff'], },
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

export default other
