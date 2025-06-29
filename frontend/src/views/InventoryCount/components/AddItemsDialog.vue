<template>
  <el-dialog v-model="dialogVisible" title="棚卸項目追加" width="85%" :close-on-click-modal="false" class="add-items-dialog"
    :before-close="handleBeforeClose">
    <div class="dialog-content">
      <!-- 搜索区域 -->
      <div class="search-section">
        <div class="search-header">
          <h3 class="search-title">
            <el-icon>
              <Search />
            </el-icon>
            商品検索
          </h3>
          <div class="search-subtitle">棚卸対象となる商品を検索・選択してください</div>
        </div>
        <el-form :inline="true" class="search-form">
          <el-form-item label="キーワード">
            <el-input v-model="searchKeyword" placeholder="商品コードまたは商品名を入力" style="width: 320px" @input="handleSearch"
              @keyup.enter="handleSearch" clearable class="search-input">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" class="search-btn">
              <el-icon>
                <Search />
              </el-icon>
              検索
            </el-button>
            <el-button @click="handleReset" class="reset-btn">
              <el-icon>
                <Refresh />
              </el-icon>
              リセット
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 选择信息栏 -->
      <div v-if="selectedItems.length > 0" class="selection-info">
        <el-alert :title="`${selectedItems.length} 件の商品が選択されています`" type="info" :closable="false" show-icon>
          <template #default>
            <div class="selection-details">
              <span>選択商品数: <strong>{{ selectedItems.length }}</strong></span>
              <el-button size="small" type="text" @click="clearSelection" class="clear-btn">
                すべてクリア
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 物品列表 -->
      <div class="items-section">
        <div class="table-header">
          <h3 class="table-title">
            <el-icon>
              <List />
            </el-icon>
            商品一覧
          </h3>
          <div class="table-info">
            <el-tag v-if="countType" :type="getCountTypeTagType(countType)" class="type-tag">
              {{ getCountTypeLabel(countType) }}
            </el-tag>
            <span class="total-count">全 {{ pagination.total }} 件</span>
          </div>
        </div>
        <el-table v-loading="loading" :data="itemList" @selection-change="handleSelectionChange" border stripe
          style="width: 100%" class="items-table"
          :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: '600' }" empty-text="検索結果がありません">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="code" label="商品コード" width="150" fixed="left">
            <template #default="{ row }">
              <el-text class="item-code" type="primary">{{ row.code }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名" width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="item-name">
                <el-text>{{ row.name }}</el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="仕様・規格" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-text class="specification" type="info">
                {{ row.specification || '-' }}
              </el-text>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="単位" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" class="unit-tag">{{ row.unit }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="stockQuantity" label="在庫数量" width="120" align="right">
            <template #default="{ row }">
              <div class="quantity-cell">
                <el-text :type="getQuantityType(row.stockQuantity)">
                  {{ formatNumber(row.stockQuantity) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="standardCost" label="標準コスト" width="120" align="right">
            <template #default="{ row }">
              <div class="cost-cell">
                <el-text type="warning">
                  ¥{{ formatNumber(row.standardCost, 2) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="countType === 'wip'" prop="processName" label="工程" width="120">
            <template #default="{ row }">
              <el-tag type="warning" size="small">{{ row.processName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="countType === 'wip'" prop="departmentName" label="部門" width="120">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.departmentName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="countType === 'wip'" prop="lotNo" label="ロット番号" width="120">
            <template #default="{ row }">
              <el-text class="lot-no">{{ row.lotNo || '-' }}</el-text>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :total="pagination.total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" class="custom-pagination" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <div class="selected-info">
            <el-icon>
              <Select />
            </el-icon>
            <span>選択済み: <strong>{{ selectedItems.length }}</strong> 件</span>
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
            :disabled="selectedItems.length === 0">
            <el-icon>
              <Plus />
            </el-icon>
            追加 ({{ selectedItems.length }})
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, List, Select, Close, Plus } from '@element-plus/icons-vue'
import { getInventoryItems, addInventoryDetails } from '@/api/inventoryCount'
import type { InventoryItem } from '@/types/inventoryCount'

interface Props {
  visible: boolean
  countId?: number
  countType?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const itemList = ref<InventoryItem[]>([])
const selectedItems = ref<InventoryItem[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 计算属性
const countType = computed(() => props.countType)

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal && props.countId) {
      loadItems()
    }
  }
)

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
    resetData()
  }
})

// 方法
const loadItems = async () => {
  if (!props.countId) return

  try {
    loading.value = true
    const response = await getInventoryItems(props.countId, {
      keyword: searchKeyword.value,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    itemList.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    console.error('商品リスト読み込み失敗:', error)
    ElMessage.error('商品リストの読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadItems()
}

const handleReset = () => {
  searchKeyword.value = ''
  handleSearch()
}

const handleSelectionChange = (selection: InventoryItem[]) => {
  selectedItems.value = selection
}

const clearSelection = () => {
  selectedItems.value = []
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadItems()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadItems()
}

const handleSubmit = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('追加する商品を選択してください')
    return
  }

  if (!props.countId) return

  try {
    submitting.value = true
    const items = selectedItems.value.map(item => ({
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      specification: item.specification || '',
      unit: item.unit,
      bookQuantity: item.stockQuantity,
      unitPrice: item.standardCost || 0,
    }))

    await addInventoryDetails(props.countId, { items })
    ElMessage.success('商品の追加が完了しました')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('追加失敗:', error)
    ElMessage.error('商品の追加に失敗しました')
  } finally {
    submitting.value = false
  }
}

const handleBeforeClose = async (done: () => void) => {
  if (selectedItems.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        '選択した商品がありますが、保存せずに閉じますか？',
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

const handleClose = () => {
  dialogVisible.value = false
}

const resetData = () => {
  searchKeyword.value = ''
  itemList.value = []
  selectedItems.value = []
  pagination.page = 1
  pagination.total = 0
}

// 工具方法
const formatNumber = (value?: number, precision = 4) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(precision)
}

const getQuantityType = (quantity?: number) => {
  if (!quantity || quantity <= 0) return 'danger'
  if (quantity < 10) return 'warning'
  return 'success'
}

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
</script>

<style scoped lang="scss">
.add-items-dialog {
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
    .search-section {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 0;
      padding: 32px;
      border-bottom: 1px solid #e9ecef;

      .search-header {
        margin-bottom: 24px;

        .search-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-subtitle {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }
      }

      .search-form {
        .search-input {
          :deep(.el-input__inner) {
            border-radius: 12px;
            border: 2px solid #e9ecef;
            padding-left: 40px;
            height: 44px;
            font-size: 14px;

            &:focus {
              border-color: #667eea;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
          }
        }

        .search-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          height: 44px;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
        }

        .reset-btn {
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          height: 44px;
          border: 2px solid #e9ecef;

          &:hover {
            border-color: #adb5bd;
            background: #f8f9fa;
          }
        }
      }
    }

    .selection-info {
      margin: 0 32px 24px;

      :deep(.el-alert) {
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      }

      .selection-details {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .clear-btn {
          color: #1976d2;
          font-weight: 500;

          &:hover {
            color: #0d47a1;
          }
        }
      }
    }

    .items-section {
      margin: 0 32px 24px;

      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 16px 0;
        border-bottom: 2px solid #f8f9fa;

        .table-title {
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

          .type-tag {
            font-weight: 500;
            border-radius: 8px;
          }

          .total-count {
            color: #6c757d;
            font-size: 14px;
            font-weight: 500;
          }
        }
      }

      .items-table {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        :deep(.el-table__header) {
          th {
            border-bottom: 2px solid #e9ecef;
          }
        }

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
        .cost-cell {
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .lot-no {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
        }
      }
    }

    .pagination-section {
      display: flex;
      justify-content: center;
      padding: 24px 32px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;

      .custom-pagination {
        :deep(.el-pagination__sizes) {
          .el-select {
            .el-input__inner {
              border-radius: 8px;
            }
          }
        }

        :deep(.btn-prev),
        :deep(.btn-next) {
          border-radius: 8px;
        }

        :deep(.el-pager li) {
          border-radius: 8px;
          margin: 0 2px;
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
      .selected-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
        font-size: 16px;
        font-weight: 500;

        strong {
          color: #667eea;
          font-size: 18px;
        }
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
}

// 响应式设计
@media (max-width: 768px) {
  .add-items-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0 auto;
    }

    .dialog-content {

      .search-section,
      .items-section,
      .pagination-section {
        margin-left: 16px;
        margin-right: 16px;
      }

      .search-section {
        padding: 24px 16px;
      }

      .items-section {
        .table-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
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
