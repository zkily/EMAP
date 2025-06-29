import axios from 'axios'
import request from '@/utils/request'

// ==============================納入先マスタ============================
// 获取納入先列表
export async function getDestinationList(params: { keyword: string }) {
  const res = await axios.get('/api/master/destinations', { params })
  return res.data
}

// 新增納入先
export function createDestination(data: any) {
  return axios.post('/api/master/destinations', data)
}

// 更新納入先
export function updateDestination(data: any) {
  return axios.put(`/api/master/destinations/${data.id}`, data)
}

// 删除納入先
export function deleteDestinationById(id: number) {
  return axios.delete(`/api/master/destinations/${id}`)
}

// 启用 / 停用切换
export function updateDestinationStatus(id: number, status: number) {
  return axios.put(`/api/master/destinations/${id}/status`, { status })
}

//===============================納入先祝日マスタ==================================
// 获取指定納入先的休日列表
export async function getHolidaysByDest(cd: string) {
  const res = await axios.get('/api/master/holiday', {
    params: { destination_cd: cd },
  })
  return res.data.data
}
// 获取指定納入先的臨時出勤日列表
export async function getWorkdaysByDest(cd: string) {
  const res = await axios.get('/api/master/holiday/workday', {
    params: { destination_cd: cd },
  })
  return res.data.data
}
// 添加休日
export async function addHolidayDate(cd: string, date: string) {
  return await axios.post('/api/master/holiday', {
    destination_cd: cd,
    holiday_date: date,
  })
}

// 删除休日
export async function deleteHolidayDate(id: number) {
  return await axios.delete(`/api/master/holiday/${id}`)
}

// 添加臨時出勤日
export async function addWorkdayDate(cd: string, date: string, reason: string) {
  return await axios.post('/api/master/holiday/workday', {
    destination_cd: cd,
    work_date: date,
    reason,
  })
}

// 删除臨時出勤日
export async function deleteWorkdayDate(id: number) {
  return await axios.delete(`/api/master/holiday/workday/${id}`)
}

/**
 * 获取用户选项列表
 */
export function getUserOptions() {
  return request.get('/api/master/users/options')
}

/**
 * 获取交货目的地列表
 */
export function getDeliveryDestinations() {
  return request.get('/api/master/delivery-destinations')
}

/**
 * 更新交货目的地的担当者
 */
export function updateDestinationPicker(id: string | number, picker_id: string | null) {
  return request.put(`/api/master/delivery-destinations/${id}/picker`, {
    picker_id
  })
}
