<template>
  <div class="modern-daily-history-page">
    <!-- 现代化页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-icon">
            <el-icon>
              <Van />
            </el-icon>
          </div>
          <div class="title-text">
            <h1 class="page-title">日別出荷履歴</h1>
            <p class="page-subtitle">出荷データの詳細履歴・検索・印刷機能</p>
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
        <div class="floating-circle circle-1"></div>
        <div class="floating-circle circle-2"></div>
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
        <div class="filter-stats" v-if="!loading">
          <span class="stats-text">{{ filteredOrderList.length }}件の結果</span>
        </div>
      </div>

      <el-form :inline="true" :model="filters" class="modern-filter-form" @submit.prevent>
        <div class="filter-row">
          <el-form-item class="filter-item">
            <template #label>
              <div class="custom-label">
                <el-icon><Calendar /></el-icon>
                <span>期間</span>
              </div>
            </template>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="開始日"
              end-placeholder="終了日"
              value-format="YYYY-MM-DD"
              :shortcuts="dateShortcuts"
              class="date-picker"
            />
          </el-form-item>

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
              filterable
              clearable
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
                <el-icon><Box /></el-icon>
                <span>製品</span>
              </div>
            </template>
            <el-select
              v-model="filters.product_cd"
              placeholder="製品を選択"
              filterable
              clearable
              class="select-input"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.cd"
                :label="`${item.cd} - ${item.name}`"
                :value="item.cd"
              />
            </el-select>
          </el-form-item>

          <div class="filter-actions">
            <el-button type="primary" @click="fetchList" class="search-btn">
              <el-icon><Search /></el-icon>
              検索
            </el-button>
            <el-button @click="resetFilter" class="reset-btn">
              <el-icon><RefreshLeft /></el-icon>
              リセット
            </el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 现代化数据展示区域 -->
    <div class="data-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon class="section-icon">
            <List />
          </el-icon>
          <span>出荷履歴データ</span>
        </div>
        <div class="data-summary" v-if="!loading">
          <div class="summary-item">
            <span class="summary-label">総件数</span>
            <span class="summary-value">{{ pagination.total.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">表示中</span>
            <span class="summary-value">{{ filteredOrderList.length.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="modern-table-container">
        <el-table
          :data="filteredOrderList"
          v-loading="loading"
          class="modern-table"
          :row-class-name="tableRowClassName"
          empty-text="データがありません"
        >
          <el-table-column label="年月日" align="center" width="110">
            <template #header>
              <div class="table-header">
                <el-icon><Calendar /></el-icon>
                <span>年月日</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="date-cell">
                {{ formatDate(row) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="納入先CD" prop="destination_cd" width="130">
            <template #header>
              <div class="table-header">
                <el-icon><OfficeBuilding /></el-icon>
                <span>納入先CD</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="code-cell">
                {{ row.destination_cd }}
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
                <el-icon><Shop /></el-icon>
                <span>納入先名</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="name-cell">
                {{ row.destination_name }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="製品CD" prop="product_cd" width="130">
            <template #header>
              <div class="table-header">
                <el-icon><Box /></el-icon>
                <span>製品CD</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="code-cell">
                {{ row.product_cd }}
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

          <el-table-column label="確定箱数" prop="confirmed_boxes" width="120" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Box /></el-icon>
                <span>確定箱数</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell boxes">
                <span class="number">{{ row.confirmed_boxes?.toLocaleString() }}</span>
                <span class="unit">箱</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="確定本数" prop="confirmed_units" width="120" align="right">
            <template #header>
              <div class="table-header">
                <el-icon><Collection /></el-icon>
                <span>確定本数</span>
              </div>
            </template>
            <template #default="{ row }">
              <div class="number-cell units">
                <span class="number">{{ row.confirmed_units?.toLocaleString() }}</span>
                <span class="unit">本</span>
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

        <!-- 现代化分页器 -->
        <div class="modern-pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchDailyAllOrders } from '@/api/order/order'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { OrderDaily, FetchDailyOrdersParams } from '@/types/order'
import { getDestinationOptions, getProductOptions } from '@/api/options'
import dayjs from 'dayjs'
import {
  Van,
  Printer,
  Search,
  Calendar,
  OfficeBuilding,
  Box,
  RefreshLeft,
  List,
  Shop,
  Goods,
  Collection,
  Flag,
} from '@element-plus/icons-vue'

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今日',
    value: () => {
      const today = new Date()
      return [today, today]
    },
  },
  {
    text: '昨日',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    },
  },
  {
    text: '今週',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - start.getDay())
      return [start, end]
    },
  },
  {
    text: '今月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    },
  },
]

// 筛选条件
const filters = ref({
  dateRange: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')], // 默认今天
  destination_cd: '',
  product_cd: '',
})

// 納入先選択
interface OptionItem {
  cd: string
  name: string
}

const destinationOptions = ref<OptionItem[]>([])
const productOptions = ref<OptionItem[]>([])

// 获取选项数据
const fetchOptions = async () => {
  try {
    const [destinations, products] = await Promise.all([
      getDestinationOptions(),
      getProductOptions(),
    ])
    destinationOptions.value = destinations
    productOptions.value = products
  } catch (error) {
    console.error('オプション取得失敗', error)
    ElMessage.error('データ取得に失敗しました')
  }
}

// 列表数据
const orderList = ref<OrderDaily[]>([])
const loading = ref(false)

// 过滤后的订单列表（确定箱数大于0）
const filteredOrderList = computed(() => {
  return orderList.value.filter((order) => order.confirmed_boxes > 0)
})

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val
  pagination.value.page = 1
  fetchList()
}

// 格式化日期显示
const formatDate = (row: OrderDaily) => {
  return `${row.year}/${String(row.month).padStart(2, '0')}/${String(row.day).padStart(2, '0')}`
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '出荷済':
      return 'success'
    case 'キャンセル':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  switch (status) {
    case '出荷済':
      return 'status-shipped'
    case 'キャンセル':
      return 'status-cancelled'
    default:
      return 'status-pending'
  }
}

// 表格行样式类名
const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

// 查询履歴
const fetchList = async () => {
  loading.value = true
  try {
    const [startDate, endDate] = filters.value.dateRange

    const params: FetchDailyOrdersParams = {
      startDate,
      endDate,
      destination_cd: filters.value.destination_cd,
      product_cd: filters.value.product_cd,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }

    const res = await fetchDailyAllOrders(params)
    orderList.value = res.list
    pagination.value.total = res.total
  } catch (error) {
    console.error('履歴取得失敗', error)
    ElMessage.error('データ取得に失敗しました')
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  filters.value = {
    dateRange: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    destination_cd: '',
    product_cd: '',
  }
  pagination.value.page = 1
  fetchList()
}

// 打印
const handlePrint = async () => {
  try {
    // 使用当前筛选后的数据
    const printData = filteredOrderList.value

    if (printData.length === 0) {
      ElMessage.warning('印刷するデータがありません')
      return
    }

    // 按日期和納入先分组数据
    const groupedData = new Map<string, Map<string, OrderDaily[]>>()

    // 首先按日期和納入先排序
    const sortedData = [...printData].sort((a, b) => {
      // 先按年月日排序
      if (a.year !== b.year) return a.year - b.year
      if (a.month !== b.month) return a.month - b.month
      if (a.day !== b.day) return a.day - b.day
      // 再按納入先CD排序
      return a.destination_cd.localeCompare(b.destination_cd)
    })

    // 组织数据
    sortedData.forEach((order) => {
      const dateKey = `${order.year}年${order.month}月${order.day}日`
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, new Map())
      }
      const destinationMap = groupedData.get(dateKey)!
      const destinationKey = order.destination_cd
      if (!destinationMap.has(destinationKey)) {
        destinationMap.set(destinationKey, [])
      }
      destinationMap.get(destinationKey)!.push(order)
    })

    // 构建打印HTML
    let printContent = ''
    groupedData.forEach((destinationMap, dateKey) => {
      // 添加日期标题
      printContent += `
        <div class="date-group">
          <h3>${dateKey}</h3>
      `

      destinationMap.forEach((orders, destinationKey) => {
        const firstOrder = orders[0]
        // 添加納入先信息
        printContent += `
          <div class="destination-group">
            <h4>${firstOrder.destination_name} (${firstOrder.destination_cd})</h4>
            <table>
              <thead>
                <tr>
                  <th>製品CD</th>
                  <th>製品名</th>
                  <th>確定箱数</th>
                  <th>確定本数</th>
                  <th>納入日</th>
                </tr>
              </thead>
              <tbody>
        `

        // 添加订单详情
        orders.forEach((order) => {
          const deliveryDate = order.delivery_date
            ? new Date(order.delivery_date).toLocaleDateString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
              })
            : ''
          printContent += `
            <tr>
              <td>${order.product_cd ?? ''}</td>
              <td>${order.product_name ?? ''}</td>
              <td class="number">${order.confirmed_boxes?.toLocaleString() ?? ''}</td>
              <td class="number">${order.confirmed_units?.toLocaleString() ?? ''}</td>
              <td class="center">${deliveryDate}</td>
            </tr>
          `
        })

        printContent += `
              </tbody>
            </table>
          </div>
        `
      })

      printContent += `</div>`
    })

    // 添加筛选条件信息
    const filterInfo = []
    if (filters.value.dateRange[0] === filters.value.dateRange[1]) {
      filterInfo.push(`日付: ${dayjs(filters.value.dateRange[0]).format('YYYY/MM/DD')}`)
    } else {
      filterInfo.push(
        `期間: ${dayjs(filters.value.dateRange[0]).format('YYYY/MM/DD')} ~ ${dayjs(filters.value.dateRange[1]).format('YYYY/MM/DD')}`,
      )
    }
    if (filters.value.destination_cd) {
      const dest = destinationOptions.value.find((d) => d.cd === filters.value.destination_cd)
      filterInfo.push(
        `納入先: ${dest ? `${dest.cd} - ${dest.name}` : filters.value.destination_cd}`,
      )
    }
    if (filters.value.product_cd) {
      const prod = productOptions.value.find((p) => p.cd === filters.value.product_cd)
      filterInfo.push(`製品: ${prod ? `${prod.cd} - ${prod.name}` : filters.value.product_cd}`)
    }
    const filterText =
      filterInfo.length > 0
        ? `<div class="filter-info">検索条件: ${filterInfo.join(' / ')}</div>`
        : ''

    const printWindow = window.open('', '', 'width=1000,height=800')
    if (!printWindow) return ElMessage.error('印刷ウィンドウを開けません')

    printWindow.document.write(`
      <html>
        <head>
          <title>日別出荷履歴 印刷</title>
          <style>
            body {
              font-family: "Yu Gothic", "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif;
              padding: 20px;
              color: #2c3e50;
              background: #fff;
              line-height: 1.6;
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
              padding: 15px 0;
              color: #1a73e8;
              border-bottom: 2px solid #1a73e8;
              position: relative;
            }
            h2:after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 100%;
              height: 1px;
              background: rgba(26, 115, 232, 0.3);
            }
            .date-group {
              margin-bottom: 40px;
              break-inside: avoid;
              background: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
              padding: 20px;
            }
            .date-group h3 {
              font-size: 20px;
              color: #2c3e50;
              margin-bottom: 20px;
              padding: 10px 15px;
              background: #f8f9fa;
              border-left: 4px solid #1a73e8;
              border-radius: 4px;
            }
            .destination-group {
              margin-bottom: 30px;
              break-inside: avoid;
              padding: 0 10px;
            }
            .destination-group h4 {
              font-size: 16px;
              color: #444;
              margin: 15px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #ddd;
              display: flex;
              align-items: center;
            }
            .destination-group h4:before {
              content: '🏢';
              margin-right: 8px;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 20px;
              font-size: 13px;
              border: 1px solid #e0e6ed;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background-color: #f7faff;
              color: #2c3e50;
              padding: 12px 8px;
              font-weight: 600;
              border-bottom: 2px solid #e0e6ed;
              white-space: nowrap;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #edf2f7;
              color: #444;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:hover td {
              background-color: #f8fafd;
            }
            td.number {
              text-align: right;
              font-family: 'Roboto Mono', monospace;
              font-size: 13px;
              color: #2c3e50;
            }
            td.center {
              text-align: center;
            }
            .print-date {
              text-align: right;
              color: #666;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
            }
            .company-info {
              font-size: 13px;
              color: #666;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 0;
                background: #fff;
              }
              .date-group {
                box-shadow: none;
                border: 1px solid #e0e6ed;
                margin-bottom: 20px;
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
              tfoot {
                display: table-footer-group;
              }
              .date-group {
                page-break-inside: avoid;
              }
              .destination-group {
                page-break-inside: avoid;
                margin-bottom: 15px;
              }
              h2, h3, h4 {
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="page-header">
            <div class="company-info">
              Smart-EMAP System
            </div>
            <div class="print-date">
              印刷日時: ${new Date().toLocaleString('ja-JP')}
            </div>
          </div>
          <h2>🚚 日別出荷履歴</h2>
          ${filterText}
          ${printContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  } catch (error) {
    console.error('印刷エラー', error)
    ElMessage.error('印刷に失敗しました')
  }
}

// Excel导出履歴
const handleExport = () => {
  if (orderList.value.length === 0) {
    ElMessage.warning('エクスポートするデータがありません')
    return
  }
  const exportData = orderList.value.map((item) => ({
    年: item.year,
    月: item.month,
    日: item.day,
    納入先CD: item.destination_cd,
    納入先名: item.destination_name,
    製品CD: item.product_cd,
    製品名: item.product_name,
    確定箱数: item.confirmed_boxes,
    確定本数: item.confirmed_units,
    状態: item.status,
  }))
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '日別出荷履歴')
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const exportDate = dayjs(filters.value.dateRange[0]).format('YYYY_MM')
  saveAs(
    new Blob([excelBuffer], { type: 'application/octet-stream' }),
    `日別出荷履歴_${exportDate}.xlsx`,
  )
}

onMounted(async () => {
  await fetchOptions()
  fetchList()
})
</script>

<style scoped>
/* 现代化页面样式 */
.modern-daily-history-page {
  min-height: calc(100vh - 84px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.modern-daily-history-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23667eea' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    repeat;
  pointer-events: none;
  z-index: 0;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    repeat;
  opacity: 0.3;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
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
    transform: translateY(-5px);
  }
}

.title-text {
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  margin: 8px 0 0;
  opacity: 0.9;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.print-btn {
  height: 48px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.print-btn .el-icon {
  font-size: 18px;
}

/* 装饰元素 */
.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: -60px;
  right: 10%;
  animation: rotate 8s linear infinite;
}

.circle-2 {
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

/* 筛选区域样式 */
.filter-section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 24px;
  margin: 0 24px 24px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px 20px 0 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.filter-icon {
  font-size: 20px;
  color: #667eea;
  animation: pulse 2s ease-in-out infinite;
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
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.modern-filter-form {
  margin: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 240px;
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

.date-picker,
.select-input {
  width: 100%;
  border-radius: 12px;
}

.date-picker :deep(.el-input__wrapper),
.select-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.date-picker :deep(.el-input__wrapper:hover),
.select-input :deep(.el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.date-picker :deep(.el-input__wrapper.is-focus),
.select-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.search-btn {
  height: 44px;
  padding: 0 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.search-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  height: 44px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.reset-btn:hover {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 数据展示区域样式 */
.data-section {
  margin: 0 24px;
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.section-icon {
  font-size: 24px;
  color: #667eea;
  animation: pulse 2s ease-in-out infinite;
}

.data-summary {
  display: flex;
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

/* 现代化表格样式 */
.modern-table-container {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.modern-table {
  width: 100%;
}

.modern-table :deep(.el-table__header) th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  padding: 16px 0;
  border: none;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.table-header .el-icon {
  font-size: 16px;
}

.modern-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.modern-table :deep(.el-table__row:hover) {
  background-color: rgba(102, 126, 234, 0.05) !important;
  transform: scale(1.001);
}

.modern-table :deep(.el-table__row.even-row) {
  background-color: rgba(248, 250, 252, 0.5);
}

.modern-table :deep(.el-table__row.odd-row) {
  background-color: rgba(255, 255, 255, 0.5);
}

.modern-table :deep(.el-table__cell) {
  padding: 12px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

/* 单元格样式 */
.date-cell {
  font-weight: 600;
  color: #667eea;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.code-cell {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 600;
  color: #374151;
  background: rgba(102, 126, 234, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.name-cell {
  font-weight: 500;
  color: #1e293b;
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

.number-cell.boxes .number {
  color: #0ea5e9;
  font-weight: 700;
}

.number-cell.units .number {
  color: #10b981;
  font-weight: 700;
}

.number-cell .unit {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-tag {
  border-radius: 20px;
  font-weight: 600;
  padding: 6px 12px;
  border: none;
  transition: all 0.3s ease;
}

.status-tag:hover {
  transform: scale(1.05);
}

.status-tag.status-shipped {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.status-tag.status-cancelled {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.status-tag.status-pending {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

/* 现代化分页器 */
.modern-pagination {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
}

.modern-pagination :deep(.el-pagination) {
  gap: 8px;
}

.modern-pagination :deep(.el-pager li) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-pagination :deep(.el-pager li:hover) {
  background: #667eea;
  color: white;
}

.modern-pagination :deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .page-header {
    padding: 32px 20px;
  }

  .filter-section,
  .data-section {
    margin: 0 20px 20px;
  }
}

@media screen and (max-width: 768px) {
  .page-header {
    padding: 24px 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .title-section {
    flex-direction: column;
    gap: 16px;
  }

  .title-icon {
    width: 56px;
    height: 56px;
  }

  .title-icon .el-icon {
    font-size: 28px;
  }

  .page-title {
    font-size: 2rem;
  }

  .filter-section,
  .data-section {
    margin: 0 16px 16px;
    padding: 20px;
  }

  .filter-row {
    flex-direction: column;
    gap: 16px;
  }

  .filter-item {
    min-width: unset;
  }

  .filter-actions {
    width: 100%;
    justify-content: center;
  }

  .data-summary {
    flex-direction: column;
    gap: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
  }

  .circle-1,
  .circle-2 {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .filter-section {
    padding: 16px;
  }

  .modern-pagination {
    padding: 16px;
  }

  .search-btn,
  .reset-btn {
    flex: 1;
    justify-content: center;
  }
}

/* 打印样式 */
@media print {
  .filter-section,
  .modern-pagination,
  .header-actions {
    display: none !important;
  }

  .modern-daily-history-page {
    background: white;
  }

  .modern-daily-history-page::before {
    display: none;
  }

  .page-header {
    background: white;
    color: black;
    padding: 20px 0;
  }

  .modern-table-container {
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}
</style>
