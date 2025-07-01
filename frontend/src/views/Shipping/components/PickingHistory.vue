<template>
  <div class="picking-history-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DataAnalysis /></el-icon>
        ピッキング履歴分析
      </h1>
      <p class="page-subtitle">作業履歴の分析と効率管理</p>
    </div>

    <!-- 筛选条件卡片 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Filter /></el-icon>
          <span>検索条件</span>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="期間">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="〜"
            start-placeholder="開始日"
            end-placeholder="終了日"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="handleDateRangeChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="refreshData" :loading="loading.search">
            <el-icon><Search /></el-icon>
            検索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            リセット
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card total-tasks">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><DataBoard /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ historyStats.totalTasks }}</div>
              <div class="stat-label">総ピッキング数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card pending-tasks">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ historyStats.pendingTasks }}</div>
              <div class="stat-label">総未ピッキング数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card completed-tasks">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ historyStats.completedTasks }}</div>
              <div class="stat-label">総ピッキング済数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card completion-rate">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ historyStats.completionRate }}%</div>
              <div class="stat-label">全体完了率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务列表区域 -->
    <el-row :gutter="20" class="tables-row">
      <!-- 未ピッキングリスト -->
      <el-col :span="12">
        <el-card class="table-card pending-tasks" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><Clock /></el-icon>
                <span>未ピッキングリスト</span>
              </div>
              <el-badge :value="pendingTasks.length" class="task-count-badge" />
            </div>
          </template>
          <div class="table-container" v-loading="loading.pendingTasks">
            <el-table
              :data="paginatedPendingTasks"
              @row-click="showTaskDetail"
              :row-class-name="getTaskRowClass"
              height="400"
              size="small"
            >
              <el-table-column prop="shipping_no" label="ピッキングNo" width="120" />
              <el-table-column prop="product_cd" label="製品CD" width="90" />
              <el-table-column
                prop="product_name"
                label="製品名"
                min-width="150"
                show-overflow-tooltip
              />
              <el-table-column label="数量" min-width="100" align="right">
                <template #default="{ row }">
                  {{ row.picked_quantity || 0 }}/{{ row.confirmed_boxes || 0 }}
                </template>
              </el-table-column>
              <el-table-column label="状態" min-width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-mini">
              <el-pagination
                v-model:current-page="pendingCurrentPage"
                v-model:page-size="pendingPageSize"
                :page-sizes="[10, 20, 50]"
                :total="pendingTasks.length"
                layout="prev, pager, next, sizes"
                size="small"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- ピッキング済リスト -->
      <el-col :span="12">
        <el-card class="table-card completed-tasks" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><Check /></el-icon>
                <span>ピッキング済リスト</span>
              </div>
              <el-badge :value="completedTasks.length" class="task-count-badge" />
            </div>
          </template>
          <div class="table-container" v-loading="loading.completedTasks">
            <el-table
              :data="paginatedCompletedTasks"
              @row-click="showTaskDetail"
              :row-class-name="getTaskRowClass"
              height="400"
              size="small"
            >
              <el-table-column prop="picking_id" label="ピッキングID" width="180" />
              <el-table-column prop="product_cd" label="製品CD" width="100" />
              <el-table-column
                prop="product_name"
                label="製品名"
                min-width="150"
                show-overflow-tooltip
              />
              <el-table-column label="出荷日" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.shipping_date) }}
                </template>
              </el-table-column>
              <el-table-column label="数量" min-width="100" align="right">
                <template #default="{ row }">
                  {{ row.picked_quantity || 0 }}/{{ row.confirmed_boxes || 0 }}
                </template>
              </el-table-column>
              <el-table-column label="完了日時" width="160">
                <template #default="{ row }">
                  {{ formatDateTime(row.complete_time || row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-mini">
              <el-pagination
                v-model:current-page="completedCurrentPage"
                v-model:page-size="completedPageSize"
                :page-sizes="[10, 20, 50]"
                :total="completedTasks.length"
                layout="prev, pager, next, sizes"
                size="small"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="taskDetailVisible" title="ピッキング作業詳細" width="600px">
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="ピッキングID">
            {{ selectedTask.picking_id }}
          </el-descriptions-item>
          <el-descriptions-item label="パレット番号">
            {{ selectedTask.shipping_no }}
          </el-descriptions-item>
          <el-descriptions-item label="製品コード">
            {{ selectedTask.product_cd }}
          </el-descriptions-item>
          <el-descriptions-item label="製品名">
            {{ selectedTask.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="必要数量">
            {{ selectedTask.confirmed_boxes }}
          </el-descriptions-item>
          <el-descriptions-item label="ピッキング数量">
            {{ selectedTask.picked_quantity }}
          </el-descriptions-item>
          <el-descriptions-item label="保管場所">
            {{ selectedTask.location_cd }}
          </el-descriptions-item>
          <el-descriptions-item label="棚位置">
            {{ selectedTask.shelf_position }}
          </el-descriptions-item>
          <el-descriptions-item label="担当者">
            {{ selectedTask.picker_name }}
          </el-descriptions-item>
          <el-descriptions-item label="優先度">
            <el-tag :type="getPriorityType(selectedTask.priority)">
              {{ getPriorityText(selectedTask.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状態">
            <el-tag :type="getStatusTagType(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="作業時間" v-if="selectedTask.work_time">
            {{ selectedTask.work_time }}分
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedTask.remarks" class="task-remarks">
          <h4>備考</h4>
          <p>{{ selectedTask.remarks }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="taskDetailVisible = false">閉じる</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Filter,
  DataBoard,
  CircleCheck,
  TrendCharts,
  DataAnalysis,
  Clock,
  Check,
} from '@element-plus/icons-vue'
import {
  getPickingHistoryData,
  getPendingTasks,
  getCompletedTasks,
  getPickerOptions,
} from '@/api/shipping/picking'

// 接口定义
interface PickingTask {
  picking_id: string
  shipping_no: string
  product_cd: string
  product_name: string
  confirmed_boxes: number
  picked_quantity: number
  location_cd: string
  shelf_position: string
  priority: number
  status: string
  picker_id: string
  picker_name: string
  start_time?: string
  complete_time?: string
  work_time?: number
  elapsed_time?: number
  completion_status?: string
  remarks?: string
  created_at?: string
  completionRate: number
  shipping_date?: string
}

interface HistoryStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
}

interface PickerOption {
  id: string
  name: string
  task_count: number
}

// 响应式数据
const loading = ref({
  search: false,
  pendingTasks: false,
  completedTasks: false,
})

// 简化筛选条件，只保留期间
const filters = ref({})

// 日本时区工具函数
const getJapanDate = (date?: Date): Date => {
  const targetDate = date || new Date()
  return new Date(targetDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
}

const formatDateString = (date: Date): string => {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  )
}

// 默认期间为当月1号到月末（日本时区）
const getCurrentMonthRange = (): [string, string] => {
  // 使用日本时区获取当前日期
  const japanTime = getJapanDate()
  const year = japanTime.getFullYear()
  const month = japanTime.getMonth()

  // 当月1号（日本时区）
  const firstDay = new Date(year, month, 1)
  const firstDayStr = formatDateString(firstDay)

  // 当月最后一天（日本时区）
  const lastDay = new Date(year, month + 1, 0)
  const lastDayStr = formatDateString(lastDay)

  console.log('🗾 日本時区当月期間:', {
    localTime: new Date().toLocaleString(),
    japanTime: japanTime.toLocaleString(),
    range: [firstDayStr, lastDayStr],
  })

  return [firstDayStr, lastDayStr]
}

const dateRange = ref<[string, string]>(getCurrentMonthRange())

// 数据状态
const historyStats = reactive<HistoryStats>({
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  completionRate: 0,
})

const pickerOptions = ref<PickerOption[]>([])
const pendingTasks = ref<PickingTask[]>([])
const completedTasks = ref<PickingTask[]>([])

// 任务详情
const taskDetailVisible = ref(false)
const selectedTask = ref<PickingTask | null>(null)

// 分页
const pendingCurrentPage = ref(1)
const pendingPageSize = ref(10)
const completedCurrentPage = ref(1)
const completedPageSize = ref(10)

// 计算属性
const paginatedPendingTasks = computed(() => {
  const start = (pendingCurrentPage.value - 1) * pendingPageSize.value
  const end = start + pendingPageSize.value
  return pendingTasks.value.slice(start, end)
})

const paginatedCompletedTasks = computed(() => {
  const start = (completedCurrentPage.value - 1) * completedPageSize.value
  const end = start + completedPageSize.value
  return completedTasks.value.slice(start, end)
})

// 通用数据过滤函数
const filterProductData = (data: any) => {
  if (!data) return data

  const excludeKeywords = ['加工', 'アーチ', '料金']

  const shouldExclude = (productName: string) => {
    if (!productName) return false
    return excludeKeywords.some((keyword) => productName.includes(keyword))
  }

  // 如果是数组，过滤每个元素
  if (Array.isArray(data)) {
    return data.filter((item: any) => {
      const productName = item.product_name || item.productName || ''
      return !shouldExclude(productName)
    })
  }

  // 如果是对象，递归过滤其属性
  if (typeof data === 'object') {
    const filtered = { ...data }

    // 过滤各种可能的数组属性
    Object.keys(filtered).forEach((key) => {
      if (Array.isArray(filtered[key])) {
        filtered[key] = filtered[key].filter((item: any) => {
          const productName = item.product_name || item.productName || ''
          return !shouldExclude(productName)
        })
      }
    })

    return filtered
  }

  return data
}

// 方法
async function fetchPickerOptions() {
  try {
    console.log('👥 担当者選択肢取得開始')
    const response = await getPickerOptions()
    console.log('👥 担当者選択肢API応答:', response)

    // 处理不同的响应格式
    let data
    if (response && response.data) {
      data = response.data
    } else if (Array.isArray(response)) {
      data = response
    } else {
      data = []
    }

    // 担当者数据不需要产品过滤，直接使用
    pickerOptions.value = Array.isArray(data) ? data : []
    console.log('👥 更新後の担当者選択肢数:', pickerOptions.value.length)
    console.log('👥 担当者選択肢詳細:', pickerOptions.value)
  } catch (error) {
    console.error('担当者選択肢取得エラー:', error)
    pickerOptions.value = []
  }
}

async function fetchHistoryStats() {
  loading.value.search = true
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      page: 1,
      limit: 10000, // 获取所有数据进行统计
    }

    console.log('📊 履歴統計データ取得開始:', params)
    const response = await getPickingHistoryData(params)
    console.log('📊 履歴統計データ取得結果:', response)

    // 处理响应数据
    const data = response?.data || response

    if (data) {
      // 应用数据过滤
      const filteredData = filterProductData(data)

      // 重新计算统计数据
      let totalTasks = 0
      let completedTasks = 0
      let pendingTasks = 0

      // 如果有统计数据，直接使用
      if (filteredData.stats) {
        totalTasks = filteredData.stats.totalTasks || 0
        completedTasks = filteredData.stats.completedTasks || 0
        pendingTasks = filteredData.stats.pendingTasks || 0
      } else {
        // 如果没有统计数据，从任务列表中计算
        const allTasks = filteredData.tasks || filteredData || []
        if (Array.isArray(allTasks)) {
          totalTasks = allTasks.length
          completedTasks = allTasks.filter(
            (task) => task.status === 'completed' || task.status === 'picked',
          ).length
          pendingTasks = allTasks.filter(
            (task) => task.status === 'pending' || task.status === 'assigned',
          ).length
        }
      }

      // 更新统计数据
      historyStats.totalTasks = totalTasks
      historyStats.completedTasks = completedTasks
      historyStats.pendingTasks = pendingTasks
      historyStats.completionRate =
        totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0

      console.log('📊 更新後の統計データ:', historyStats)

      // 强制触发响应式更新
      await nextTick()
      console.log('📊 強制更新完了')
    } else {
      console.warn('📊 履歴統計データが空です:', data)
      // 重置统计数据
      historyStats.totalTasks = 0
      historyStats.completedTasks = 0
      historyStats.pendingTasks = 0
      historyStats.completionRate = 0
      ElMessage.warning('履歴統計データが取得できませんでした')
    }
  } catch (error) {
    console.error('履歴統計取得エラー:', error)
    ElMessage.error('履歴統計の取得に失敗しました')
    // 重置统计数据
    historyStats.totalTasks = 0
    historyStats.completedTasks = 0
    historyStats.pendingTasks = 0
    historyStats.completionRate = 0
  } finally {
    loading.value.search = false
  }
}

async function fetchPendingTasks() {
  loading.value.pendingTasks = true
  try {
    // 未ピッキングタスクは通常、日付範囲に依存しないため、パラメータなしで取得
    console.log('⏳ 未ピッキングリスト取得開始:')
    const response = await getPendingTasks({})
    console.log('⏳ 未ピッキングリスト取得結果:', response)

    // 处理响应数据并应用过滤
    const data = response?.data || response
    const filteredData = filterProductData(data)
    pendingTasks.value = Array.isArray(filteredData) ? filteredData : []
    console.log('⏳ 更新後の未ピッキングタスク数:', pendingTasks.value.length)
  } catch (error) {
    console.error('未ピッキングリスト取得エラー:', error)
    ElMessage.error('未ピッキングリストの取得に失敗しました')
    pendingTasks.value = []
  } finally {
    loading.value.pendingTasks = false
  }
}

async function fetchCompletedTasks() {
  loading.value.completedTasks = true
  try {
    const params: {
      start_date?: string
      end_date?: string
      page?: number
      limit?: number
    } = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      page: completedCurrentPage.value,
      limit: completedPageSize.value,
    }

    console.log('✅ ピッキング済リスト取得開始:', params)
    const response = await getCompletedTasks(params)
    console.log('✅ ピッキング済リスト取得結果 (原始データ):', response)

    // 处理响应数据并应用过滤
    const data = response?.data || response

    if (data) {
      let rawTasks = []
      if (Array.isArray(data)) {
        rawTasks = data
      } else if (data.logs && Array.isArray(data.logs)) {
        rawTasks = data.logs
      } else if (data.tasks && Array.isArray(data.tasks)) {
        rawTasks = data.tasks
      } else {
        rawTasks = []
        console.warn('✅ 予期しない形式のデータを受信、空の配列をセット:', data)
      }

      // 应用数据过滤
      completedTasks.value = filterProductData(rawTasks)
    } else {
      completedTasks.value = []
      console.warn('✅ 無効なデータを受信、空の配列をセット:', data)
    }

    console.log('✅ 更新後のピッキング済タスク数:', completedTasks.value.length)
    console.log('✅ ピッキング済タスクの内容:', completedTasks.value)

    // 页面をリセット
    completedCurrentPage.value = 1
  } catch (error) {
    console.error('ピッキング済リスト取得エラー:', error)
    ElMessage.error('ピッキング済リストの取得に失敗しました')
    completedTasks.value = []
  } finally {
    loading.value.completedTasks = false
  }
}

function handleDateRangeChange() {
  refreshData()
}

async function refreshData() {
  console.log('🔄 データ更新開始')
  try {
    // 并行执行所有数据获取
    await Promise.all([fetchHistoryStats(), fetchPendingTasks(), fetchCompletedTasks()])
    console.log('🔄 データ更新完了')
  } catch (error) {
    console.error('🔄 データ更新エラー:', error)
    ElMessage.error('データの更新に失敗しました')
  }
}

function resetFilters() {
  filters.value = {}
  dateRange.value = getCurrentMonthRange()
  refreshData()
}

function showTaskDetail(task: PickingTask) {
  selectedTask.value = task
  taskDetailVisible.value = true
}

// 样式辅助函数
function getTaskRowClass({ row }: { row: PickingTask }) {
  return `task-row-${row.status}`
}

function getPriorityType(priority: number): 'danger' | 'warning' | 'info' {
  const typeMap: Record<number, 'danger' | 'warning' | 'info'> = {
    1: 'danger',
    2: 'warning',
    3: 'info',
  }
  return typeMap[priority] || 'info'
}

function getPriorityText(priority: number): string {
  const textMap: Record<number, string> = {
    1: '高',
    2: '中',
    3: '低',
  }
  return textMap[priority] || '中'
}

function getStatusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    completed: 'success',
    shortage: 'warning',
    cancelled: 'danger',
    pending: 'info',
    picking: 'primary',
  }
  return typeMap[status] || 'info'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    completed: 'ピッキング済',
    pending: '未ピッキング',
    picking: 'ピッキング中',
  }
  return textMap[status] || status
}

function formatDateTime(dateTime?: string): string {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCompletionColor(rate: number) {
  if (rate >= 90) return '#67c23a'
  if (rate >= 70) return '#409eff'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// 生命周期
onMounted(async () => {
  console.log('🚀 PickingHistory コンポーネントマウント開始')
  try {
    await fetchPickerOptions()
    await refreshData()

    console.log('🚀 PickingHistory コンポーネントマウント完了')
  } catch (error) {
    console.error('🚀 PickingHistory コンポーネントマウントエラー:', error)
  }
})

onUnmounted(() => {
  // 清理图表和事件监听
})
</script>

<style scoped>
.picking-history-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.filter-form {
  margin-top: 16px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-card.total-tasks .stat-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-card.pending-tasks .stat-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-card.completed-tasks .stat-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-card.completion-rate .stat-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.tables-row {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-card.pending-tasks {
  border-left: 4px solid #e6a23c;
}

.table-card.completed-tasks {
  border-left: 4px solid #67c23a;
}

.task-count-badge {
  margin-left: 8px;
}

.table-container {
  padding: 0;
}

.pagination-mini {
  padding: 10px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

.task-detail {
  margin-bottom: 20px;
}

.task-remarks {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.task-remarks h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
}

.task-remarks p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
  font-size: 14px;
}

/* 表格行样式 */
:deep(.task-row-pending) {
  background-color: #fdf6ec;
}

:deep(.task-row-picking) {
  background-color: #ecf5ff;
}

:deep(.task-row-completed) {
  background-color: #f0f9ff;
}

:deep(.task-row-shortage) {
  background-color: #fef0f0;
}

:deep(.task-row-cancelled) {
  background-color: #f5f5f5;
}

/* Loading状态优化 */
.chart-container .el-loading-mask {
  border-radius: 8px;
}

/* 图表动画效果 */
.chart-card {
  overflow: hidden;
}

.chart-container {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 按钮悬停效果 */
.chart-controls .el-button:not(.active):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 图表加载状态 */
.chart-container[v-loading] {
  min-height: 350px !important;
}

.chart-container[v-loading] .chart-canvas {
  opacity: 0.3;
}

/* 防止 Element Plus 的 loading 影响容器尺寸 */
.chart-container[v-loading] {
  min-height: 300px !important;
}

/* 当在标签页中时，确保图表容器可见性 */
.el-tab-pane .chart-container {
  opacity: 1;
  visibility: visible;
  display: block;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-row .el-col {
    margin-bottom: 16px;
  }

  .tables-row .el-col {
    margin-bottom: 16px;
  }

  .chart-container {
    height: 320px;
  }
}

@media (max-width: 768px) {
  .picking-history-container {
    padding: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .filter-form {
    display: block;
  }

  .filter-form .el-form-item {
    display: block;
    margin-bottom: 16px;
  }

  .chart-container {
    height: 280px;
    padding: 5px;
  }

  .chart-canvas {
    min-height: 250px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .chart-controls {
    align-self: stretch;
    justify-content: space-between;
  }

  .chart-controls .el-button {
    flex: 1;
    margin: 0 2px;
  }

  .filter-actions {
    margin-left: 0;
    justify-content: center;
  }
}

/* 额外的图表样式优化 */
.chart-card .el-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chart-card .el-card__body {
  padding: 0;
}

/* 确保图表在各种容器中都能正常显示 */
.chart-canvas {
  width: 100% !important;
  height: 100% !important;
  min-height: 200px;
  min-width: 280px;
}

/* 图表容器的最小尺寸保证 */
.chart-container {
  min-height: 250px;
  min-width: 300px;
}

/* Success状态的按钮样式 */
.chart-controls .el-button[type='success'].active {
  background-color: var(--el-color-success);
  color: white;
  border-color: var(--el-color-success);
}
</style>
