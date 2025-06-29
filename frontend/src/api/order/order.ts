import request from '@/utils/request'
import axios from 'axios'
import type {
  ApiResponse,
  OrderMonthly,
  OrderDaily,
  ForecastDiffItem,
  FetchDailyOrdersParams,
  DashboardSummaryResponse,
  OrderDailyUpdate,
  UpdateOrderFieldsResponse,
} from '@/types/order'
import { ElMessage } from 'element-plus'

// 出荷月订单→生成日订单
export const generateDailyOrders = (params: {
  year: number
  month: number
  destination_cd?: string
  monthly_order_id?: string
  productType?: string
}) => {
  return request.post<ApiResponse>('/api/order/generate-daily', params)
}

// 取得：月別注文リスト（带分页）
export const fetchMonthlyOrders = (params: {
  year?: number
  month?: number
  destination_cd?: string
  keyword?: string
  page?: number
  pageSize?: number
}) => {
  return request.get<{ list: OrderMonthly[]; total: number }>('/api/order/monthly', { params })
}

// 新增月订单
export const createMonthlyOrder = (data: OrderMonthly) => {
  return request.post<ApiResponse>('/api/order/monthly/add', data)
}

// 更新月订单
export const updateMonthlyOrder = (id: number, data: OrderMonthly) => {
  return request.put<ApiResponse>(`/api/order/monthly/update/${id}`, data)
}

// 删除月订单
export const deleteMonthlyOrder = (id: number) => {
  return request.delete(`/api/order/monthly/delete/${id}`)
}

// 检查指定 order_id 是否已经存在
export const checkMonthlyOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const res = await request.get<ExistsResponse>('/api/order/check-exists', {
      params: { order_id: orderId },
    })
    console.log(`API检查响应 order_id: ${orderId}, 响应:`, res)
    // 处理API响应，res可能直接是 { exists: boolean }
    return res?.exists || false
  } catch (error) {
    console.error(`检查order_id ${orderId} 失败:`, error)
    return false
  }
}

// 指定納入先+年月的产品和数量列表
export const getProductsByDestination = (destination_cd: string, year: number, month: number) => {
  return request.get<
    { product_cd: string; product_name: string; product_type: string; forecast_units: number }[]
  >('/api/order/products', {
    params: { destination_cd, year, month },
  })
}

// 根据納入先CD查询对应的产品列表
export const batchCreateMonthlyOrders = (data: {
  year: number
  month: number
  destination_cd: string
  destination_name: string
  products: { product_cd: string; product_name: string; forecast_units: number }[]
}) => {
  return request.post<ApiResponse<any>>('/api/order/batch-create-monthly', data)
}

// 查询月別受注是否存在
interface ExistsResponse {
  exists: boolean
}

// 通过月订单ID取得所有日订单
export const fetchDailyOrdersByMonthlyOrderId = (monthlyOrderId: string) => {
  return request.get<ApiResponse<{ list: OrderDaily[] }>>(
    `/api/order/daily/by-monthly/${monthlyOrderId}`,
  )
}

// 日別受注 一覧取得
export const fetchDailyOrders = (params: {
  year?: number
  month?: number
  day?: number
  destination_cd?: string
  keyword?: string
  specificDate?: string
  page?: number
  pageSize?: number
  all?: boolean
}) => {
  // 如果没有提供page或pageSize参数，表示需要获取全部数据
  const requestParams = { ...params }

  // 是否是请求总计数据（不分页）
  const isRequestingAll = !requestParams.page && !requestParams.pageSize

  // 如果是请求总计，添加一个标记参数
  if (isRequestingAll) {
    requestParams.all = true
  }

  return request.get<ApiResponse<{ list: OrderDaily[]; total: number }>>('/api/order/daily', {
    params: requestParams,
  })
}

// 日別受注 単件更新
export const updateDailyOrder = (id: number, data: Partial<OrderDaily>) => {
  return request.put<ApiResponse<null>>(`/api/order/daily/${id}`, data)
}

// 新增日订单
export const createDailyOrder = (data: OrderDaily) => {
  return request.post<ApiResponse<null>>('/api/order/daily', data)
}

// 新增日订单（用于弹窗组件）
export const addOrderDaily = (data: Partial<OrderDaily>) => {
  console.log('API发送日订单数据:', JSON.stringify(data, null, 2))

  // 确保delivery_date字段被包含并正确格式化
  const postData = {
    ...data,
    delivery_date: data.delivery_date || null,
  }

  return request.post<ApiResponse<null>>('/api/order/daily', postData)
}

// 批量更新日订单
export const batchUpdateDailyOrders = (data: { list: OrderDailyUpdate[] }) => {
  return request.post('/api/order/daily/batch-update', data)
}

// 内示差異ランキング用
export function getForecastDiffRanking(params: { year: number; month: number }) {
  return request.get<{
    positive: ForecastDiffItem[]
    negative: ForecastDiffItem[]
  }>('/api/order/forecast-diff-ranking', { params })
}

// 一括出荷済に更新
export const updateOrderDailyStatus = (params: { date: string; status: string }) => {
  return request.post<{ updated: number }>('/api/order/daily/update-status', params)
}

// 指定日受注データ取得
export const fetchDailyOrdersByDate = (params: { date: string }) => {
  return request.get<OrderDaily[]>('/api/order/daily/by-date', { params })
}

