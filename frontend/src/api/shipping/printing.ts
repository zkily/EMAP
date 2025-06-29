import request from '@/utils/request'

// 获取可用打印机列表
export function getPrinters() {
  return request.get('/api/shipping/printing/printers')
}

// 打印出荷予定表
export function printShippingOverview(data: any, filters: any, printerName?: string) {
  return request.post('/api/shipping/printing/shipping-overview', {
    data,
    filters,
    printerName,
  })
}

// 打印出荷品報告書
export function printShippingReport(data: any, filters: any, printerName?: string) {
  return request.post('/api/shipping/printing/shipping-report', {
    data,
    filters,
    printerName,
  })
}

// 下载PDF
export function downloadShippingOverviewPDF(data: any, filters: any) {
  return request.post(
    '/api/shipping/printing/shipping-overview',
    {
      data,
      filters,
    },
    {
      responseType: 'blob',
    },
  )
}

// 下载报告PDF
export function downloadShippingReportPDF(data: any, filters: any) {
  return request.post(
    '/api/shipping/printing/shipping-report',
    {
      data,
      filters,
    },
    {
      responseType: 'blob',
    },
  )
}
