import request from '@/utils/request';

// 获取甘特图数据
export const getGanttItems = (from: string, to: string) =>
  request.get('/api/plan/gantt', { params: { from, to } })

// 同步更新方法
export const updatePlanStepTime = (id: number, start_time: string, end_time: string, machine_cd: string) =>
  request.post('/api/plan/steps/update-time', {
    id,
    start_time,
    end_time,
    machine_cd,
  })

// 新建任务
export const createPlanStepAuto = (payload: {
  plan_id: number | string
  process_cd: string
  machine_cd: string
  start_time: string
}) => request.post('/api/plan/steps/create-auto', payload)

// 计划选项
export const getAllPlans = () => request.get('/api/plan/all')

// 能率
export const getEfficiency = (product_cd: string, process_cd: string, machine_cd: string) =>
  request.get('/api/plan/efficiency', {
    params: { product_cd, process_cd, machine_cd },
  })

// 工序选项
export const getProcessOptions = () => request.get('/api/plan/master/processes')

// 机台选项
export const getMachineOptions = (product_cd: string, process_cd: string) =>
  request.get('/api/plan/master/machines', {
    params: { product_cd, process_cd },
  })

// 工序顺序校验
export const validateStepOrder = (plan_id: string, process_cd: string) =>
  request.get('/api/plan/validate-step-order', {
    params: { plan_id, process_cd },
  })

// 拖拽校验
export const validateStepDrag = (
  step_id: number,
  plan_id: number,
  process_cd: string,
  new_start_time: string,
) =>
  request.get('/api/plan/validate-step-drag', {
    params: { step_id, plan_id, process_cd, new_start_time },
  })

// 设备可用时间
export const getMachineAvailability = (machine_cd: string) =>
  request.get('/api/plan/machine/availability', {
    params: { machine_cd },
  })

// 设备例外日
export const getMachineExceptions = (machine_cd: string) =>
  request.get('/api/plan/machine/exceptions', {
    params: { machine_cd },
  })

  // 设备组（机台列表）
export const getMachineGroup = () => request.get('/api/plan/machines/all')
