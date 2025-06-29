<template>
  <div class="customer-order-history">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-icon">
            <el-icon>
              <User />
            </el-icon>
          </div>
          <div class="title-text">
            <h1 class="main-title">顧客別受注履歴</h1>
            <p class="subtitle">顧客ごとの受注データを詳細に分析・管理</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" class="print-btn" @click="handlePrint">
            <el-icon><Printer /></el-icon>
            印刷
          </el-button>
        </div>
      </div>
      <div class="header-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
      </div>
    </div>

    <!-- 筛选表单 -->
    <div class="filter-section">
      <div class="filter-card">
        <div class="filter-header">
          <el-icon class="filter-icon"><Search /></el-icon>
          <span class="filter-title">検索条件</span>
        </div>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="顧客">
            <el-select
              v-model="filters.customer_cd"
              placeholder="顧客を選択"
              clearable
              filterable
              class="custom-select"
            >
              <el-option
                v-for="item in customerOptions"
                :key="item.cd"
                :label="`${item.cd} - ${item.name}`"
                :value="item.cd"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="期間">
            <el-date-picker
              v-model="filters.date_range"
              type="daterange"
              start-placeholder="開始日"
              end-placeholder="終了日"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="custom-date-picker"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="search-btn" @click="fetchData">
              <el-icon><Search /></el-icon>
              検索
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 月别统计 -->
    <div class="summary-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon class="section-icon"><TrendCharts /></el-icon>
          <span>月別集計</span>
        </div>
        <div class="section-badge">{{ summaryList.length }}件</div>
      </div>
      <div class="table-container">
        <el-table :data="summaryList" class="modern-table summary-table">
          <el-table-column label="年月" prop="ym" width="150" align="center">
            <template #default="{ row }">
              <div class="month-cell">
                <el-icon><Calendar /></el-icon>
                <span>{{ row.ym }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="受注数量合計" prop="total_quantity" align="right">
            <template #default="{ row }">
              <div class="quantity-cell">
                <span class="quantity-number">{{ row.total_quantity?.toLocaleString() }}</span>
                <span class="quantity-unit">件</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 订单明细 -->
    <div class="details-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon class="section-icon"><Document /></el-icon>
          <span>受注明細</span>
        </div>
        <div class="section-badge">{{ filteredOrderList.length }}件</div>
      </div>
      <div class="table-container">
        <el-table :data="filteredOrderList" class="modern-table details-table">
          <el-table-column label="受注日" prop="order_date" width="120" align="center">
            <template #default="{ row }">
              <div class="date-cell">
                <el-icon><Calendar /></el-icon>
                <span>{{ row.order_date }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="顧客CD" prop="customer_cd" width="120">
            <template #default="{ row }">
              <div class="code-cell">
                <el-icon><User /></el-icon>
                <span>{{ row.customer_cd }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="顧客名"
            prop="customer_name"
            min-width="150"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="name-cell">
                <span class="name-text">{{ row.customer_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="納入先CD" prop="destination_cd" width="120">
            <template #default="{ row }">
              <div class="code-cell">
                <el-icon><Location /></el-icon>
                <span>{{ row.destination_cd }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="納入先名"
            prop="destination_name"
            min-width="150"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="name-cell">
                <span class="name-text">{{ row.destination_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="製品CD" prop="product_cd" width="120">
            <template #default="{ row }">
              <div class="code-cell">
                <el-icon><Box /></el-icon>
                <span>{{ row.product_cd }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="製品名" prop="product_name" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="name-cell">
                <span class="name-text">{{ row.product_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="120" align="right">
            <template #default="{ row }">
              <div class="quantity-cell">
                <span class="quantity-number">{{ row.quantity?.toLocaleString() }}</span>
                <span class="quantity-unit">個</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状態" prop="status" width="100" align="center">
            <template #default="{ row }">
              <div class="status-cell">
                <el-tag :type="getStatusType(row.status)" class="status-tag">
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
import { getCustomerOptions } from '@/api/options'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  User,
  Printer,
  Search,
  TrendCharts,
  Calendar,
  Document,
  Location,
  Box,
} from '@element-plus/icons-vue'

const filters = ref({
  customer_cd: '',
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
  status: string
}

interface MonthlySummaryItem {
  ym: string
  total_quantity: number
}

const orderList = ref<OrderHistoryItem[]>([])
const summaryList = ref<MonthlySummaryItem[]>([])
const customerOptions = ref<{ cd: string; name: string }[]>([])

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

// 📥 顧客選択肢
const loadOptions = async () => {
  try {
    customerOptions.value = await getCustomerOptions()
  } catch (error) {
    console.error('顧客データ取得エラー:', error)
    ElMessage.error('顧客データの取得に失敗しました')
  }
}

// 📊 検索
const fetchData = async () => {
  if (!filters.value.customer_cd || filters.value.date_range.length !== 2) {
    ElMessage.warning('顧客と期間を選択してください')
    return
  }

  try {
    const [start_date, end_date] = filters.value.date_range
    const [orders, summary] = await Promise.all([
      request.get('/api/order/customer-history', {
        params: { customer_cd: filters.value.customer_cd, start_date, end_date },
      }),
      request.get('/api/order/customer-monthly-summary', {
        params: { customer_cd: filters.value.customer_cd, start_date, end_date },
      }),
    ])

    orderList.value = orders
    summaryList.value = summary
  } catch (error) {
    console.error('データ取得エラー:', error)
    ElMessage.error('データの取得に失敗しました')
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
  if (filters.value.customer_cd) {
    const customer = customerOptions.value.find((c) => c.cd === filters.value.customer_cd)
    filterInfo.push(
      `顧客: ${customer ? `${customer.cd} - ${customer.name}` : filters.value.customer_cd}`,
    )
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
        <title>顧客別受注履歴</title>
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
        <h2>顧客別受注履歴</h2>
        ${filterText}
        <h3>月別集計</h3>
        <table>
          <thead>
            <tr>
              <th>年月</th>
              <th>受注数量合計</th>
            </tr>
          </thead>
          <tbody>
            ${summaryList.value
              .map(
                (item) => `
              <tr>
                <td class="center">${item.ym}</td>
                <td class="number">${item.total_quantity?.toLocaleString() ?? ''}</td>
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
              <th>顧客CD</th>
              <th>顧客名</th>
              <th>納入先CD</th>
              <th>納入先名</th>
              <th>製品CD</th>
              <th>製品名</th>
              <th>数量</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrderList.value
              .map(
                (item) => `
              <tr>
                <td class="center">${item.order_date}</td>
                <td>${item.customer_cd}</td>
                <td>${item.customer_name}</td>
                <td>${item.destination_cd}</td>
                <td>${item.destination_name}</td>
                <td>${item.product_cd}</td>
                <td>${item.product_name}</td>
                <td class="number">${item.quantity?.toLocaleString() ?? ''}</td>
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
/* CSS变量定义 */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --border-color: rgba(0, 0, 0, 0.08);
  --shadow-light: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-heavy: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.customer-order-history {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

.customer-order-history::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  animation: backgroundMove 20s linear infinite;
  pointer-events: none;
}

@keyframes backgroundMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(20px, 20px);
  }
}

/* 页面头部 */
.page-header {
  position: relative;
  padding: 40px 30px 50px;
  color: white;
  overflow: hidden;
  backdrop-filter: blur(10px);
  margin: 0 20px 30px;
  border-radius: 0 0 24px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.title-icon .el-icon {
  font-size: 28px;
  color: white;
}

.title-text {
  flex: 1;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 8px;
  background: linear-gradient(45deg, #ffffff, #f0f8ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.print-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.print-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: float 8s ease-in-out infinite;
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: 20%;
  right: 15%;
  animation-delay: 0s;
}

.circle-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 25%;
  animation-delay: 2s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 筛选区域 */
.filter-section {
  max-width: 1400px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.filter-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-medium);
  position: relative;
  overflow: hidden;
}

.filter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 20px 20px 0 0;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-icon {
  font-size: 20px;
  color: var(--primary-color);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.filter-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
}

.custom-select,
.custom-date-picker {
  width: 240px;
}

.search-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 数据区域 */
.summary-section,
.details-section {
  max-width: 1400px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.section-icon {
  font-size: 24px;
  animation: iconPulse 3s ease-in-out infinite;
}

.section-badge {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.table-container {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
}

/* 表格样式 */
.modern-table {
  border-radius: 16px;
  overflow: hidden;
  border: none;
}

.modern-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.modern-table :deep(.el-table__header th) {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-weight: 600;
  padding: 16px 12px;
  font-size: 0.9rem;
}

.modern-table :deep(.el-table__body tr) {
  transition: all 0.3s ease;
}

.modern-table :deep(.el-table__body tr:hover) {
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-1px);
}

.modern-table :deep(.el-table__body td) {
  border: none;
  padding: 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 自定义单元格样式 */
.month-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--primary-color);
}

.month-cell .el-icon {
  font-size: 16px;
}

.quantity-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.quantity-number {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-family: 'Roboto Mono', monospace;
}

.quantity-unit {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 详细表格单元格样式 */
.date-cell,
.code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.date-cell {
  color: var(--primary-color);
}

.date-cell .el-icon {
  font-size: 14px;
}

.code-cell {
  color: var(--text-primary);
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
}

.code-cell .el-icon {
  font-size: 14px;
  opacity: 0.7;
}

.name-cell {
  display: flex;
  align-items: center;
}

.name-text {
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-tag {
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 状态标签特殊样式 */
.status-tag.el-tag--success {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.status-tag.el-tag--warning {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.status-tag.el-tag--danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.status-tag.el-tag--info {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

/* 表格行悬停效果增强 */
.modern-table :deep(.el-table__body tr:hover .date-cell),
.modern-table :deep(.el-table__body tr:hover .code-cell) {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}

.modern-table :deep(.el-table__body tr:hover .quantity-number) {
  color: var(--primary-color);
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.modern-table :deep(.el-table__body tr:hover .status-tag) {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-header {
    margin: 0 15px 25px;
    padding: 30px 25px 40px;
  }

  .main-title {
    font-size: 2.2rem;
  }

  .filter-section,
  .summary-section,
  .details-section {
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .page-header {
    margin: 0 10px 20px;
    padding: 25px 20px 35px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .title-section {
    gap: 15px;
  }

  .title-icon {
    width: 48px;
    height: 48px;
  }

  .title-icon .el-icon {
    font-size: 24px;
  }

  .main-title {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .filter-card {
    padding: 20px;
  }

  .filter-form {
    flex-direction: column;
    gap: 15px;
  }

  .custom-select,
  .custom-date-picker {
    width: 100%;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .decoration-circle {
    display: none;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 20px 15px 30px;
  }

  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .filter-card {
    padding: 15px;
  }

  .table-container {
    padding: 15px;
  }

  .modern-table :deep(.el-table__header th),
  .modern-table :deep(.el-table__body td) {
    padding: 12px 8px;
    font-size: 0.85rem;
  }
}

/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #74b9ff;
    --secondary-color: #a29bfe;
    --text-primary: #e2e8f0;
    --text-secondary: #a0aec0;
    --bg-primary: #2d3748;
    --bg-secondary: #1a202c;
  }

  .customer-order-history {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .filter-card,
  .table-container {
    background: rgba(45, 55, 72, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modern-table :deep(.el-table__header) {
    background: linear-gradient(135deg, #2d3748, #4a5568);
  }

  .modern-table :deep(.el-table__header th) {
    color: var(--text-primary);
  }

  .modern-table :deep(.el-table__body tr:hover) {
    background: rgba(116, 185, 255, 0.1);
  }

  .main-title {
    background: linear-gradient(45deg, #ffffff, #e2e8f0);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* 动画增强 */
.filter-card,
.table-container {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-section {
  animation-delay: 0.1s;
}

.details-section {
  animation-delay: 0.2s;
}

/* 加载状态 */
.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
</style>
