import request from '../../utils/request'

// 溶接产品接口
export interface WeldingProduct {
  label: string
  value: string
}

export interface WeldingShippingRecord {
  boxes: number
}

// 溶接出荷数据接口
export interface WeldingShippingData {
  dates: string[]
  destinations: string[]
  products: Array<{
    cd: string
    name: string
  }>
  data: {
    [date: string]: {
      [destination: string]: {
        [product: string]: WeldingShippingRecord[]
      }
    }
  }
}

// 获取溶接产品列表
export const getWeldingProducts = () => {
  return request.get<WeldingProduct[]>('/api/shipping/welding/products')
}

// 获取溶接出荷数据
export const getWeldingShippingData = (params: {
  start_date: string
  end_date: string
  products: string[]
}) => {
  return request.get<WeldingShippingData>('/api/shipping/welding/data', {
    params: {
      ...params,
      products: params.products,
    },
    paramsSerializer: {
      indexes: null, // 这样数组参数会序列化为 products[]=value1&products[]=value2
    },
  })
}

// 导出溶接出荷报告
export const exportWeldingShippingReport = (data: {
  start_date: string
  end_date: string
  products: string[]
  table_data: WeldingShippingData
}) => {
  return request.post<{ html: string; filename: string }>('/api/shipping/welding/export', data)
}
