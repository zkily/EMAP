// 人員管理路由
import { RouteRecordRaw } from 'vue-router'

const staff: RouteRecordRaw = {
  path: 'staff',
  name: '人員管理',
  component: () => import('@/views/Staff/Staff.vue'),
  meta: { title: '人員管理', icon: 'UserFilled', roles: ['admin', 'manager', 'staff'], },
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

export default staff
