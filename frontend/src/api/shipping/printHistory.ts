import request from '@/utils/request'

// 获取打印历史列表
export const getPrintHistory = (params: any) => {
  return request.get('/api/shipping/print/history', { params })
}

// 获取打印历史统计
export const getPrintHistoryStats = (params: any) => {
  return request.get('/api/shipping/print/history/stats', { params })
}

// 删除打印历史
export const deletePrintHistory = (id: number) => {
  return request.delete(`/api/shipping/print/history/${id}`)
}

// 批量删除打印历史
export const batchDeletePrintHistory = (ids: number[]) => {
  return request.delete(`/api/shipping/print/history/batch/${ids.join(',')}`)
}

// 记录打印历史
export const recordPrintHistory = (data: any) => {
  return request.post('/api/shipping/print/history', data)
}
