import request from '@/utils/request'
import type { ComponentItem } from '@/types/master'
import type {
  BomItem,
  BomTreeNode,
  BomReverseItem,
  BomCreateParams,
  BomSearchParams,
  ProductOption,
  ComponentOption,
} from '@/shared/types/bom'

//=========================================部品マスタ
// 一覧取得
export async function fetchComponents(keyword = ''): Promise<ComponentItem[]> {
  return await request.get('/api/master/components', { params: { keyword } })
}

// 登録
export async function createComponent(payload: ComponentItem) {
  return await request.post('/api/master/components', payload)
}

// 更新
export async function updateComponent(id: number, payload: ComponentItem) {
  return await request.put(`/api/master/components/${id}`, payload)
}

// 削除
export async function deleteComponent(id: number) {
  return await request.delete(`/api/master/components/${id}`)
}

// =================================================BOM
export const fetchBomList = (params: BomSearchParams): Promise<BomItem[]> => {
  return request.get('/api/master/bom/list', { params })
}

export const createBomItem = (data: BomCreateParams) => {
  return request.post('/api/master/bom/create', data)
}

export const updateBomItem = (id: number, data: BomCreateParams) => {
  return request.put(`/api/master/bom/update/${id}`, data)
}

export const deleteBomItem = (id: number) => {
  return request.delete(`/api/master/bom/delete/${id}`)
}

export const fetchProductOptions = (): Promise<ProductOption[]> => {
  return request.get('/api/master/bom/product-options')
}

export const fetchComponentOptions = (): Promise<ComponentOption[]> => {
  return request.get('/api/master/bom/component-options')
}

// 製品の構成ツリー（BOM 展開表示）
export const fetchBomTree = async (productId: number): Promise<BomTreeNode[]> => {
  return await request.get(`/api/master/bom/tree/${productId}`)
}

export const fetchBomReverse = async (componentId: number): Promise<BomReverseItem[]> => {
  return await request.get(`/api/master/bom/tree/reverse/${componentId}`)
}
