<!-- stock-snapshot-page.vue 最终优化版 -->
<template>
  <div class="stock-snapshot-page">
    <!-- 📦 页面标题 -->
    <h2>📦 製品在庫履歴分析</h2>

    <!-- 📦 筛选区域 -->
    <div class="filter-area">
      <el-form :inline="true" :model="filters" class="filter-form" @submit.prevent>
        <!-- 📦 产品选择 -->
        <el-form-item label="製品CD">
          <el-input v-model="productText" placeholder="📦 製品選択" readonly @click="dialogVisible = true" class="select-input" />
          <product-select-dialog v-model="dialogVisible" @confirm="handleProductSelect" />
        </el-form-item>

        <!-- 📦 保管場所选择 -->
        <el-form-item label="保管場所">
          <el-select v-model="filters.location_cd" placeholder="選択" clearable class="location-select">
            <el-option v-for="loc in locationOptions" :key="loc.cd" :label="loc.name" :value="loc.cd" />
          </el-select>
        </el-form-item>

        <!-- 📅 期间选择 -->
        <el-form-item label="期間">
          <el-date-picker v-model="filters.date_range" type="daterange" start-placeholder="開始日" end-placeholder="終了日" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>

        <!-- 🔍 查询按钮 -->
        <el-form-item>
          <el-button type="primary" @click="fetchData">検索</el-button>
          <el-button type="warning" @click="clearFilters">リセット</el-button>
        </el-form-item>
      </el-form>

      <!-- 📥 导出 + 打印 -->
      <div class="button-group">
        <el-button type="success" @click="exportToExcel">📤 Excel出力</el-button>
        <el-button type="info" @click="printTable">🖨️ 印刷</el-button>
      </div>
    </div>

    <!-- 📊 表格/图表切换 -->
    <el-radio-group v-model="viewMode" size="small" class="view-mode-toggle">
      <el-radio-button value="table">📋 表</el-radio-button>
      <el-radio-button value="chart">📊 チャート</el-radio-button>
    </el-radio-group>

    <!-- 📋 表格显示 -->
    <el-table v-if="viewMode === 'table'" :data="snapshotData" border stripe>
      <el-table-column label="日付" prop="snapshot_date" width="120" />
      <el-table-column label="製品CD" prop="product_cd" width="120" />
      <el-table-column label="製品名" prop="product_name" min-width="160" />
      <el-table-column label="保管場所" prop="location_cd" width="180" />
      <el-table-column label="数量" prop="quantity" width="120">
        <template #default="{ row }">
          <span :style="{ color: row.quantity < 0 ? 'red' : '' }">
            {{ row.quantity }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 📊 图表显示 -->
    <div v-if="viewMode === 'chart' && chartData.length">
      <stock-snapshot-chart :data="chartData" />
    </div>
  </div>
</template>

<script setup lang="ts">
// ✅ vue & 依赖
import { ref, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import StockSnapshotChart from './StockSnapshotChart.vue'
import ProductSelectDialog from '@/views/components/ProductSelectDialog.vue'
import { getProductOptions } from '@/api/options'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ✅ 状态变量
const filters = ref({
  product_cd: '',
  location_cd: '製品倉庫',
  date_range: []
})

const snapshotData = ref<any[]>([])
const viewMode = ref<'table' | 'chart'>('table')
const dialogVisible = ref(false)
const selectedProduct = ref<{ cd: string, name: string }>({ cd: '', name: '' })
const productText = ref('')

// ✅ 产品选择逻辑
const handleProductSelect = async (selectedCds: string[]) => {
  if (!selectedCds.length) return
  const all = await getProductOptions()
  const product = all.find(opt => opt.cd === selectedCds[0])
  if (product) {
    selectedProduct.value = { cd: product.cd, name: product.name }
    filters.value.product_cd = product.cd
    productText.value = `${product.cd}｜${product.name}`
  }
}

const clearFilters = () => {
  selectedProduct.value = { cd: '', name: '' }
  productText.value = ''
  filters.value.product_cd = ''
  filters.value.location_cd = '製品倉庫'
  filters.value.date_range = []
}

// ✅ 保管場所下拉
const locationOptions = [
  '製品倉庫', '仮設倉庫', '仕上倉庫',
  'メッキ倉庫', '加工棟', '部品倉庫', 'その他'
].map(cd => ({ cd, name: cd }))

// ✅ 查询接口
const fetchData = async () => {
  try {
    const res = await request.get('/api/stock/snapshots', {
      params: {
        product_cd: filters.value.product_cd || undefined,
        location_cd: filters.value.location_cd || undefined,
        start_date: filters.value.date_range[0] ?? undefined,
        end_date: filters.value.date_range[1] ?? undefined
      }
    })
    snapshotData.value = res ?? []
  } catch (err: any) {
    ElMessage.error(err?.message || '取得失敗')
  }
}

// ✅ Excel导出
const exportToExcel = () => {
  if (!snapshotData.value.length) {
    ElMessage.warning('出力データがありません')
    return
  }
  const exportData = snapshotData.value.map(row => ({
    日付: row.snapshot_date,
    製品CD: row.product_cd,
    製品名: row.product_name ?? '',
    保管場所: row.location_cd,
    数量: row.quantity
  }))
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'スナップショット')
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'stock_snapshot.xlsx')
}

// ✅ 打印
const printTable = () => {
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) return
  const tableHtml = document.querySelector('.el-table')?.outerHTML ?? ''
  printWindow.document.write(`
    <html>
      <head>
        <title>在庫スナップショット印刷</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>📦 製品在庫スナップショット印刷</h2>
        ${tableHtml}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

// ✅ 图表数据计算
const chartData = computed(() => {
  if (!filters.value.product_cd || !filters.value.location_cd) return []
  return snapshotData.value
    .filter(row => row.product_cd === filters.value.product_cd && row.location_cd === filters.value.location_cd)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map(row => ({
      date: row.snapshot_date,
      quantity: row.quantity,
      product_name: row.product_name ?? ''
    }))
})
</script>

<style scoped>
.stock-snapshot-page {
  padding: 16px 24px;
}

h2 {
  margin-bottom: 16px;
}

/* 📋 筛选区样式 */
.filter-area {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 14px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  padding: 12px 16px;
  border-radius: 8px;
  gap: 10px;
}

.el-form-item {
  min-width: 220px;
}

.el-form-item__label {
  font-weight: bold;
  text-align: left;
}

/* 📥 导出&打印按钮组 */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.el-button {
  min-width: 110px;
}

/* 📊 表格/图表切换按钮 */
.view-mode-toggle {
  margin-bottom: 12px;
}

/* 📋 表格样式 */
.el-table {
  font-size: 13px;
  border-color: #e0e0e0;
  margin-top: 10px;
}

/* 📦 产品选择input */
.select-input {
  width: 220px;
  cursor: pointer;
}

/* 📦 保管場所选择 */
.location-select {
  min-width: 180px;
}

@media (max-width: 768px) {
  .filter-area {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
