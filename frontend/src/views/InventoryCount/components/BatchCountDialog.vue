<template>
  <el-dialog v-model="dialogVisible" title="一括棚卸" width="80%" :close-on-click-modal="false" class="batch-count-dialog"
    :before-close="handleBeforeClose">
    <div class="dialog-content">
      <!-- 选中项目信息 -->
      <div class="selected-info">
        <div class="info-header">
          <h3 class="info-title">
            <el-icon>
              <Select />
            </el-icon>
            選択項目情報
          </h3>
        </div>
        <el-alert :title="`${selectedItems.length} 件の棚卸項目が選択されています`" type="info" :closable="false" show-icon
          class="selection-alert">
          <template #default>
            <div class="selection-summary">
              <div class="summary-item">
                <span class="label">総項目数:</span>
                <span class="value">{{ selectedItems.length }} 件</span>
              </div>
              <div class="summary-item">
                <span class="label">総帳簿数量:</span>
                <span class="value">{{ formatNumber(totalBookQuantity) }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 批量操作表单 -->
      <div class="batch-form">
        <div class="form-header">
          <h3 class="form-title">
            <el-icon>
              <Setting />
            </el-icon>
            一括設定
          </h3>
          <div class="form-subtitle">選択した項目に対する棚卸方法を設定してください</div>
        </div>
        <el-form :model="batchForm" label-width="140px" class="batch-form-content">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="設定方法" class="method-selection">
                <el-radio-group v-model="batchType" class="method-radio-group">
                  <el-radio-button label="quantity" class="method-radio">
                    <div class="radio-content">
                      <el-icon>
                        <Operation />
                      </el-icon>
                      <span>統一実棚数量</span>
                    </div>
                  </el-radio-button>
                  <el-radio-button label="individual" class="method-radio">
                    <div class="radio-content">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      <span>個別設定</span>
                    </div>
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="batchType === 'quantity'">
              <el-form-item label="実棚数量" class="quantity-input">
                <el-input-number v-model="batchForm.actualQuantity" :precision="4" :min="0" style="width: 100%"
                  size="large" class="quantity-number-input" @change="handleQuantityChange" />
                <div v-if="batchType === 'quantity'" class="quantity-preview">
                  <span class="preview-label">差異合計:</span>
                  <span :class="getDifferenceClass(totalDifference)" class="preview-value">
                    {{ formatNumber(totalDifference) }}
                  </span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="備考" class="remark-input">
                <el-input v-model="batchForm.remark" type="textarea" :rows="3" placeholder="棚卸に関する備考を入力してください（任意）"
                  maxlength="500" show-word-limit class="remark-textarea" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 明细列表 -->
      <div class="detail-list">
        <div class="list-header">
          <h3 class="list-title">
            <el-icon>
              <List />
            </el-icon>
            棚卸明細一覧
          </h3>
          <div class="list-actions">
            <el-button size="small" @click="previewDifferences" class="preview-btn">
              <el-icon>
                <View />
              </el-icon>
              差異プレビュー
            </el-button>
          </div>
        </div>
        <el-table :data="selectedItems" border stripe style="width: 100%" class="detail-table"
          :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: '600' }" max-height="400">
          <el-table-column type="index" label="No." width="60" align="center" />
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
          <el-table-column label="実棚数量" width="160" align="right">
            <template #default="{ row, $index }">
              <div class="actual-quantity-cell">
                <el-input-number v-if="batchType === 'individual'" v-model="row.actualQuantity" :precision="4" :min="0"
                  size="small" style="width: 100%" class="individual-input" @change="handleIndividualChange" />
                <div v-else class="unified-quantity">
                  <el-text type="success" class="unified-value">
                    {{ formatNumber(batchForm.actualQuantity) }}
                  </el-text>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="差異数量" width="120" align="right">
            <template #default="{ row }">
              <div class="difference-cell">
                <el-text :type="getDifferenceTextType(getDifferenceQuantity(row))" class="difference-value">
                  {{ formatNumber(getDifferenceQuantity(row)) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="差異率" width="100" align="right">
            <template #default="{ row }">
              <div class="difference-rate-cell">
                <el-text :type="getDifferenceTextType(getDifferenceQuantity(row))" class="difference-rate">
                  {{ getDifferenceRate(row) }}%
                </el-text>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 汇总信息 -->
      <div class="summary-info">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="summary-card total">
              <div class="summary-icon">
                <el-icon>
                  <DataBoard />
                </el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-value">{{ selectedItems.length }}</div>
                <div class="summary-label">総項目数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="summary-card positive">
              <div class="summary-icon">
                <el-icon>
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-value">{{ positiveCount }}</div>
                <div class="summary-label">増加項目</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="summary-card negative">
              <div class="summary-icon">
                <el-icon>
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-value">{{ negativeCount }}</div>
                <div class="summary-label">減少項目</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <div class="operation-summary">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span>{{ batchType === 'quantity' ? '統一数量で' : '個別数量で' }}一括棚卸を実行します</span>
          </div>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose" size="large" class="cancel-btn">
            <el-icon>
              <Close />
            </el-icon>
            キャンセル
          </el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" size="large" class="submit-btn"
            :disabled="!isFormValid">
            <el-icon>
              <Check />
            </el-icon>
            棚卸実行 ({{ selectedItems.length }})
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Select,
  Setting,
  Operation,
  Edit,
  List,
  View,
  DataBoard,
  TrendCharts,
  InfoFilled,
  Close,
  Check
} from '@element-plus/icons-vue'
import { batchUpdateInventoryDetails } from '@/api/inventoryCount'
import type { InventoryCountDetail } from '@/types/inventoryCount'

interface Props {
  visible: boolean
  selectedItems: InventoryCountDetail[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const submitting = ref(false)
const batchType = ref<'quantity' | 'individual'>('quantity')

// 表单数据
const batchForm = reactive({
  actualQuantity: 0,
  remark: '',
})

// 计算属性
const selectedItems = computed(() => {
  return props.selectedItems.map(item => ({
    ...item,
    actualQuantity: item.actualQuantity || 0,
  }))
})

const totalBookQuantity = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + (item.bookQuantity || 0), 0)
})

