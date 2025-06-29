// 通用接口返回格式
export interface ApiResponse<T = any> {
  success: any
  list: never[]
  total: number
  code: number
  message: string
  data: T
}

// 月別注文データ型
export interface OrderMonthly {
  // [x: string]: number
  id?: number
  order_id?: string
  destination_cd: string
  destination_name: string
  year: number
  month: number
  product_cd: string
  product_name: string
  product_type?: string
  product_alias?: string
  forecast_units: number
  forecast_total_units: number
  forecast_diff?: number
  created_at?: string
  updated_at?: string
}

// 批量登録用の型（新规受注、月注文一括登録共用）
export interface BatchProduct {
  product_cd: string
  product_name: string
  quantity: number
  exists?: boolean // 🔥 一括登録時チェック用
}

// 日別受注型
export interface OrderDaily {
  id: number
  monthly_order_id: string
  destination_cd: string
  destination_name: string
  product_cd: string
  product_name: string
  product_alias?: string
  forecast_units: number
  confirmed_boxes: number
  confirmed_units: number
  status: '未出荷' | '出荷済' | 'キャンセル'
  remarks: string
  year: number
  month: number
  day: number
  updated_at?: string
  unit_per_box?: number
  confirmed?: boolean
  confirmed_by?: string
  confirmed_at?: string
  weekday?: string
  product_type?: string
  delivery_date?: string
}

// 批量更新提交用
export interface OrderDailyUpdate {
  id: number
  forecast_units?: number
  confirmed_boxes?: number
  confirmed_units?: number
  status?: string
  remarks?: string
  confirmed?: boolean | number
}

export interface FetchDailyOrdersParams {
  year?: number
  month?: number
  day?: number
  destination_cd?: string
  status?: string
  startDate?: string
  endDate?: string
  product_cd?: string
  specificDate?: string
  keyword?: string
  page?: number
  pageSize?: number
  all?: boolean
}

export interface OrderDailyUpdatePayload {
  id: number
  confirmed_units: number
  confirmed_boxes: number
  status: string
  remarks: string
}

export interface ForecastDiffItem {
  product_cd: string
  product_name: string
  diff: string | number
}

// 📋 納入先別統計
export interface DestinationSummaryItem {
  destination_cd: string
  destination_name: string
  order_count: number
  forecast_units_sum: number
}

// 📈 月別統計
export interface MonthlySummaryItem {
  month: number
  order_count: number
  forecast_units_sum: number
}

// 📦 API 返回整体
export interface DashboardSummaryResponse {
  destinationSummary: DestinationSummaryItem[]
  monthlySummary: MonthlySummaryItem[]
}

// 仕入先
export interface Supplier {
  supplier_cd: string
  supplier_name: string
}

// 一括更新レスポンス
export interface UpdateOrderFieldsResponse {
  updatedCount: number
  message: string
}
