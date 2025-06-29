import request from '@/utils/request'
import type { Material, MaterialSearchParams, StockHistory } from '@/types/material'

// 获取材料列表
export function getMaterialList(params: MaterialSearchParams) {
  return request.get<{
    list: Material[]
    total: number
  }>('/api/material/list', { params })
}

// 获取材料详情
export function getMaterialDetail(id: number) {
  return request.get<Material>(`/api/material/${id}`)
}

// 创建材料
export function createMaterial(data: Partial<Material>) {
  return request.post('/api/material', data)
}

// 更新材料
export function updateMaterial(id: number, data: Partial<Material>) {
  return request.put(`/api/material/${id}`, data)
}

// 删除材料
export function deleteMaterial(id: number) {
  return request.delete(`/api/material/${id}`)
}

// 批量删除材料
export function batchDeleteMaterials(ids: number[]) {
  return request.post('/api/material/batch-delete', { ids })
}

// 更新材料状态
export function updateMaterialStatus(id: number, status: number) {
  return request.patch(`/api/material/${id}/status`, { status })
}

// 获取库存变动记录
export function fetchStockHistory(materialId: number) {
  return request.get<StockHistory[]>(`/api/material/${materialId}/stock-history`)
}

// 导入材料数据
export function importMaterials(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/material/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 导出材料数据
export function exportMaterials(ids?: number[]) {
  return request.post(
    '/api/material/export',
    { ids },
    {
      responseType: 'blob',
    },
  )
}

// 获取材料分类选项
export function getMaterialCategories() {
  return request.get<{ value: string; label: string }[]>('/api/material/categories')
}

// 获取计量单位选项
export function getMaterialUnits() {
  return request.get<{ value: string; label: string }[]>('/api/material/units')
}

// 检查材料编码是否存在
export function checkMaterialCode(code: string, excludeId?: number) {
  return request.get<boolean>('/api/material/check-code', {
    params: { code, excludeId },
  })
}
