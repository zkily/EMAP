import request from '@/utils/request'
import type { FetchProcessesParams, ProcessItem, RouteItem } from '@/types/master'

//========================工程マスタ======================
// 取得工程列表
export async function fetchProcesses(params: FetchProcessesParams): Promise<{
  list: ProcessItem[]
  total: number
}> {
  return await request.get('/api/master/processes', { params })
}

// 新增工程
export async function createProcess(payload: {
  process_cd: string
  process_name: string
  category: string
  is_outsource: boolean
  default_cycle_sec: number
  default_yield: number
}) {
  return await request.post('/api/master/processes', payload)
}

// 更新工程
export async function updateProcess(id: number, payload: Partial<ProcessItem>) {
  return await request.put(`/api/master/processes/${id}`, payload)
}

// 删除工程
export async function deleteProcess(id: number) {
  return await request.delete(`/api/master/processes/${id}`)
}