const totalDifference = computed(() => {
  if (batchType.value === 'quantity') {
    return selectedItems.value.reduce((sum, item) => {
      return sum + (batchForm.actualQuantity - (item.bookQuantity || 0))
    }, 0)
  } else {
    return selectedItems.value.reduce((sum, item) => {
      return sum + ((item.actualQuantity || 0) - (item.bookQuantity || 0))
    }, 0)
  }
})

const positiveCount = computed(() => {
  return selectedItems.value.filter(item => getDifferenceQuantity(item) > 0).length
})

const negativeCount = computed(() => {
  return selectedItems.value.filter(item => getDifferenceQuantity(item) < 0).length
})

const isFormValid = computed(() => {
  if (batchType.value === 'quantity') {
    return batchForm.actualQuantity >= 0
  } else {
    return selectedItems.value.every(item => (item.actualQuantity || 0) >= 0)
  }
})

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
      resetForm()
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
const resetForm = () => {
  batchForm.actualQuantity = 0
  batchForm.remark = ''
  batchType.value = 'quantity'
}

const getDifferenceQuantity = (row: any) => {
  const actualQty = batchType.value === 'quantity'
    ? batchForm.actualQuantity
    : (row.actualQuantity || 0)
  return actualQty - (row.bookQuantity || 0)
}

const getDifferenceRate = (row: any) => {
  const bookQty = row.bookQuantity || 0
  if (bookQty === 0) return '0.00'
  const diff = getDifferenceQuantity(row)
  return ((diff / bookQty) * 100).toFixed(2)
}

const handleQuantityChange = () => {
  // 统一数量变化时的处理
}

const handleIndividualChange = () => {
  // 个别数量变化时的处理
}

const previewDifferences = () => {
  const hasPositive = positiveCount.value > 0
  const hasNegative = negativeCount.value > 0

  let message = '差異プレビュー:\n'
  message += `• 総項目数: ${selectedItems.value.length} 件\n`
  message += `• 増加項目: ${positiveCount.value} 件\n`
  message += `• 減少項目: ${negativeCount.value} 件\n`
  message += `• 総差異数量: ${formatNumber(totalDifference.value)}`

  ElMessageBox.alert(message, '差異プレビュー', {
    confirmButtonText: '確認',
    type: hasNegative ? 'warning' : hasPositive ? 'info' : 'success'
  })
}

