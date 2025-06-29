<template>
  <div>
    <h2 style="font-size:1.3em;letter-spacing:2px;margin-bottom:8px;">
      📊 生産スケジュール（多级表头・甘特表＋进度条＋合计行）
    </h2>
    <div style="margin-bottom:12px;">
      <el-radio-group v-model="viewMode" size="small" style="margin-right:14px;">
        <el-radio-button value="day">日表示</el-radio-button>
        <el-radio-button value="hour">時表示</el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="reloadPlans">再読込</el-button>
    </div>
    <ag-grid-vue
      style="width:100%;height:650px;"
      class="ag-theme-alpine gantt-table"
      :columnDefs="columns"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :suppressMovableColumns="true"
      :localeText="localeJP"
      rowSelection="singleRow"
      :pinnedTopRowData="[]"
      :pinnedBottomRowData="bottomRows"
      @cellClicked="onCellClicked"
    />
    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" title="计划详情" width="400px">
      <div v-if="selectedPlan">
        <div><b>工程：</b>{{selectedPlan.process_name}}</div>
        <div><b>设备：</b>{{selectedPlan.machine_name}}</div>
        <div><b>产品：</b>{{selectedPlan.product_name}}</div>
        <div><b>计划数量：</b>{{selectedPlan.quantity}}</div>
        <div><b>实际数量：</b>{{selectedPlan.actual_qty}}</div>
        <div><b>开始：</b>{{selectedPlan.plan_start}}</div>
        <div><b>结束：</b>{{selectedPlan.plan_end}}</div>
        <div><b>状态：</b>{{selectedPlan.status}}</div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible=false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import dayjs from 'dayjs'
import axios from 'axios'

const viewMode = ref('day')
const startDate = ref(dayjs().startOf('month'))
const daysCount = 100
const rowData = ref([])
const planList = ref([])
const dialogVisible = ref(false)
const selectedPlan = ref(null)
const holidays = [
  '2025-06-03',
  '2025-07-15',
  // ...更多假日
]
const jpWeek = ['日', '月', '火', '水', '木', '金', '土']

async function reloadPlans() {
  try {
    const res = await axios.get('/api/schedule')
    planList.value = res.data.data || res.data
    updateRowData()
  } catch (err) {
    planList.value = []
    updateRowData()
  }
}

function isHoliday(field) {
  const weekday = dayjs(field).day()
  return weekday === 0 || weekday === 6 || holidays.includes(field)
}

function updateRowData() {
  // 每条计划数据一行
  const rows = planList.value.map(p => ({
    ...p,
    total_quantity: p.quantity,
    total_actual: p.actual_qty,
    progress: p.quantity ? (p.actual_qty / p.quantity) : 0
  }))

  rows.forEach(row => {
    if (viewMode.value === 'day') {
      const planStart = dayjs(row.plan_start).startOf('day')
      const planEnd = dayjs(row.plan_end).startOf('day')
      // 计算实际工作日数量（排除休息日）
      let actualWorkDays = 0
      let curDay = planStart.clone()
      while (curDay.isSameOrBefore(planEnd, 'day')) {
        if (!isHoliday(curDay.format('YYYY-MM-DD'))) {
          actualWorkDays++
        }
        curDay = curDay.add(1, 'day')
      }
      // 按工作日分摊总量
      let cur = startDate.value
      const end = cur.add(daysCount - 1, 'day')
      while (cur.isBefore(end) || cur.isSame(end, 'day')) {
        const field = cur.format('YYYY-MM-DD')
        row[field] =
          (dayjs(field).isSameOrAfter(planStart, 'day') &&
           dayjs(field).isSameOrBefore(planEnd, 'day') &&
           !isHoliday(field))
            ? Math.round(row.quantity / (actualWorkDays || 1))
            : 0
        cur = cur.add(1, 'day')
      }
    } else if (viewMode.value === 'hour') {
      // 小时模式（演示用：每小时数量也均分）
      const planStart = dayjs(row.plan_start)
      const planEnd = dayjs(row.plan_end)
      let actualWorkHours = 0
      let curHour = planStart.clone()
      while (curHour.isSameOrBefore(planEnd, 'hour')) {
        if (!isHoliday(curHour.format('YYYY-MM-DD'))) {
          actualWorkHours++
        }
        curHour = curHour.add(1, 'hour')
      }
      let cur = startDate.value
      const end = cur.add(daysCount - 1, 'day').endOf('day')
      while (cur.isBefore(end) || cur.isSame(end, 'hour')) {
        const field = cur.format('YYYY-MM-DD HH')
        row[field] =
          (dayjs(field).isSameOrAfter(planStart, 'hour') &&
           dayjs(field).isSameOrBefore(planEnd, 'hour') &&
           !isHoliday(cur.format('YYYY-MM-DD')))
            ? Math.round(row.quantity / (actualWorkHours || 1))
            : 0
        cur = cur.add(1, 'hour')
      }
    }
  })

  // 按 item_no 排序
  rows.sort((a, b) => (a.item_no ?? 0) - (b.item_no ?? 0))
  rowData.value = rows
}

