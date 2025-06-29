// 在庫管理路由
import { RouteRecordRaw } from 'vue-router'
import { Refresh, Document, Menu, Edit, Box, Cpu, Collection } from '@element-plus/icons-vue'

const stock: RouteRecordRaw = {
  path: '/stock',
  name: '在庫管理',
  meta: { title: '在庫管理' },
  redirect: '/stock/home',
  children: [
    {
      path: 'home',
      name: 'StockHome',
      component: () => import('@/views/Stock/StockHome.vue'),
      meta: { title: '在庫管理メニュー', group: 'メインメニュー', icon: Menu },
    },
    {
      path: '/stock/transaction',
      name: 'StockTransactionForm',
      component: () => import('@/views/Stock/stockEntry/StockTransactionForm.vue'),
      meta: { title: '在庫登録', group: '入出庫手動登録', icon: Edit },
    },
    {
      path: '/stock/product',
      name: 'ProductStockEntry',
      component: () => import('@/views/Stock/stockEntry/ProductStockEntry.vue'),
      meta: { title: '製品在庫登録', group: '入出庫手動登録', icon: Box },
    },
    {
      path: '/stock/wip',
      name: 'WipStockEntry',
      component: () => import('@/views/Stock/stockEntry/WipStockEntry.vue'),
      meta: { title: '仕掛在庫登録', group: '入出庫手動登録', icon: Refresh },
    },
    {
      path: '/stock/material',
      name: 'MaterialStockEntry',
      component: () => import('@/views/Stock/stockEntry/MaterialStockEntry.vue'),
      meta: { title: '材料在庫登録', group: '入出庫手動登録', icon: Collection },
    },
    {
      path: '/stock/component',
      name: 'ComponentStockEntry',
      component: () => import('@/views/Stock/stockEntry/ComponentStockEntry.vue'),
      meta: { title: '部品在庫登録', group: '入出庫手動登録', icon: Cpu },
    },
    {
      path: '/stock/logs',
      name: 'StockLogList',
      component: () => import('@/views/Stock/StockLogList.vue'),
      meta: { title: '在庫取引履歴', group: '入出庫自動処理', icon: Document },
    },
    {
      path: '/stock/product-recalc',
      name: 'ProductStockList',
      component: () => import('@/views/Stock/stockList/ProductStockList.vue'),
      meta: {
        title: '製品在庫明細',
        group: '在庫明細',
        icon: Refresh,
      },
    },
    {
      path: '/stock/trend',
      name: '製品在庫推移表',
      component: () => import('@/views/Stock/stockTrend/ProductStockTrendTable.vue'),
      meta: {
        title: '製品在庫推移',
        group: '在庫明細',
        icon: Refresh,
      },
    },
    {
      path: '/stock/snapshot',
      name: 'StockSnapshot',
      component: () => import('@/views/Stock/stockSnapshot/StockSnapshotView.vue'),
      meta: {
        title: '製品在庫履歴分析',
        group: '在庫分析',
        icon: Refresh,
      },
    },
    {
      path: '/stock/wip-recalc',
      name: 'WipStockList',
      component: () => import('@/views/Stock/stockList/WipStockList.vue'),
      meta: {
        title: '仕掛在庫明細',
        group: '在庫明細',
        icon: Refresh,
      },
    },
    {
      path: '/stock/material-recalc',
      name: 'MaterialStockList',
      component: () => import('@/views/Stock/stockList/MaterialStockList.vue'),
      meta: {
        title: '材料在庫明細',
        group: '在庫明細',
        icon: Refresh,
      },
    },
  ],
}

export default stock
