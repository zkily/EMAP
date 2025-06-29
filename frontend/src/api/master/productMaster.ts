import axios from 'axios'
import request from '@/utils/request'
import type { Product} from '@/types/master'

// 製品一覧取得
export function getProductList(params: any) {
  return request.get('/api/master/products', { params })
}

// 製品登録
export function createProduct(data: Product) {
  return request.post('/api/master/products', data)
}

// 製品更新
export function updateProduct(data: Product) {
  return request.put(`/api/master/products/${data.id}`, data)
}

// 製品削除
export function deleteProduct(id: number) {
  return request.delete(`/api/master/products/${id}`)
}

// 製品状態更新（有効 / 無効）---（未使用）
export function updateProductStatus(id: number, status: number) {
  return axios.put(`/api/master/products/${id}/status`, { status })
}

// 製品CD最大値
export async function getMaxProductCd(): Promise<number> {
  return await request.get<number>('/api/master/products/max-cd')
}
