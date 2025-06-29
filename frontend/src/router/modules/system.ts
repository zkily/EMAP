// システム管理路由
import { RouteRecordRaw } from 'vue-router'

const system: RouteRecordRaw = {
  path: 'system',
  name: 'システム管理',
  meta: { title: 'システム管理', icon: 'Setting', roles: ['admin'] },
  redirect: '/system',
  children: [
    {
      path: '',
      name: 'システム管理ホーム',
      component: () => import('@/views/System/SystemHome.vue'),
      meta: {
        title: 'システム管理ホーム',
        icon: 'Setting',
        roles: ['admin'],
      },
    },
    {
      path: 'permission',
      name: '権限管理',
      component: () => import('@/views/System/PermissionManagement.vue'),
      meta: {
        title: '権限管理',
        icon: 'Lock',
        roles: ['admin'],
      },
    },
    // 其他系统管理子页面可继续添加
  ],
}

export default system
