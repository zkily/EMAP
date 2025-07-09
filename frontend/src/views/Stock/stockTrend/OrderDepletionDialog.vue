<template>
  <el-dialog
    v-model="visible"
    title="📉 在庫不足一覧"
    width="80%"
    top="5vh"
    :close-on-click-modal="false"
  >
    <div class="filter-section">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="期間">
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
        <el-form-item>
          <div class="date-buttons">
            <el-button size="small" @click="setDateOffset(-1)">📅 -1日</el-button>
            <el-button size="small" type="primary" @click="setToday">📅 本日</el-button>
            <el-button size="small" @click="setDateOffset(1)">📅 +1日</el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData" :loading="loading">
            <el-icon><Search /></el-icon>
            検索
          </el-button>
          <el-button @click="handlePrint" :disabled="sortedNegativeStockList.length === 0">
            <el-icon><Printer /></el-icon>
            印刷
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 統計情報 -->
      <div class="stats-card" v-if="sortedNegativeStockList.length > 0">
        <el-card shadow="never" class="stats-content">
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">抽出件数:</span>
              <span class="stat-value">{{ sortedNegativeStockList.length }}</span>
              <span class="stat-unit">件</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">対象日数:</span>
              <span class="stat-value">{{ uniqueDatesCount }}</span>
              <span class="stat-unit">日</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">対象品目数:</span>
              <span class="stat-value">{{ uniqueProductsCount }}</span>
              <span class="stat-unit">品目</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <el-table :data="sortedNegativeStockList" border stripe>
      <el-table-column label="納入先名" prop="納入先名" sortable />
      <el-table-column label="製品CD" prop="製品CD" width="120" sortable />
      <el-table-column label="製品名" prop="製品名" sortable />
      <el-table-column label="製品種類" prop="製品種類" width="130" sortable />
      <el-table-column label="日付" prop="日付" sortable>
        <template #default="{ row }">
          <span style="font-weight: bold">{{ row.日付 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="在庫数" prop="在庫数" sortable>
        <template #default="{ row }">
          <span style="color: red; font-weight: bold">{{ row.在庫数 }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getNegativeStockData } from '@/api/stock/productStock'
import { ElMessage } from 'element-plus'
import { Search, Printer } from '@element-plus/icons-vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', val: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const filters = ref({ date_range: getDefaultRange() })
const loading = ref(false)

function getDefaultRange(): [string, string] {
  const today = new Date()
  const format = (d: Date) => d.toISOString().slice(0, 10)
  // デフォルトは当日に設定
  return [format(today), format(today)]
}

// 日付操作関数
const setToday = () => {
  const today = new Date()
  const format = (d: Date) => d.toISOString().slice(0, 10)
  filters.value.date_range = [format(today), format(today)]
}

const setDateOffset = (offset: number) => {
  const [start, end] = filters.value.date_range
  const startDate = new Date(start)
  const endDate = new Date(end)

  startDate.setDate(startDate.getDate() + offset)
  endDate.setDate(endDate.getDate() + offset)

  const format = (d: Date) => d.toISOString().slice(0, 10)
  filters.value.date_range = [format(startDate), format(endDate)]
}

const negativeStockList = ref<any[]>([])

// 按製品名排序的数据
const sortedNegativeStockList = computed(() => {
  return [...negativeStockList.value].sort((a, b) => {
    const nameA = a.製品名 || ''
    const nameB = b.製品名 || ''
    return nameA.localeCompare(nameB, 'ja', { numeric: true })
  })
})

// 統計計算
const uniqueDatesCount = computed(() => {
  const dates = new Set(negativeStockList.value.map((item) => item.日付))
  return dates.size
})

const uniqueProductsCount = computed(() => {
  const products = new Set(negativeStockList.value.map((item) => item.製品CD))
  return products.size
})

const fetchData = async () => {
  const [start, end] = filters.value.date_range
  loading.value = true
  try {
    const res = await getNegativeStockData({
      start_date: start,
      end_date: end,
    })
    console.log('API応答:', res) // デバッグログ

    // バックエンドから返されるデータ構造に応じてデータを処理
    if (Array.isArray(res)) {
      negativeStockList.value = res
    } else if (res && Array.isArray(res.data)) {
      negativeStockList.value = res.data
    } else {
      negativeStockList.value = []
      console.warn('有効なデータ配列が見つかりません:', res)
    }
  } catch (err: any) {
    console.error('在庫不足データの取得に失敗しました:', err)
    ElMessage.error(err?.message || '取得失敗')
  } finally {
    loading.value = false
  }
}

// ダイアログが開かれたときに自動でデータを取得
watch(visible, (newVal) => {
  if (newVal) {
    fetchData()
  }
})

const handlePrint = () => {
  const printWindow = window.open('', '', 'width=1200,height=800')
  if (!printWindow) return

  // 日付でデータをグループ化（製品名でソート済みのデータを使用）
  const groupedData = sortedNegativeStockList.value.reduce((groups: any, item) => {
    const date = item.日付
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {})

  // 各日付グループ内でも製品名でソート
  Object.keys(groupedData).forEach((date) => {
    groupedData[date].sort((a: any, b: any) => {
      const nameA = a.製品名 || ''
      const nameB = b.製品名 || ''
      return nameA.localeCompare(nameB, 'ja', { numeric: true })
    })
  })

  // 日付でソート
  const sortedDates = Object.keys(groupedData).sort()

  const html = `
    <html>
    <head>
      <title>在庫不足一覧</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'MS Gothic', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .print-date {
          font-size: 14px;
          color: #666;
        }
        .stats-summary {
          background-color: #f5f5f5;
          padding: 15px;
          margin-bottom: 25px;
          border-radius: 5px;
          border: 1px solid #ddd;
        }
        .stats-row {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
        }
        .stat-item {
          text-align: center;
          margin: 5px;
        }
        .stat-label {
          font-size: 11px;
          color: #666;
          display: block;
        }
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #e74c3c;
        }
        .date-group {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .date-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .date-count {
          background-color: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 14px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 11px;
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #495057;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #dee2e6;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background-color: #f8f9fa;
        }
        tr:hover td {
          background-color: #e8f4f8;
        }
        .red {
          color: #e74c3c;
          font-weight: bold;
          background-color: #fdf2f2;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .product-cd {
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        .product-type {
          background-color: #e3f2fd;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          color: #1976d2;
        }
        @media print {
          body { margin: 15px; }
          .date-group { page-break-inside: avoid; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">📉 在庫不足一覧</div>
        <div class="print-date">印刷日時: ${new Date().toLocaleString('ja-JP')}</div>
      </div>

      <div class="stats-summary">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">総件数</span>
            <span class="stat-value">${sortedNegativeStockList.value.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">対象日数</span>
            <span class="stat-value">${sortedDates.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">対象品目数</span>
            <span class="stat-value">${uniqueProductsCount.value}</span>
          </div>
        </div>
      </div>

      ${sortedDates
        .map((date) => {
          const items = groupedData[date]
          return `
          <div class="date-group">
            <div class="date-header">
              <span>📅 ${date}</span>
              <span class="date-count">${items.length}件</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>納入先名</th>
                  <th>製品CD</th>
                  <th>製品名</th>
                  <th>製品種類</th>
                  <th>在庫数</th>
                </tr>
              </thead>
              <tbody>
                                 ${items
                                   .map(
                                     (item: any) => `
                  <tr>
                    <td>${item.納入先名 || '-'}</td>
                    <td class="product-cd">${item.製品CD}</td>
                    <td>${item.製品名}</td>
                    <td><span class="product-type">${item.製品種類 || '-'}</span></td>
                    <td class="red">${item.在庫数}</td>
                  </tr>
                `,
                                   )
                                   .join('')}
              </tbody>
            </table>
          </div>
        `
        })
        .join('')}
    </body>
    </html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}
</script>

<style scoped>
.filter-section {
  margin-bottom: 10px;
}

.filter-form {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
  color: white;
  margin-bottom: 10px;
}

.filter-form :deep(.el-form-item__label) {
  color: white !important;
  font-weight: 600;
}

.date-picker {
  min-width: 280px;
}

.date-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-buttons .el-button {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
}

.date-buttons .el-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.date-buttons .el-button--primary {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.el-form-item {
  margin-right: 24px;
}

.stats-card {
  margin-bottom: 10px;
}

.stats-content {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stats-content :deep(.el-card__body) {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  flex: 1;
  min-width: 120px;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
  display: block;
  margin-bottom: 4px;
}

.stat-unit {
  font-size: 12px;
  color: #adb5bd;
  font-weight: 500;
}

.el-dialog__body {
  padding: 15px;
  background-color: #f8f9fa;
}

.el-table {
  font-size: 13px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.el-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.el-table :deep(.el-table__header th) {
  background: transparent !important;
  color: rgb(15, 12, 12) !important;
  font-weight: bold;
  border: none;
  padding: 16px 12px;
}

.el-table :deep(.el-table__body tr) {
  transition: all 0.3s ease;
}

.el-table :deep(.el-table__body tr:hover) {
  background-color: #e3f2fd !important;
  transform: scale(1.01);
}

.el-table :deep(.el-table__body td) {
  background-color: #fcfcfc;
  border-color: #e9ecef;
  padding: 14px 12px;
  vertical-align: middle;
}

.el-table :deep(.el-table__body tr:nth-child(even) td) {
  background-color: #f8f9fa;
}

.el-button {
  border-radius: 8px !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a3093 100%);
}

.el-button:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-form {
    padding: 16px;
  }

  .stats-row {
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    min-width: auto;
    width: 100%;
  }

  .date-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