const handleBeforeClose = async (done: () => void) => {
  if (isFormValid.value && (batchForm.actualQuantity > 0 || selectedItems.value.some(item => (item.actualQuantity || 0) > 0))) {
    try {
      await ElMessageBox.confirm(
        '入力した棚卸データがありますが、保存せずに閉じますか？',
        '確認',
        {
          confirmButtonText: '閉じる',
          cancelButtonText: 'キャンセル',
          type: 'warning',
        }
      )
      done()
    } catch {
      // ユーザーがキャンセルした場合は何もしない
    }
  } else {
    done()
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('有効な数量を入力してください')
    return
  }

  try {
    submitting.value = true

    const details = selectedItems.value.map(item => ({
      id: item.id,
      actualQuantity: batchType.value === 'quantity'
        ? batchForm.actualQuantity
        : (item.actualQuantity || 0),
      remark: batchForm.remark,
    }))

    await batchUpdateInventoryDetails(details)
    ElMessage.success('一括棚卸が完了しました')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('一括棚卸失敗:', error)
    ElMessage.error('一括棚卸に失敗しました')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

// 工具方法
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
.batch-count-dialog {
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

  .dialog-content {
    .selected-info {
      margin-bottom: 24px;
      padding: 24px 32px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #e9ecef;

      .info-header {
        margin-bottom: 16px;

        .info-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .selection-alert {
        :deep(.el-alert) {
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        }

        .selection-summary {
          display: flex;
          gap: 24px;
          margin-top: 12px;

          .summary-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              color: #6c757d;
              font-weight: 500;
            }

            .value {
              color: #495057;
              font-weight: 600;
              font-family: 'Monaco', 'Menlo', monospace;
            }
          }
        }
      }
    }

    .batch-form {
      margin-bottom: 24px;
      padding: 32px;
      background: white;
      border-bottom: 1px solid #e9ecef;

      .form-header {
        margin-bottom: 24px;

        .form-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-subtitle {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }
      }

      .batch-form-content {
        .method-selection {
          .method-radio-group {
            width: 100%;

            .method-radio {
              flex: 1;
              margin-right: 12px;

              :deep(.el-radio-button__inner) {
                width: 100%;
                border-radius: 12px;
                border: 2px solid #e9ecef;
                padding: 16px;
                height: auto;

                .radio-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 8px;

                  .el-icon {
                    font-size: 24px;
                  }

                  span {
                    font-weight: 500;
                    font-size: 14px;
                  }
                }
              }

              :deep(.el-radio-button__inner:hover) {
                border-color: #667eea;
                background: #f8f9ff;
              }

              :deep(.el-radio-button.is-active .el-radio-button__inner) {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-color: #667eea;
                color: white;
              }
            }
          }
        }

        .quantity-input {
          .quantity-number-input {
            :deep(.el-input-number) {
              width: 100%;

              .el-input__inner {
                border-radius: 12px;
                border: 2px solid #e9ecef;
                height: 48px;
                font-size: 16px;
                font-weight: 600;
                text-align: center;

                &:focus {
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
              }
            }
          }

          .quantity-preview {
            margin-top: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .preview-label {
              color: #6c757d;
              font-weight: 500;
            }

            .preview-value {
              font-weight: 600;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 16px;
            }
          }
        }

        .remark-input {
          .remark-textarea {
            :deep(.el-textarea__inner) {
              border-radius: 12px;
              border: 2px solid #e9ecef;
              font-size: 14px;

              &:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
              }
            }
          }
        }
      }
    }

    .detail-list {
      margin: 0 32px 24px;

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 16px 0;
        border-bottom: 2px solid #f8f9fa;

        .list-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-btn {
          border-radius: 8px;
          border: 2px solid #e9ecef;
          font-weight: 500;

          &:hover {
            border-color: #667eea;
            color: #667eea;
          }
        }
      }

      .detail-table {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        .item-code {
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .item-name {
          font-weight: 500;
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
        .difference-rate-cell {

          .book-quantity,
          .unified-value,
          .difference-value,
          .difference-rate {
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', monospace;
          }

          .individual-input {
            :deep(.el-input-number) {
              .el-input__inner {
                border-radius: 6px;
                text-align: center;
                font-weight: 600;
              }
            }
          }
        }
      }
    }

    .summary-info {
      margin: 0 32px 24px;

      .summary-card {
        display: flex;
        align-items: center;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        .summary-icon {
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

        .summary-content {
          .summary-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 4px;
          }

          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
        }

        &.total {
          .summary-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .summary-value {
            color: #667eea;
          }
        }

        &.positive {
          .summary-icon {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          }

          .summary-value {
            color: #28a745;
          }
        }

        &.negative {
          .summary-icon {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
          }

          .summary-value {
            color: #dc3545;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-top: 1px solid #e9ecef;

    .footer-info {
      .operation-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
        font-weight: 500;
      }
    }

    .footer-actions {
      display: flex;
      gap: 12px;

      .cancel-btn {
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        border: 2px solid #e9ecef;

        &:hover {
          border-color: #adb5bd;
          background: #f8f9fa;
        }
      }

      .submit-btn {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        border: none;
        border-radius: 12px;
        padding: 12px 32px;
        font-weight: 600;
        font-size: 16px;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        &:disabled {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
        }
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
  .batch-count-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0 auto;
    }

    .dialog-content {

      .selected-info,
      .batch-form,
      .detail-list,
      .summary-info {
        margin-left: 16px;
        margin-right: 16px;
      }

      .selected-info,
      .batch-form {
        padding: 24px 16px;
      }

      .summary-info {
        .el-row {
          .el-col {
            margin-bottom: 12px;
          }
        }
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .footer-actions {
        justify-content: center;
      }
    }
  }
}
</style>
