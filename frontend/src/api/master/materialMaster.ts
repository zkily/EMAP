import axios from 'axios'
import request from '@/utils/request'


// 材料一覧取得
export async function getMaterialList(params: { keyword: string }) {
  const res = await axios.get('/api/master/materials', { params })
  return res.data
}

// 材料詳細取得 (未使用)
export async function getMaterialById(id: number) {
  const res = await axios.get(`/api/master/materials/${id}`)
  return res.data
}

// 材料登録
export function createMaterial(data: any) {
  return axios.post('/api/master/materials', data)
}

// 材料更新
export function updateMaterial(data: any) {
  return axios.put(`/api/master/materials/${data.id}`, data)
}

// 材料削除
export function deleteMaterialById(id: number) {
  return axios.delete(`/api/master/materials/${id}`)
}

// 材料CD重複チェック
export async function checkMaterialCd(code: string, id: number = 0) {
  const res = await axios.get('/api/master/materials/check-code', { params: { code, id } })
  return res.data
}

// 最大材料CD取得
export function getMaxMaterialCd() {
  return request.post('/api/master/materials/max-code')
}
