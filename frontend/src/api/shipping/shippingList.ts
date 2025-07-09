import request from '@/utils/request'

// 获取出荷便リスト数据
export function getShippingListData(params: {
  date_from: string
  date_to: string
  destination_cds?: string
}) {
  return request.get('/api/shipping/list', {
    params,
  })
}

// 打印出荷便リスト
export function printShippingList(data: any, filters: any, printerName?: string) {
  return request.post('/api/shipping/printing/shipping-list', {
    data,
    filters,
    printerName,
  })
}

// 下载出荷便リストPDF
export function downloadShippingListPDF(data: any, filters: any) {
  return request.post(
    '/api/shipping/printing/shipping-list',
    {
      data,
      filters,
    },
    {
      responseType: 'blob',
    },
  )
}

// 记录打印并更新状态
export function recordPrintAndUpdateStatus(shipping_numbers: string[]) {
  return request.post('/api/shipping/print-record', {
    shipping_numbers,
  })
}