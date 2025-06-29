import request from '@/utils/request';

// wip库存读取
export const fetchWipStock = () => {
  return request.get('/api/stock/wip');
};

// wip库存计算
export const recalculateWipStock = () => {
  return request.post('/api/stock/wip/recalculate');
};

// 工程顺序取得
export const getProcessOrder = () => {
  return request.get('/api/stock/wip/route-process-order');
};















// 一下做成中


// // wip库存推移数据取得
// export const getWipTrend = (params: {
//   product_cd_list?: string[]
//   start_date: string
//   end_date: string
// }) => {
//   return request.get('/api/stock/wip/wip-trend-cache', { params })
// }

// // wip一键计算在库推移所有产品
// export const getShippingEndDates = () => {
//   return request.get('/api/stock/wip/shipping-end-dates')
// }


export function rebuildWipTrendCache(params: any) {
  return request.post('/api/stock/wip/rebuild-wip-trend-cache', params)
}

export function fetchWipTrend(params: any) {
  return request.get('/api/stock/wip/wip-trend', { params })
}
