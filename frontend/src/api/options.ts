import axios from 'axios'
import request from '@/utils/request'
import { ApiResponse } from '@/types/master'

// OptionItem 型
export interface OptionItem {
  category: any
  cd: string
  name: string
}

// 共通取得函数
const fetchOptions = async (url: string): Promise<OptionItem[]> => {
  try {
    const res = await axios.get<ApiResponse<OptionItem[]>>(url, {
      timeout: 10000, // 10秒超时
    })
    if (!res.data.success) {
      throw new Error(res.data.message || 'オプション取得失敗')
    }
    return res.data.data || []
  } catch (error: any) {
    console.error('获取选项失败:', error)
    if (error.code === 'ECONNABORTED') {
      throw new Error('リクエストがタイムアウトしました')
    }
    if (error.response?.status === 404) {
      throw new Error('APIエンドポイントが見つかりません')
    }
    if (error.response?.status >= 500) {
      throw new Error('サーバーエラーが発生しました')
    }
    throw new Error(error.message || 'オプション取得に失敗しました')
  }
}

// 顧客
export const getCustomerOptions = () => fetchOptions('/api/master/options/customer-options')

// 運送便
export const getCarrierOptions = () => fetchOptions('/api/master/options/carrier-options')

// 製品
export const getProductOptions = () => fetchOptions('/api/master/options/product-options')

// 納入先
export const getDestinationOptions = () => fetchOptions('/api/master/options/destination-options')

// 仕入先
export const getSupplierOptions = () => fetchOptions('/api/master/options/supplier-options')

// 材料
export const getMaterialOptions = () => fetchOptions('/api/master/options/material-options')

// 工程ルート
export const getRouteOptions = () => fetchOptions('/api/master/options/route-options')

// 工程
export const getProcessOptions = () => fetchOptions('/api/master/options/process-options')

// 工程詳細情報取得
export const getProcessDetails = async (processCd: string) => {
  console.log('调用getProcessDetails API:', processCd)
  const response = await request.get<{
    success: boolean
    data: {
      process_cd: string
      process_name: string
      default_yield: number
      default_cycle_sec: number
    }
  }>(`/api/master/options/process-details/${processCd}`)
  console.log('getProcessDetails API响应:', response)
  return response
}

// 部品
export const getComponentOptions = () => fetchOptions('/api/master/options/component-options')

// 製品別工程ルート（ステップ）
export const getProductRouteStepOptions = () =>
  fetchOptions('/api/master/options/product-route-steps')

// 設備
export const getMachineOptions = () => fetchOptions('/api/master/options/machine-options')

// BOM
export const getBOMOptions = () => fetchOptions('/api/master/options/bom-options')
