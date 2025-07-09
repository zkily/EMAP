import axios from 'axios'

// このファイルは外注管理モジュールのためのモックAPIです。
// UI開発を先行させるため、バックエンド実装を待たずに固定のテストデータを返します。

/**
 * 概要データを取得する
 */
async function getOverviewData() {
  console.log('API: getOverviewData (mocked)')
  return {
    success: true,
    data: {
      total_orders: 125,
      orders_growth: 5.2,
      active_suppliers: 23,
      suppliers_growth: 1.5,
      total_amount: 15230000,
      amount_growth: 8.1,
      avg_performance: 92.3,
      performance_trend: -1.2,
    },
  }
}

/**
 * 通知リストを取得する
 */
async function getNotifications() {
  console.log('API: getNotifications (mocked)')
  return {
    success: true,
    data: [
      {
        id: 1,
        type: 'warning',
        title: '納期遅延',
        message: '注文 #12345 の納期が遅延しています。',
        created_at: new Date(),
      },
      {
        id: 2,
        type: 'info',
        title: '新規仕入先',
        message: '新しい仕入先「株式会社テスト」が追加されました。',
        created_at: new Date(),
      },
    ],
  }
}

/**
 * 注文統計を取得する
 */
async function getOrderStatistics() {
  console.log('API: getOrderStatistics (mocked)')
  return {
    success: true,
    data: {
      total: 150,
      completed: 120,
      in_progress: 20,
      pending_receipt: 10,
    },
  }
}

/**
 * 注文リストを取得する
 */
async function getOrders(params: any) {
  console.log('API: getOrders (mocked)', params)
  return {
    success: true,
    data: {
      items: [
        {
          id: 1,
          order_no: 'PO-2023-001',
          supplier_name: '株式会社A',
          amount: 120000,
          status: '完了',
          due_date: '2023-10-10',
        },
        {
          id: 2,
          order_no: 'PO-2023-002',
          supplier_name: '株式会社B',
          amount: 85000,
          status: '進行中',
          due_date: '2023-10-15',
        },
      ],
      total: 2,
    },
  }
}

/**
 * 仕入先パフォーマンスを取得する
 */
async function getSupplierPerformance() {
  console.log('API: getSupplierPerformance (mocked)')
  return {
    success: true,
    data: [
      { name: '株式会社A', performance: 98.5, trend: 1.2 },
      { name: '株式会社B', performance: 95.2, trend: -0.5 },
      { name: '株式会社C', performance: 92.1, trend: 0.8 },
      { name: '株式会社D', performance: 88.7, trend: -2.1 },
      { name: '株式会社E', performance: 85.4, trend: 1.5 },
    ],
  }
}

// 実際のAPI呼び出しの代わりに、Proxyを使用して未実装の関数呼び出しを警告します。
const unimplementedApiHandler: ProxyHandler<any> = {
  get: (target, prop: string) => {
    // すでに実装済みの関数は、そのまま返す
    if (prop in target) {
      return target[prop]
    }
    // 未実装の関数は警告を出し、エラーを返す
    return async (...args: any[]) => {
      console.warn(`outsourcingApi.${prop}() は未実装です。`, args)
      return Promise.reject(new Error(`Not implemented: outsourcingApi.${prop}`))
    }
  },
}

export const outsourcingApi = new Proxy(
  {
    getOverviewData,
    getNotifications,
    getOrderStatistics,
    getOrders,
    getSupplierPerformance,
  },
  unimplementedApiHandler,
)
