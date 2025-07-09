<template>
  <el-dialog
    v-model="visible"
    title="未ピッキング検出"
    width="1200px"
    :before-close="handleClose"
    class="unpicked-dialog"
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="header-content">
          <h3>未ピッキング検出</h3>
          <p>確定箱数があるが出荷番号が未設定の注文を検索します</p>
        </div>
      </div>
    </template>

    <!-- 搜索条件 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams" class="search-form">
        <el-form-item label="検索期間">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="〜"
            start-placeholder="開始日"
            end-placeholder="終了日"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="納入先">
          <el-select
            v-model="searchParams.destination_cd"
            placeholder="全て"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="dest in destinationOptions"
              :key="dest.value"
              :label="dest.label"
              :value="dest.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchUnpickedOrders" :loading="loading">
            <el-icon><Search /></el-icon>
            検索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            リセット
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-card v-if="summary" class="summary-card" shadow="never">
      <template #header>
        <div class="summary-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>検索結果サマリー</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.totalOrders.toLocaleString() }}</div>
            <div class="summary-label">総注文数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.totalBoxes.toLocaleString() }}</div>
            <div class="summary-label">総箱数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.totalUnits.toLocaleString() }}</div>
            <div class="summary-label">総本数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.destinationCount }}</div>
            <div class="summary-label">納入先数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.productCount }}</div>
            <div class="summary-label">製品数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="summary-item">
            <div class="summary-value">{{ summary.dateCount }}</div>
            <div class="summary-label">日付数</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon><Document /></el-icon>
            <span>未ピッキング注文一覧</span>
            <el-badge :value="pagination.total" :max="9999" class="count-badge" />
          </div>
          <div class="table-actions">
            <el-button
              size="small"
              @click="exportData"
              :loading="exportLoading"
              :disabled="!unpickedOrders.length"
            >
              <el-icon><Download /></el-icon>
              エクスポート
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="unpickedOrders"
        border
        v-loading="loading"
        element-loading-text="データを読み込み中..."
        style="width: 100%"
        height="400"
        class="unpicked-table"
        :empty-text="unpickedOrders.length === 0 ? 'データがありません' : ''"
      >
        <el-table-column label="出荷日" width="100" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(row.shipping_date) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="納入先" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="destination-cell">
              <div class="destination-name">{{ row.destination_name || '' }}</div>
              <div class="destination-code">{{ row.destination_cd || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="製品" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-cell">
              <div class="product-name">{{ row.product_name || '' }}</div>
              <div class="product-code">{{ row.product_cd || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="箱数" width="80" align="right">
          <template #default="{ row }">
            <div class="number-cell boxes">
              <span class="number">{{ (row.confirmed_boxes || 0).toLocaleString() }}</span>
              <span class="unit">箱</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="本数" width="90" align="right">
          <template #default="{ row }">
            <div class="number-cell units">
              <span class="number">{{ (row.confirmed_units || 0).toLocaleString() }}</span>
              <span class="unit">本</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="箱タイプ" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getBoxTypeTagType(row.box_type)">
              {{ row.box_type || '未設定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状態" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status || '')" size="small">
              {{ row.status || '未設定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="曜日" width="60" align="center">
          <template #default="{ row }">
            <span :class="getWeekdayClass(row.weekday || '')">{{ row.weekday || '' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">
          <el-icon><Close /></el-icon>
          閉じる
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  fetchUnpickedOrders,
  type UnpickedOrdersParams,
  type UnpickedOrderItem,
  type UnpickedOrdersResponse,
} from '@/api/order/order'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Warning,
  Search,
  Refresh,
  DataAnalysis,
  Document,
  Download,
  Calendar,
  Close,
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// Props and Emits
interface Props {
  modelValue: boolean
  destinationOptions?: { value: string; label: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  destinationOptions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Reactive data
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const loading = ref(false)
const exportLoading = ref(false)
const dateRange = ref<[string, string]>(['', ''])
const unpickedOrders = ref<UnpickedOrderItem[]>([])

const searchParams = reactive<UnpickedOrdersParams>({
  startDate: '',
  endDate: '',
  destination_cd: '',
  page: 1,
  pageSize: 50,
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0,
})

const summary = ref<{
  totalOrders: number
  totalBoxes: number
  totalUnits: number
  destinationCount: number
  productCount: number
  dateCount: number
} | null>(null)

// Methods
const handleDateRangeChange = (range: [string, string] | null) => {
  if (range && range.length === 2) {
    searchParams.startDate = range[0]
    searchParams.endDate = range[1]
  } else {
    searchParams.startDate = ''
    searchParams.endDate = ''
  }
}

const resetSearch = () => {
  dateRange.value = ['', '']
  searchParams.startDate = ''
  searchParams.endDate = ''
  searchParams.destination_cd = ''
  searchParams.page = 1
  searchParams.pageSize = 50
  unpickedOrders.value = []
  summary.value = null
  pagination.page = 1
  pagination.total = 0
}

const searchUnpickedOrders = async () => {
  if (!searchParams.startDate) {
    ElMessage.warning('検索期間を設定してください')
    return
  }

  loading.value = true
  try {
    searchParams.page = pagination.page
    searchParams.pageSize = pagination.pageSize

    const response: any = await fetchUnpickedOrders(searchParams)

    console.log('API Response:', response) // 调试日志

    /*
      后端返回格式有两种可能：
      1. 经过 axios 拦截器解包，直接返回 { list, total, summary, pagination }
      2. 未解包，返回 { success, message, data:{ list, ... } }
      以下代码统一兼容两种格式，并在前端过滤掉製品名包含「加工」「アーチ」「料金」的记录。
    */

    const data = (() => {
      if (response && Array.isArray(response.list)) {
        // 情况 1：已解包
        return response
      }
      if (response && response.success === true && response.data) {
        // 情况 2：未解包
        return response.data
      }
      return {}
    })()

    // 取得列表并执行关键字过滤
    const rawList: any[] = Array.isArray(data.list) ? data.list : []
    const filterKeywords = ['加工', 'アーチ', '料金']
    const excludedDestinations = ['北九州ケミカル']
    const filteredList = rawList.filter((item) => {
      const name = item.product_name || ''
      if (filterKeywords.some((kw) => name.includes(kw))) return false
      if (excludedDestinations.some((dest) => (item.destination_name || '').includes(dest)))
        return false
      return true
    })

    unpickedOrders.value = filteredList

    // 统计信息（始终基于过滤后的列表计算，确保一致）
    const totalOrders = unpickedOrders.value.length
    const totalBoxes = unpickedOrders.value.reduce(
      (sum, item) => sum + (Number(item.confirmed_boxes) || 0),
      0,
    )
    const totalUnits = unpickedOrders.value.reduce(
      (sum, item) => sum + (Number(item.confirmed_units) || 0),
      0,
    )
    const destinationCount = new Set(unpickedOrders.value.map((item) => item.destination_cd)).size
    const productCount = new Set(unpickedOrders.value.map((item) => item.product_cd)).size
    const dateCount = new Set(unpickedOrders.value.map((item) => item.shipping_date)).size

    summary.value = {
      totalOrders,
      totalBoxes,
      totalUnits,
      destinationCount,
      productCount,
      dateCount,
    }

    // 分页信息
    pagination.total = totalOrders
    pagination.totalPages = Math.ceil(pagination.total / pagination.pageSize)

    // 通知
    ElNotification({
      title: '検索完了',
      message: `${totalOrders}件の未ピッキングデータが見つかりました`,
      type: totalOrders > 0 ? 'warning' : 'info',
      duration: 3000,
    })
  } catch (error: any) {
    console.error('未ピッキング検索エラー:', error)
    ElMessage.error(error?.message || '検索中にエラーが発生しました')
    unpickedOrders.value = []
    summary.value = null
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (newSize: number) => {
  pagination.pageSize = newSize
  pagination.page = 1
  searchUnpickedOrders()
}

const handleCurrentChange = (newPage: number) => {
  pagination.page = newPage
  searchUnpickedOrders()
}

const exportData = async () => {
  if (!searchParams.startDate) {
    ElMessage.warning('検索期間を設定してください')
    return
  }

  exportLoading.value = true
  try {
    const exportParams = { ...searchParams, export: true }
    delete exportParams.page
    delete exportParams.pageSize

    const response: any = await fetchUnpickedOrders(exportParams)

    console.log('Export API Response:', response) // 调试日志

    const data = (() => {
      if (response && Array.isArray(response.list)) {
        return response
      }
      if (response && response.success === true && response.data) {
        return response.data
      }
      return {}
    })()

    const rawList: any[] = Array.isArray(data.list) ? data.list : []
    const filterKeywords = ['加工', 'アーチ', '料金']
    const excludedDestinations = ['北九州ケミカル']
    const exportList = rawList.filter((item) => {
      const name = item.product_name || ''
      if (filterKeywords.some((kw) => name.includes(kw))) return false
      if (excludedDestinations.some((dest) => (item.destination_name || '').includes(dest)))
        return false
      return true
    })

    if (exportList.length > 0) {
      // 构建CSV内容
      const headers = [
        '出荷日',
        '納入先CD',
        '納入先名',
        '製品CD',
        '製品名',
        '確定箱数',
        '確定本数',
        '箱タイプ',
        '状態',
        '曜日',
        '備考',
      ]

      const csvContent = [
        headers.join(','),
        ...exportList.map((item) =>
          [
            item.shipping_date,
            item.destination_cd,
            item.destination_name,
            item.product_cd,
            item.product_name,
            item.confirmed_boxes,
            item.confirmed_units,
            item.box_type || '',
            item.status,
            item.weekday,
            (item.remarks || '').replace(/,/g, '，'),
          ].join(','),
        ),
      ].join('\n')

      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `未ピッキング一覧_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success(`${exportList.length}件のデータをエクスポートしました`)
    } else {
      ElMessage.warning('エクスポートするデータがありません')
    }
  } catch (error: any) {
    console.error('エクスポートエラー:', error)
    if (error?.isTokenError) return // token已处理
    ElMessage.error(error?.message || 'エクスポート中にエラーが発生しました')
  } finally {
    exportLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateStr
    }
    return date
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-')
  } catch {
    return dateStr
  }
}

const getBoxTypeTagType = (
  boxType: string,
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  if (!boxType || boxType === '未設定') return 'info'
  switch (boxType) {
    case '小箱':
      return 'success'
    case '大箱':
      return 'warning'
    case 'TP箱':
      return 'info'
    case '特殊':
      return 'danger'
    default:
      return 'primary'
  }
}

const getStatusTagType = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  switch (status) {
    case '出荷済':
      return 'success'
    case '未出荷':
      return 'warning'
    case 'キャンセル':
      return 'danger'
    default:
      return 'info'
  }
}

const getWeekdayClass = (weekday: string) => {
  switch (weekday) {
    case '土':
      return 'weekday-saturday'
    case '日':
      return 'weekday-sunday'
    default:
      return 'weekday-normal'
  }
}

const handleClose = () => {
  visible.value = false
}

// 监听对话框打开时设置默认日期范围
watch(visible, (newVal) => {
  if (newVal && !dateRange.value[0]) {
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)

    dateRange.value = [lastWeek.toISOString().split('T')[0], today.toISOString().split('T')[0]]
    handleDateRangeChange(dateRange.value)
  }

  // 添加调试信息
  console.log('Dialog visible changed:', newVal)
  console.log('Current unpickedOrders:', unpickedOrders.value)
  console.log('Current summary:', summary.value)
})

// 监听unpickedOrders数据变化
watch(
  unpickedOrders,
  (newVal) => {
    console.log('unpickedOrders changed:', newVal)
  },
  { deep: true },
)
</script>

<style scoped>
.unpicked-dialog {
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #1f2937;

    .header-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .header-content {
      h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px 24px;
  }
}

.search-card {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;

  .search-form {
    margin: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 16px;
    }
  }
}

.summary-card {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;

  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #374151;
  }

  .summary-item {
    text-align: center;
    padding: 8px;

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  }
}

.table-card {
  border: 1px solid #e5e7eb;

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .table-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #374151;

      .count-badge {
        margin-left: 8px;
      }
    }
  }
}

.unpicked-table {
  :deep(.el-table__header) {
    background: #f9fafb;
  }

  .date-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
  }

  .destination-cell {
    .destination-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 13px;
    }
    .destination-code {
      font-size: 11px;
      color: #6b7280;
    }
  }

  .product-cell {
    .product-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .product-code {
      font-size: 11px;
      color: #6b7280;
      font-family: monospace;
    }
  }

  .number-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .number {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .unit {
      font-size: 10px;
      color: #6b7280;
    }

    &.boxes .number {
      color: #dc2626;
    }

    &.units .number {
      color: #059669;
    }
  }

  .weekday-saturday {
    color: #2563eb;
    font-weight: 600;
  }

  .weekday-sunday {
    color: #dc2626;
    font-weight: 600;
  }

  .weekday-normal {
    color: #374151;
  }
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
