<template>
  <div class="stock-trend-container">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <div class="title-icon">📈</div>
          <div class="title-content">
            <h1>製品在庫推移表</h1>
            <span class="subtitle">リアルタイム在庫状況の監視と分析</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选器面板 -->
    <div class="filter-panel">
      <div class="filter-header">
        <div class="filter-title">
          <el-icon>
            <Filter />
          </el-icon>
          検索条件
        </div>
        <div class="filter-actions">
          <el-button-group class="action-buttons">
            <el-button
              type="info"
              @click="shippingDepletionVisible = true"
              size="default"
              class="depletion-btn"
            >
              <el-icon>
                <TrendCharts />
              </el-icon>
              出荷枯渇予測
            </el-button>
            <el-button
              type="danger"
              @click="recalculateAllProducts"
              :loading="loadingAll"
              :disabled="!filters.location_cd || !filters.date_range?.length"
              size="default"
              class="recalc-all-btn"
            >
              <el-icon>
                <Refresh />
              </el-icon>
              全製品再計算
              <span class="btn-subtitle">（92日間）</span>
            </el-button>
          </el-button-group>
          <el-button
            type="primary"
            @click="fetchData"
            :disabled="!validateForSearch()"
            class="search-btn"
          >
            <el-icon>
              <Search />
            </el-icon>
            検索
          </el-button>
          <el-button
            type="warning"
            @click="recalculateData"
            :disabled="!validateForRecalc()"
            class="recalc-btn"
          >
            <el-icon>
              <Refresh />
            </el-icon>
            再計算
          </el-button>
        </div>
      </div>

      <div class="filter-content">
        <el-row :gutter="24">
          <!-- 产品选择 -->
          <el-col :lg="8" :md="12" :sm="24">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon>
                  <Box />
                </el-icon>
                製品選択
              </label>
              <el-input
                v-model="productText"
                placeholder="クリックして製品を選択..."
                readonly
                @click="dialogVisible = true"
                class="product-selector"
              >
                <template #suffix>
                  <el-icon class="cursor-pointer">
                    <ArrowDown />
                  </el-icon>
                </template>
              </el-input>
            </div>
          </el-col>

          <!-- 保管場所 -->
          <el-col :lg="6" :md="12" :sm="24">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon>
                  <OfficeBuilding />
                </el-icon>
                保管場所
              </label>
              <el-select
                v-model="filters.location_cd"
                placeholder="選択してください"
                class="w-full"
              >
                <el-option
                  v-for="loc in locationOptions"
                  :key="loc.cd"
                  :label="loc.name"
                  :value="loc.cd"
                >
                  <span>{{ loc.name }}</span>
                </el-option>
              </el-select>
            </div>
          </el-col>

          <!-- 日期范围 -->
          <el-col :lg="10" :md="24" :sm="24">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon>
                  <Calendar />
                </el-icon>
                期間設定
              </label>
              <div class="date-range-container">
                <el-date-picker
                  v-model="filters.date_range"
                  type="daterange"
                  start-placeholder="開始日"
                  end-placeholder="終了日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="date-picker"
                  size="default"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="data-stats" v-if="trendData.length">
          <el-tag type="info" size="large" effect="plain">
            <el-icon>
              <DataBoard />
            </el-icon>
            総件数: {{ trendData.length }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 警告提示区域 -->
    <div v-if="stockDepletionAlerts.length" class="alert-section">
      <div class="alert-header">
        <el-icon class="alert-icon">
          <WarningFilled />
        </el-icon>
        <h4>在庫枯渇警告</h4>
      </div>
      <div class="alert-grid">
        <el-alert
          v-for="alert in stockDepletionAlerts"
          :key="alert"
          type="error"
          :title="`枯渇予定: ${alert}`"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="content-area">
      <!-- 表格视图 -->
      <el-card v-if="viewMode === 'table'" class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon>
                <Grid />
              </el-icon>
              在庫推移データ
            </div>
            <div class="view-switcher">
              <el-radio-group v-model="viewMode" size="default">
                <el-radio-button value="table">
                  <el-icon>
                    <Grid />
                  </el-icon>
                  表形式
                </el-radio-button>
                <el-radio-button value="chart">
                  <el-icon>
                    <TrendCharts />
                  </el-icon>
                  チャート
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>

        <div class="table-container">
          <el-table
            :data="trendData"
            stripe
            border
            :row-class-name="getRowClass"
            empty-text="データがありません。検索条件を設定して検索ボタンをクリックしてください。"
            table-layout="auto"
            class="trend-table"
          >
            <el-table-column label="日付" width="190" align="center" fixed>
              <template #default="{ row }">
                <div class="date-cell">
                  <el-icon>
                    <Calendar />
                  </el-icon>
                  {{ formatDate(row.date) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="製品情報" width="160" fixed>
              <template #default="{ row }">
                <div class="product-cell">
                  <div class="product-code">{{ row.product_cd }}</div>
                  <div class="product-name">{{ row.product_name }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="初期" width="80" align="right">
              <template #default="{ row }">
                <div class="number-cell initial">
                  <el-icon v-if="row['初期'] > 0">
                    <Star />
                  </el-icon>
                  {{ formatNumber(row['初期']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="入庫" width="80" align="right">
              <template #default="{ row }">
                <div class="number-cell positive">
                  <el-icon v-if="row['入庫'] > 0">
                    <Plus />
                  </el-icon>
                  {{ formatNumber(row['入庫']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="出庫" width="100" align="right">
              <template #default="{ row }">
                <div class="number-cell negative">
                  <el-icon v-if="row['出庫'] > 0">
                    <Minus />
                  </el-icon>
                  {{ formatNumber(row['出庫']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="調整" width="100" align="right">
              <template #default="{ row }">
                <div class="number-cell">
                  {{ formatNumber(row['調整']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="廃棄" width="100" align="right">
              <template #default="{ row }">
                <div class="number-cell negative">
                  <el-icon v-if="row['廃棄'] > 0">
                    <Delete />
                  </el-icon>
                  {{ formatNumber(row['廃棄']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="保留" width="100" align="right">
              <template #default="{ row }">
                <div class="number-cell">
                  {{ formatNumber(row['保留']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="出荷" width="100" align="right">
              <template #default="{ row }">
                <div class="number-cell negative">
                  <el-icon v-if="row['出荷'] > 0">
                    <Van />
                  </el-icon>
                  {{ formatNumber(row['出荷']) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="差引累計" width="130" align="right">
              <template #default="{ row }">
                <div class="cumulative-cell">
                  <el-tag
                    :type="
                      row['差引累計'] < 0 ? 'danger' : row['差引累計'] === 0 ? 'warning' : 'success'
                    "
                    size="large"
                    effect="dark"
                  >
                    {{ formatNumber(row['差引累計']) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="状態" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row['差引累計'] < 0
                      ? 'danger'
                      : row['差引累計'] < warningLevel
                        ? 'warning'
                        : 'success'
                  "
                  size="large"
                  effect="dark"
                  round
                >
                  <template #icon>
                    <el-icon v-if="row['差引累計'] < 0">
                      <CircleCloseFilled />
                    </el-icon>
                    <el-icon v-else-if="row['差引累計'] < warningLevel">
                      <WarningFilled />
                    </el-icon>
                    <el-icon v-else>
                      <CircleCheckFilled />
                    </el-icon>
                  </template>
                  {{
                    row['差引累計'] < 0 ? '枯渇' : row['差引累計'] < warningLevel ? '警戒' : '正常'
                  }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 图表视图 -->
      <el-card v-if="viewMode === 'chart' && trendData.length" class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon>
                <TrendCharts />
              </el-icon>
              差引累計チャート
            </div>
          </div>
        </template>
        <stock-trend-chart :data="trendData" :warning-level="warningLevel" />
      </el-card>

      <!-- 空状态 -->
      <el-empty
        v-if="!trendData.length && viewMode === 'table'"
        description="データがありません"
        class="empty-state"
      >
        <template #image>
          <el-icon size="60">
            <DataBoard />
          </el-icon>
        </template>
        <el-button
          type="primary"
          @click="
            () => {
              if (!validateForSearch()) {
                ElMessage.warning('すべての検索条件を入力してください')
                return
              }
              fetchData()
            }
          "
        >
          検索を実行
        </el-button>
      </el-empty>
    </div>

    <!-- 对话框 -->
    <product-select-dialog v-model="dialogVisible" @confirm="handleProductSelect" />
    <shipping-depletion-dialog v-model="shippingDepletionVisible" />
  </div>
</template>

<script setup lang="ts">
// 引入vue函数和element plus消息组件
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
// 引入Element Plus图标
import {
  Grid,
  TrendCharts,
  Filter,
  Search,
  Refresh,
  Box,
  OfficeBuilding,
  Calendar,
  ArrowDown,
  WarningFilled,
  DataBoard,
  Plus,
  Minus,
  Delete,
  Van,
  CircleCloseFilled,
  CircleCheckFilled,
  Star,
} from '@element-plus/icons-vue'
// 引入请求工具、图表组件、产品选择组件等
import request from '@/utils/request'
import StockTrendChart from './ProductStockTrendChart.vue'
import ProductSelectDialog from '@/views/components/ProductSelectDialog.vue'
import { getProductOptions } from '@/api/options'
import ShippingDepletionDialog from './OrderDepletionDialog.vue'

// 格式化函数逗号分隔
const formatNumber = (val: number | string | undefined): string => {
  if (val == null) return '0'
  return Number(val).toLocaleString('ja-JP')
}

// 预警阈值
const warningLevel = 0
// 当前视图模式：表格或图表
const viewMode = ref<'table' | 'chart'>('table')

// 产品数据类型定义
interface ProductItem {
  cd: string
  name: string
}

// 日期格式化函数
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

// 产品选择对话框开关
const dialogVisible = ref(false)
// 已选择产品
const selectedProducts = ref<ProductItem[]>([])
// 出荷枯渇对话框开关
const shippingDepletionVisible = ref(false)
// 产品文本显示
const productText = ref('')

// 处理产品选择后的回调
const handleProductSelect = async (selectedCds: string[]) => {
  try {
    // 如果没有选择任何产品，清空选择
    if (!selectedCds || selectedCds.length === 0) {
      selectedProducts.value = []
      filters.value.product_cd_list = []
      productText.value = ''
      return
    }

    const all = await getProductOptions()
    selectedProducts.value = all
      .filter((opt) => selectedCds.includes(opt.cd))
      .map((opt) => ({ cd: opt.cd, name: opt.name }))
    filters.value.product_cd_list = selectedProducts.value.map((p) => p.cd)
    productText.value = selectedProducts.value.map((p) => `${p.cd}｜${p.name}`).join(', ')
  } catch (error) {
    console.error('产品选择处理错误:', error)
    ElMessage.error('製品選択の処理中にエラーが発生しました')
  }
}

// 保管場所选项
const locationOptions = [
  '製品倉庫',
  '仮設倉庫',
  '仕上倉庫',
  'メッキ倉庫',
  '加工棟',
  '部品倉庫',
  'その他',
].map((cd) => ({ cd, name: cd }))

// 获取当月的日期范围（日本时区）
function getCurrentMonthRange(): [string, string] {
  // 使用日本时区
  const japanTimeZone = 'Asia/Tokyo'
  const now = new Date()

  // 转换为日本时区
  const japanTime = new Date(now.toLocaleString('en-US', { timeZone: japanTimeZone }))
  const year = japanTime.getFullYear()
  const month = japanTime.getMonth()

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  // 格式化为YYYY-MM-DD格式
  const format = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return [format(startDate), format(endDate)]
}

// 查询条件初始值
const filters = ref({
  product_cd_list: [] as string[],
  location_cd: '製品倉庫',
  date_range: getCurrentMonthRange(),
})

// 在庫推移数据
const trendData = ref<any[]>([])
const loadingAll = ref(false)

// 计算枯渇预警（首次出现负数库存的日期）
const stockDepletionAlerts = computed(() => {
  const firstDepletion: Record<string, string> = {}
  for (const row of trendData.value) {
    if (row['差引累計'] < 0) {
      const cd = row.product_cd
      const name = row.product_name ?? ''
      if (!firstDepletion[cd]) {
        firstDepletion[cd] = `${formatDate(row.date)}（${cd}｜${name}）`
      }
    }
  }
  return Object.values(firstDepletion)
})

// 全产品库存推移再计算
const recalculateAllProducts = async () => {
  const { location_cd, date_range } = filters.value
  if (!location_cd || date_range.length !== 2) {
    ElMessage.warning('保管場所・期間を指定してください')
    return
  }

  // 计算新的结束日期：开始日期 + 92天
  const startDate = new Date(date_range[0])
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 92)

  // 格式化结束日期
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const calculatedEndDate = formatDate(endDate)

  try {
    loadingAll.value = true
    // 先清空表
    await request.post('/api/stock/clear-trends')
    ElMessage.success('在庫推移テーブルをクリアしました')

    // 然后重新计算全部产品（使用新的结束日期）
    await request.get('/api/stock/product-trend/all', {
      params: {
        location_cd,
        start_date: date_range[0],
        end_date: calculatedEndDate,
      },
    })
    ElMessage.success(
      `全製品の在庫推移を再計算しました（${date_range[0]} ～ ${calculatedEndDate}）`,
    )
    if (filters.value.product_cd_list.length > 0) await fetchData()
  } catch (err: any) {
    ElMessage.error(err?.message || '全体再計算に失敗しました')
  } finally {
    loadingAll.value = false
  }
}

// 单个产品在庫推移查询
const fetchData = async () => {
  if (!validateForSearch()) {
    ElMessage.warning('すべての検索条件を入力してください')
    return
  }
  try {
    const res = await request.get('/api/stock/daily-trends', {
      params: {
        product_cd: filters.value.product_cd_list[0],
        location_cd: filters.value.location_cd,
        start_date: filters.value.date_range[0],
        end_date: filters.value.date_range[1],
      },
    })
    trendData.value = res
  } catch (err: any) {
    ElMessage.error(err?.message || '在庫推移の取得に失敗しました')
  }
}

// 产品再计算
const recalculateData = async () => {
  if (!validateForRecalc()) {
    ElMessage.warning('製品CD・保管場所・期間を指定してください')
    return
  }
  try {
    await request.get('/api/stock/product-trend', {
      params: {
        product_cd_list: filters.value.product_cd_list,
        location_cd: filters.value.location_cd,
        start_date: filters.value.date_range[0],
        end_date: filters.value.date_range[1],
      },
    })
    ElMessage.success('再計算完了（キャッシュ生成済み）')
    await fetchData()
  } catch (err: any) {
    ElMessage.error(err?.message || '再計算に失敗しました')
  }
}

// 校验搜索条件
const validateForRecalc = () => {
  const { product_cd_list, location_cd, date_range } = filters.value
  if (!product_cd_list.length || !location_cd || date_range.length !== 2) {
    return false
  }
  return true
}

const validateForSearch = () => {
  const { product_cd_list, location_cd, date_range } = filters.value
  if (!product_cd_list.length || !location_cd || date_range.length !== 2) {
    return false
  }
  return true
}

// 获取首次枯渇日期，用于行高亮
const firstDepletionDates = computed(() => {
  const result: Record<string, string> = {}
  for (const row of trendData.value) {
    if (row['差引累計'] < 0) {
      const cd = row.product_cd
      if (!result[cd]) result[cd] = formatDate(row.date)
    }
  }
  return result
})

// 设置表格行class
const getRowClass = ({ row }: { row: any }) => {
  const cd = row.product_cd
  const date = formatDate(row.date)
  if (firstDepletionDates.value[cd] === date) return 'danger-row'
  return ''
}
</script>

<style scoped>
/* ===== 基础样式重置 ===== */
* {
  box-sizing: border-box;
}

/* ===== 页面整体样式 ===== */
.stock-trend-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #212529;
}

/* ===== 页面标题区域 ===== */
.page-header {
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(47, 150, 247, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.title-icon {
  font-size: 2.5rem;
}

.title-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: white;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 400;
  margin-top: 4px;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* ===== 按钮美化样式 ===== */
.depletion-btn {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
  border: none !important;
  box-shadow: 0 3px 10px rgba(108, 117, 125, 0.3) !important;
  transition: all 0.3s ease !important;
  padding: 10px 18px !important;
  color: white !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
}

.depletion-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4) !important;
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%) !important;
}

.search-btn {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
  border: none !important;
  box-shadow: 0 3px 10px rgba(0, 123, 255, 0.3) !important;
  transition: all 0.3s ease !important;
  padding: 10px 20px !important;
  color: white !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
}

.search-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.4) !important;
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%) !important;
}

.search-btn:disabled {
  background: #6c757d !important;
  box-shadow: none !important;
  transform: none !important;
  opacity: 0.6 !important;
}

.recalc-btn {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important;
  border: none !important;
  box-shadow: 0 3px 10px rgba(255, 193, 7, 0.3) !important;
  transition: all 0.3s ease !important;
  padding: 10px 18px !important;
  color: #212529 !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
}

.recalc-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 15px rgba(255, 193, 7, 0.4) !important;
  background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%) !important;
}

.recalc-btn:disabled {
  background: #6c757d !important;
  box-shadow: none !important;
  transform: none !important;
  opacity: 0.6 !important;
}

/* ===== 视图切换器样式 ===== */
.view-switcher {
  display: flex;
  align-items: center;
}

.view-switcher :deep(.el-radio-group) {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.view-switcher :deep(.el-radio-button__inner) {
  background: transparent;
  border: none;
  color: #495057;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.view-switcher :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.view-switcher :deep(.el-radio-button__inner:hover) {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

/* ===== 筛选器面板 ===== */
.filter-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
}

.filter-header {
  background: #f8f9fa;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.filter-title {
  margin: 0;
  font-size: 1.2rem;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.filter-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.filter-content {
  padding: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-label {
  font-weight: 600;
  color: #212529;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.product-selector {
  width: 100%;
}

.date-range-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-picker {
  width: 100%;
}

/* ===== 操作工具栏 ===== */
.toolbar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.data-stats :deep(.el-tag) {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  font-weight: 600;
  padding: 8px 16px;
}

/* ===== 警告提示区域 ===== */
.alert-section {
  background: #fff5f5;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  padding: 20px 24px;
  border: 1px solid #fed7d7;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.alert-header h4 {
  margin: 0;
  color: #c53030;
  font-size: 1.1rem;
  font-weight: 600;
}

.alert-icon {
  font-size: 1.2rem;
  color: #c53030;
}

.alert-grid {
  display: grid;
  gap: 12px;
}

/* ===== 数据展示区域 ===== */
.content-area {
  border-radius: 12px;
}

.table-card,
.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.2rem;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
}

.trend-table {
  width: 100%;
}

/* 表格单元格样式 */
.date-cell {
  font-weight: 600;
  color: #212529;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-code {
  font-weight: 600;
  color: #212529;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.product-name {
  color: #495057;
  font-size: 0.85rem;
  line-height: 1.3;
}

.number-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  color: #212529;
}

.number-cell.positive {
  color: #28a745;
}

.number-cell.negative {
  color: #dc3545;
}

.number-cell.initial {
  color: #6f42c1;
}

.cumulative-cell {
  display: flex;
  justify-content: flex-end;
}

/* 表格行样式 */
:deep(.el-table__row.danger-row) {
  background-color: #fff5f5 !important;
  border-left: 4px solid #e53e3e;
}

:deep(.el-table__row.danger-row:hover) {
  background-color: #fed7d7 !important;
}

:deep(.el-table th) {
  background-color: #f8f9fa !important;
  color: #212529 !important;
  font-weight: 600 !important;
  border-bottom: 2px solid #dee2e6 !important;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f8f9fa !important;
  padding: 12px 8px !important;
  color: #212529 !important;
}

:deep(.el-table__body tr:hover) {
  background-color: #f8f9fa !important;
}

:deep(.el-table__fixed-column--left) {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* ===== 空状态 ===== */
.empty-state {
  padding: 80px 24px;
  color: #495057;
}

/* ===== 响应式设计 ===== */
@media (max-width: 1200px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .filter-actions {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stock-trend-container {
    padding: 16px;
  }

  .page-header {
    padding: 24px 20px;
  }

  .title-content h1 {
    font-size: 1.6rem;
  }

  .filter-content {
    padding: 20px;
  }

  .filter-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .filter-actions {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .view-switcher {
    order: -1;
  }
}

@media (max-width: 480px) {
  .title-content h1 {
    font-size: 1.4rem;
  }

  .title-icon {
    font-size: 2rem;
  }

  .filter-title {
    font-size: 1.1rem;
  }

  .card-title {
    font-size: 1.1rem;
  }
}

/* ===== Element Plus 组件样式覆盖 ===== */
:deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #ced4da;
}

:deep(.el-input__wrapper:hover) {
  border-color: #adb5bd;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-date-editor) {
  border-radius: 6px;
  border: 1px solid #ced4da;
}

:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  color: #212529;
}

:deep(.el-button--primary) {
  background-color: #007bff;
  border-color: #007bff;
}

:deep(.el-button--warning) {
  background-color: #ffc107;
  border-color: #ffc107;
}

:deep(.el-button--danger) {
  background-color: #dc3545;
  border-color: #dc3545;
}

:deep(.el-button--info) {
  background-color: #6c757d;
  border-color: #6c757d;
}

:deep(.el-alert) {
  border-radius: 6px;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

:deep(.el-card) {
  border: 1px solid #e9ecef;
}

:deep(.el-card__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #212529;
}

:deep(.w-full) {
  width: 100%;
}

:deep(.cursor-pointer) {
  cursor: pointer;
}

.recalc-all-btn {
  position: relative;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
  border: none !important;
  box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3) !important;
  transition: all 0.3s ease !important;
  padding: 10px 18px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 2px !important;
  min-width: 120px !important;
  color: white !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
}

.recalc-all-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4) !important;
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%) !important;
}

.recalc-all-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3) !important;
}

.recalc-all-btn.is-loading {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3) !important;
}

.recalc-all-btn:disabled {
  background: #6c757d !important;
  box-shadow: none !important;
  transform: none !important;
  opacity: 0.6 !important;
}

.btn-subtitle {
  font-size: 0.7rem !important;
  color: rgba(255, 255, 255, 0.8) !important;
  font-weight: 400 !important;
  line-height: 1 !important;
  margin-top: 1px !important;
}

/* ===== 确保所有文本都是黑色 ===== */
/* .stock-trend-container,
.stock-trend-container * {
  color: #212529;
}

.stock-trend-container .el-input__inner,
.stock-trend-container .el-select__placeholder,
.stock-trend-container .el-date-editor__editor {
  color: #212529 !important;
} */
</style>