// 出货履历用
interface FetchDailyOrdersResponse {
  list: OrderDaily[]
  total: number
}
export const fetchDailyAllOrders = (params: FetchDailyOrdersParams) => {
  return request.get<FetchDailyOrdersResponse>('/api/order/daily/list', { params })
}

// 获取包含产品信息的日订单数据（用于出荷创建）
export const fetchDailyOrdersWithProduct = (params: {
  startDate: string
  endDate: string
  destination_cd?: string
  pageSize?: number
}) => {
  return request.get<FetchDailyOrdersResponse>('/api/order/daily/list-with-product', { params })
}

// ダッシュボード受注統計取得
export const fetchDashboardSummary = (params: { year: number; month?: number }) => {
  return axios.get<ApiResponse<DashboardSummaryResponse>>('/api/order/dashboard-summary', {
    params,
  })
}

// 受注logs
export const fetchLogs = (params: {
  page: number
  pageSize: number
  action?: string
  target_type?: string
  keyword?: string
}) => {
  return request.get('/api/order/logs', { params })
}

// 订单到流水表
export const syncShippingLog = (
  mode: 'today' | 'all' | 'range' = 'today',
  startDate?: string,
  endDate?: string,
) => {
  const params: Record<string, any> = { mode }
  if (mode === 'range') {
    params.start_date = startDate
    params.end_date = endDate
  }
  return request.get('/api/order/batch-shipping-sync', { params })
}

// 受注履歴比較
export interface OrderHistoryComparisonParams {
  year: number
  month: number
  baseRecordMonth: number
  baseRecordYear: number
  compareRecordMonth: number
  compareRecordYear: number
}

export interface OrderHistoryComparisonItem {
  order_id: string
  destination_cd: string
  destination_name: string
  product_cd: string
  product_name: string
  year: number
  month: number
  base_snapshot_date: string
  compare_snapshot_date: string
  base_forecast: number
  compare_forecast: number
  forecast_diff: number
  base_record: string
  compare_record: string
}

// 受注履歴比較データを取得
export const fetchOrderHistoryComparison = (params: OrderHistoryComparisonParams) => {
  return request.get<ApiResponse<OrderHistoryComparisonItem[]>>(
    '/api/order/monthly/history-comparison',
    {
      params,
    },
  )
}

// 受注履歴スナップショットを手動で作成（開発用）
export const createOrderHistorySnapshot = () => {
  return request.post<ApiResponse<{ count: number }>>('/api/order/monthly/create-history')
}

// 受注情報を一括更新
export const updateOrderFields = (params: { startDate: string; updateProductInfo?: boolean }) => {
  return request.post<ApiResponse<UpdateOrderFieldsResponse>>(
    '/api/order/monthly/update-fields',
    params,
  )
}

// 删除日订单
export const deleteDailyOrder = (id: number) => {
  return request.delete(`/api/order/daily/${id}`)
}

// 获取月订单合计
export const fetchMonthlySummary = (params: any) => {
  return request.get('/api/order/monthly/summary', { params })
}

// 新增订单确认API - 支持单个和批量确认
export const confirmOrder = async (data: { id?: number; ids?: number[] }) => {
  try {
    let result
    if (data.id) {
      // 单个确认，只传 id 和 confirmed=1
      console.log('发送单个订单确认请求:', data.id)
      result = await request.put(`/api/order/daily/${data.id}`, {
        confirmed: 1,
        confirmed_at: new Date().toISOString(),
      })
    } else if (data.ids && data.ids.length > 0) {
      // 批量确认，发送批量更新请求
      console.log('发送批量订单确认请求, 订单数量:', data.ids.length)
      const list = data.ids.map((id) => ({
        id,
        confirmed: 1,
        confirmed_at: new Date().toISOString(),
      }))

      // 使用不同的API端点，避免权限问题
      result = await request.post('/api/order/daily/confirm-batch', { list })
    } else {
      throw new Error('未提供有效的订单ID')
    }
    return result
  } catch (error: any) {
    // token错误已在request拦截器中处理，这里不需要重复处理
    console.error('确认订单失败', error)
    throw error // 向上传递错误以便UI处理
  }
}

// 检测没有ピッキング的订单
export interface UnpickedOrdersParams {
  startDate?: string
  endDate?: string
  destination_cd?: string
  page?: number
  pageSize?: number
  export?: boolean
}

export interface UnpickedOrderItem {
  id: number
  destination_cd: string
  destination_name: string
  product_cd: string
  product_name: string
  product_alias?: string
  confirmed_boxes: number
  confirmed_units: number
  unit_per_box: number
  status: string
  year: number
  month: number
  day: number
  weekday: string
  delivery_date?: string
  remarks?: string
  created_at: string
  updated_at: string
  shipping_date: string
  box_type?: string
}

export interface UnpickedOrdersResponse {
  success: boolean
  message: string
  data: {
    list: UnpickedOrderItem[]
    total: number
    summary: {
      totalOrders: number
      totalBoxes: number
      totalUnits: number
      destinationCount: number
      productCount: number
      dateCount: number
    }
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
}

// 获取没有ピッキング的订单列表
export const fetchUnpickedOrders = (params: UnpickedOrdersParams) => {
  return request.get<UnpickedOrdersResponse>('/api/order/daily/unpicked', { params })
}
