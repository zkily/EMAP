// 路由主体
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/Layout.vue'
import { useMainStore } from '@/store/main'
import { ElMessage } from 'element-plus'

import order from './modules/order' //受注管理
import plan from './modules/plan' //生産計画
import productionInstruction from './modules/productionInstruction' //生産指示
import productionSchedule from './modules/productionSchedule' //生産スケジューリング
import kpi from './modules/kpi' //生産指標
import outsourcings from './modules/outsourcing' //外注管理
import stock from './modules/stock' //在庫管理
import material from './modules/material' //材料管理
import parts from './modules/parts' //部品管理
import inventorycount from './modules/inventorycount' //棚卸管理
import shipping from './modules/shipping' //出荷管理
import cost from './modules/cost' //コスト管理
import staff from './modules/staff' //人員管理
import other from './modules/other' //その他管理
import master from './modules/master' //マスタ管理
import system from './modules/system' //システム管理

const routes: RouteRecordRaw[] = [
  { path: '/guide', name: 'ガイド', component: () => import('@/views/Login/Guide.vue') },
  {
    path: '/login',
    name: 'ログイン',
    component: () => import('@/views/Login/Login.vue'),
    meta: { hiddenTab: true },
  },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/guide' },
      {
        path: 'dashboard',
        name: 'ダッシュボード',
        component: () => import('@/views/Login/Dashboard.vue'),
        meta: { title: 'ダッシュボード', icon: 'Monitor' },
      },

      //模块添加
      order, //受注管理
      plan, //生産計画
      productionInstruction, //生産指示
      productionSchedule, //生産スケジューリング
      kpi, //生産指標
      outsourcings, //外注管理
      stock, //在庫管理
      material, //材料管理
      parts, //部品管理
      inventorycount, //棚卸管理
      shipping, //出荷管理
      cost, //コスト管理
      staff, //人員管理
      other, //その他管理
      master, //マスタ管理
      system, //システム管理
    ],
  },

  //未找到时，显示的网页
  { path: '/403', name: '権限拒否', component: () => import('@/views/Login/NoPermission.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: '未找到',
    component: () => import('@/views/Login/NotFound.vue'),
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const store = useMainStore()
  const token = store.token || localStorage.getItem('token')
  const role = store.userInfo?.role || JSON.parse(localStorage.getItem('userInfo') || '{}').role

  if (to.path === '/login' || to.path === '/guide') {
    next()
  } else if (!token) {
    ElMessage.warning('ログインしてください')
    next('/login')
  } else if (Array.isArray(to.meta?.roles) && !to.meta.roles.includes(role)) {
    ElMessage.error('アクセス権限がありません')
    next('/403')
  } else {
    next()
  }
})

export default router
