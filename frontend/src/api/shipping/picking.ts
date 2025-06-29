import request from '@/utils/request'

// 数据同步
export const syncShippingDataToPickingTasks = () => {
  return request.post('/api/shipping/picking/sync-data')
}

// 获取可用于ピッキング的出荷数据
export const getShippingItemsForPicking = (params: {
  start_date?: string
  end_date?: string
  destination_cd?: string
  status?: string
  picking_status?: string
}) => {
  return request.get('/api/shipping/picking/items/for-picking', { params })
}

// 生成ピッキングリスト
export const generatePickingTasks = (data: {
  shipping_nos: string[]
  picker_id: string
  priority?: number
  optimization?: string
  remarks?: string
}) => {
  return request.post('/api/shipping/picking/generate', data)
}

// 获取ピッキング任务列表
export const getPickingTasks = (params: {
  picker_id?: string
  status?: string
  shipping_no?: string
  priority?: number
}) => {
  return request.get('/api/shipping/picking/tasks', { params })
}

// 获取托盘进度信息
export const getPalletProgress = (params: { picker_id?: string }) => {
  return request.get('/api/shipping/picking/pallet-progress', { params })
}

// 开始ピッキング任务
export const startPickingTask = (picking_id: string) => {
  return request.put(`/api/shipping/picking/tasks/${picking_id}/start`)
}

// 完成ピッキング任务
export const completePickingTask = (
  picking_id: string,
  data: {
    picked_quantity?: number
    remarks?: string
  },
) => {
  return request.put(`/api/shipping/picking/tasks/${picking_id}/complete`, data)
}

// 获取ピッキング历史数据
export const getPickingHistory = (params: {
  start_date?: string
  end_date?: string
  picker_id?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return request.get('/api/shipping/picking/history', { params })
}

// ==================== ピッキング履歴関連 API ====================

// 获取ピッキング履歴概要数据
export const getPickingHistoryData = (params: {
  start_date?: string
  end_date?: string
  picker_id?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return request.get('/api/shipping/picking/history', {
    params: {
      page: 1,
      limit: 100,
      ...params,
    },
  })
}

// 获取日别作业效率推移数据
export const getDailyEfficiencyData = (params: {
  start_date?: string
  end_date?: string
  picker_id?: string
}) => {
  return request.get('/api/shipping/picking/history/daily-efficiency', { params })
}

// 获取月别作业效率推移数据
export const getMonthlyEfficiencyData = (params: {
  start_date?: string
  end_date?: string
  picker_id?: string
}) => {
  return request.get('/api/shipping/picking/history/monthly-efficiency', { params })
}

// 获取未ピッキングリスト
export const getPendingTasks = (params: {
  picker_id?: string
  shipping_no?: string
  priority?: number
}) => {
  return request.get('/api/shipping/picking/tasks', {
    params: {
      ...params,
      status: 'active',
    },
  })
}

// 获取ピッキング済リスト
export const getCompletedTasks = (params: {
  start_date?: string
  end_date?: string
  picker_id?: string
  shipping_no?: string
  page?: number
  limit?: number
}) => {
  return request.get('/api/shipping/picking/history', {
    params: {
      ...params,
      status: 'completed',
    },
  })
}

// 获取担当者选项列表
export const getPickerOptions = () => {
  return request.get('/api/master/options/pickers')
}

/**
 * 获取担当者按目的地分组的绩效数据
 */
export function getPerformanceByDestination(params: {
  start_date: string
  end_date: string
  picker_ids?: string[]
}) {
  return request.get('/api/shipping/picking/performance-by-destination', {
    params,
    paramsSerializer: (params) => {
      // Use qs to format array params correctly
      return require('qs').stringify(params, { arrayFormat: 'comma' })
    },
  })
}
