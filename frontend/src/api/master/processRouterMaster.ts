import request from '@/utils/request'
import type { RouteItem } from '@/types/master'

//=========================工程ルートマスタ==================

// 取得工程工序列表
export async function fetchRoutes(
  keyword = '',
  page = 1,
  pageSize = 50,
): Promise<{ list: RouteItem[]; total: number }> {
  return await request.get('/api/master/processes/routes', {
    params: {
      keyword,
      page,
      pageSize,
    },
  })
}

// 新增工程工序
export async function createRoute(payload: {
  route_cd: string
  route_name: string
  description?: string
  is_default: boolean
}) {
  return await request.post('/api/master/processes/routes', payload)
}

// 更新工程工序
export async function updateRoute(id: number, payload: Partial<RouteItem>) {
  return await request.put(`/api/master/processes/routes/${id}`, payload)
}

// 删除工程工序
export async function deleteRoute(id: number) {
  return await request.delete(`/api/master/processes/routes/${id}`)
}

// =================== 工程ルート編集 ===================

// ルート基本情報取得
export const getRouteInfo = (routeCd: string) => {
  return request.get('/api/master/processes/routes/info', { params: { route_cd: routeCd } })
}

// ルートステップ一覧取得
export const getRouteSteps = (routeCd: string) => {
  return request.get('/api/master/processes/routes/steps', { params: { route_cd: routeCd } })
}

// ステップ順序保存
export const updateStepOrder = (routeCd: string, steps: { id: number; step_no: number }[]) => {
  return request.post('/api/master/processes/routes/steps/reorder', { route_cd: routeCd, steps })
}

// ステップ追加
export const createRouteStep = (routeCd: string, data: any) => {
  return request.post('/api/master/processes/routes/steps', { route_cd: routeCd, ...data })
}

// ステップ編集
export const updateRouteStep = (stepId: number, data: any) => {
  return request.put(`/api/master/processes/routes/steps/${stepId}`, data)
}

// ステップ削除
export const deleteRouteStep = (routeCd: string, id: number) => {
  return request.delete(`/api/master/processes/routes/steps?route_cd=${routeCd}&id=${id}`)
}
