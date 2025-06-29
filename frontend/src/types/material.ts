// 材料基本信息
export interface Material {
  id: number
  materialCode: string // 材料编码
  materialName: string // 材料名称
  specification: string // 规格型号
  category: MaterialCategory // 材料类别
  unit: string // 计量单位
  stockQuantity: number // 库存数量
  safetyStock: number // 安全库存
  lastPrice: number // 最新单价
  averagePrice?: number // 平均单价
  supplierId: number // 主供应商ID
  supplierName: string // 主供应商名称
  leadTime: number // 采购提前期（天）
  minOrderQty?: number // 最小订购量
  maxStockQty?: number // 最大库存量
  status: number // 状态：0-停用，1-启用
  remark?: string // 备注
  createTime: string // 创建时间
  updateTime?: string // 更新时间
  createBy?: string // 创建人
  updateBy?: string // 更新人
}

// 材料类别枚举
export enum MaterialCategory {
  RAW = 'raw', // 原材料
  SEMI = 'semi', // 半成品
  FINISHED = 'finished', // 成品
  AUXILIARY = 'auxiliary', // 辅助材料
}

// 材料搜索参数
export interface MaterialSearchParams {
  materialCode?: string
  materialName?: string
  category?: string
  supplierId?: number | null
  status?: number
  minStock?: number
  maxStock?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// 库存变动记录
export interface StockHistory {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  date: string // 变动日期
  type: StockChangeType // 变动类型
  quantity: number // 变动数量（正数入库，负数出库）
  balance: number // 变动后余额
  referenceNo?: string // 关联单号
  operator: string // 操作人
  remark?: string // 备注
}

// 库存变动类型
export enum StockChangeType {
  PURCHASE_IN = '采购入库',
  PRODUCTION_IN = '生产入库',
  RETURN_IN = '退货入库',
  OTHER_IN = '其他入库',
  PRODUCTION_OUT = '生产领用',
  SALES_OUT = '销售出库',
  SCRAP_OUT = '报废出库',
  OTHER_OUT = '其他出库',
  INVENTORY_PROFIT = '盘盈',
  INVENTORY_LOSS = '盘亏',
  INITIAL = '期初库存',
}

// 材料库存预警信息
export interface MaterialStockAlert {
  materialId: number
  materialCode: string
  materialName: string
  specification: string
  unit: string
  currentStock: number
  safetyStock: number
  shortageQty: number // 缺货数量
  suggestOrderQty: number // 建议订购数量
  supplierName: string
  leadTime: number
}

// 材料价格历史
export interface MaterialPriceHistory {
  id: number
  materialId: number
  price: number
  effectiveDate: string // 生效日期
  supplierId: number
  supplierName: string
  createTime: string
  createBy: string
}

// 材料供应商关系
export interface MaterialSupplier {
  id: number
  materialId: number
  supplierId: number
  supplierName: string
  supplierCode: string
  price: number
  moq: number // 最小起订量
  leadTime: number // 供货周期
  isDefault: boolean // 是否默认供应商
  status: number
  lastPurchaseDate?: string
  remark?: string
}