reloadPlans()
watch(viewMode, updateRowData)

function renderPlanCell(params, field) {
  if (params.data[field] && params.data[field] > 0) {
    const progress = params.data.progress || 0
    const barColor = progress >= 0.8 ? '#52c41a' : '#ff4d4f'
    return `
      <div class="gantt-cell-plan" style="background:${params.data.status==='完了'?'#b7eb8f':(params.data.status==='進行中'?'#91d5ff':'#f5f5f5')}; border:1px solid #bbb;">
        <div class="gantt-cell-qty">${params.data[field]}</div>
        <div class="gantt-progress-bar-wrap">
          <div class="gantt-progress-bar-bg"></div>
          <div class="gantt-progress-bar"
            style="width:${Math.min(100,Math.round(progress*100))}%;background:${barColor};"></div>
          <div class="gantt-progress-label">${Math.round(progress*100)}%</div>
        </div>
      </div>
    `
  }
  return ''
}

// 日模式多级表头
function genDayColumns() {
  let cur = startDate.value
  const end = cur.add(daysCount - 1, 'day')
  const months = {}
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    const ym = cur.format('YYYY-MM')
    const d = cur.format('DD')
    const dateStr = cur.format('YYYY-MM-DD')
    const weekdayIdx = cur.day()
    const weekday = jpWeek[weekdayIdx]
    const isHoli = isHoliday(dateStr)
    if (!months[ym]) months[ym] = []
    months[ym].push({
      headerName: d,
      headerClass: isHoli ? 'weekend-header center-header' : 'center-header',
      children: [
        {
          headerName: weekday,
          field: dateStr,
          minWidth: 54,
          width: 54,
          headerClass: isHoli ? 'weekend-header center-header' : 'center-header',
          cellRenderer: params => renderPlanCell(params, dateStr),
          valueGetter: params => params.data && params.data[dateStr] !== undefined ? params.data[dateStr] : null,
          valueFormatter: p => (p.value !== undefined && p.value !== null && p.value !== '' ? p.value.toLocaleString() : ''),
        }
      ]
    })
    cur = cur.add(1, 'day')
  }
  return Object.keys(months).map(ym => ({
    headerName: ym,  // 月，默认左对齐
    children: months[ym]
  }))
}

// 小时模式多级表头
function genHourColumns() {
  let cur = startDate.value
  const end = cur.add(daysCount - 1, 'day').endOf('day')
  const months = {}
  while (cur.isBefore(end) || cur.isSame(end, 'hour')) {
    const ym = cur.format('YYYY-MM')
    const day = cur.format('DD')
    const hour = cur.format('HH')
    const dateStr = cur.format('YYYY-MM-DD')
    const weekdayIdx = cur.day()
    const weekday = jpWeek[weekdayIdx]
    const isHoli = isHoliday(dateStr)
    if (!months[ym]) months[ym] = {}
    if (!months[ym][day]) months[ym][day] = []
    months[ym][day].push({
      headerName: hour,
      field: `${dateStr} ${hour}`,
      minWidth: 38,
      width: 38,
      headerClass: isHoli ? 'center-header weekend-header' : 'center-header',
      cellRenderer: params => renderPlanCell(params, `${dateStr} ${hour}`),
      valueGetter: params => params.data && params.data[`${dateStr} ${hour}`] !== undefined ? params.data[`${dateStr} ${hour}`] : null,
      valueFormatter: p => (p.value !== undefined && p.value !== null && p.value !== '' ? p.value.toLocaleString() : ''),
    })
    cur = cur.add(1, 'hour')
  }
  // 三层结构：月->日->小时
  return Object.keys(months).map(ym => ({
    headerName: ym,
    children: Object.keys(months[ym]).map(day => {
      const dateStr = Object.values(months[ym][day])[0].field.split(' ')[0]
      const weekdayIdx = dayjs(dateStr).day()
      const isHoli = isHoliday(dateStr)
      return {
        headerName: day,
        headerClass: isHoli ? 'weekend-header center-header' : 'center-header',
        children: months[ym][day]
      }
    })
  }))
}

const fixedCols = [
  { headerName: '工程', field: 'process_name', pinned: 'left', width: 100, sortable: true, cellClass: 'ag-center-cell' },
  { headerName: '設備', field: 'machine_name', pinned: 'left', width: 120, sortable: true, cellClass: 'ag-center-cell' },
  { headerName: '製品', field: 'product_name', pinned: 'left', width: 120, sortable: true, cellClass: 'ag-center-cell' },
  { headerName: '合計予定数', field: 'total_quantity', pinned: 'left', width: 100, cellClass: 'ag-center-cell',
    valueFormatter: p => p.value ? p.value.toLocaleString() : '' },
  { headerName: '合計実績数', field: 'total_actual', pinned: 'left', width: 100, cellClass: 'ag-center-cell',
    valueFormatter: p => p.value ? p.value.toLocaleString() : '' },
  { headerName: '進捗(%)', field: 'progress', pinned: 'left', width: 95, cellClass: params => {
      if (params.value >= 0.8) return 'progress-good ag-center-cell'
      if (params.value > 0) return 'progress-bad ag-center-cell'
      return 'ag-center-cell'
    },
    valueFormatter: p => (p.value ? Math.round(p.value * 100) : 0) + '%'
  }
]
const columns = computed(() =>
  [...fixedCols, ...(viewMode.value === 'day' ? genDayColumns() : genHourColumns())]
)
const defaultColDef = { resizable: true, sortable: false, filter: false, minWidth: 65 }

