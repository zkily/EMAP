<template>
  <el-dialog v-model="dialogVisible" :title="`棚卸単詳細 - ${inventoryCount?.countNo}`" width="95%"
    :close-on-click-modal="false" class="detail-dialog">
    <div v-loading="loading" class="detail-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon>
              <InfoFilled />
            </el-icon>
            基本情報
          </h3>
        </div>
        <el-row :gutter="24" class="info-grid">
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">棚卸単番号</div>
              <div class="info-value primary">{{ inventoryCount?.countNo }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">棚卸種別</div>
              <el-tag :type="getCountTypeTagType(inventoryCount?.countType)" class="info-tag">
                {{ getCountTypeLabel(inventoryCount?.countType) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">棚卸日付</div>
              <div class="info-value">{{ inventoryCount?.countDate }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">ステータス</div>
              <el-tag :type="getStatusTagType(inventoryCount?.status)" class="info-tag">
                {{ getStatusLabel(inventoryCount?.status) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="24" class="info-grid">
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">棚卸担当者</div>
              <div class="info-value">{{ inventoryCount?.countPerson }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">確認者</div>
              <div class="info-value">{{ inventoryCount?.checkPerson || '-' }}</div>
            </div>
          </el-col>
          <el-col :span="6" v-if="inventoryCount?.departmentName">
            <div class="info-item">
              <div class="info-label">部門</div>
              <div class="info-value">{{ inventoryCount.departmentName }}</div>
            </div>
          </el-col>
          <el-col :span="6" v-if="inventoryCount?.processName">
            <div class="info-item">
              <div class="info-label">工程</div>
              <div class="info-value">{{ inventoryCount.processName }}</div>
            </div>
          </el-col>
        </el-row>
        <el-row v-if="inventoryCount?.remark" class="info-grid">
          <el-col :span="24">
            <div class="info-item">
              <div class="info-label">備考</div>
              <div class="info-value remark">{{ inventoryCount.remark }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 盘点进度 -->
      <div class="progress-section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon>
              <TrendCharts />
            </el-icon>
            棚卸進捗
          </h3>
        </div>
        <el-row :gutter="20" class="progress-stats">
          <el-col :span="6">
            <div class="progress-card total">
              <div class="progress-icon">
                <el-icon>
                  <DataBoard />
                </el-icon>
              </div>
              <div class="progress-content">
                <div class="progress-value">{{ progress.totalCount }}</div>
                <div class="progress-label">総項目数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="progress-card counted">
              <div class="progress-icon">
                <el-icon>
                  <CircleCheckFilled />
                </el-icon>
              </div>
              <div class="progress-content">
                <div class="progress-value">{{ progress.countedCount }}</div>
                <div class="progress-label">棚卸済</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="progress-card uncounted">
              <div class="progress-icon">
                <el-icon>
                  <Clock />
                </el-icon>
              </div>
              <div class="progress-content">
                <div class="progress-value">{{ progress.uncountedCount }}</div>
                <div class="progress-label">未棚卸</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="progress-card difference">
              <div class="progress-icon">
                <el-icon>
                  <WarningFilled />
                </el-icon>
              </div>
              <div class="progress-content">
                <div class="progress-value">{{ progress.differenceCount }}</div>
                <div class="progress-label">差異あり</div>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="progress-bar-container">
          <div class="progress-info">
            <span class="progress-text">進捗率</span>
            <span class="progress-percentage">{{ progress.progressRate }}%</span>
          </div>
          <el-progress :percentage="progress.progressRate" :stroke-width="24" :text-inside="true" status="success"
            class="custom-progress" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <div class="action-header">
          <h3 class="section-title">
            <el-icon>
              <Operation />
            </el-icon>
            操作メニュー
          </h3>
        </div>
        <div class="action-buttons">
          <el-button v-if="inventoryCount?.status === 'draft'" type="primary" size="large" @click="handleAddItems"
            class="action-btn primary-btn">
            <el-icon>
              <Plus />
            </el-icon>
            棚卸項目追加
          </el-button>
          <el-button v-if="inventoryCount?.status === 'counting'" type="success" size="large" @click="handleBatchCount"
            class="action-btn success-btn" :disabled="selectedItems.length === 0">
            <el-icon>
              <Edit />
            </el-icon>
            一括棚卸 ({{ selectedItems.length }})
          </el-button>
          <el-button @click="handleRefresh" size="large" class="action-btn refresh-btn">
            <el-icon>
              <Refresh />
            </el-icon>
            更新
          </el-button>
          <el-button @click="handleExport" size="large" class="action-btn export-btn">
            <el-icon>
              <Download />
            </el-icon>
            エクスポート
          </el-button>
        </div>
      </div>

      <!-- 盘点明细表格 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon>
              <List />
            </el-icon>
            棚卸明細一覧
          </h3>
          <div class="table-info">
            <el-tag v-if="selectedItems.length > 0" type="info" class="selection-tag">
              {{ selectedItems.length }} 件選択中
            </el-tag>
            <span class="total-count">全 {{ detailList.length }} 件</span>
          </div>
        </div>
        <el-table :data="detailList" border stripe style="width: 100%" @selection-change="handleSelectionChange"
          class="detail-table" :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: '600' }"
          empty-text="棚卸明細がありません">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="itemCode" label="商品コード" width="150" fixed="left">
            <template #default="{ row }">
              <el-text class="item-code" type="primary">{{ row.itemCode }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="itemName" label="商品名" width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <el-text class="item-name">{{ row.itemName }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="仕様・規格" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <el-text class="specification" type="info">{{ row.specification || '-' }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="単位" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" class="unit-tag">{{ row.unit }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bookQuantity" label="帳簿数量" width="120" align="right">
            <template #default="{ row }">
              <div class="quantity-cell">
                <el-text class="book-quantity">{{ formatNumber(row.bookQuantity) }}</el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="actualQuantity" label="実棚数量" width="150" align="right">
            <template #default="{ row }">
              <div class="actual-quantity-cell">
                <el-input-number v-if="inventoryCount?.status === 'counting' && !row.isCounted"
                  v-model="row.actualQuantity" :precision="4" :min="0" size="small" style="width: 100%"
                  @blur="handleQuantityBlur(row)" class="quantity-input" />
                <el-text v-else class="actual-quantity" :type="row.isCounted ? 'success' : 'info'">
                  {{ formatNumber(row.actualQuantity) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="differenceQuantity" label="差異数量" width="120" align="right">
            <template #default="{ row }">
              <div class="difference-cell">
                <el-text :type="getDifferenceTextType(row.differenceQuantity)" class="difference-value">
                  {{ formatNumber(row.differenceQuantity) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="単価" width="100" align="right">
            <template #default="{ row }">
              <div class="price-cell">
                <el-text class="unit-price">¥{{ formatNumber(row.unitPrice, 2) }}</el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="differenceAmount" label="差異金額" width="120" align="right">
            <template #default="{ row }">
              <div class="amount-cell">
                <el-text :type="getDifferenceTextType(row.differenceAmount)" class="difference-amount">
                  ¥{{ formatNumber(row.differenceAmount, 2) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="batchNo" label="ロット番号" width="120">
            <template #default="{ row }">
              <el-text class="batch-no">{{ row.batchNo || '-' }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="locationCode" label="保管場所" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.locationCode || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isCounted" label="棚卸状態" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isCounted ? 'success' : 'warning'" class="status-tag">
                {{ row.isCounted ? '棚卸済' : '未棚卸' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="備考" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <el-text class="remark-text">{{ row.remark || '-' }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons-cell">
                <el-button v-if="inventoryCount?.status === 'counting' && !row.isCounted" size="small" type="success"
                  @click="handleConfirmCount(row)" class="confirm-btn">
                  <el-icon>
                    <Check />
                  </el-icon>
                  確認
                </el-button>
                <el-button v-if="inventoryCount?.status === 'draft'" size="small" type="danger"
                  @click="handleDeleteDetail(row)" class="delete-btn">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  削除
                </el-button>
                <el-button size="small" @click="handleViewHistory(row)" class="history-btn">
                  <el-icon>
                    <Clock />
                  </el-icon>
                  履歴
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 添加项目对话框 -->
    <AddItemsDialog v-model:visible="addItemsDialogVisible" :count-id="countId" :count-type="inventoryCount?.countType"
      @success="loadDetailList" />

    <!-- 批量盘点对话框 -->
    <BatchCountDialog v-model:visible="batchCountDialogVisible" :selected-items="selectedItems"
      @success="loadDetailList" />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large" class="close-btn">
          <el-icon>
            <Close />
          </el-icon>
          閉じる
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Refresh,
  Download,
  InfoFilled,
  TrendCharts,
  DataBoard,
  CircleCheckFilled,
  Clock,
  WarningFilled,
  Operation,
  List,
  Check,
  Delete,
  Close
} from '@element-plus/icons-vue'
import {
  getInventoryCountDetail,
  updateInventoryDetail,
  deleteInventoryDetail,
  getInventoryCountProgress,
  exportInventoryCount,
} from '@/api/inventoryCount'
import {
  INVENTORY_COUNT_TYPE_OPTIONS,
  INVENTORY_COUNT_STATUS_OPTIONS,
  type InventoryCount,
  type InventoryCountDetail,
} from '@/types/inventoryCount'
import AddItemsDialog from './AddItemsDialog.vue'
import BatchCountDialog from './BatchCountDialog.vue'

interface Props {
  visible: boolean
  countId?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const inventoryCount = ref<InventoryCount | null>(null)
const detailList = ref<InventoryCountDetail[]>([])
const selectedItems = ref<InventoryCountDetail[]>([])
const addItemsDialogVisible = ref(false)
const batchCountDialogVisible = ref(false)

// 进度数据
const progress = ref({
  totalCount: 0,
  countedCount: 0,
  uncountedCount: 0,
  differenceCount: 0,
  progressRate: 0,
})

// 计算属性
const countId = computed(() => props.countId)

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal && props.countId) {
      loadData()
    }
  }
)

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 方法
const loadData = async () => {
  if (!props.countId) return

  try {
    loading.value = true
    await Promise.all([
      loadDetailInfo(),
      loadDetailList(),
      loadProgress(),
    ])
  } catch (error) {
    console.error('データ読み込み失敗:', error)
    ElMessage.error('データの読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

const loadDetailInfo = async () => {
  if (!props.countId) return

  const response = await getInventoryCountDetail(props.countId)
  inventoryCount.value = response.data
}

const loadDetailList = async () => {
  if (!inventoryCount.value?.details) return

  detailList.value = inventoryCount.value.details
}

const loadProgress = async () => {
  if (!props.countId) return

  try {
    const response = await getInventoryCountProgress(props.countId)
    progress.value = response.data
  } catch (error) {
    console.error('進捗読み込み失敗:', error)
  }
}

const handleAddItems = () => {
  addItemsDialogVisible.value = true
}

const handleBatchCount = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('棚卸する項目を選択してください')
    return
  }
  batchCountDialogVisible.value = true
}

const handleRefresh = () => {
  loadData()
}

const handleExport = async () => {
  if (!props.countId) return

  try {
    const blob = await exportInventoryCount(props.countId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `棚卸単_${inventoryCount.value?.countNo}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    ElMessage.success('エクスポートが完了しました')
  } catch (error) {
    console.error('エクスポート失敗:', error)
    ElMessage.error('エクスポートに失敗しました')
  }
}

const handleSelectionChange = (selection: InventoryCountDetail[]) => {
  selectedItems.value = selection
}

const handleQuantityBlur = async (row: InventoryCountDetail) => {
  if (row.actualQuantity === undefined || row.actualQuantity === null) return

  try {
    await updateInventoryDetail(row.id, {
      actualQuantity: row.actualQuantity,
      isCounted: false, // 数量入力済みだが未確認
    })

    // 差異を再計算
    row.differenceQuantity = row.actualQuantity - row.bookQuantity
    row.differenceAmount = row.differenceQuantity * (row.unitPrice || 0)
  } catch (error) {
    console.error('更新失敗:', error)
    ElMessage.error('更新に失敗しました')
  }
}

const handleConfirmCount = async (row: InventoryCountDetail) => {
  if (row.actualQuantity === undefined || row.actualQuantity === null) {
    ElMessage.warning('実棚数量を入力してください')
    return
  }

  try {
    await updateInventoryDetail(row.id, {
      actualQuantity: row.actualQuantity,
      isCounted: true,
    })

    row.isCounted = true
    ElMessage.success('棚卸確認が完了しました')
    loadProgress()
  } catch (error) {
    console.error('棚卸確認失敗:', error)
    ElMessage.error('棚卸確認に失敗しました')
  }
}

const handleDeleteDetail = async (row: InventoryCountDetail) => {
  try {
    await ElMessageBox.confirm('この棚卸明細を削除しますか？', '削除確認', {
      type: 'warning',
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル',
    })

    await deleteInventoryDetail(row.id)
    ElMessage.success('削除が完了しました')
    loadDetailList()
    loadProgress()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('削除失敗:', error)
      ElMessage.error('削除に失敗しました')
    }
  }
}

const handleViewHistory = (row: InventoryCountDetail) => {
  // 棚卸履歴を表示
  ElMessage.info('棚卸履歴機能は開発中です...')
}

const handleClose = () => {
  dialogVisible.value = false
}

// 工具方法
const getCountTypeLabel = (type?: string) => {
  const typeMap: Record<string, string> = {
    product: '製品',
    wip: '仕掛品',
    material: '材料',
    component: '部品',
  }
  return typeMap[type || ''] || type
}

const getCountTypeTagType = (type?: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    product: 'success',
    wip: 'warning',
    material: 'info',
    component: 'primary',
  }
  return typeMap[type || ''] || 'primary'
}

const getStatusLabel = (status?: string) => {
  const statusMap: Record<string, string> = {
    draft: '下書き',
    counting: '棚卸中',
    completed: '完了',
    cancelled: '取消',
  }
  return statusMap[status || ''] || status
}

const getStatusTagType = (status?: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const statusMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    draft: 'info',
    counting: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return statusMap[status || ''] || 'primary'
}

const formatNumber = (value?: number, precision = 4) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(precision)
}

const getDifferenceClass = (value?: number) => {
  if (!value || value === 0) return ''
  return value > 0 ? 'text-success' : 'text-danger'
}

const getDifferenceTextType = (value?: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (!value || value === 0) return 'info'
  return value > 0 ? 'success' : 'danger'
}
</script>

<style scoped lang="scss">
.detail-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px 32px;
    margin: 0;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    margin: 0;
  }

  .detail-content {
    max-height: 80vh;
    overflow-y: auto;

    .info-section,
    .progress-section,
    .action-section,
    .detail-section {
      margin-bottom: 24px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .section-header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .section-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #495057;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .table-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .selection-tag {
          font-weight: 500;
        }

        .total-count {
          color: #6c757d;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    .info-section {
      .info-grid {
        padding: 0 24px;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
          padding-bottom: 24px;
        }
      }

      .info-item {
        padding: 16px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .info-value {
          font-size: 16px;
          color: #495057;
          font-weight: 600;

          &.primary {
            color: #667eea;
            font-family: 'Monaco', 'Menlo', monospace;
          }

          &.remark {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            font-weight: 400;
            line-height: 1.5;
          }
        }

        .info-tag {
          font-weight: 500;
          border-radius: 8px;
        }
      }
    }

    .progress-section {
      .progress-stats {
        padding: 24px;

        .progress-card {
          display: flex;
          align-items: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 2px solid #f8f9fa;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .progress-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 24px;
            color: white;
          }

          .progress-content {
            .progress-value {
              font-size: 24px;
              font-weight: 700;
              line-height: 1;
              margin-bottom: 4px;
            }

            .progress-label {
              font-size: 14px;
              color: #6c757d;
              font-weight: 500;
            }
          }

          &.total {
            .progress-icon {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .progress-value {
              color: #667eea;
            }
          }

          &.counted {
            .progress-icon {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            }

            .progress-value {
              color: #28a745;
            }
          }

          &.uncounted {
            .progress-icon {
              background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
            }

            .progress-value {
              color: #ffc107;
            }
          }

          &.difference {
            .progress-icon {
              background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
            }

            .progress-value {
              color: #dc3545;
            }
          }
        }
      }

      .progress-bar-container {
        padding: 0 24px 24px;

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .progress-text {
            font-weight: 500;
            color: #495057;
          }

          .progress-percentage {
            font-weight: 600;
            color: #667eea;
            font-size: 18px;
          }
        }

        .custom-progress {
          :deep(.el-progress-bar__outer) {
            border-radius: 12px;
            background: #f8f9fa;
          }

          :deep(.el-progress-bar__inner) {
            border-radius: 12px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          }
        }
      }
    }

    .action-section {
      .action-buttons {
        padding: 24px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        justify-content: center;

        .action-btn {
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;

          &:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          &.primary-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;

            &:hover {
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
          }

          &.success-btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;

            &:hover:not(:disabled) {
              box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }

            &:disabled {
              background: #e9ecef;
              color: #6c757d;
            }
          }

          &.refresh-btn,
          &.export-btn {
            border: 2px solid #e9ecef;
            background: white;
            color: #495057;

            &:hover {
              border-color: #667eea;
              color: #667eea;
              background: #f8f9ff;
            }
          }
        }
      }
    }

    .detail-section {
      .detail-table {
        margin: 0;
        border-radius: 0;

        .item-code {
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .item-name {
          font-weight: 500;
        }

        .specification {
          font-size: 13px;
        }

        .unit-tag {
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
          font-weight: 500;
        }

        .quantity-cell,
        .actual-quantity-cell,
        .difference-cell,
        .price-cell,
        .amount-cell {

          .book-quantity,
          .actual-quantity,
          .difference-value,
          .unit-price,
          .difference-amount {
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', monospace;
          }

          .quantity-input {
            :deep(.el-input-number) {
              .el-input__inner {
                border-radius: 6px;
                text-align: center;
                font-weight: 600;
              }
            }
          }
        }

        .batch-no {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
        }

        .status-tag {
          font-weight: 500;
          border-radius: 8px;
        }

        .remark-text {
          font-size: 13px;
          color: #6c757d;
        }

        .action-buttons-cell {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;

          .confirm-btn,
          .delete-btn,
          .history-btn {
            border-radius: 6px;
            font-size: 12px;
            padding: 4px 8px;
            min-width: auto;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-top: 1px solid #e9ecef;

    .close-btn {
      border-radius: 12px;
      padding: 12px 32px;
      font-weight: 600;
      font-size: 16px;
      border: 2px solid #e9ecef;

      &:hover {
        border-color: #adb5bd;
        background: #f8f9fa;
      }
    }
  }

  .text-success {
    color: #67c23a;
  }

  .text-danger {
    color: #f56c6c;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .detail-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      margin: 0 auto;
    }

    .detail-content {
      .info-grid {
        .el-col {
          margin-bottom: 12px;
        }
      }

      .progress-stats {
        .el-col {
          margin-bottom: 12px;
        }
      }

      .action-buttons {
        flex-direction: column;
        align-items: stretch;

        .action-btn {
          width: 100%;
        }
      }
    }
  }
}
</style>
