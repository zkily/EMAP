import request from '@/utils/request'

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

// 文件监视器状态接口
export interface FileWatcherStatus {
  isRunning: boolean
  watchPath: string
  lastProcessTime: string | null
  processedFiles: number
}

// 日志记录接口
export interface ShippingLogRecord {
  id: number
  project: string
  date: string
  datetime: string
  model_no: string
  person_in_charge: string
  picking_no: string
  product_name: string
  product_code: string
  product_name_2: string
  quantity: number
  shipping_quantity: number
  created_at: string
  updated_at: string
}

// 重复数据统计接口
export interface DuplicateStats {
  totalRecords: number
  duplicateGroups: number
  totalDuplicateRecords: number
  duplicateDetails: Array<{
    picking_no: string
    product_code: string
    date: string
    count: number
    first_created: string
    last_created: string
  }>
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  logs: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  todayCount?: number
  duplicateCount?: number
  errorCount?: number
  message?: string
}

// 获取文件监视器状态
export const getFileWatcherStatus = () => {
  return request.get<FileWatcherStatus>('/api/shipping/file-watcher/status')
}

// 启动文件监视器
export const startFileWatcher = () => {
  return request.post<{ message?: string }>('/api/shipping/file-watcher/start')
}

// 停止文件监视器
export const stopFileWatcher = () => {
  return request.post<{ message?: string }>('/api/shipping/file-watcher/stop')
}

// 手动处理文件
export const processFile = () => {
  return request.post<{ message?: string }>('/api/shipping/file-watcher/process')
}

// 获取日志列表
export const getShippingLogs = (params: {
  page?: number
  limit?: number
  search?: string
  statsOnly?: boolean
}) => {
  return request.get<PaginatedResponse<ShippingLogRecord>>('/api/shipping/file-watcher/logs', {
    params,
  })
}

// 搜索日志
export const searchShippingLogs = (params: {
  page?: number
  limit?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  project?: string
  picking_no?: string
  product_code?: string
}) => {
  return request.get<PaginatedResponse<ShippingLogRecord>>(
    '/api/shipping/file-watcher/logs/search',
    {
      params,
    },
  )
}

// 清理历史日志
export const cleanupShippingLogs = (daysToKeep: number = 30) => {
  return request.delete<{ message?: string }>('/api/shipping/file-watcher/logs/cleanup', {
    data: { daysToKeep },
  })
}

// 获取重复数据统计
export const getDuplicateStats = () => {
  return request.get<DuplicateStats>('/api/shipping/file-watcher/duplicates/stats')
}

// 执行去重操作
export const performDeduplicate = () => {
  return request.post<{ message?: string }>('/api/shipping/file-watcher/deduplicate')
}

// 导出日志数据
export const exportShippingLogs = (params: {
  dateFrom?: string
  dateTo?: string
  project?: string
  format?: 'csv' | 'excel'
}) => {
  return request.get('/api/shipping/file-watcher/logs/export', {
    params,
    responseType: 'blob',
  })
}

// 同步数据到picking_tasks表
export const syncToPickingTasks = () => {
  return request.post<
    ApiResponse<{
      message: string
      syncedRecords: number
      statistics: {
        totalSyncedTasks: number
        totalShippingLogs: number
        totalPickers: number
      }
    }>
  >('/api/shipping/file-watcher/sync-to-picking')
}

// 获取同步状态
export const getSyncStatus = () => {
  return request.get<
    ApiResponse<{
      availableForSync: number
      alreadySynced: number
      totalPickingTasks: number
      totalShippingLogs: number
      lastSyncTime: string | null
      syncRate: number
      tableExists?: boolean
    }>
  >('/api/shipping/file-watcher/sync-status')
}

// 创建picking_tasks表
export const createPickingTable = () => {
  return request.post<
    ApiResponse<{
      message: string
    }>
  >('/api/shipping/file-watcher/create-picking-table')
}

// 获取同步调试信息
export const getSyncDebugInfo = () => {
  return request.get<
    ApiResponse<{
      shippingLogData: any[]
      pickingTasksData: any[]
      matchingData: any[]
      summary: {
        shippingLogCount: number
        pickingTasksCount: number
        matchedCount: number
        unmatchedCount: number
      }
    }>
  >('/api/shipping/file-watcher/sync-debug')
}
