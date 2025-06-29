import axios from 'axios'

// 获取客户列表
export async function getCustomerList(params: { keyword: string }) {
  const res = await axios.get('/api/master/customer', { params })
  return res.data
}

// 顧客登録
export function createCustomer(data: any) {
  return axios.post('/api/master/customer', data)
}

// 顧客更新
export function updateCustomer(data: any) {
  return axios.put(`/api/master/customer/${data.id}`, data)
}

// 顧客削除
export function deleteCustomerById(id: number) {
  return axios.delete(`/api/master/customer/${id}`)
}

// 顧客状態更新（有効 / 無効）
export function updateCustomerStatus(id: number, status: number) {
  return axios.put(`/api/master/customer/${id}/status`, { status })
}
