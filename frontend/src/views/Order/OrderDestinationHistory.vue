<template>
  <div class="modern-destination-history">
    <!-- 现代化页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-icon">
            <el-icon>
              <OfficeBuilding />
            </el-icon>
          </div>
          <div class="title-text">
            <h1 class="page-title">納入先別受注履歴</h1>
            <p class="page-subtitle">納入先ごとの受注データ分析・履歴管理</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button class="print-btn" @click="handlePrint">
            <el-icon><Printer /></el-icon>
            印刷
          </el-button>
        </div>
      </div>

      <!-- 装饰元素 -->
      <div class="header-decoration">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
      </div>
    </div>

    <!-- 现代化筛选区域 -->
    <div class="filter-section">
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <Search />
          </el-icon>
          <span>検索フィルター</span>
        </div>
        <div class="filter-stats" v-if="orderList.length > 0">
          <span class="stats-text">{{ filteredOrderList.length }}件の結果</span>
        </div>
      </div>

      <el-form :inline="true" class="modern-filter-form">
        <div class="filter-row">
          <el-form-item class="filter-item">
            <template #label>
              <div class="custom-label">
                <el-icon><OfficeBuilding /></el-icon>
                <span>納入先</span>
              </div>
            </template>
            <el-select
              v-model="filters.destination_cd"
              placeholder="納入先を選択"
              clearable
              filterable
              class="select-input"
            >
              <el-option
                v-for="item in destinationOptions"
                :key="item.cd"
                :label="`${item.cd} - ${item.name}`"
                :value="item.cd"
              />
            </el-select>
          </el-form-item>

          <el-form-item class="filter-item">
            <template #label>
              <div class="custom-label">
                <el-icon><Calendar /></el-icon>
                <span>期間</span>
              </div>
            </template>
            <el-date-picker
              v-model="filters.date_range"
              type="daterange"
              start-placeholder="開始日"
              end-placeholder="終了日"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
          </el-form-item>

          <div class="filter-actions">
            <el-button type="primary" @click="fetchData" class="search-btn">
              <el-icon><Search /></el-icon>
              検索
            </el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 月別集計区域 -->
    <div class="summary-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon class="section-icon">
            <TrendCharts />
          </el-icon>
          <span>月別集計</span>
        </div>
        <div class="summary-stats" v-if="summaryList.length > 0">
          <div class="stat-item">
            <span class="stat-label">期間数</span>
            <span class="stat-value">{{ summaryList.length }}ヶ月</span>
          </div>
        </div>
      </div>

      <div class="modern-table-container">
        <el-table :data="summaryList" class="modern-table summary-table">
          <el-table-column label="年月" prop="ym" width="140" align="center">
            <template #header>
              <div class="table-header">
                <el-icon><Calendar /></el-icon>
                <span>年月</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="date-cell">
                {{ row.ym }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="受注数量合計" prop="total_quantity" width="160" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Box /></el-icon>
                <span>受注数量合計</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell quantity">
                <span class="number">{{ row.total_quantity?.toLocaleString() }}</span>
                <span class="unit">個</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="受注金額合計" prop="total_amount" width="180" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Money /></el-icon>
                <span>受注金額合計</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell amount">
                <span class="number">{{ row.total_amount?.toLocaleString() }}</span>
                <span class="unit">円</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 受注明細区域 -->
    <div class="details-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon class="section-icon">
            <List />
          </el-icon>
          <span>受注明細</span>
        </div>
        <div class="details-stats" v-if="filteredOrderList.length > 0">
          <div class="stat-item">
            <span class="stat-label">明細数</span>
            <span class="stat-value">{{ filteredOrderList.length }}件</span>
          </div>
        </div>
      </div>

      <div class="modern-table-container">
        <el-table :data="filteredOrderList" class="modern-table details-table">
          <el-table-column label="受注日" prop="order_date" width="120" align="center">
            <template #header>
              <div class="table-header">
                <el-icon><Calendar /></el-icon>
                <span>受注日</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="date-cell">
                {{ row.order_date }}
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="納入先名"
            prop="destination_name"
            min-width="160"
            show-overflow-tooltip
          >
            <template #header>
              <div class="table-header">
                <el-icon><OfficeBuilding /></el-icon>
                <span>納入先名</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="name-cell">
                {{ row.destination_name }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="製品名" prop="product_name" min-width="160" show-overflow-tooltip>
            <template #header>
              <div class="table-header">
                <el-icon><Goods /></el-icon>
                <span>製品名</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="name-cell">
                {{ row.product_name }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="quantity" width="110" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Box /></el-icon>
                <span>数量</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell quantity">
                <span class="number">{{ row.quantity?.toLocaleString() }}</span>
                <span class="unit">個</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="単価" prop="unit_price" width="110" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><PriceTag /></el-icon>
                <span>単価</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell price">
                <span class="number">{{ row.unit_price?.toLocaleString() }}</span>
                <span class="unit">円</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="金額" prop="total_price" width="130" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Money /></el-icon>
                <span>金額</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell amount">
                <span class="number">{{ row.total_price?.toLocaleString() }}</span>
                <span class="unit">円</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状態" prop="status" width="110" align="center">
            <template #header>
              <div class="table-header">
                <el-icon><Flag /></el-icon>
                <span>状態</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="status-cell">
                <el-tag :class="getStatusClass(row.status)" class="status-tag">
                  {{ row.status }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import request from '@/utils/request'
import { getDestinationOptions } from '@/api/options'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import {
  OfficeBuilding,
  Printer,
  Search,
  Calendar,
  TrendCharts,
  Box,
  Money,
  List,
  Goods,
  PriceTag,
  Flag,
} from '@element-plus/icons-vue'

const filters = ref({
  destination_cd: '',
  date_range: [],
})

interface OrderHistoryItem {
  order_date: string
  customer_cd: string
  customer_name: string
  destination_cd: string
  destination_name: string
  product_cd: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
}

interface MonthlySummaryItem {
  ym: string
  total_quantity: number
  total_amount: number
}

const orderList = ref<OrderHistoryItem[]>([])
const summaryList = ref<MonthlySummaryItem[]>([])
const destinationOptions = ref<{ cd: string; name: string }[]>([])

// 过滤数量大于0的订单
const filteredOrderList = computed(() => {
  return orderList.value.filter((order) => order.quantity > 0)
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '完了':
      return 'success'
    case 'キャンセル':
      return 'danger'
    case '処理中':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  switch (status) {
    case '完了':
      return 'status-completed'
    case 'キャンセル':
      return 'status-cancelled'
    case '処理中':
      return 'status-processing'
    default:
      return 'status-default'
  }
}

// 📥 納入先選択肢取得
const loadOptions = async () => {
  destinationOptions.value = await getDestinationOptions()
}

// 📊 検索
const fetchData = async () => {
  if (!filters.value.destination_cd || filters.value.date_range.length !== 2) {
    return
  }

  const [start_date, end_date] = filters.value.date_range

  try {
    const [orders, summary] = await Promise.all([
      request.get('/api/order/destination-history', {
        params: { destination_cd: filters.value.destination_cd, start_date, end_date },
      }),
      request.get('/api/order/destination-monthly-summary', {
        params: { destination_cd: filters.value.destination_cd, start_date, end_date },
      }),
    ])

    orderList.value = orders
    summaryList.value = summary
  } catch (error) {
    console.error('データ取得エラー:', error)
  }
}

// 打印功能
const handlePrint = () => {
  if (filteredOrderList.value.length === 0) {
    ElMessage.warning('印刷するデータがありません')
    return
  }

  // 获取筛选条件信息
  const filterInfo = []
  if (filters.value.date_range?.length === 2) {
    filterInfo.push(`期間: ${filters.value.date_range[0]} ~ ${filters.value.date_range[1]}`)
  }
  if (filters.value.destination_cd) {
    const dest = destinationOptions.value.find((d) => d.cd === filters.value.destination_cd)
    filterInfo.push(`納入先: ${dest ? `${dest.cd} - ${dest.name}` : filters.value.destination_cd}`)
  }
  const filterText =
    filterInfo.length > 0
      ? `<div class="filter-info">検索条件: ${filterInfo.join(' / ')}</div>`
      : ''

  // 打印窗口
  const printWindow = window.open('', '', 'width=1000,height=800')
  if (!printWindow) return ElMessage.error('印刷ウィンドウを開けません')

  printWindow.document.write(`
    <html>
      <head>
        <title>納入先別受注履歴</title>
        <style>
          body {
            font-family: "Yu Gothic", "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif;
            padding: 20px;
            color: #2c3e50;
          }
          .filter-info {
            margin: 10px 0 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 14px;
            color: #666;
          }
          h2 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1a73e8;
          }
          h3 {
            font-size: 18px;
            margin: 20px 0;
            color: #2c3e50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f7faff;
            font-weight: bold;
          }
          .number {
            text-align: right;
            font-family: 'Roboto Mono', monospace;
          }
          .center {
            text-align: center;
          }
          .print-info {
            text-align: right;
            color: #666;
            font-size: 12px;
            margin-bottom: 20px;
          }
          @media print {
            body {
              padding: 0;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-info">
          印刷日時: ${dayjs().format('YYYY/MM/DD HH:mm')}
        </div>
        <h2>納入先別受注履歴</h2>
        ${filterText}
        <h3>月別集計</h3>
        <table>
          <thead>
            <tr>
              <th>年月</th>
              <th>受注数量合計</th>
              <th>受注金額合計</th>
            </tr>
          </thead>
          <tbody>
            ${summaryList.value
              .map(
                (item) => `
              <tr>
                <td class="center">${item.ym}</td>
                <td class="number">${item.total_quantity?.toLocaleString() ?? ''}</td>
                <td class="number">${item.total_amount?.toLocaleString() ?? ''}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <h3>受注明細</h3>
        <table>
          <thead>
            <tr>
              <th>受注日</th>
              <th>納入先名</th>
              <th>製品名</th>
              <th>数量</th>
              <th>単価</th>
              <th>金額</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrderList.value
              .map(
                (item) => `
              <tr>
                <td class="center">${item.order_date}</td>
                <td>${item.destination_name}</td>
                <td>${item.product_name}</td>
                <td class="number">${item.quantity?.toLocaleString() ?? ''}</td>
                <td class="number">${item.unit_price?.toLocaleString() ?? ''}</td>
                <td class="number">${item.total_price?.toLocaleString() ?? ''}</td>
                <td class="center">${item.status}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

loadOptions()
</script>

<style scoped>
/* 页面容器 */
.modern-destination-history {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  background-image:
    radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
  position: relative;
  overflow-x: hidden;
}

/* SVG网格背景 */
.modern-destination-history::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* 页面头部 */
.page-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 32px;
  margin-bottom: 32px;
  overflow: hidden;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: float 3s ease-in-out infinite;
}

.title-icon .el-icon {
  font-size: 32px;
  color: white;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.title-text {
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.print-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 装饰元素 */
.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shape-1 {
  width: 120px;
  height: 120px;
  top: -60px;
  right: 10%;
  animation: rotate 8s linear infinite;
}

.shape-2 {
  width: 80px;
  height: 80px;
  bottom: -40px;
  left: 15%;
  animation: rotate 12s linear infinite reverse;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 筛选区域 */
.filter-section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 32px;
  margin: 0 32px 32px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
  animation: slideInUp 0.6s ease-out;
}

.filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px 24px 0 0;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.filter-icon {
  font-size: 20px;
  color: #667eea;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.filter-stats {
  display: flex;
  gap: 16px;
}

.stats-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modern-filter-form {
  margin: 0;
}

.filter-row {
  display: flex;
  align-items: end;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  margin-bottom: 0;
}

.custom-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.custom-label .el-icon {
  font-size: 16px;
  color: #667eea;
}

.select-input {
  width: 240px;
}

.date-picker {
  width: 280px;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 区域样式 */
.summary-section,
.details-section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 32px;
  margin: 0 32px 32px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
  animation: slideInUp 0.6s ease-out;
}

.summary-section {
  animation-delay: 0.1s;
}

.details-section {
  animation-delay: 0.2s;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.section-icon {
  font-size: 20px;
  color: #667eea;
  animation: pulse 2s infinite;
}

.summary-stats,
.details-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 表格样式 */
.modern-table-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.modern-table {
  border: none;
  border-radius: 16px;
}

:deep(.modern-table .el-table__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.modern-table .el-table__header th) {
  background: transparent;
  border: none;
  padding: 16px 8px;
  color: white;
  font-weight: 600;
  text-align: center;
}

:deep(.modern-table .el-table__body tr) {
  transition: all 0.3s ease;
}

:deep(.modern-table .el-table__body tr:hover) {
  background-color: rgba(102, 126, 234, 0.05);
  transform: scale(1.01);
}

:deep(.modern-table .el-table__body td) {
  border: none;
  padding: 16px 8px;
  border-bottom: 1px solid #f3f4f6;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
}

.table-header .el-icon {
  font-size: 16px;
}

/* 单元格样式 */
.date-cell {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 600;
  color: #667eea;
  text-align: center;
}

.name-cell {
  font-weight: 500;
  color: #374151;
}

.number-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  transition: all 0.3s ease;
}

.number-cell:hover {
  transform: scale(1.05);
}

.number-cell .number {
  font-weight: 700;
}

.number-cell .unit {
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: 500;
}

.number-cell.quantity {
  color: #059669;
}

.number-cell.quantity:hover {
  color: #047857;
}

.number-cell.price {
  color: #dc2626;
}

.number-cell.price:hover {
  color: #b91c1c;
}

.number-cell.amount {
  color: #7c3aed;
}

.number-cell.amount:hover {
  color: #6d28d9;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-tag {
  border: none;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.status-tag:hover {
  transform: scale(1.1);
}

.status-completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.status-cancelled {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.status-processing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.status-default {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-header {
    padding: 32px 24px;
  }

  .filter-section,
  .summary-section,
  .details-section {
    margin: 0 24px 24px;
    padding: 24px;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .modern-destination-history {
    background-attachment: local;
  }

  .page-header {
    padding: 24px 16px;
    margin-bottom: 24px;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .title-section {
    gap: 16px;
  }

  .title-icon {
    width: 48px;
    height: 48px;
  }

  .title-icon .el-icon {
    font-size: 24px;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .filter-section,
  .summary-section,
  .details-section {
    margin: 0 16px 24px;
    padding: 20px;
    border-radius: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .select-input,
  .date-picker {
    width: 100%;
  }

  .filter-actions {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .floating-shape {
    display: none;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 20px 12px;
  }

  .filter-section,
  .summary-section,
  .details-section {
    margin: 0 12px 20px;
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .title-section {
    gap: 12px;
  }

  .title-icon {
    width: 40px;
    height: 40px;
  }

  .title-icon .el-icon {
    font-size: 20px;
  }
}

/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  .modern-destination-history {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  }

  .filter-section,
  .summary-section,
  .details-section {
    background: rgba(31, 41, 55, 0.95);
    border-color: rgba(75, 85, 99, 0.5);
  }

  .filter-title,
  .section-title {
    color: #f9fafb;
  }

  .name-cell {
    color: #d1d5db;
  }

  :deep(.modern-table .el-table__body td) {
    border-bottom-color: #374151;
  }
}
</style>
