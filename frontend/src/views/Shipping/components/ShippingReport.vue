<template>
  <div class="shipping-report">
    <!-- 报告头部 -->
    <div class="report-header">
      <div class="header-left">
        <span>出荷日: {{ formatShippingDate(filters.dateRange) }}</span>
      </div>
      <div class="header-center">
        <h1 class="report-title">出荷品報告書</h1>
      </div>
      <div class="header-right">
        <span>印刷日時: {{ printDateTime }}</span>
      </div>
    </div>

    <!-- 报告内容 -->
    <div class="report-body">
      <div
        v-for="destGroup in groupedData"
        :key="destGroup.destination_name"
        class="destination-section"
      >
        <!-- 納入先名标题 -->
        <h2 class="destination-title">{{ destGroup.destination_name }}</h2>

        <!-- 直接显示表格，不按出荷No分组 -->
        <table class="report-table">
          <thead>
            <tr>
              <th>出荷No</th>
              <th>製品名</th>
              <th>箱タイプ</th>
              <th>受注数</th>
              <th>受注本数</th>
              <th>納入日</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in destGroup.items" :key="index">
              <td>{{ item.shipping_no }}</td>
              <td>{{ item.product_name }}</td>
              <td>{{ item.box_type || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.units || '-' }}</td>
              <td>{{ formatDate(item.delivery_date) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 納入先合計 -->
        <div class="destination-summary">
          <table class="summary-table">
            <tbody>
              <tr>
                <td class="summary-label">{{ destGroup.destination_name }} 合計</td>
                <td class="summary-value">受注数: {{ destGroup.totalQuantity }}</td>
                <td class="summary-value">受注本数: {{ destGroup.totalUnits }}</td>
                <td class="summary-value">出荷No件数: {{ destGroup.shippingNoCount }}</td>
              </tr>
            </tbody>
          </table>
          <!-- 分割线 -->
          <div class="separator-line"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
})

const printDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('ja-JP')
})

function formatShippingDate(dateRange) {
  if (!dateRange || dateRange.length !== 2) return 'N/A'
  if (dateRange[0] === dateRange[1]) {
    return formatDate(dateRange[0])
  }
  return `${formatDate(dateRange[0])} ~ ${formatDate(dateRange[1])}`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP')
}

// 按納入先分组数据，不再按出荷No分组
const groupedData = computed(() => {
  if (!props.data || props.data.length === 0) return []

  const destMap = new Map()

  props.data.forEach((item) => {
    const destName = item.destination_name
    if (!destMap.has(destName)) {
      destMap.set(destName, [])
    }
    destMap.get(destName).push(item)
  })

  const result = []
  destMap.forEach((items, destination_name) => {
    // 按製品名排序
    const sortedItems = items.sort((a, b) => a.product_name.localeCompare(b.product_name))

    const totalQuantity = sortedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    const totalUnits = sortedItems.reduce((sum, item) => sum + (Number(item.units) || 0), 0)

    // 统计不同的出荷No数量
    const uniqueShippingNos = new Set(sortedItems.map((item) => item.shipping_no))
    const shippingNoCount = uniqueShippingNos.size

    result.push({
      destination_name,
      items: sortedItems,
      totalQuantity,
      totalUnits,
      shippingNoCount,
    })
  })

  return result.sort((a, b) => a.destination_name.localeCompare(b.destination_name))
})
</script>

<style scoped>
@page {
  size: A4 portrait;
  margin: 2cm;
}

.shipping-report {
  font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'MS Gothic', sans-serif;
  color: #1a1a1a;
  background: #fff;
  padding: 24px;
  line-height: 1.5;
  position: relative;
}

.shipping-report::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* 头部 */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #2c3e50;
  padding: 20px 0;
  margin-bottom: 30px;
  font-size: 14px;
  background: linear-gradient(to right, #f8f9fa, #ffffff, #f8f9fa);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.report-header::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #667eea, #764ba2);
}

.header-left,
.header-right {
  flex: 1;
  padding: 0 15px;
  font-weight: 600;
  color: #34495e;
}

.header-left {
  text-align: left;
}

.header-right {
  text-align: right;
}

.header-center {
  flex: 2;
  text-align: center;
  padding: 0 20px;
}

.report-title {
  font-size: 26px;
  font-weight: 900;
  margin: 0;
  color: #2c3e50;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 1.5px;
  position: relative;
}

.report-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #e74c3c, #c0392b);
  border-radius: 2px;
}

/* 内容区域 */
.report-body {
  width: 100%;
  margin-top: 20px;
}

.destination-section {
  margin-bottom: 30px;
  page-break-inside: avoid;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.destination-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  background: #ffffff;
}

.report-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #2c3e50;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 8px;
  text-align: center;
  border: none;
  border-bottom: 2px solid #dee2e6;
}

.report-table td {
  padding: 10px 8px;
  font-size: 11px;
  text-align: left;
  border: none;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
}

.report-table tbody tr:nth-child(even) {
  background: rgba(248, 249, 250, 0.5);
}

.report-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

/* 表格列样式 */
.report-table th:nth-child(1),
.report-table td:nth-child(1) {
  width: 20%;
  font-family: 'Courier New', monospace;
  color: #8e44ad;
  font-weight: 600;
}

.report-table th:nth-child(2),
.report-table td:nth-child(2) {
  width: 30%;
  font-weight: 600;
  color: #2c3e50;
}

.report-table th:nth-child(3),
.report-table td:nth-child(3) {
  width: 15%;
  text-align: center;
  color: #3498db;
  font-weight: 500;
}

.report-table th:nth-child(4),
.report-table td:nth-child(4) {
  width: 12%;
  text-align: center;
  color: #27ae60;
  font-weight: 600;
}

.report-table th:nth-child(5),
.report-table td:nth-child(5) {
  width: 12%;
  text-align: center;
  color: #e67e22;
  font-weight: 600;
}

.report-table th:nth-child(6),
.report-table td:nth-child(6) {
  width: 11%;
  text-align: center;
  color: #95a5a6;
  font-size: 10px;
}

.destination-summary {
  margin: 0;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.summary-table td {
  padding: 8px 12px;
  font-weight: 700;
  font-size: 12px;
  border: none;
  background: transparent;
}

.summary-label {
  width: 25%;
  text-align: left;
  color: #2c3e50;
  font-size: 13px;
}

.summary-value {
  width: 25%;
  text-align: center;
  color: #34495e;
}

.summary-value:nth-child(2) {
  color: #27ae60;
}

.summary-value:nth-child(3) {
  color: #e67e22;
}

.summary-value:nth-child(4) {
  color: #8e44ad;
}

.separator-line {
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, #667eea, #764ba2);
  margin-top: 12px;
  border-radius: 1px;
  box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
}

@media print {
  body {
    background: #fff;
  }

  .shipping-report {
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .shipping-report::before {
    display: none;
  }

  .report-header {
    box-shadow: none;
    border-bottom: 3px solid #2c3e50;
  }

  .destination-section {
    box-shadow: none;
    border: 1px solid #dee2e6;
    page-break-before: auto;
    margin-bottom: 25px;
  }

  .report-table tbody tr:hover {
    background: transparent;
  }
}

@media screen {
  .shipping-report {
    background: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin: 20px;
  }

  .destination-section {
    margin-bottom: 25px;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .header-left,
  .header-right {
    text-align: center;
  }

  .report-table {
    font-size: 10px;
  }

  .report-table th,
  .report-table td {
    padding: 6px 4px;
  }
}
</style>
