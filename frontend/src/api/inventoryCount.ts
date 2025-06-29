import request from '@/utils/request'
import type {
  InventoryCount,
  InventoryCountSearchParams,
  InventoryCountDetail,
  InventoryAdjustment,
  InventoryItem,
  InventoryItemSearchParams,
  CreateInventoryCountParams,
  UpdateInventoryCountParams,
  AddInventoryDetailParams,
  UpdateInventoryDetailParams,
  CreateAdjustmentParams,
  InventoryCountStatistics,
  Department,
  Process,
  Location,
} from '@/types/inventoryCount'

// API响应包装类型
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

// 获取盘点单列表
export function getInventoryCountList(params: InventoryCountSearchParams) {
  return request.get<
    ApiResponse<{
      list: InventoryCount[]
      total: number
      page: number
      pageSize: number
    }>
  >('/api/inventory-count/list', { params })
}

// 获取盘点单详情
export function getInventoryCountDetail(id: number) {
  return request.get<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}`)
}

// 创建盘点单
export function createInventoryCount(data: CreateInventoryCountParams) {
  return request.post<ApiResponse<InventoryCount>>('/api/inventory-count', data)
}

// 更新盘点单
export function updateInventoryCount(id: number, data: UpdateInventoryCountParams) {
  return request.put<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}`, data)
}

// 删除盘点单
export function deleteInventoryCount(id: number) {
  return request.delete<ApiResponse<any>>(`/api/inventory-count/${id}`)
}

// 获取可盘点的物品列表
export function getInventoryItems(countId: number, params: InventoryItemSearchParams) {
  return request.get<
    ApiResponse<{
      list: InventoryItem[]
      total: number
      page: number
      pageSize: number
    }>
  >(`/api/inventory-count/${countId}/items`, { params })
}

// 添加盘点明细
export function addInventoryDetails(countId: number, data: AddInventoryDetailParams) {
  return request.post<ApiResponse<InventoryCountDetail[]>>(
    `/api/inventory-count/${countId}/details`,
    data,
  )
}

// 更新盘点明细
export function updateInventoryDetail(detailId: number, data: UpdateInventoryDetailParams) {
  return request.put<ApiResponse<InventoryCountDetail>>(
    `/api/inventory-count/details/${detailId}`,
    data,
  )
}

// 删除盘点明细
export function deleteInventoryDetail(detailId: number) {
  return request.delete<ApiResponse<any>>(`/api/inventory-count/details/${detailId}`)
}

// 开始盘点
export function startInventoryCount(id: number, updatedBy: string) {
  return request.post<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}/start`, {
    updatedBy,
  })
}

// 完成盘点
export function completeInventoryCount(
  id: number,
  data: { checkPerson: string; updatedBy: string },
) {
  return request.post<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}/complete`, data)
}

// 取消盘点
export function cancelInventoryCount(id: number, updatedBy: string) {
  return request.post<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}/cancel`, {
    updatedBy,
  })
}

// 生成调整单
export function createAdjustment(countId: number, data: CreateAdjustmentParams) {
  return request.post<ApiResponse<InventoryAdjustment>>(
    `/api/inventory-count/${countId}/adjustment`,
    data,
  )
}

// 审核调整单
export function approveAdjustment(
  adjustmentId: number,
  data: { approvePerson: string; remark?: string },
) {
  return request.post<ApiResponse<InventoryAdjustment>>(
    `/api/inventory-adjustment/${adjustmentId}/approve`,
    data,
  )
}

// 拒绝调整单
export function rejectAdjustment(
  adjustmentId: number,
  data: { approvePerson: string; remark?: string },
) {
  return request.post<ApiResponse<InventoryAdjustment>>(
    `/api/inventory-adjustment/${adjustmentId}/reject`,
    data,
  )
}

// 获取盘点统计数据
export function getInventoryCountStatistics(params: { startDate?: string; endDate?: string }) {
  return request.get<ApiResponse<InventoryCountStatistics>>(
    '/api/inventory-count/statistics/dashboard',
    {
      params,
    },
  )
}

// 导出盘点单
export function exportInventoryCount(id: number) {
  return request.post(
    `/api/inventory-count/${id}/export`,
    {},
    {
      responseType: 'blob',
    },
  )
}

// 导出盘点差异报表
export function exportInventoryDifference(params: {
  startDate?: string
  endDate?: string
  countType?: string
}) {
  return request.post('/api/inventory-count/export/difference', params, {
    responseType: 'blob',
  })
}

// 批量删除盘点单
export function batchDeleteInventoryCounts(ids: number[]) {
  return request.post<ApiResponse<any>>('/api/inventory-count/batch-delete', { ids })
}

// 获取部门列表
export function getDepartmentList() {
  return request.get<ApiResponse<Department[]>>('/api/master/departments')
}

// 获取工程列表
export function getProcessList(departmentId?: number) {
  return request.get<ApiResponse<Process[]>>('/api/master/processes', {
    params: { departmentId },
  })
}

// 获取库位列表
export function getLocationList() {
  return request.get<ApiResponse<Location[]>>('/api/master/locations')
}

// 获取用户列表（用于选择盘点人、复核人）
export function getUserList() {
  return request.get<ApiResponse<{ id: number; username: string; realName: string }[]>>(
    '/api/system/users',
  )
}

// 批量更新盘点明细
export function batchUpdateInventoryDetails(
  details: { id: number; actualQuantity: number; remark?: string }[],
) {
  return request.post<ApiResponse<any>>('/api/inventory-count/details/batch-update', { details })
}

// 获取盘点进度
export function getInventoryCountProgress(id: number) {
  return request.get<
    ApiResponse<{
      totalCount: number
      countedCount: number
      uncountedCount: number
      differenceCount: number
      progressRate: number
    }>
  >(`/api/inventory-count/${id}/progress`)
}

// 复制盘点单
export function copyInventoryCount(
  id: number,
  data: { countDate: string; countPerson: string; createdBy: string },
) {
  return request.post<ApiResponse<InventoryCount>>(`/api/inventory-count/${id}/copy`, data)
}

// 获取盘点历史记录
export function getInventoryCountHistory(params: {
  itemId: number
  itemType: string
  page?: number
  pageSize?: number
}) {
  return request.get<
    ApiResponse<{
      list: {
        id: number
        countNo: string
        countDate: string
        countType: string
        bookQuantity: number
        actualQuantity: number
        differenceQuantity: number
        countPerson: string
      }[]
      total: number
    }>
  >('/api/inventory-count/history', { params })
}
