<template>
  <div class="picking-list-generator">
    <!-- 上部区域：标题和按钮 -->
    <div class="header-section">
      <!-- 左侧标题区域 -->
      <div class="title-section">
        <h2 class="page-title">
          <el-icon><Box /></el-icon>
          ピッキングリスト
        </h2>
        <p class="page-subtitle">出荷データからピッキングリストを表示します</p>
      </div>

      <!-- 右侧按钮区域 -->
      <div class="action-buttons-section">
        <el-button type="warning" @click="syncShippingData" :loading="loading.sync" size="default">
          <el-icon><Download /></el-icon>
          データ読み込み
        </el-button>

        <el-button
          type="primary"
          @click="fetchShippingData"
          :loading="loading.fetch"
          size="default"
        >
          <el-icon><Search /></el-icon>
          データ更新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="statistics-card total-card">
            <div class="statistics-content">
              <div class="statistics-icon">
                <el-icon size="32"><Box /></el-icon>
              </div>
              <div class="statistics-info">
                <div class="statistics-label">総件数</div>
                <div class="statistics-value">{{ totalStats.total.toLocaleString() }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="statistics-card pending-card">
            <div class="statistics-content">
              <div class="statistics-icon">
                <el-icon size="32"><Clock /></el-icon>
              </div>
              <div class="statistics-info">
                <div class="statistics-label">未ピッキング件数</div>
                <div class="statistics-value">{{ totalStats.pending.toLocaleString() }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="statistics-card completed-card">
            <div class="statistics-content">
              <div class="statistics-icon">
                <el-icon size="32"><CircleCheck /></el-icon>
              </div>
              <div class="statistics-info">
                <div class="statistics-label">ピッキング済件数</div>
                <div class="statistics-value">{{ totalStats.completed.toLocaleString() }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="statistics-card completion-card">
            <div class="statistics-content">
              <div class="statistics-icon">
                <el-icon size="32"><TrendCharts /></el-icon>
              </div>
              <div class="statistics-info">
                <div class="statistics-label">完成率</div>
                <div class="statistics-value">{{ totalStats.completionRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 中部筛选区域 -->
    <div class="filter-section">
      <el-card shadow="hover">
        <template #header>
          <div class="filter-header">
            <span class="filter-title">
              <el-icon><Filter /></el-icon>
              筛选条件
            </span>
            <el-tag type="info" size="small">自動読み込み</el-tag>
          </div>
        </template>

        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="出荷日期">
            <div class="date-picker-group">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="〜"
                start-placeholder="開始日"
                end-placeholder="終了日"
                value-format="YYYY-MM-DD"
                style="width: 280px"
              />
              <div class="date-quick-buttons">
                <el-button size="small" @click="setDateRange(-1)"> 前日 </el-button>
                <el-button size="small" type="primary" @click="setDateRange(0)"> 今日 </el-button>
                <el-button size="small" @click="setDateRange(1)"> 翌日 </el-button>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="状態">
            <el-select
              v-model="filters.status"
              placeholder="全ての状態"
              clearable
              style="width: 150px"
            >
              <el-option label="未ピッキング" value="未ピッキング" />
              <el-option label="ピッキング済" value="ピッキング済" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="fetchShippingData" :loading="loading.fetch">
              <el-icon><Search /></el-icon>
              検索
            </el-button>
            <el-button @click="resetFilters">
              <el-icon><RefreshLeft /></el-icon>
              リセット
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 下部列表显示区域 -->
    <div class="list-section">
      <el-card shadow="hover">
        <template #header>
          <div class="list-header">
            <div class="list-title">
              <span>
                <el-icon><List /></el-icon>
                パレット一覧 ({{ palletGroups.length }}個)
              </span>
            </div>
          </div>
        </template>

        <!-- 加载状态 -->
        <div v-if="loading.fetch" class="loading-state">
          <el-empty description="データを読み込み中...">
            <template #image>
              <el-icon size="64" class="is-loading">
                <Loading />
              </el-icon>
            </template>
          </el-empty>
        </div>

        <!-- 空状态 -->
        <div v-else-if="palletGroups.length === 0" class="empty-state">
          <el-empty description="条件に合う出荷データがありません">
            <template #default>
              <div class="empty-actions">
                <el-button type="warning" @click="syncShippingData" :loading="loading.sync">
                  <el-icon><Download /></el-icon>
                  データ読み込み
                </el-button>
              </div>
              <p class="empty-hint">shipping_itemsテーブルからデータを読み込んでください</p>
            </template>
          </el-empty>
        </div>

        <!-- 托盘表格 -->
        <div v-else class="pallet-table">
          <el-table :data="palletGroups" border stripe size="default" class="pallet-main-table">
            <!-- 托盘编号 -->
            <el-table-column prop="shipping_no" label="パレット番号" width="150">
              <template #default="{ row }">
                <div class="pallet-no-cell">
                  <span class="pallet-number">{{ row.shipping_no }}</span>
                  <el-tag size="small" type="primary">{{ row.items.length }}項目</el-tag>
                </div>
              </template>
            </el-table-column>

            <!-- 出荷日 -->
            <el-table-column prop="shipping_date" label="出荷日" width="110" align="center">
              <template #default="{ row }">
                {{ formatDate(row.shipping_date) }}
              </template>
            </el-table-column>

            <!-- 状態 -->
            <el-table-column label="状態" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 总数量 -->
            <el-table-column label="総数量" width="100" align="right">
              <template #default="{ row }">
                <span class="quantity-value">{{ row.totalUnits.toLocaleString() }}個</span>
              </template>
            </el-table-column>

            <!-- 总箱数 -->
            <el-table-column label="総箱数" width="100" align="right">
              <template #default="{ row }">
                <span class="box-value">{{ row.totalBoxes.toLocaleString() }}箱</span>
              </template>
            </el-table-column>

            <!-- 产品列表 -->
            <el-table-column label="製品一覧" min-width="300">
              <template #default="{ row }">
                <div class="product-list">
                  <div v-for="(item, index) in row.items" :key="index" class="product-item">
                    <span class="product-code">{{ item.product_cd }}</span>
                    <span class="product-name">{{ item.product_name }}</span>
                    <span class="product-quantity"
                      >{{
                        (item.confirmed_units || item.confirmed_boxes || 0).toLocaleString()
                      }}個</span
                    >
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 納入先 -->
            <el-table-column label="納入先" width="180">
              <template #default="{ row }">
                <div class="destination-info">
                  <span v-if="row.items[0]?.destination_name" class="destination-name">
                    {{ row.items[0].destination_name }}
                  </span>
                  <span v-if="row.items[0]?.destination_cd" class="destination-code">
                    ({{ row.items[0].destination_cd }})
                  </span>
                </div>
              </template>
            </el-table-column>

            <!-- 作業者 -->
            <el-table-column label="作業者" width="120" align="center">
              <template #default="{ row }">
                <span v-if="row.picker_name || row.picker_id" class="picker-id">{{
                  row.picker_name || row.picker_id
                }}</span>
                <span v-else class="no-picker">未割当</span>
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button size="small" link @click="togglePalletDetail(row.shipping_no)">
                  {{ expandedPallets.includes(row.shipping_no) ? '詳細を閉じる' : '詳細を見る' }}
                  <el-icon>
                    <ArrowDown v-if="!expandedPallets.includes(row.shipping_no)" />
                    <ArrowUp v-else />
                  </el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 展开的详细信息 -->
          <div
            v-for="pallet in palletGroups"
            :key="`detail-${pallet.shipping_no}`"
            class="pallet-detail-section"
          >
            <el-collapse-transition>
              <div
                v-show="expandedPallets.includes(pallet.shipping_no)"
                class="pallet-detail-content"
              >
                <div class="detail-header">
                  <h4>{{ pallet.shipping_no }} の詳細情報</h4>
                </div>
                <el-table :data="pallet.items" size="small" border class="detail-table">
                  <el-table-column prop="product_cd" label="製品コード" width="120" />
                  <el-table-column
                    prop="product_name"
                    label="製品名"
                    min-width="200"
                    show-overflow-tooltip
                  />
                  <el-table-column prop="confirmed_units" label="数量" width="100" align="right">
                    <template #default="{ row }">
                      {{ (row.confirmed_units || row.confirmed_boxes || 0).toLocaleString() }}個
                    </template>
                  </el-table-column>
                  <el-table-column prop="confirmed_boxes" label="箱数" width="100" align="right">
                    <template #default="{ row }">
                      {{ (row.confirmed_boxes || 0).toLocaleString() }}箱
                    </template>
                  </el-table-column>
                  <el-table-column label="状態" width="150" align="center">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.status)" size="small">
                        {{ getStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="destination_name"
                    label="納入先"
                    width="180"
                    show-overflow-tooltip
                  />
                  <el-table-column prop="delivery_date" label="納期" width="120">
                    <template #default="{ row }">
                      {{ formatDate(row.delivery_date) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="picker_id" label="作業者" width="100" align="center">
                    <template #default="{ row }">
                      <span v-if="row.picker_name || row.picker_id" class="picker-id">{{
                        row.picker_name || row.picker_id
                      }}</span>
                      <span v-else class="no-picker">未割当</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Loading,
  Download,
  Box,
  Filter,
  List,
  ArrowDown,
  ArrowUp,
  RefreshLeft,
  Clock,
  CircleCheck,
  TrendCharts,
} from '@element-plus/icons-vue'
import request from '@/utils/request'

interface ShippingItem {
  shipping_no_p: string
  shipping_no: string
  product_cd: string
  product_name: string
  confirmed_units: number
  confirmed_boxes: number
  box_type: string
  destination_cd: string
  destination_name: string
  shipping_date: string
  delivery_date: string
  status: string
  picker_id: string
  picker_name?: string
}

interface PalletGroup {
  shipping_no: string
  shipping_date: string
  items: ShippingItem[]
  totalUnits: number
  totalBoxes: number
  status: string
  picker_id: string
  picker_name?: string
}

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref({
  fetch: false,
  generate: false,
  sync: false,
})

const filters = ref({
  status: '',
})

const today = new Date().toISOString().slice(0, 10)
const dateRange = ref<[string, string]>([today, today])

// 防抖计时器
let debounceTimer: NodeJS.Timeout | null = null

const palletGroups = ref<PalletGroup[]>([])
const expandedPallets = ref<string[]>([])

// 统计数据计算属性
const totalStats = computed(() => {
  const total = palletGroups.value.length
  const completed = palletGroups.value.filter((pallet) => pallet.status === 'completed').length
  const pending = palletGroups.value.filter((pallet) => pallet.status === 'pending').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    pending,
    completionRate,
  }
})

// 方法
async function fetchShippingData() {
  loading.value.fetch = true
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      status: filters.value.status,
    }

    console.log('API请求参数:', params)

    const response = await request.get('/api/shipping/picking/tasks/for-display', { params })
    console.log('API响应:', response)
    console.log('API响应类型:', typeof response)
    console.log('API响应数据详情:', JSON.stringify(response, null, 2))

    // 检查响应格式 - 处理不同的响应格式
    let items
    if (response && response.success !== undefined) {
      // 标准格式: {success: true, data: [...]}
      if (!response.success) {
        console.error('API请求失败:', response.message)
        ElMessage.error(response.message || 'データの取得に失敗しました')
        return
      }
      items = response.data
    } else if (Array.isArray(response)) {
      // 直接返回数组格式: [...]
      items = response
    } else {
      console.error('未知的响应格式:', response)
      ElMessage.error('データ形式が正しくありません')
      return
    }

    // 检查数据是否为数组
    if (!Array.isArray(items)) {
      console.error('返回的数据不是数组:', items)
      ElMessage.error('データ形式が正しくありません')
      return
    }

    console.log(`获取到 ${items.length} 条原始数据`)

    // 过滤掉製品名包含特定关键词的数据
    const excludeKeywords = ['加工', 'アーチ', '料金']
    const filteredItems = items.filter((item: ShippingItem) => {
      const productName = item.product_name || ''
      const shouldExclude = excludeKeywords.some((keyword) => productName.includes(keyword))
      return !shouldExclude
    })

    console.log(
      `过滤后剩余 ${filteredItems.length} 条数据（过滤掉 ${items.length - filteredItems.length} 条包含特定关键词的数据）`,
    )

    // 打印前几条数据用于调试
    if (filteredItems.length > 0) {
      console.log('过滤后数据示例:', filteredItems.slice(0, 2))
    }

    if (filteredItems.length === 0) {
      console.warn('过滤后无数据。请检查后端数据库或当前筛选条件，确认是否有符合条件的数据。')
      ElMessage.warning({
        message:
          '出荷データが見つかりません。データベースに出荷データが存在しないか、現在のフィルター条件に合致するデータがありません。',
        duration: 8000, // Extend duration for more info
        showClose: true, // Allow user to close it
      })
      palletGroups.value = [] // Ensure palletGroups is cleared when no items
      return // Exit function early if no items
    }

    // 按shipping_no分组
    const grouped = filteredItems.reduce((acc: Record<string, PalletGroup>, item: ShippingItem) => {
      console.log('处理项目:', item.shipping_no, item.product_cd, 'status:', item.status)

      if (!acc[item.shipping_no]) {
        console.log(
          '创建新托盘组:',
          item.shipping_no,
          'status:',
          item.status,
          'picker_id:',
          item.picker_id,
        )
        acc[item.shipping_no] = {
          shipping_no: item.shipping_no,
          shipping_date: item.shipping_date,
          items: [],
          totalUnits: 0,
          totalBoxes: 0,
          status: 'pending', // 暂时设为pending，后面会重新计算
          picker_id: item.picker_id || '', // 从API数据中读取picker_id字段
          picker_name: item.picker_name || item.picker_id || '', // 从API数据中读取picker_name字段
        }
      }
      acc[item.shipping_no].items.push(item)
      // 使用confirmed_units，如果不存在则使用confirmed_boxes
      const units = Number(item.confirmed_units || item.confirmed_boxes) || 0
      const boxes = Number(item.confirmed_boxes) || 0
      acc[item.shipping_no].totalUnits += units
      acc[item.shipping_no].totalBoxes += boxes

      return acc
    }, {})

    // 计算每个托盘的整体状态
    for (const pallet of Object.values(grouped) as PalletGroup[]) {
      const statuses = pallet.items.map((item) => item.status)
      console.log(`托盘 ${pallet.shipping_no} 项目状态:`, statuses)

      // 如果所有项目都是completed，则托盘状态为completed
      if (statuses.every((status) => status === 'completed')) {
        pallet.status = 'completed'
      }
      // 如果有任何项目是picking，则托盘状态为picking
      else if (statuses.some((status) => status === 'picking')) {
        pallet.status = 'picking'
      }
      // 否则默认为pending
      else {
        pallet.status = 'pending'
      }

      console.log(
        `托盘 ${pallet.shipping_no} 最终状态: ${pallet.status}, 累计: units=${pallet.totalUnits}, boxes=${pallet.totalBoxes}`,
      )
    }

    palletGroups.value = Object.values(grouped)
    console.log(`分组后的托盘数量: ${palletGroups.value.length}`)
    console.log('完整的托盘数据:', palletGroups.value)

    if (palletGroups.value.length > 0) {
      ElMessage.success(`${palletGroups.value.length}個のパレットを取得しました`)
    } else {
      // This path means items had data, but grouping failed (very unlikely if reduce is fine)
      console.error(
        'API返回了数据，但分组后未生成任何托盘组。请检查分组逻辑或数据完整性。',
        filteredItems,
      )
      ElMessage.error(
        'データの処理中に問題が発生しました。詳細については、コンソールログを確認してください。',
      )
    }
  } catch (error: any) {
    console.error('出荷データ取得エラー:', error)

    // 提供更详细的错误信息
    let errorMessage = '出荷データの取得に失敗しました'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    loading.value.fetch = false
  }
}

function resetFilters() {
  filters.value.status = ''
  dateRange.value = [today, today]
}

// 快捷日期设置函数
function setDateRange(dayOffset: number) {
  if (dayOffset === 0) {
    // 今日按钮：设置为今天
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    dateRange.value = [dateStr, dateStr]
  } else {
    // 前日/翌日按钮：基于当前选择的日期进行增减
    const currentDate = dateRange.value[0] ? new Date(dateRange.value[0]) : new Date()
    currentDate.setDate(currentDate.getDate() + dayOffset)
    const dateStr = currentDate.toISOString().slice(0, 10)
    dateRange.value = [dateStr, dateStr]
  }
}

function togglePalletDetail(shippingNo: string) {
  const index = expandedPallets.value.indexOf(shippingNo)
  if (index > -1) {
    expandedPallets.value.splice(index, 1)
  } else {
    expandedPallets.value.push(shippingNo)
  }
}

async function syncShippingData() {
  loading.value.sync = true
  try {
    console.log('開始shipping_itemsからpicking_tasksへデータ同期...')

    // 使用已有的同步API
    const response = await request.post('/api/shipping/picking/sync-data')

    console.log('データ同期レスポンス:', response)

    if (response.success) {
      ElMessage.success(response.message || 'データ同期が完了しました')
      // 立即刷新数据
      await fetchShippingData()
      console.log(`syncShippingData完成后，palletGroups数量: ${palletGroups.value.length}`)
    } else {
      ElMessage.error(response.message || 'データ同期に失敗しました')
    }
  } catch (error: any) {
    console.error('データ同期エラー:', error)

    let errorMessage = 'データ同期に失敗しました'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    loading.value.sync = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return 'ピッキング済'
    case 'pending':
      return '未ピッキング'
    default:
      return status || '未ピッキング' // 直接显示原始状态值，如果为空则显示'未ピッキング'
  }
}

function getStatusType(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}

// 防抖函数：延迟执行数据获取，避免频繁请求
function debouncedFetchData() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    fetchShippingData()
  }, 500) // 500ms 防抖延迟
}

// 监听筛选条件变化，自动重新获取数据
watch(
  [dateRange, () => filters.value.status],
  () => {
    debouncedFetchData()
  },
  { deep: true },
)

onMounted(async () => {
  // 页面加载时直接获取数据，不需要用户手动筛选
  await fetchShippingData()
})
</script>

<style scoped>
.picking-list-generator {
  padding: 20px;
}

/* 上部区域：标题和按钮 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.page-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.action-buttons-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 中部筛选区域 */
.filter-section {
  margin-bottom: 24px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.filter-form {
  margin: 0;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

/* 日期选择器组样式 */
.date-picker-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-quick-buttons {
  display: flex;
  gap: 6px;
}

.date-quick-buttons .el-button {
  min-width: 48px;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.date-quick-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 下部列表显示区域 */
.list-section {
  margin-bottom: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.is-loading {
  animation: rotating 2s linear infinite;
  color: #409eff;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-hint {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.pallet-table {
  overflow: hidden;
}

.pallet-main-table {
  margin-bottom: 0;
}

.pallet-no-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pallet-number {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.quantity-value {
  font-weight: 600;
  color: #67c23a;
}

.box-value {
  font-weight: 600;
  color: #409eff;
}

.product-list {
  max-height: 100px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-code {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  min-width: 80px;
}

.product-name {
  flex: 1;
  font-size: 12px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-quantity {
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
  min-width: 60px;
  text-align: right;
}

.destination-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.destination-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.destination-code {
  font-size: 11px;
  color: #909399;
}

.pallet-detail-section {
  margin-top: 12px;
}

.pallet-detail-content {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
}

.detail-header {
  margin-bottom: 12px;
}

.detail-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.detail-table {
  margin: 0;
}

.picker-id {
  font-weight: 600;
  color: #409eff;
  font-size: 13px;
}

.no-picker {
  color: #909399;
  font-size: 12px;
  font-style: italic;
}

/* 响应式设计 */

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-buttons-section {
    justify-content: flex-end;
  }

  .statistics-section .el-col {
    margin-bottom: 16px;
  }

  .statistics-card {
    padding: 16px 12px;
  }

  .statistics-content {
    gap: 12px;
  }

  .statistics-icon {
    transform: scale(0.9);
  }

  .statistics-value {
    font-size: 20px;
  }

  .statistics-label {
    font-size: 12px;
  }

  .filter-form {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .date-picker-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .date-quick-buttons {
    justify-content: center;
  }

  .date-quick-buttons .el-button {
    flex: 1;
    max-width: 80px;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .pallet-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

/* 统计卡片区域 */
.statistics-section {
  margin-bottom: 24px;
}

.statistics-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px 16px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: none;
  backdrop-filter: blur(10px);
}

.statistics-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  opacity: 0.9;
  z-index: -1;
}

.statistics-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.total-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.total-card::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.pending-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  position: relative;
}

.pending-card::after {
  content: '';
  position: absolute;
  top: -30%;
  left: -30%;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 4s ease-in-out infinite reverse;
}

.completed-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  position: relative;
}

.completed-card::after {
  content: '';
  position: absolute;
  bottom: -40%;
  right: -40%;
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 5s ease-in-out infinite;
}

.completion-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  position: relative;
}

.completion-card::after {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite reverse;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
    opacity: 1;
  }
}

.statistics-card .statistics-icon,
.statistics-card .statistics-label,
.statistics-card .statistics-value {
  color: #ffffff !important;
  position: relative;
  z-index: 2;
}

.statistics-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.statistics-icon {
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.statistics-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.statistics-label {
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 13px;
  opacity: 0.9;
  letter-spacing: 0.5px;
}

.statistics-value {
  font-weight: 700;
  font-size: 24px;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: countUp 0.8s ease-out;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
