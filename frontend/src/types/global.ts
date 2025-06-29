// サーバーからの共通レスポンス型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}
