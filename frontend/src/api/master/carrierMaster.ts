import axios from 'axios'

// 運送便一覧取得
export async function getCarrierList(params: { keyword: string }) {
  const res = await axios.get('/api/master/carriers', { params })
  return res.data
}

// 運送便登録
export function createCarrier(data: any) {
  return axios.post('/api/master/carriers', data)
}

// 運送便編集
export function updateCarrier(data: any) {
  return axios.put(`/api/master/carriers/${data.id}`, data)
}

// 運送便削除
export function deleteCarrierById(id: number) {
  return axios.delete(`/api/master/carriers/${id}`)
}

// 運送便状態切替
export function updateCarrierStatus(id: number, status: number) {
  return axios.put(`/api/master/carriers/${id}/status`, { status })
}