function onCellClicked(params) {
  if (!params.colDef || !params.colDef.field) return
  const field = params.colDef.field
  selectedPlan.value = params.data
  if (params.data[field] && params.data[field] > 0) {
    dialogVisible.value = true
  }
}

function getBottomSumRow() {
  const sumRow = {
    process_name: '合计',
    machine_name: '',
    product_name: '',
    total_quantity: 0,
    total_actual: 0,
    progress: 0
  }
  sumRow.total_quantity = rowData.value.reduce((sum, row) => sum + (row.total_quantity || 0), 0)
  sumRow.total_actual   = rowData.value.reduce((sum, row) => sum + (row.total_actual || 0), 0)
  sumRow.progress = sumRow.total_quantity
    ? sumRow.total_actual / sumRow.total_quantity
    : 0
  if (viewMode.value === 'day') {
    let cur = startDate.value
    const end = cur.add(daysCount - 1, 'day')
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      const field = cur.format('YYYY-MM-DD')
      sumRow[field] = rowData.value.reduce((sum, row) => sum + (row[field] || 0), 0)
      cur = cur.add(1, 'day')
    }
  } else {
    let cur = startDate.value
    const end = cur.add(daysCount - 1, 'day').endOf('day')
    while (cur.isBefore(end) || cur.isSame(end, 'hour')) {
      const field = cur.format('YYYY-MM-DD HH')
      sumRow[field] = rowData.value.reduce((sum, row) => sum + (row[field] || 0), 0)
      cur = cur.add(1, 'hour')
    }
  }
  return [sumRow]
}
const bottomRows = computed(() => getBottomSumRow())
const localeJP = {
  noRowsToShow: '表示する行がありません', page: 'ページ', more: 'さらに', to: '〜', of: '/',
  next: '次へ', last: '最後', first: '最初', previous: '前へ', loadingOoo: '読み込み中...'
}
</script>

<style>
.gantt-table .ag-header-cell-label { font-size: 1em; font-weight: bold; }
.gantt-table .ag-center-cell { text-align: center !important; vertical-align: middle !important; }
.gantt-table .progress-good { color: #389e0d; font-weight:bold; }
.gantt-table .progress-bad { color: #ff4d4f; font-weight:bold; }
.gantt-table .ag-cell {
  font-size: 14px;
  padding: 2px 5px;
}
.gantt-cell-plan {
  position: relative;
  min-height: 32px;
  background: #e6f7ff;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.gantt-cell-qty {
  font-weight: bold;
  color: #222;
  font-size: 13px;
}
.gantt-progress-bar-wrap {
  width: 90%;
  height: 11px;
  background: transparent;
  border-radius: 6px;
  margin: 3px 0 0 0;
  position: relative;
}
.gantt-progress-bar-bg {
  background: #e5e5e5;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  position: absolute; left: 0; top: 0;
}
.gantt-progress-bar {
  position: absolute; left: 0; top: 0;
  height: 100%; border-radius: 6px;
  z-index: 1;
  transition: width 0.4s;
}
.gantt-progress-label {
  position: absolute; left: 0; top: 0;
  width: 100%; height: 100%;
  text-align: center;
  font-size: 11px;
  color: #222;
  font-weight: bold;
  z-index: 2;
  letter-spacing: 1px;
}
.ag-theme-alpine .weekend-header {
  color: #e74c3c !important;
  font-weight: bold;
  background: #fff7f6 !important;
}
.ag-theme-alpine {
  overflow-x: auto !important;
}
.ag-theme-alpine .ag-header-cell,
.ag-theme-alpine .ag-header-group-cell {
  border-right-width: 0.5px !important;
  border-right-style: solid !important;
  border-right-color: #e4e7ed !important;
  border-radius: 0 !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
}
.ag-theme-alpine .ag-header-cell-resize {
  display: none !important;
}
.ag-theme-alpine .ag-header-cell-label,
.ag-theme-alpine .ag-header-group-cell-label {
  width: 100%;
  height: 100%;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  text-align: center !important;
  padding: 0 !important;
}
.ag-theme-alpine .center-header .ag-header-cell-label,
.ag-theme-alpine .center-header .ag-header-group-cell-label {
  justify-content: center !important;
  align-items: center !important;
  text-align: center !important;
  padding: 0 !important;
}
.ag-theme-alpine .ag-row-pinned-bottom {
  font-weight: bold;
  background: #fffde6 !important;
  color: #fa541c !important;
}
</style>
