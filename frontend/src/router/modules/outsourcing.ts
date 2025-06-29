// 外注管理路由
import { RouteRecordRaw } from 'vue-router'

const outsourcings: RouteRecordRaw = {
  path: 'outsourcing',
  name: '外注管理',
  component: () => import('@/views/Outsourcing/Outsourcing.vue'),

  meta: {
    title: '外注管理',
    icon: 'Calendar',
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

export default outsourcings

