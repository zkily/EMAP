import request from '@/utils/request'

// 获取负库存数据
export function getNegativeStockData(params: { start_date: string; end_date: string }) {
  return request.get('/api/stock/negative-stock', { params })
}

// 获取库存枯竭预测数据
export function getStockDepletionDates(params: { start_date: string; end_date: string }) {
  return request.get('/api/stock/stock-depletion-dates', { params })
}

// 获取产品库存趋势数据
export function getProductStockTrend(params: {
  product_cd_list: string[]
  location_cd: string
  start_date: string
  end_date: string
}) {
  return request.get('/api/stock/product-trend', { params })
}

// 获取日常趋势数据
export function getDailyTrendData(params: {
  product_cd: string
  location_cd: string
  start_date: string
  end_date: string
}) {
  return request.get('/api/stock/daily-trends', { params })
}
