// 材料管理路由
import { RouteRecordRaw } from 'vue-router'
import {
  UserFilled,
  Setting,
} from '@element-plus/icons-vue'

const material: RouteRecordRaw = {
  path: '/material',
  name: '材料管理',
  meta: { title: '材料管理' },
  redirect: '/material/home',
  children: [
    {
      path: 'home',
      name: 'MaterialHome',
      component: () => import('@/views/Material/MaterialHome.vue'),
      meta: { title: '材料管理メニュー', group: 'メインメニュー', icon: Setting },
    },
    {
      path: 'materiallist',
      name: 'MaterialList',
      component: () => import('@/views/Material/materialMaster/MaterialList.vue'),
      meta: { title: '材料マスタ', group: '材料マスタ', icon: UserFilled },
    },
    {
      path: 'materialstock',
      name: 'MaterialStock',
      component: () => import('@/views/Material/materialStock/MaterialStockEntry.vue'),
      meta: { title: '材料在庫', group: '材料在庫', icon: UserFilled },
    },
  ],
}


export default material

