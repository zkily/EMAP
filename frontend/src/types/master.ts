export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

export interface OptionItem {
  cd: string
  name: string
}

// 引入共享BOM类型
import type { BomItem, BomTreeNode, BomReverseItem } from '@/shared/types/bom'

// 重新导出共享BOM类型
export type { BomItem, BomTreeNode, BomReverseItem }

// ユーザーマスタ
export interface User {
  id?: number
  username: string
  password?: string
  name: string
  department_id: number
  role: string
  email: string
  phone: string
  status: number
  created_at?: string
  updated_at?: string
}

// 部門マスタ
export interface Department {
  id: number
  name: string
  parent_id?: number | null
  status: number
  created_at: string
  updated_at: string
}

// 部門マスタ
export interface DepartmentPayload {
  id?: number
  name: string
  parent_id?: number | null
  status: number
}

// 材料マスタ
export interface Material {
  /** 材料ID（DB主キー） */
  id: number

  /** 材料コード（ユニーク） */
  material_cd: string

  /** 材料名称 */
  material_name: string

  /** 材料種類（鋼管 / 鋼板 / 棒鋼 / コイル材 etc.） */
  material_type: string

  /** 規格（例: φ20×L1000） */
  standard_spec: string

  /** 単位（kg / 本 / m / 枚 etc.） */
  unit: string

  /** 直径（mm単位） */
  diameter: number

  /** 厚さ（mm単位） */
  thickness: number

  /** 長さ（mm単位） */
  length: number

  /** 束本数（1束あたりの本数） */
  pieces_per_bundle: number

  /** 支給区分（有償 / 無償 / 自給） */
  supply_classification: string

  /** 用途（生産用 / 試作用 / 支給用 / その他） */
  usegae: string

  /** 仕入先CD（suppliersテーブルのcdと紐付け） */
  supplier_cd: string

  /** 単重単価（重量あたりの単価） */
  unit_price: number

  /** 長尺単重（長さあたりの重量） */
  long_weight: number

  /** 一本単価 */
  single_price: number

  /** 安全在庫数量 */
  safety_stock: number

  /** リードタイム（日数） */
  lead_time: number

  /** 保管場所CD（例: 材料倉庫 / 製品倉庫 etc.） */
  storage_location: string

  /** 状態（1: 有効, 0: 無効） */
  status: number

  /** 備考 */
  note: string
}

//　顧客マスタ
export interface Customer {
  id: number
  customer_cd: string
  customer_name: string
  phone: string
  address: string
  customer_type: 'corporate' | 'individual' | 'agency'
  status: number
  created_at?: string
  updated_at?: string
}

// 運送便マスタ
export interface Carriers {
  id: number
  carrier_cd: string
  carrier_name: string
  contact_person: string
  phone: string
  shipping_time: string
  report_no: string
  note: string
  status: number
  created_at: string
  updated_at: string
}

//　納入先マスタ
export interface DeliveryDestinations {
  id: number
  destination_cd: string
  destination_name: string
  customer_cd: string
  carrier_cd: string
  delivery_lead_time: number
  issue_type: '自動' | '手動'
  phone: string
  address: string
  status: number
  created_at: string
  updated_at: string
}

//　納入先マスタ
export interface Destination {
  cd: string
  name: string
}

// 製品マスタ
export interface Product {
  id?: number
  product_cd: string
  product_name: string
  product_type?: string
  category: string
  status?: string
  delivery_destination_cd?: string
  delivery_destination_name?: string
  material_cd?: string
  material_name?: string
  part_number?: string
  vehicle_model?: string
  route_cd: ''
  unit_price?: number
  safety_days?: number
  // 包装
  box_type?: string
  unit_per_box?: number
  weight?: number
  dimensions?: string

  // 生産
  process_count?: number
  lead_time?: number
  lot_size?: number
  take_count?: number
  is_multistage?: boolean
  priority?: number
  bom_id?: number
  bom_name?: string
  default_route_id?: number
  route_name?: string

  // 加工寸法
  cut_length?: number
  chamfer_length?: number
  developed_length?: number
  scrap_length?: number

  note?: string
  created_at?: string
  updated_at?: string
}

// 納入先祝日
export interface Holiday {
  id: number
  destination_cd: string
  holiday_date: string
  created_at: string
}
// 納入先祝日
export interface Workday {
  id: number
  destination_cd: string
  work_date: string
  reason: string
  created_at: string
}

// ログイン用
export interface UserInfo {
  id: number
  name: string
  username: string
  role: 'admin' | 'manager' | 'user' | 'guest'
  department?: string
}

// 工序用
export interface FetchProcessesParams {
  page: number
  pageSize: number
  keyword?: string
}

// 工序用
export interface ProcessItem {
  id: number
  process_cd: string
  process_name: string
  short_name?: string
  category: string
  is_outsource: boolean
  default_cycle_sec: number
  default_yield: number
  capacity_unit: string
  remark?: string
}
// 工程工序用
export interface FetchRoutesParams {
  page: number
  pageSize: number
  keyword?: string
}
// 工程工序
export interface RouteItem {
  id: number
  route_cd: string
  route_name: string
  description?: string
  is_default?: boolean
}

// 工程工序明细
export interface RouteInfo {
  id: number
  route_cd: string
  route_name: string
  description?: string
  is_default: boolean
}
// 工程工序明细
export interface RouteStepItem {
  id: number
  step_no: number
  process_id: number
  process_name: string
  yield_percent: number
  cycle_sec: number
  remarks?: string
}

// 部品マスタ
export interface ComponentItem {
  id?: number
  component_cd: string
  component_name: string
  specification?: string
  unit?: string
  sourcing_type?: string
  unit_price?: number
  note?: string
}

export interface MaterialFilterParams {
  material_name?: string
  specification?: string
  supplier_cd?: string
}

// 设备
export interface Machine {
  id?: number
  machine_cd: string
  machine_name: string
  machine_type?: string
  location_cd?: string
  status?: string
  available_from?: string
  available_to?: string
  calendar_id?: number
  efficiency?: number
  note?: string
  created_at?: string
  updated_at?: string
}

export interface Efficiency {
  id?: number
  product_cd: string
  process_cd: string
  machine_cd: string
  efficiency: number
  unit?: string
  priority?: number
  remark?: string
}
