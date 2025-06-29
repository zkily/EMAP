// マスタ管理路由
import { RouteRecordRaw } from 'vue-router'
import {
  UserFilled,
  OfficeBuilding,
  User,
  Van,
  Box,
  Coin,
  Cpu,
  Calendar,
  PieChart,
  Share,
  Timer,
  Collection,
  ZoomIn,
  Setting,
  Document,
} from '@element-plus/icons-vue'

const master: RouteRecordRaw = {
  path: '/master',
  name: 'マスタ管理',
  meta: { title: 'マスタ管理' },
  redirect: '/master/home',
  children: [
    {
      path: 'home',
      name: 'MasterHome',
      component: () => import('@/views/Master/MasterHome.vue'),
      meta: { title: 'マスタ管理メニュー', group: 'メインメニュー', icon: Setting },
    },
    {
      path: 'user',
      name: 'ユーザーマスタ',
      component: () => import('@/views/Master/userMaster/UserMaster.vue'),
      meta: { title: 'ユーザーマスタ', group: 'ユーザー関連', icon: UserFilled },
    },
    {
      path: 'department',
      name: '部門マスタ',
      component: () => import('@/views/Master/departmentMaster/DepartmentMaster.vue'),
      meta: { title: '部門マスタ', group: 'ユーザー関連', icon: OfficeBuilding },
    },
    {
      path: 'customer',
      name: '顧客マスタ',
      component: () => import('@/views/Master/customerMaster/CustomerList.vue'),
      meta: { title: '顧客マスタ', group: '取引先関連', icon: User },
    },
    {
      path: 'destination',
      name: '納入先マスタ',
      component: () => import('@/views/Master/destinationMaster/DestinationList.vue'),
      meta: { title: '納入先マスタ', group: '取引先関連', icon: Van },
    },
    {
      path: 'suppliers',
      name: '仕入先マスタ',
      component: () => import('@/views/Master/supplierMaster/SupplierList.vue'),
      meta: { title: '仕入先マスタ', group: '取引先関連', icon: Van },
    },
    {
      path: 'carrier',
      name: '運送便マスタ',
      component: () => import('@/views/Master/carrierMaster/CarrierList.vue'),
      meta: { title: '運送便マスタ', group: '取引先関連', icon: Van },
    },
    {
      path: 'products',
      name: '製品マスタ',
      component: () => import('@/views/Master/productMaster/ProductList.vue'),
      meta: { title: '製品マスタ', group: '製品関連', icon: Box },
    },
    {
      path: '/master/material',
      name: '材料マスタ',
      component: () => import('@/views/Master/materialMaster/MaterialList.vue'),
      meta: { title: '材料マスタ', group: '製品関連', icon: Coin },
    },
    {
      path: '/master/components',
      name: '部品マスタ',
      component: () => import('@/views/Master/componentMaster/ComponentList.vue'),
      meta: { title: '部品マスタ', group: '製品関連', icon: Cpu },
    },
    {
      path: '/master/holiday',
      name: 'Holiday',
      component: () => import('@/views/Master/destinationMaster/DestinationHoliday.vue'),
      meta: { title: '納入先休日設定', group: '取引先関連', icon: Calendar },
    },
    {
      path: '/master/processes',
      name: 'ProcessList',
      component: () => import('@/views/Master/processMaster/ProcessList.vue'),
      meta: { title: '工程マスタ', group: '生産関連', icon: PieChart },
    },
    {
      path: '/master/processes/routes',
      name: 'RouteList',
      component: () => import('@/views/Master/processRouterMaster/ProcessRouteList.vue'),
      meta: { title: '工程ルートマスタ', group: '生産関連', icon: Share },
    },
    {
      path: '/router/product-route-steps',
      name: 'ProductRouteStepsManager',
      component: () =>
        import('@/views/Master/productProcessRouterMaster/ProductRouteStepManager.vue'),
      meta: { title: '製品別工程時間', group: '生産関連', icon: Timer },
    },
    {
      path: '/master/bom',
      name: 'BomManager',
      component: () => import('@/views/Master/bomMaster/index.vue'),
      meta: { title: '部品構成管理(BOM)', group: '製品関連', icon: Document },
    },
    {
      path: '/master/route-steps/:route_cd',
      name: 'RouteStepList',
      component: () => import('@/views/Master/processRouterMaster/ProcessRouteStepEditor.vue'),
      meta: { title: '工程ルート編集', group: 'メインメニュー', icon: ZoomIn },
    },
    {
      path: '/master/machine',
      name: '設備マスタ',
      component: () => import('@/views/Master/machineMaster/MachineList.vue'),
      meta: { title: '設備マスタ', group: '生産関連', icon: PieChart },
    },
  ],
}

export default master
