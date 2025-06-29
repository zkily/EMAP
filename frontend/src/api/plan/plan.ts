import request from '@/utils/request'

export const getBatchList = (params: any) => request.get('/api/plan/batch/list', { params })

export const updateBatchStatus = (data: any) => request.post('/api/plan/batch/update-status', data)

export const toggleBatchLock = (data: any) => request.post('/api/plan/batch/toggle-lock', data)



export const exportBatchPdf = (batch_id: any) =>
  request.get('/api/plan/batch/export-pdf', { params: { batch_id } })


export const deleteBatchApi = (batch_id: any) =>
  request.post('/api/plan/batch/delete', { batch_id })






export const getBatchDetail = (batchId: number | string) => {
  return request.get('/api/plan/batch/detail', { params: { batch_id: batchId } })
}

export const getBatchOrders = (batch_id: any) =>
  request.get('/api/plan/batch/orders', { params: { batch_id } })



