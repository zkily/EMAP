<template>
  <el-card class="stock-recalc-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div>
          <p v-if="result?.updatedCount" class="summary-text">
            ✅ 更新件数: <strong>{{ result.updatedCount }}</strong> 件
            <span v-if="executedAt" class="executed-at">📅 最终再计算日时：{{ formatExecutedAt(executedAt) }}</span>
          </p>
        </div>
        <el-button type="primary" :loading="loading" @click="confirmRecalculate" round icon="Refresh">
          再计算を実行
        </el-button>
      </div>
    </template>

    <!-- メッセージ -->
    <el-alert v-if="result?.message" :title="result.message" :type="result?.updatedCount ? 'success' : 'info'" show-icon
      class="alert-box" />

    <!-- ❌ 负在庫 -->
    <el-card v-if="result.anomalies.negativeStock.length" class="anomaly-card" shadow="never">
      <template #header>❌ <strong>负在库一览</strong></template>
      <el-table :data="result.anomalies.negativeStock" border stripe size="small">
        <el-table-column label="材料CD" prop="material_cd" width="120" />
        <el-table-column label="材料名" prop="material_name" width="180" />
        <el-table-column label="仓库CD" prop="location_cd" width="160" />
        <el-table-column label="批次" prop="lot_no" width="120" />
        <el-table-column label="数量" prop="quantity" />
        <el-table-column label="单位" prop="unit" width="80" />
      </el-table>
    </el-card>

    <!-- ⚠️ 同一材料多仓库 -->
    <el-card v-if="result.anomalies.multiLocations.length" class="anomaly-card" shadow="never">
      <template #header>⚠️ <strong>同一材料存在于多个仓库</strong></template>
      <el-table :data="result.anomalies.multiLocations" border stripe size="small">
        <el-table-column label="材料CD" prop="material_cd" />
        <el-table-column label="材料名" prop="material_name" width="180" />
        <el-table-column label="仓库数" prop="location_count" />
      </el-table>
    </el-card>

    <!-- ⚠️ 重复批次 -->
    <el-card v-if="result.anomalies.duplicateLots.length" class="anomaly-card" shadow="never">
      <template #header>⚠️ <strong>重复批次</strong></template>
      <el-table :data="result.anomalies.duplicateLots" border stripe size="small">
        <el-table-column label="材料CD" prop="material_cd" width="120" />
        <el-table-column label="材料名" prop="material_name" width="180" />
        <el-table-column label="仓库CD" prop="location_cd" width="160" />
        <el-table-column label="重复数" prop="count" />
      </el-table>
    </el-card>

    <!-- 📦 材料在库一览 -->
    <el-card v-if="result.stockList?.length" class="anomaly-card" shadow="always">
      <template #header>
        <div class="card-header">
          <h3>📦 材料在库一览</h3>
          <el-button size="small" type="success" @click="handlePrint" round icon="Printer">
            打印
          </el-button>
        </div>
      </template>

      <div class="stock-summary-cards">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-title">📋 件数</div>
          <div class="summary-value">{{ filteredStockList.length }}</div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div class="summary-title">📦 总在库数</div>
          <div class="summary-value">{{ totalQuantity }}</div>
        </el-card>
      </div>

      <el-input v-model="searchKeyword" placeholder="材料CD、材料名或供应商名称搜索" clearable size="small" />

      <el-table :data="pagedStockList" border stripe size="small" height="420" @sort-change="handleSort">
        <el-table-column label="仓库CD" prop="location_cd" width="140" />
        <el-table-column label="供应商名称" prop="supplier_name" />
        <el-table-column label="材料CD" prop="material_cd" width="120" />
        <el-table-column label="材料名" prop="material_name" sortable />
        <el-table-column label="数量" prop="quantity" sortable />
        <el-table-column label="单位" prop="unit" width="80" />
      </el-table>

      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" layout="prev, pager, next"
        :total="filteredStockList.length" size="small" />
    </el-card>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

interface StockItem {
  material_cd: string
  material_name?: string
  location_cd: string
  lot_no: string
  quantity: number
  unit: string
  supplier_name?: string
}

interface NegativeStockItem {
  material_cd: string
  material_name?: string
  location_cd: string
  lot_no: string
  quantity: number
  unit: string
}

interface MultiLocationItem {
  material_cd: string
  material_name?: string
  location_count: number
}

interface DuplicateLotItem {
  material_cd: string
  material_name?: string
  location_cd: string
  count: number
}

interface SortChangeEvent {
  prop: 'material_name' | 'quantity' | ''
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
  },
  stockList: StockItem[]
}

