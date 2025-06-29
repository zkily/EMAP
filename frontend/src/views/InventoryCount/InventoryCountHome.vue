<template>
  <div class="inventory-count-home">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon">
            <DocumentCopy />
          </el-icon>
          棚卸管理
        </h1>
        <p class="page-description">製品・仕掛品（工程別）・材料・部品の在庫棚卸管理システム</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="large" @click="handleCreate" class="create-btn">
          <el-icon>
            <Plus />
          </el-icon>
          新規棚卸単作成
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="24">
        <el-col :span="6">
          <div class="stat-card draft-card">
            <div class="stat-icon-wrapper">
              <div class="stat-icon draft">
                <el-icon>
                  <Document />
                </el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.draftCount }}</div>
              <div class="stat-label">下書き</div>
            </div>
            <div class="stat-trend">
              <el-icon class="trend-icon">
                <Edit />
              </el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card counting-card">
            <div class="stat-icon-wrapper">
              <div class="stat-icon counting">
                <el-icon>
                  <Loading />
                </el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.countingCount }}</div>
              <div class="stat-label">棚卸中</div>
            </div>
            <div class="stat-trend">
              <el-icon class="trend-icon">
                <Timer />
              </el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card completed-card">
            <div class="stat-icon-wrapper">
              <div class="stat-icon completed">
                <el-icon><Select /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.completedCount }}</div>
              <div class="stat-label">完了</div>
            </div>
            <div class="stat-trend">
              <el-icon class="trend-icon">
                <Check />
              </el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card difference-card">
            <div class="stat-icon-wrapper">
              <div class="stat-icon difference">
                <el-icon>
                  <Warning />
                </el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.differenceCount }}</div>
              <div class="stat-label">差異項目</div>
            </div>
            <div class="stat-trend">
              <el-icon class="trend-icon">
                <WarningFilled />
              </el-icon>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索条件 -->
    <div class="search-form">
      <div class="search-header">
        <h3 class="search-title">
          <el-icon>
            <Search />
          </el-icon>
          検索条件
        </h3>
      </div>
      <el-form :model="searchForm" :inline="true" label-width="100px" class="search-form-content">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="棚卸種類">
              <el-select v-model="searchForm.countType" placeholder="種類を選択" clearable style="width: 100%">
                <el-option v-for="item in INVENTORY_COUNT_TYPE_OPTIONS" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="ステータス">
              <el-select v-model="searchForm.status" placeholder="ステータスを選択" clearable style="width: 100%">
                <el-option v-for="item in INVENTORY_COUNT_STATUS_OPTIONS" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="棚卸単番号">
              <el-input v-model="searchForm.countNo" placeholder="棚卸単番号を入力" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="棚卸担当者">
              <el-input v-model="searchForm.countPerson" placeholder="担当者名を入力" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="棚卸日付">
              <el-date-picker v-model="dateRange" type="daterange" range-separator="〜" start-placeholder="開始日"
                end-placeholder="終了日" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item class="search-buttons">
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
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">
          <el-icon>
            <List />
          </el-icon>
          棚卸単一覧
        </h3>
        <div class="table-actions">
          <el-button v-if="selectedRows.length > 0" type="danger" @click="handleBatchDelete" class="batch-delete-btn">
            <el-icon>
              <Delete />
            </el-icon>
            一括削除 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%" class="data-table"
        @selection-change="handleSelectionChange" :header-cell-style="{ background: '#f8f9fa', color: '#606266' }">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="countNo" label="棚卸単番号" width="160" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)" class="count-no-link">{{ row.countNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="countType" label="種類" width="120">
          <template #default="{ row }">
            <el-tag :type="getCountTypeTagType(row.countType)" class="type-tag">
              {{ getCountTypeLabel(row.countType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="countDate" label="棚卸日付" width="120" />
        <el-table-column prop="status" label="ステータス" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" class="status-tag">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="countPerson" label="棚卸担当者" width="120" />
        <el-table-column prop="checkPerson" label="確認者" width="100" />
        <el-table-column prop="departmentName" label="部門" width="120" />
        <el-table-column prop="processName" label="工程" width="120" />
        <el-table-column prop="detailCount" label="明細数" width="100" align="center">
          <template #default="{ row }">
            <el-badge :value="row.detailCount" class="detail-count-badge">
              <el-icon>
                <List />
              </el-icon>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="作成日時" width="160" />
        <el-table-column prop="remark" label="備考" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="handleView(row)" class="view-btn">
                <el-icon>
                  <View />
                </el-icon>
                詳細
              </el-button>
              <el-button v-if="row.status === 'draft'" size="small" type="primary" @click="handleEdit(row)"
                class="edit-btn">
                <el-icon>
                  <Edit />
                </el-icon>
                編集
              </el-button>
              <el-button v-if="row.status === 'draft'" size="small" type="success" @click="handleStart(row)"
                class="start-btn">
                開始
              </el-button>
              <el-button v-if="row.status === 'counting'" size="small" type="warning" @click="handleComplete(row)"
                class="complete-btn">
                完了
              </el-button>
              <el-dropdown v-if="row.status !== 'cancelled'" @command="(command) => handleCommand(command, row)"
                class="more-dropdown">
                <el-button size="small" class="more-btn">
                  その他<el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">
                      <el-icon>
                        <CopyDocument />
                      </el-icon>
                      複製
                    </el-dropdown-item>
                    <el-dropdown-item command="export">
                      <el-icon>
                        <Download />
                      </el-icon>
                      エクスポート
                    </el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'completed'" command="adjustment">
                      <el-icon>
                        <Setting />
                      </el-icon>
                      調整単生成
                    </el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'draft'" command="delete" divided>
                      <el-icon>
                        <Delete />
                      </el-icon>
                      削除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
        :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange" @current-change="handleCurrentChange" class="custom-pagination" />
    </div>

    <!-- 创建/编辑对话框 -->
    <InventoryCountDialog v-model:visible="dialogVisible" :data="currentRow" :mode="dialogMode"
      @success="handleDialogSuccess" />

    <!-- 详情对话框 -->
    <InventoryCountDetailDialog v-model:visible="detailDialogVisible" :count-id="currentRow?.id" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentCopy,
  Plus,
  Search,
  Refresh,
  View,
  Edit,
  Delete,
  ArrowDown,
  Document,
  Loading,
  Select,
  Warning,
  Timer,
  Check,
  WarningFilled,
  List,
  CopyDocument,
  Download,
  Setting,
} from '@element-plus/icons-vue'
import {
  getInventoryCountList,
  deleteInventoryCount,
  batchDeleteInventoryCounts,
  startInventoryCount,
  completeInventoryCount,
  getInventoryCountStatistics,
  exportInventoryCount,
  copyInventoryCount,
} from '@/api/inventoryCount'
import {
  INVENTORY_COUNT_TYPE_OPTIONS,
  INVENTORY_COUNT_STATUS_OPTIONS,
  type InventoryCount,
  type InventoryCountSearchParams,
  InventoryCountType,
  InventoryCountStatus,
} from '@/types/inventoryCount'
import InventoryCountDialog from './components/InventoryCountDialog.vue'
import InventoryCountDetailDialog from './components/InventoryCountDetailDialog.vue'

// 响应式数据
const loading = ref(false)
const tableData = ref<InventoryCount[]>([])
const selectedRows = ref<InventoryCount[]>([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentRow = ref<InventoryCount | null>(null)
const dateRange = ref<[string, string]>(['', ''])

// 搜索表单
const searchForm = reactive<InventoryCountSearchParams>({
  countType: undefined,
  status: undefined,
  countNo: '',
  countPerson: '',
  startDate: '',
  endDate: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 统计数据
const statistics = ref({
  draftCount: 0,
  countingCount: 0,
  completedCount: 0,
  differenceCount: 0,
})

// 计算属性
const searchParams = computed(() => ({
  ...searchForm,
  startDate: dateRange.value?.[0] || '',
  endDate: dateRange.value?.[1] || '',
  page: pagination.page,
  pageSize: pagination.pageSize,
}))

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal) {
    searchForm.startDate = newVal[0]
    searchForm.endDate = newVal[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
})

// 方法
const loadData = async () => {
  try {
    loading.value = true
    const response = await getInventoryCountList(searchParams.value)
    tableData.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    console.error('データ読み込み失敗:', error)
    ElMessage.error('データ読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await getInventoryCountStatistics({
      startDate: searchForm.startDate,
      endDate: searchForm.endDate,
    })

    statistics.value = {
      draftCount: response.data.statusStats.find((s: any) => s.status === InventoryCountStatus.DRAFT)?.count || 0,
      countingCount: response.data.statusStats.find((s: any) => s.status === InventoryCountStatus.COUNTING)?.count || 0,
      completedCount: response.data.statusStats.find((s: any) => s.status === InventoryCountStatus.COMPLETED)?.count || 0,
      differenceCount: response.data.differenceStats.differenceCount,
    }
  } catch (error) {
    console.error('統計データ読み込み失敗:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
  loadStatistics()
}

const handleReset = () => {
  Object.assign(searchForm, {
    countType: undefined,
    status: undefined,
    countNo: '',
    countPerson: '',
    startDate: '',
    endDate: '',
  })
  dateRange.value = ['', '']
  handleSearch()
}

const handleCreate = () => {
  currentRow.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

const handleEdit = (row: InventoryCount) => {
  currentRow.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

const handleView = (row: InventoryCount) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

const handleStart = async (row: InventoryCount) => {
  try {
    await ElMessageBox.confirm('棚卸を開始しますか？開始後は棚卸単の基本情報を変更できません。', '操作確認', {
      type: 'warning',
    })

    await startInventoryCount(row.id, 'current_user') // 替换为实际用户
    ElMessage.success('棚卸開始が完了しました')
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('棚卸開始失敗:', error)
      ElMessage.error('棚卸開始に失敗しました')
    }
  }
}

const handleComplete = async (row: InventoryCount) => {
  try {
    const { value } = await ElMessageBox.prompt('確認者名を入力してください', '棚卸完了', {
      confirmButtonText: '確定',
      cancelButtonText: 'キャンセル',
      inputPattern: /\S+/,
      inputErrorMessage: '確認者名は必須です',
    })

    await completeInventoryCount(row.id, {
      checkPerson: value,
      updatedBy: 'current_user', // 替换为实际用户
    })
    ElMessage.success('棚卸完了が完了しました')
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('棚卸完了失敗:', error)
      ElMessage.error('棚卸完了に失敗しました')
    }
  }
}

const handleDelete = async (row: InventoryCount) => {
  try {
    await ElMessageBox.confirm('この棚卸単を削除しますか？', '削除確認', {
      type: 'warning',
    })

    await deleteInventoryCount(row.id)
    ElMessage.success('削除が完了しました')
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('削除失敗:', error)
      ElMessage.error('削除に失敗しました')
    }
  }
}

const handleCommand = (command: string, row: InventoryCount) => {
  switch (command) {
    case 'copy':
      handleCopy(row)
      break
    case 'export':
      handleExport(row)
      break
    case 'adjustment':
      handleCreateAdjustment(row)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const handleCopy = async (row: InventoryCount) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { value } = await ElMessageBox.prompt('新しい棚卸日付を入力してください', '棚卸単複製', {
      confirmButtonText: '確定',
      cancelButtonText: 'キャンセル',
      inputValue: today,
    })

    await copyInventoryCount(row.id, {
      countDate: value,
      countPerson: row.countPerson,
      createdBy: 'current_user', // 替换为实际用户
    })
    ElMessage.success('複製が完了しました')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('複製失敗:', error)
      ElMessage.error('複製に失敗しました')
    }
  }
}

const handleExport = async (row: InventoryCount) => {
  try {
    const blob = await exportInventoryCount(row.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `棚卸単_${row.countNo}.xlsx`
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

const handleCreateAdjustment = (row: InventoryCount) => {
  // 跳转到调整单创建页面或打开对话框
  ElMessage.info('調整単機能は開発中です...')
}

const handleSelectionChange = (selection: InventoryCount[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`選択した ${selectedRows.value.length} 件の棚卸単を削除しますか？`, '一括削除', {
      type: 'warning',
    })

    const ids = selectedRows.value.map(row => row.id)
    await batchDeleteInventoryCounts(ids)
    ElMessage.success('一括削除が完了しました')
    selectedRows.value = []
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('一括削除失敗:', error)
      ElMessage.error('一括削除に失敗しました')
    }
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handleDialogSuccess = () => {
  loadData()
  loadStatistics()
}

// 工具方法
const getCountTypeLabel = (type: string) => {
  return INVENTORY_COUNT_TYPE_OPTIONS.find(item => item.value === type)?.label || type
}

const getCountTypeTagType = (type: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    product: 'success',
    wip: 'warning',
    material: 'info',
    component: 'primary',
  }
  return typeMap[type] || 'primary'
}

const getStatusLabel = (status: string) => {
  return INVENTORY_COUNT_STATUS_OPTIONS.find(item => item.value === status)?.label || status
}

const getStatusTagType = (status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const statusMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    draft: 'info',
    counting: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return statusMap[status] || 'primary'
}

// 生命周期
onMounted(() => {
  loadData()
  loadStatistics()
})
</script>

<style scoped lang="scss">
.inventory-count-home {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  color: white;

  .header-content {
    .page-title {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;

      .title-icon {
        font-size: 36px;
      }
    }

    .page-description {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
      font-weight: 300;
    }
  }

  .create-btn {
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }
}

.statistics-cards {
  margin-bottom: 24px;

  .stat-card {
    position: relative;
    display: flex;
    align-items: center;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--card-color-1), var(--card-color-2));
    }

    &.draft-card {
      --card-color-1: #909399;
      --card-color-2: #c0c4cc;
    }

    &.counting-card {
      --card-color-1: #e6a23c;
      --card-color-2: #f7ba2a;
    }

    &.completed-card {
      --card-color-1: #67c23a;
      --card-color-2: #85ce61;
    }

    &.difference-card {
      --card-color-1: #f56c6c;
      --card-color-2: #f78989;
    }

    .stat-icon-wrapper {
      margin-right: 20px;
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: white;
      background: linear-gradient(135deg, var(--card-color-1), var(--card-color-2));
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 16px;
        color: #909399;
        font-weight: 500;
      }
    }

    .stat-trend {
      .trend-icon {
        font-size: 24px;
        color: #c0c4cc;
        opacity: 0.6;
      }
    }
  }
}

.search-form {
  margin-bottom: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .search-header {
    padding: 20px 24px 0;
    border-bottom: 1px solid #f0f0f0;

    .search-title {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .search-form-content {
    padding: 24px;

    .search-buttons {
      text-align: right;

      .search-btn {
        background: linear-gradient(135deg, #409eff, #36a3f7);
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        margin-right: 12px;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
        }
      }

      .reset-btn {
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
      }
    }
  }
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;

    .table-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .batch-delete-btn {
      background: linear-gradient(135deg, #f56c6c, #f78989);
      border: none;
      color: white;
      font-weight: 600;
      border-radius: 8px;
      padding: 10px 20px;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(245, 108, 108, 0.3);
      }
    }
  }

  .data-table {
    .count-no-link {
      font-weight: 600;
      font-size: 14px;
    }

    .type-tag,
    .status-tag {
      font-weight: 500;
      border-radius: 6px;
      padding: 4px 8px;
    }

    .detail-count-badge {
      :deep(.el-badge__content) {
        background: #409eff;
        border-radius: 10px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .el-button {
        border-radius: 6px;
        font-weight: 500;
        padding: 8px 12px;

        &.view-btn {
          background: #f0f9ff;
          color: #0369a1;
          border-color: #bae6fd;
        }

        &.edit-btn {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        &.start-btn {
          background: #f0fdf4;
          color: #15803d;
          border-color: #bbf7d0;
        }

        &.complete-btn {
          background: #fffbeb;
          color: #d97706;
          border-color: #fed7aa;
        }

        &.more-btn {
          background: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
        }
      }
    }
  }
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;

  .custom-pagination {
    :deep(.el-pagination__sizes) {
      .el-select {
        .el-input__inner {
          border-radius: 6px;
        }
      }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
      border-radius: 6px;
    }

    :deep(.el-pager li) {
      border-radius: 6px;
      margin: 0 2px;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .statistics-cards {
    .el-col {
      margin-bottom: 16px;
    }
  }
}

@media (max-width: 768px) {
  .inventory-count-home {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .search-form-content {
    .el-row {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
