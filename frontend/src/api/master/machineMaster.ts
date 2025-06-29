import request from '@/utils/request'
import { Machine } from '@/types/master'

export interface MachineListResponse {
  list: Machine[]
  total: number
}

// 📥 获取设备列表（已开启拦截器，返回的是 data.list 和 data.total）
export const fetchMachines = (): Promise<MachineListResponse> => {
  return request.get('/api/master/machines')
}

// 📥 获取单个设备详情
export const fetchMachineById = (id: number): Promise<Machine> => {
  return request.get(`/api/master/machines/${id}`)
}

// 📤 创建设备
export const createMachine = (data: Partial<Machine>) => {
  return request.post('/api/master/machines', data)
}

// ✏️ 更新设备
export const updateMachine = (id: number, data: Partial<Machine>) => {
  return request.put(`/api/master/machines/${id}`, data)
}

// ❌ 删除设备
export const deleteMachine = (id: number) => {
  return request.delete(`/api/master/machines/${id}`)
}
