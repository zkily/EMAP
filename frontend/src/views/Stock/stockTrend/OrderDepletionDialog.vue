<template>
  <el-dialog v-model="visible" title="📉 在庫枯済予測一覧" width="80%" top="5vh" :close-on-click-modal="false">
    <el-form :inline="true" class="filter-form">
      <el-form-item label="期間">
        <el-date-picker v-model="filters.date_range" type="daterange" start-placeholder="開始日" end-placeholder="終了日"
          format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="フィルタ">
        <el-radio-group v-model="filterMode" size="small">
          <!-- <el-radio-button :label="'all'">全て</el-radio-button> -->
          <el-radio-button :label="'depleted'">枯済まで</el-radio-button>
          <el-radio-button :label="'active'">在庫続行中</el-radio-button>
          <el-radio-button :label="'low_stock'">安全在庫割れ</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchData">検索</el-button>
        <el-button type="success" @click="exportToExcel">📄 Excel</el-button>
        <el-button type="warning" @click="exportToPDF">📄 PDF</el-button>
        <el-button @click="handlePrint">🖨️ 印刷</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="sortedList" border stripe :default-sort="{ prop: 'days_until_depletion', order: 'ascending' }">
      <el-table-column label="製品CD" prop="product_cd" width="120" sortable />
      <el-table-column label="製品名" prop="product_name" sortable />
      <el-table-column label="枯済日" prop="depletion_date" sortable>
        <template #default="{ row }">
          <span v-if="row.depletion_date" style="color: red; font-weight: bold">{{ row.depletion_date }}</span>
          <el-tag type="success" v-else>🚚 在庫続行中</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="在庫継続終了日" prop="last_positive_date" sortable>
        <template #default="{ row }">
          <span>{{ row.last_positive_date || '---' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最終在庫" prop="final_balance" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.final_balance < row.safety_stock ? 'red' : '' }">{{ row.final_balance }}</span>
        </template>
      </el-table-column>
      <el-table-column label="安全在庫" prop="safety_stock" sortable>
        <template #default="{ row }">
          <span>{{ row.safety_stock }}</span>
        </template>
      </el-table-column>
      <el-table-column label="枯済までの日数" prop="days_until_depletion" sortable>
        <template #default="{ row }">
          <span v-if="row.days_until_depletion !== null"
            :style="{ color: row.days_until_depletion <= 0 ? 'red' : row.days_until_depletion <= 3 ? 'orange' : '' }">
            {{ row.days_until_depletion }} 日
          </span>
          <span v-else>---</span>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', val: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const filters = ref({ date_range: getDefaultRange() })
function getDefaultRange(): [string, string] {
  const today = new Date()
  const past = new Date()
  past.setDate(today.getDate() - 30)
  const format = (d: Date) => d.toISOString().slice(0, 10)
  return [format(past), format(today)]
}

const filterMode = ref<'all' | 'depleted' | 'active' | 'low_stock'>('all')
const depletionList = ref<any[]>([])

const filteredList = computed(() => {
  return depletionList.value.filter(item => {
    if (filterMode.value === 'depleted') return !!item.depletion_date
    if (filterMode.value === 'active') return !item.depletion_date
  })
})

const sortedList = computed(() => {
  return [...filteredList.value].sort((a, b) => {
    if (a.days_until_depletion === null) return 1
    if (b.days_until_depletion === null) return -1
    return a.days_until_depletion - b.days_until_depletion
  })
})

const fetchData = async () => {
  const [start, end] = filters.value.date_range
  try {
    const res = await request.get('/api/stock/stock-depletion-dates', {
      params: { start_date: start, end_date: end }
    })
    depletionList.value = res
  } catch (err: any) {
    ElMessage.error(err?.message || '取得失敗')
  }
}

const exportToExcel = () => {
  const data = sortedList.value.map(row => ({
    製品CD: row.product_cd,
    製品名: row.product_name,
    枯渇日: row.depletion_date || '在庫継続中',
    最終在庫: row.final_balance,
    '枯渇まで(日)': row.days_until_depletion ?? '---'
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '在庫枯渇予測')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'stock_depletion_list.xlsx')
}

const exportToPDF = () => {
  const doc = new jsPDF()
  doc.text('在庫枯渇予測一覧', 14, 15)
  autoTable(doc, {
    startY: 20,
    head: [['製品CD', '製品名', '枯渇日', '最終在庫', '枯渇まで(日)']],
    body: sortedList.value.map(r => [
      r.product_cd,
      r.product_name,
      r.depletion_date || '在庫継続中',
      r.final_balance,
      r.days_until_depletion ?? '---'
    ])
  })
  doc.save('stock_depletion_list.pdf')
}

const handlePrint = () => {
  const printWindow = window.open('', '', 'width=900,height=700')
  if (!printWindow) return

  const html = `
    <html><head><title>在庫枯渇予測</title>
    <style>
      table { border-collapse: collapse; width: 100%; font-size: 13px }
      th, td { border: 1px solid #ccc; padding: 6px; text-align: left }
      th { background-color: #f0f0f0 }
      .red { color: red; font-weight: bold }
      .orange { color: orange; font-weight: bold }
    </style></head><body>
    <h2>📉 在庫枯渇予測一覧</h2>
    <table>
      <thead>
        <tr><th>製品CD</th><th>製品名</th><th>枯渇日</th><th>最終在庫</th><th>枯渇まで</th></tr>
      </thead>
      <tbody>
        ${sortedList.value.map(r => `
          <tr>
            <td>${r.product_cd}</td>
            <td>${r.product_name}</td>
            <td class="${r.depletion_date ? 'red' : ''}">${r.depletion_date || '在庫継続中'}</td>
            <td>${r.final_balance}</td>
            <td class="${r.days_until_depletion <= 0 ? 'red' : r.days_until_depletion <= 3 ? 'orange' : ''}">
              ${r.days_until_depletion ?? '---'}日
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}
</script>


<style scoped>
.filter-form {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.el-form-item {
  margin-right: 16px;
}

.el-dialog__body {
  padding-top: 10px;
}

.el-table {
  font-size: 13px;
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background-color: #409eff;
  color: white;
  font-weight: bold;
}

.el-table td {
  background-color: #fcfcfc;
}

.el-button {
  border-radius: 6px !important;
}

.el-radio-button__inner {
  border-radius: 6px !important;
  padding: 6px 12px !important;
}

/* 打印样式 */
@media print {
  body * {
    visibility: hidden;
  }
  .el-dialog__wrapper,
  .el-dialog__wrapper * {
    visibility: visible;
  }
  .el-dialog__wrapper {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
