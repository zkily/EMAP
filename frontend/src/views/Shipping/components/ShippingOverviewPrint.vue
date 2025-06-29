<template>
  <div class="shipping-overview-print">
    <!-- Loop for each shipping date -->
    <div v-for="dateGroup in groupedData" :key="dateGroup.shipping_date" class="page-container">
      <!-- 打印头部 -->
      <div class="print-header">
        <div class="header-left">
          <span>印刷日時:</span>
          <span>{{ printDateTime }}</span>
        </div>
        <div class="header-center">
          <h1 class="print-title">出荷予定表</h1>
        </div>
        <div class="header-right">
          <span>出荷日:</span>
          <span>{{ formatDate(dateGroup.shipping_date) }}</span>
        </div>
      </div>

      <!-- 打印中部 - 两列布局 -->
      <div class="print-body">
        <div class="column" v-for="colIndex in 2" :key="colIndex">
          <div
            v-for="destGroup in getColumnData(dateGroup, colIndex - 1)"
            :key="destGroup.destination_name"
            class="destination-group"
          >
            <h2 class="destination-name">{{ destGroup.destination_name }}</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>製品名</th>
                  <th>数量</th>
                  <th>出荷No</th>
                  <th>確認</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in destGroup.items" :key="index">
                  <td>{{ item.product_name }}</td>
                  <td style="text-align: center">{{ item.quantity }}</td>
                  <td style="text-align: center">
                    {{ item.shipping_no ? item.shipping_no.slice(-2) : '' }}
                  </td>
                  <td class="checkbox-cell">
                    <span class="checkbox"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('ja-JP-u-ca-japanese', options)
}

// Group data by shipping_date and then by destination_name
const groupedData = computed(() => {
  if (!props.data || props.data.length === 0) return []

  const result = []
  const dateMap = new Map()

  props.data.forEach((item) => {
    if (!dateMap.has(item.shipping_date)) {
      dateMap.set(item.shipping_date, new Map())
    }
    const destMap = dateMap.get(item.shipping_date)

    if (!destMap.has(item.destination_name)) {
      destMap.set(item.destination_name, [])
    }
    destMap.get(item.destination_name).push(item)
  })

  dateMap.forEach((destMap, shipping_date) => {
    const destinations = []
    destMap.forEach((items, destination_name) => {
      destinations.push({ destination_name, items })
    })
    result.push({ shipping_date, destinations })
  })

  return result.sort((a, b) => new Date(a.shipping_date) - new Date(b.shipping_date))
})

function getColumnData(dateGroup, columnIndex) {
  return dateGroup.destinations.filter((_, index) => index % 2 === columnIndex)
}
</script>

<style scoped>
@page {
  size: A4 portrait; /* 纵向 */
  /* 上:1.5cm, 左右:0.4cm, 下:0.5cm */
  margin: 1.5cm 0.4cm 0.5cm;
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  background: transparent !important; /* 去掉所有背景色 */
  color: #000 !important; /* 确保字体为黑色 */
}

.shipping-overview-print {
  font-family: 'MS Gothic', sans-serif;
  line-height: 1.3;
  font-size: 16px; /* 增大基础字体 */
}

.page-container {
  page-break-after: always;
}
.page-container:last-child {
  page-break-after: auto;
}

/* Header */
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding-bottom: 5px;
  margin-bottom: 10px;
  margin-top: 1.5cm;
  page-break-after: avoid;
}

.header-left,
.header-right {
  font-size: 14px; /* 增大头部辅助字体 */
}
.header-left span:first-child,
.header-right span:first-child {
  font-weight: bold;
}

.print-title {
  font-size: 22px; /* 增大主标题字体 */
  font-weight: bold;
  margin: 0;
}

/* Body */
.print-body {
  display: flex;
  gap: 12px;
}

.column {
  flex: 1;
  min-width: 0;
}

.destination-group {
  /* margin-bottom: 10px; */
  page-break-inside: avoid;
  /* border: 1px solid #000; */ /* 移除外层边框 */
  margin-bottom: 10px; /* 保持分组间距 */
}

.destination-name {
  font-size: 17px; /* 增大分组标题字体 */
  font-weight: bold;
  padding: 4px 6px;
  border-bottom: 1px solid #000;
  text-align: center;
  page-break-after: avoid;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000; /* 确保表格有边框 */
  border-top: none; /* 去掉表格顶部边框，与标题无缝连接 */
}

.print-table th,
.print-table td {
  border: 1px solid #000;
  padding: 4px;
  font-size: 14px; /* 增大表格字体 */
  text-align: left;
  word-break: break-all;
}

.print-table th {
  font-weight: bold;
  text-align: center;
}

/* 列宽设置 */
.print-table th:nth-child(1),
.print-table td:nth-child(1) {
  width: 45%;
} /* 製品名 */
.print-table th:nth-child(2),
.print-table td:nth-child(2) {
  width: 15%;
} /* 数量 */
.print-table th:nth-child(3),
.print-table td:nth-child(3) {
  width: 25%;
} /* 出荷No */
.print-table th:nth-child(4),
.print-table td:nth-child(4) {
  width: 15%;
} /* 確認 */

/* 確認列的内容左内边距 */
.print-table td:nth-child(4) {
  padding-left: 20px;
}

.checkbox-cell {
  vertical-align: middle; /* 垂直居中 */
  text-align: center; /* 水平居中 */
}

.checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid #000;
  display: inline-block;
}
</style>
