<template>
  <el-card class="stock-recalc-card" shadow="hover">
    <!-- 新的顶部布局 -->
    <div class="page-header">
      <div class="header-left">
        <p v-if="result?.updatedCount" class="summary-text">
          ✅ 更新件数: <strong>{{ result.updatedCount }}</strong> 件
          <span v-if="executedAt" class="executed-at"
            >📅 最終再計算日時：{{ formatExecutedAt(executedAt) }}</span
          >
        </p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :loading="loading"
          @click="confirmRecalculate"
          round
          icon="Refresh"
        >
          再計算を実行
        </el-button>
        <el-button type="success" @click="handlePrint" round icon="Printer"> 印刷 </el-button>
      </div>
    </div>

    <!-- メッセージ -->
    <el-alert
      v-if="result?.message"
      :title="result.message"
      :type="result?.updatedCount ? 'success' : 'info'"
      show-icon
      class="alert-box"
    />

    <!-- ❌ 負在庫 -->
    <el-card v-if="result.anomalies.negativeStock.length" class="anomaly-card" shadow="never">
      <template #header>❌ <strong>在庫不足一覧</strong></template>
      <el-table :data="result.anomalies.negativeStock" border stripe size="small">
        <el-table-column label="製品CD" prop="product_cd" width="120" />
        <el-table-column label="製品名" prop="product_name" width="180" />
        <el-table-column label="倉庫CD" prop="location_cd" width="160" />
        <el-table-column label="ロット" prop="lot_no" width="120" />
        <el-table-column label="数量" prop="quantity" />
      </el-table>
    </el-card>

    <!-- ⚠️ 同一製品多倉庫 -->
    <el-card v-if="result.anomalies.multiLocations.length" class="anomaly-card" shadow="never">
      <template #header>⚠️ <strong>同一製品が複数倉庫に存在</strong></template>
      <el-table :data="result.anomalies.multiLocations" border stripe size="small">
        <el-table-column label="製品CD" prop="product_cd" />
        <el-table-column label="製品名" prop="product_name" width="180" />
        <el-table-column label="倉庫数" prop="location_count" />
      </el-table>
    </el-card>

    <!-- ⚠️ 重複ロット -->
    <el-card v-if="result.anomalies.duplicateLots.length" class="anomaly-card" shadow="never">
      <template #header>⚠️ <strong>重複ロット</strong></template>
      <el-table :data="result.anomalies.duplicateLots" border stripe size="small">
        <el-table-column label="製品CD" prop="product_cd" width="120" />
        <el-table-column label="製品名" prop="product_name" width="180" />
        <el-table-column label="倉庫CD" prop="location_cd" width="160" />
        <el-table-column label="重複数" prop="count" />
      </el-table>
    </el-card>

    <!-- 📦 製品在庫一覧 -->
    <el-card class="stock-list-card" shadow="always">
      <template #header>
        <div class="stock-list-header">
          <h3>📦 製品在庫一覧</h3>
        </div>
      </template>

      <div class="stock-summary-cards">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-title">📋 件数</div>
          <div class="summary-value count-color">
            {{ filteredStockList.length.toLocaleString() }}
          </div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div class="summary-title">📦 総箱数</div>
          <div class="summary-value boxes-color">{{ totalBoxes.toLocaleString() }}</div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div class="summary-title">📦 総在庫数</div>
          <div class="summary-value quantity-color">{{ totalQuantity.toLocaleString() }}</div>
        </el-card>
      </div>

      <!-- 箱型統計 -->
      <el-card
        v-if="result.boxTypeStats && result.boxTypeStats.length > 0"
        class="box-stats-card"
        shadow="hover"
      >
        <template #header>
          <div class="box-stats-header">
            <h4>箱タイプ別集計</h4>
          </div>
        </template>
        <div class="box-stats-container">
          <div v-for="item in result.boxTypeStats" :key="item.box_type" class="box-stats-item">
            <div class="box-type">{{ item.box_type }}</div>
            <div class="box-count">{{ Number(item.total_boxes).toLocaleString() }} 箱</div>
          </div>
        </div>
      </el-card>

      <el-input
        v-model="searchKeyword"
        placeholder="製品CD、製品名または納入先名で検索"
        clearable
        size="small"
        class="search-input"
      />

      <el-table
        :data="pagedStockList"
        border
        stripe
        size="small"
        height="420"
        @sort-change="handleSort"
        class="stock-table"
      >
        <el-table-column label="倉庫CD" prop="location_cd" width="140" />
        <el-table-column label="納入先名" prop="destination_name" min-width="140" />
        <!-- <el-table-column label="製品CD" prop="product_cd" width="120" /> -->
        <el-table-column label="製品名" prop="product_name" sortable min-width="160" />
        <el-table-column label="入数" prop="unit_per_box" width="100">
          <template #default="{ row }">
            {{ row.unit_per_box?.toLocaleString() || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="箱タイプ" prop="box_type" width="120" />
        <el-table-column label="箱数" prop="boxes" width="100" sortable>
          <template #default="{ row }">
            <span class="boxes-highlight">{{ row.boxes?.toLocaleString() || '0' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="100" sortable>
          <template #default="{ row }">
            <span class="quantity-highlight">{{ row.quantity?.toLocaleString() || '0' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="filteredStockList.length"
        size="small"
        class="pagination"
      />
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

interface StockItem {
  product_cd: string
  product_name?: string
  location_cd: string
  lot_no: string
  quantity: number
  boxes?: number
  unit_per_box?: number
  box_type?: string
  destination_name?: string
}

interface NegativeStockItem {
  product_cd: string
  product_name?: string
  location_cd: string
  lot_no: string
  quantity: number
}

interface MultiLocationItem {
  product_cd: string
  product_name?: string
  location_count: number
}

interface DuplicateLotItem {
  product_cd: string
  product_name?: string
  location_cd: string
  count: number
}

interface SortChangeEvent {
  prop: 'product_name' | 'quantity' | 'boxes' | ''
  order: 'ascending' | 'descending' | null
}

interface Result {
  message: string
  updatedCount: number
  executedAt?: string
  anomalies: {
    negativeStock: NegativeStockItem[]
    multiLocations: MultiLocationItem[]
    duplicateLots: DuplicateLotItem[]
  }
  stockList: StockItem[]
  boxTypeStats?: { box_type: string; total_boxes: number }[]
}

const loading = ref(false)
const result = ref<Result>({
  message: '',
  updatedCount: 0,
  anomalies: { negativeStock: [], multiLocations: [], duplicateLots: [] },
  stockList: [],
})

const executedAt = ref<string | null>(null)
const searchKeyword = ref('')
const pageSize = ref(20)
const currentPage = ref(1)
const sortProp = ref<'product_name' | 'quantity' | 'boxes' | ''>('')
const sortOrder = ref<'ascending' | 'descending' | null>(null)

const handleSort = ({ prop, order }: SortChangeEvent) => {
  sortProp.value = prop
  sortOrder.value = order
}

const totalQuantity = computed(() =>
  filteredStockList.value
    .filter(
      (item) => !item.product_name?.includes('加工') && !item.product_name?.includes('アーチ'),
    )
    .reduce((sum, item) => sum + (item.quantity ?? 0), 0),
)

const totalBoxes = computed(() =>
  filteredStockList.value
    .filter(
      (item) => !item.product_name?.includes('加工') && !item.product_name?.includes('アーチ'),
    )
    .reduce((sum, item) => sum + (item.boxes ?? 0), 0),
)

const filteredStockList = computed(() => {
  if (!result.value?.stockList) return []

  // 首先过滤掉产品名包含"加工"或"アーチ"的产品
  let filtered = result.value.stockList.filter(
    (item) => !item.product_name?.includes('加工') && !item.product_name?.includes('アーチ'),
  )

  // 然后根据搜索关键词进一步过滤
  if (!searchKeyword.value.trim()) return filtered

  const keyword = searchKeyword.value.toLowerCase().trim()
  return filtered.filter(
    (item) =>
      (item.product_cd?.toLowerCase() || '').includes(keyword) ||
      (item.product_name?.toLowerCase() || '').includes(keyword) ||
      (item.destination_name?.toLowerCase() || '').includes(keyword),
  )
})

const sortedList = computed(() => {
  if (!filteredStockList.value?.length) return []
  if (!sortProp.value || !sortOrder.value) return filteredStockList.value

  const prop = sortProp.value as keyof StockItem
  return [...filteredStockList.value].sort((a, b) => {
    const valA = a[prop] ?? ''
    const valB = b[prop] ?? ''
    if (valA === valB) return 0
    return sortOrder.value === 'ascending' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
  })
})

const pagedStockList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedList.value.slice(start, Math.min(start + pageSize.value, sortedList.value.length))
})

const isAuto = ref(true)
const handleRecalculate = async () => {
  loading.value = true
  try {
    const res = await request.post('/api/stock/products/recalculate-and-check', {
      auto: isAuto.value,
    })
    result.value = res
    executedAt.value = res.executedAt
    if (!isAuto.value) {
      ElMessage.success(res.message || '在庫再計算が完了しました')
    } else if (res.updatedCount) {
      // 即使是自动模式，如果有更新也显示提示
      ElMessage.info(`自動再計算完了: ${res.updatedCount}件更新されました`)
    }
  } catch (error) {
    console.error('在庫再計算エラー:', error)
    ElMessage.error('在庫再計算に失敗しました')
    // 保持旧数据，不清空result
  } finally {
    loading.value = false
    isAuto.value = false
  }
}

const confirmRecalculate = () => {
  ElMessageBox.confirm('本当に在庫再計算を実行しますか？', '確認', {
    confirmButtonText: 'はい',
    cancelButtonText: 'いいえ',
    type: 'warning',
  })
    .then(() => {
      isAuto.value = false // 确保手动点击时isAuto为false
      handleRecalculate()
    })
    .catch(() => {
      // 用户取消，不做任何操作
    })
}

const handlePrint = () => {
  // 过滤掉产品名包含"加工"或"アーチ"的产品，然后排序
  const sorted = [...result.value.stockList]
    .filter(
      (item) => !item.product_name?.includes('加工') && !item.product_name?.includes('アーチ'),
    )
    .sort((a, b) => {
      const nameA = (a.product_name ?? '').toLowerCase()
      const nameB = (b.product_name ?? '').toLowerCase()
      if (nameA === nameB) return 0
      return nameA > nameB ? 1 : -1
    })

  // 使用后端返回的箱型统计
  const boxTypeStatsData = result.value.boxTypeStats || []

  const printContent = `
    <html>
      <head>
        <title>製品在庫一覧 印刷</title>
        <style>
          body { font-family: sans-serif; padding: 10px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; }
          th { background-color: #f0f0f0; color: #333; font-weight: bold; }
          h2 { text-align: center; margin-bottom: 20px; color: #409EFF; }

          /* 美化统计区域 */
          .summary {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            background: #f9f9f9;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }
          .summary span {
            margin: 10px 15px;
            padding: 10px 15px;
            font-weight: bold;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          /* 美化箱型统计 */
          .box-stats {
            margin: 15px 0;
            padding: 15px;
            border-radius: 8px;
            background: #f5f8fa;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .box-stats-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #409EFF;
          }
          .box-stats-item {
            display: inline-block;
            margin: 5px 10px;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          /* 表格行交替颜色 */
          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tbody tr:hover {
            background-color: #f0f7ff;
          }

          @media print {
            body { font-size: 10px; }
            h2 { font-size: 18px; }
            th, td { padding: 3px; font-size: 10px; }
            .summary, .box-stats {
              box-shadow: none;
              border: 1px solid #eee;
            }
            .summary span, .box-stats-item {
              box-shadow: none;
              border: 1px solid #eee;
            }
          }
        </style>
      </head>
      <body>
        <h2>📦 製品在庫一覧 印刷用</h2>
        <div class="summary">
          <span>総件数: ${sorted.length}</span>
          <span>総在庫数: ${sorted.reduce((sum, item) => sum + (item.quantity ?? 0), 0).toLocaleString()}</span>
          <span>総箱数: ${sorted.reduce((sum, item) => sum + (item.boxes ?? 0), 0).toLocaleString()}</span>
        </div>
        ${
          boxTypeStatsData.length > 0
            ? `
        <div class="box-stats">
          <div class="box-stats-title">📦 箱タイプ別集計:</div>
          ${boxTypeStatsData
            .map(
              (item) => `
            <div class="box-stats-item">${item.box_type}: ${Number(item.total_boxes).toLocaleString()} 箱</div>
          `,
            )
            .join('')}
        </div>
        `
            : ''
        }
        <table>
          <thead>
            <tr>
              <th>製品CD</th>
              <th>製品名</th>
              <th>納入先名</th>
              <th>倉庫CD</th>
              <th>箱数</th>
              <th>数量</th>
              <th>1箱あたり</th>
              <th>箱タイプ</th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map(
                (item) => `
              <tr>
                <td>${item.product_cd}</td>
                <td>${item.product_name ?? ''}</td>
                <td>${item.destination_name ?? ''}</td>
                <td>${item.location_cd}</td>
                <td style="text-align: right;">${(item.boxes ?? 0).toLocaleString()}</td>
                <td style="text-align: right;">${(item.quantity ?? 0).toLocaleString()}</td>
                <td style="text-align: right;">${item.unit_per_box ?? '-'}</td>
                <td>${item.box_type ?? ''}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '', 'width=900,height=600')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

const formatExecutedAt = (dateStr: string) => {
  if (!dateStr) return ''
  const dt = new Date(dateStr)
  return `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`
}

onMounted(() => {
  isAuto.value = true
  handleRecalculate()
})
</script>

<style scoped>
.stock-recalc-card {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px;
}

/* 新的顶部布局样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.summary-text {
  font-size: 14px;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.executed-at {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.alert-box {
  margin: 15px 0;
}

.anomaly-card {
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #fff8f8;
  border-left: 4px solid #f56c6c;
  transition: all 0.3s ease;
}

.anomaly-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stock-list-card {
  margin-top: 20px;
}

.stock-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stock-list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.stock-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 15px 0;
}

.summary-card {
  text-align: center;
  padding: 15px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.summary-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #67c23a, #409eff, #e6a23c);
}

.summary-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 15px;
  font-weight: 500;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 表格样式优化 */
.el-table {
  margin-top: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.el-table th {
  background-color: #f5f7fa !important;
  color: #606266;
  font-weight: 600;
  font-size: 14px !important;
}

.el-table td {
  font-size: 14px !important;
  padding: 8px 0 !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}

.el-table__body tr:hover > td {
  background-color: #f0f7ff !important;
}

.quantity-highlight {
  color: #409eff;
  font-weight: 600;
}

.boxes-highlight {
  color: #e6a23c;
  font-weight: 600;
}

/* 搜索框样式优化 */
.search-input {
  margin: 15px 0;
  max-width: 400px;
}

.search-input .el-input__inner {
  height: 38px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-input .el-input__inner:focus {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 分页样式 */
.pagination {
  margin-top: 15px;
  text-align: right;
}

/* 响应式布局增强 */
@media screen and (max-width: 1200px) {
  .stock-recalc-card {
    max-width: 100%;
    margin: 0 10px;
  }

  .box-stats-container {
    justify-content: space-around;
  }

  .stock-table {
    width: 100%;
    overflow-x: auto;
  }
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .summary-text {
    text-align: center;
    justify-content: center;
  }

  .stock-summary-cards {
    grid-template-columns: 1fr;
  }

  .box-stats-item {
    min-width: 100px;
    flex: 1 1 calc(50% - 15px);
  }

  .search-input {
    max-width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .box-stats-item {
    flex: 1 1 100%;
  }

  .el-table {
    font-size: 12px !important;
  }

  .el-table th,
  .el-table td {
    padding: 5px !important;
    font-size: 12px !important;
  }

  .summary-value {
    font-size: 24px;
  }

  .pagination {
    text-align: center;
  }
}

.box-stats-card {
  margin: 15px 0;
  background: #f8fcff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.box-stats-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.box-stats-header h4 {
  margin: 0;
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.box-stats-header h4::before {
  content: '📦';
  margin-right: 8px;
}

.box-stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
  justify-content: flex-start;
}

.box-stats-item {
  background: white;
  border-radius: 8px;
  padding: 10px 15px;
  min-width: 120px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-left: 3px solid #409eff;
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.box-stats-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.box-type {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
  font-weight: 500;
}

.box-count {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.count-color {
  color: #67c23a;
  /* 绿色 */
}

.boxes-color {
  color: #e6a23c;
  /* 橙色 */
}

.quantity-color {
  color: #409eff;
  /* 蓝色 */
}
</style>
