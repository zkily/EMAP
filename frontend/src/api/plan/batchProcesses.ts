import request from '@/utils/request'

// 批次工序相关的类型定义
export interface BatchProcess {
  id: number
  batch_id: number
  product_cd: string
  route_cd: string
  step_no: number
  process_cd: string
  process_name: string
  planned_qty: number
  actual_qty: number
  status: string
  equipment_id?: number
  equipment_cd?: string
  equipment_name?: string
  start_date?: string
  end_date?: string
  process_time_sec: number
  setup_time: number
  created_at: string
  updated_at: string
  // 关联数据
  batch_no?: string
  batch_product_cd?: string
  product_name?: string
}

export interface ProcessOption {
  process_cd: string
  process_name: string
  batch_count: number
}

export interface EquipmentOption {
  equipment_cd: string
  equipment_name: string
}

export interface PlanningOptions {
  processes: ProcessOption[]
  equipment: EquipmentOption[]
}

// 获取批次工序列表
export const getBatchProcesses = (params: {
  batch_id?: number
  product_cd?: string
  process_cd?: string
  status?: string
}) => {
  return request.get<{ success: boolean; data: BatchProcess[] }>('/api/plan/batch/processes', { params })
}

// 更新批次工序状态
export const updateBatchProcessStatus = (data: {
  id: number
  status?: string
  equipment_id?: number
  equipment_cd?: string
  equipment_name?: string
  start_date?: string
  end_date?: string
  actual_qty?: number
}) => {
  return request.post<{ success: boolean; message: string }>('/api/plan/batch/processes/update-status', data)
}

// 获取计划选项（工程和设备）
export const getPlanningOptions = (params?: { product_cd?: string }) => {
  return request.get<{ success: boolean; data: PlanningOptions }>('/api/plan/planning/options', { params })
}

// 根据工程和设备筛选批次工序
export const getFilteredBatchProcesses = (params: {
  process_cd?: string
  equipment_cd?: string
  status?: string
  product_cd?: string
}) => {
  return getBatchProcesses(params)
}
