import request from '@/utils/request'

// 导出picking数据为CSV的数据部分（拦截器处理后的结果）
export interface PickingExportData {
  copiedCount: number
  totalDataCount: number
  csvFilePath: string
  fileName: string
  exportTime: string
}

// 导出picking数据到CSV文件
export function exportPickingCSV(): Promise<PickingExportData> {
  return request.post('/api/shipping/export/export-picking-csv')
}

// 获取picking_list表的概要信息数据部分
export interface PickingListSummaryData {
  tableExists: boolean
  totalCount: number
  latestRecord: any
}

export function getPickingListSummary(): Promise<PickingListSummaryData> {
  return request.get('/api/shipping/export/picking-list-summary')
}