const loading = ref(false)
const result = ref<Result>({
  message: '',
  updatedCount: 0,
  anomalies: { negativeStock: [], multiLocations: [], duplicateLots: [] },
  stockList: []
})

const executedAt = ref<string | null>(null)
const searchKeyword = ref('')
const pageSize = ref(20)
const currentPage = ref(1)
const sortProp = ref<'material_name' | 'quantity' | ''>('')
const sortOrder = ref<'ascending' | 'descending' | null>(null)

const handleSort = ({ prop, order }: SortChangeEvent) => {
  sortProp.value = prop
  sortOrder.value = order
}

const totalQuantity = computed(() =>
  filteredStockList.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
)

const filteredStockList = computed(() => {
  if (!result.value?.stockList) return []
  return result.value.stockList.filter(item => {
    const keyword = searchKeyword.value.toLowerCase()
    return (
      item.material_cd?.toLowerCase().includes(keyword) ||
      item.material_name?.toLowerCase().includes(keyword) ||
      item.supplier_name?.toLowerCase().includes(keyword)
    )
  })
})

const sortedList = computed(() => {
  if (!filteredStockList.value) return []
  if (!sortProp.value || !sortOrder.value) return filteredStockList.value
  const prop = sortProp.value as keyof StockItem
  return [...filteredStockList.value].sort((a, b) => {
    const valA = a[prop] ?? ''
    const valB = b[prop] ?? ''
    if (valA === valB) return 0
    return sortOrder.value === 'ascending'
      ? valA > valB ? 1 : -1
      : valA < valB ? 1 : -1
  })
})

const pagedStockList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedList.value.slice(start, start + pageSize.value)
})

const isAuto = ref(true)
const handleRecalculate = async () => {
  loading.value = true
  try {
    const res = await request.post('/api/stock/materials/recalculate-and-check', { auto: isAuto.value })
    result.value = res
    executedAt.value = res.executedAt
    if (!isAuto.value) {
      ElMessage.success(res.message || '在库再计算完成')
    }
  } catch {
    ElMessage.error('在库再计算失败')
  } finally {
    loading.value = false
    isAuto.value = false
  }
}

const confirmRecalculate = () => {
  ElMessageBox.confirm('确定要执行在库再计算吗？', '确认', {
    confirmButtonText: '是',
    cancelButtonText: '否',
    type: 'warning',
  }).then(() => handleRecalculate())
}

const handlePrint = () => {
  const sorted = [...result.value.stockList].sort((a, b) => {
    const nameA = (a.material_name ?? '').toLowerCase()
    const nameB = (b.material_name ?? '').toLowerCase()
    if (nameA === nameB) return 0
    return nameA > nameB ? 1 : -1
  })

  const printContent = `
    <html>
      <head>
        <title>材料在库一览 打印</title>
        <style>
          body { font-family: sans-serif; padding: 10px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 12px; }
          th { background-color: #f0f0f0; }
          h2 { text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>📦 材料在库一览 打印用</h2>
        <table>
          <thead>
            <tr>
              <th>材料CD</th>
              <th>材料名</th>
              <th>供应商名称</th>
              <th>仓库CD</th>
              <th>批次</th>
              <th>数量</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(item => `
              <tr>
                <td>${item.material_cd}</td>
                <td>${item.material_name ?? ''}</td>
                <td>${item.supplier_name ?? ''}</td>
                <td>${item.location_cd}</td>
                <td>${item.lot_no}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td>${item.unit}</td>
              </tr>
            `).join('')}
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 22px;
  font-weight: bold;
  margin: 0;
}

.alert-box {
  margin: 100px 0;
}

.executed-at {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

.summary-text {
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
}

.anomaly-card {
  margin-top: 1px;
  padding: 5px;
}

.stock-summary-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.summary-card {
  flex: 1;
  text-align: center;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.summary-title {
  font-size: 15px;
  color: #666;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.el-table th,
.el-table td {
  font-size: 16px !important;
}

@media print {

  .el-button,
  .el-input,
  .el-pagination,
  .stock-summary-cards {
    display: none !important;
  }

  .el-card {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .el-table__header-wrapper,
  .el-table__body-wrapper {
    overflow: visible !important;
  }

  body {
    margin: 5mm !important;
    font-size: 14px !important;
  }

  th,
  td {
    padding: 6px !important;
  }
}

.el-input {
  margin-bottom: 8px;
}

.el-input .el-input__inner {
  height: 36px;
}
</style>
