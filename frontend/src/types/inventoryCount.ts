// 盘点类型枚举
export enum InventoryCountType {
  PRODUCT = 'product', // 製品
  WIP = 'wip', // 仕掛品
  MATERIAL = 'material', // 材料
  COMPONENT = 'component', // 部品
}

// 盘点状态枚举
export enum InventoryCountStatus {
  DRAFT = 'draft', // 草稿
  COUNTING = 'counting', // 盘点中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

// 调整类型枚举
export enum AdjustmentType {
  PROFIT = 'profit', // 盘盈
  LOSS = 'loss', // 盘亏
}

// 调整状态枚举
export enum AdjustmentStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已审核
  REJECTED = 'rejected', // 已拒绝
}

// 盘点单主表接口
export interface InventoryCount {
  id: number
  countNo: string // 盘点单号
  countDate: string // 盘点日期
  countType: InventoryCountType // 盘点类型
  departmentId?: number // 部门ID
  departmentName?: string // 部门名称
  processId?: number // 工程ID
  processName?: string // 工程名称
  locationId?: number // 库位ID
  locationName?: string // 库位名称
  status: InventoryCountStatus // 状态
  countPerson: string // 盘点人
  checkPerson?: string // 复核人
  remark?: string // 备注
  createdBy: string // 创建人
  updatedBy?: string // 更新人
  createdAt: string // 创建时间
  updatedAt?: string // 更新时间
  details?: InventoryCountDetail[] // 盘点明细
  adjustments?: InventoryAdjustment[] // 调整记录
  detailCount?: number // 明细数量
}

// 盘点明细接口
export interface InventoryCountDetail {
  id: number
  countId: number // 盘点单ID
  itemId: number // 物品ID
  itemCode: string // 物品编码
  itemName: string // 物品名称
  specification?: string // 规格型号
  unit: string // 计量单位
  bookQuantity: number // 账面数量
  actualQuantity?: number // 实盘数量
  differenceQuantity?: number // 差异数量
  unitPrice?: number // 单价
  differenceAmount?: number // 差异金额
  batchNo?: string // 批次号
  locationCode?: string // 库位编码
  remark?: string // 备注
  isCounted: boolean // 是否已盘点
  createdAt: string // 创建时间
  updatedAt?: string // 更新时间
}

// 盘点差异处理记录接口
export interface InventoryAdjustment {
  id: number
  countId: number // 盘点单ID
  adjustmentNo: string // 调整单号
  adjustmentDate: string // 调整日期
  adjustmentType: AdjustmentType // 调整类型
  totalAmount: number // 调整总金额
  status: AdjustmentStatus // 状态
  approvePerson?: string // 审核人
  approveDate?: string // 审核日期
  remark?: string // 备注
  createdBy: string // 创建人
  createdAt: string // 创建时间
}

// 盘点单搜索参数
export interface InventoryCountSearchParams {
  page?: number
  pageSize?: number
  countType?: InventoryCountType
  status?: InventoryCountStatus
  countNo?: string
  countPerson?: string
  startDate?: string
  endDate?: string
  departmentId?: number
  processId?: number
}

// 可盘点物品接口
export interface InventoryItem {
  id: number
  code: string // 编码
  name: string // 名称
  specification?: string // 规格型号
  unit: string // 计量单位
  stockQuantity: number // 库存数量
  standardCost?: number // 标准成本
  processName?: string // 工程名称（仕掛品专用）
  departmentName?: string // 部门名称（仕掛品专用）
  lotNo?: string // 批次号（仕掛品专用）
}

// 盘点物品搜索参数
export interface InventoryItemSearchParams {
  keyword?: string
  page?: number
  pageSize?: number
}

// 创建盘点单参数
export interface CreateInventoryCountParams {
  countType: InventoryCountType
  countDate: string
  departmentId?: number
  departmentName?: string
  processId?: number
  processName?: string
  locationId?: number
  locationName?: string
  countPerson: string
  remark?: string
  createdBy: string
}

// 更新盘点单参数
export interface UpdateInventoryCountParams {
  countDate?: string
  departmentId?: number
  departmentName?: string
  processId?: number
  processName?: string
  locationId?: number
  locationName?: string
  countPerson?: string
  checkPerson?: string
  remark?: string
  updatedBy: string
}

// 添加盘点明细参数
export interface AddInventoryDetailParams {
  items: {
    itemId: number
    itemCode: string
    itemName: string
    specification?: string
    unit: string
    bookQuantity: number
    unitPrice?: number
    locationCode?: string
    batchNo?: string
  }[]
}

// 更新盘点明细参数
export interface UpdateInventoryDetailParams {
  actualQuantity: number
  remark?: string
  isCounted?: boolean
}

// 生成调整单参数
export interface CreateAdjustmentParams {
  adjustmentDate: string
  createdBy: string
  remark?: string
}

// 盘点统计数据
export interface InventoryCountStatistics {
  statusStats: {
    status: InventoryCountStatus
    count: number
  }[]
  typeStats: {
    countType: InventoryCountType
    count: number
  }[]
  differenceStats: {
    profitAmount: number // 盘盈金额
    lossAmount: number // 盘亏金额
    differenceCount: number // 差异项目数
  }
}

// 部门接口
export interface Department {
  id: number
  departmentCode: string
  departmentName: string
  status: number
}

// 工程接口
export interface Process {
  id: number
  processCode: string
  processName: string
  departmentId?: number
  departmentName?: string
  sequence?: number
  standardTime?: number
  status: number
}

// 库位接口
export interface Location {
  id: number
  locationCode: string
  locationName: string
  warehouseId?: number
  warehouseName?: string
  status: number
}

// 盘点类型选项
export const INVENTORY_COUNT_TYPE_OPTIONS = [
  { value: InventoryCountType.PRODUCT, label: '製品' },
  { value: InventoryCountType.WIP, label: '仕掛品（工程別）' },
  { value: InventoryCountType.MATERIAL, label: '材料' },
  { value: InventoryCountType.COMPONENT, label: '部品' },
]

// 盘点状态选项
export const INVENTORY_COUNT_STATUS_OPTIONS = [
  { value: InventoryCountStatus.DRAFT, label: '草稿', color: 'gray' },
  { value: InventoryCountStatus.COUNTING, label: '盘点中', color: 'blue' },
  { value: InventoryCountStatus.COMPLETED, label: '已完成', color: 'green' },
  { value: InventoryCountStatus.CANCELLED, label: '已取消', color: 'red' },
]

// 调整状态选项
export const ADJUSTMENT_STATUS_OPTIONS = [
  { value: AdjustmentStatus.PENDING, label: '待审核', color: 'orange' },
  { value: AdjustmentStatus.APPROVED, label: '已审核', color: 'green' },
  { value: AdjustmentStatus.REJECTED, label: '已拒绝', color: 'red' },
]
