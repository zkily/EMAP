<template>
  <div>
    <h2 style="font-size: 1.5em; margin-bottom: 8px; letter-spacing: 2px;">📋 生産スケジュール（基本機能）</h2>
    <!-- 筛选区 -->
    <el-form :inline="true" :model="filters" class="filter-form"
      style="margin: 18px 0 12px 0; padding: 12px 16px; background: #f8fafd; border-radius: 8px; box-shadow: 0 2px 8px #0001;">
      <el-form-item label="工程">
        <el-select v-model="filters.process_cd" clearable placeholder="すべて" style="width: 180px;" filterable>
          <el-option v-for="p in processes" :key="p.process_cd" :label="p.process_name" :value="p.process_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="設備">
        <el-select v-model="filters.machine_cd" clearable placeholder="すべて" style="width: 180px;" filterable>
          <el-option v-for="m in machines" :key="m.machine_cd" :label="m.machine_name" :value="m.machine_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="製品">
        <el-select v-model="filters.product_cd" clearable placeholder="すべて" style="width: 180px;" filterable>
          <el-option v-for="p in products" :key="p.product_cd" :label="p.product_name" :value="p.product_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="期間">
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="～" start-placeholder="開始日"
          end-placeholder="終了日" value-format="YYYY-MM-DD" style="width: 230px;" />
      </el-form-item>
      <el-form-item label="状態">
        <el-select v-model="filters.status" clearable placeholder="すべて" style="width: 150px;">
          <el-option label="未開始" value="未開始" />
          <el-option label="進行中" value="進行中" />
          <el-option label="完了" value="完了" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData" icon="Search">検索</el-button>
        <el-button @click="resetFilters" icon="Refresh">リセット</el-button>
      </el-form-item>
    </el-form>

    <!-- 按钮区 -->
    <div style="margin-bottom: 12px;">
      <el-button type="primary" @click="openBatchDialog" icon="Plus">➕ バッチから生成</el-button>
      <el-button type="primary" @click="openDialog" icon="Plus">➕ 新規作成</el-button>
      <el-button type="info" @click="loadData" icon="Refresh">⟳ 再読み込み</el-button>
      <el-button type="primary" @click="handleAutoSchedule" icon="Refresh">⟳ 排程再計算</el-button>
      <el-button type="info" @click="handleAnalyzeProgress" icon="PieChart">⟳ 進捗再分析</el-button>
    </div>

    <!-- 表格 -->
    <div style="background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0002; padding: 12px 8px;">
      <ag-grid-vue
        style="width: 100%; height: 600px;"
        class="ag-theme-alpine"
        :columnDefs="columnDefs"
        :localeText="localeJP"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :stopEditingWhenCellsLoseFocus="true"
        rowDragManaged
        animateRows
        @rowDragEnd="onRowDragEnd"
        @cellValueChanged="onCellValueChanged"
        @rowClicked="onRowClicked"
        ref="agGrid"
      />
    </div>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="dialogVisible" title="新規計画作成" width="500px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="工程">
          <el-select v-model="form.process_cd" style="width: 100%" @change="handleFormFieldChange">
            <el-option v-for="p in processes" :key="p.process_cd" :label="p.process_name" :value="p.process_cd" />
          </el-select>
        </el-form-item>
        <el-form-item label="設備">
          <el-select v-model="form.machine_cd" style="width: 100%" @change="handleFormFieldChange">
            <el-option v-for="m in machines" :key="m.machine_cd" :label="m.machine_name" :value="m.machine_cd" />
          </el-select>
        </el-form-item>
        <el-form-item label="製品">
          <el-select v-model="form.product_cd" style="width: 100%" @change="handleFormFieldChange">
            <el-option v-for="p in products" :key="p.product_cd" :label="p.product_name" :value="p.product_cd" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" :step="100" style="width: 100%" @change="handleFormFieldChange" />
        </el-form-item>
        <el-form-item label="能率">
          <el-input v-model="form.efficiency" :readonly="true" style="width: 100%" />
          <span v-if="form.efficiency_unit" style="margin-left:8px;">{{ form.efficiency_unit }}</span>
        </el-form-item>
        <el-form-item label="計画開始">
          <el-date-picker v-model="form.plan_start" type="datetime" format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
    <!-- 多选批次弹窗（新） -->
<BatchPlanDialog
  v-model="batchDialogVisible"
  :processes="processes"
  :machines="machines"
  @created="onBatchPlansCreated"
/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import axios from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import DateTimeCellEditor from '@/components/DateTimeCellEditor.vue'
import BatchPlanDialog from './ScheduleCreateDialog.vue' // 你自己的文件名

const batchDialogVisible = ref(false)
function openBatchDialog() {
  batchDialogVisible.value = true
}
async function onBatchPlansCreated() {
  batchDialogVisible.value = false
  await loadData()
  ElMessage.success('計画作成しました')
}
// 主要数据
const rowData = ref([])
const products = ref([])
const processes = ref([])
const machines = ref([])

const filters = ref({
  process_cd: '',
  machine_cd: '',
  product_cd: '',
  dateRange: [],
  status: ''
})

// 新建弹窗相关
const dialogVisible = ref(false)
const form = ref({
  process_cd: '',
  machine_cd: '',
  product_cd: '',
  quantity: 1000,
  plan_start: '',
  efficiency: 1.0,
  efficiency_unit: ''
})

// MySQL DATETIME 格式化
function toMySQLDateTime(dt) {
  if (!dt) return ''
  const d = typeof dt === 'string' ? new Date(dt.replace(/-/g, '/')) : new Date(dt)
  if (isNaN(d.getTime())) return ''
  const pad = n => n < 10 ? '0' + n : n
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate())
  ].join('-') + ' ' +
    [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':')
}

// 表格列名查找
function getName(cd, arr, key, label) {
  const item = arr.find(i => i[key] === cd)
  return item ? item[label] : cd
}

// 自动查能率（建议所有场景都查表）
async function fetchEfficiency(process_cd, machine_cd, product_cd) {
  if (!process_cd || !machine_cd || !product_cd) return { efficiency: 1.0, unit: '' }
  const res = await axios.get('/api/schedule/efficiency', { params: { product_cd, process_cd, machine_cd } })
  return { efficiency: res.data.efficiency || 1.0, unit: res.data.unit || '' }
}

// 结束时间推算
function calcPlanEnd(plan_start, quantity, efficiency) {
  if (!plan_start || !quantity || !efficiency) return ''
  const hours = quantity / (efficiency * 1.0)
  const start = new Date(plan_start)
  const end = new Date(start.getTime() + hours * 3600 * 1000)
  return toMySQLDateTime(end)
}

// 字符串去秒，仅显示到分
function trimSeconds(dt) {
  return (typeof dt === 'string' && dt.length >= 16) ? dt.slice(0, 16) : dt
}

// ---------------- 表格定义 ------------------

const columnDefs = [
  {
    headerName: '工程', field: 'process_cd', editable: true, cellClass: 'ag-center-cell',cellEditor: 'agSelectCellEditor',
    cellEditorParams: () => ({ values: processes.value.map(p => p.process_cd) }),
    valueFormatter: params => getName(params.value, processes.value, 'process_cd', 'process_name'), minWidth: 90
  },
  {
    headerName: '設備', field: 'machine_cd', editable: true, cellClass: 'ag-center-cell',cellEditor: 'agSelectCellEditor',
    cellEditorParams: () => ({ values: machines.value.map(m => m.machine_cd) }),
    valueFormatter: params => getName(params.value, machines.value, 'machine_cd', 'machine_name'), minWidth: 100
  },
  { headerName: '順序', field: 'item_no', rowDrag: true, cellClass: 'ag-center-cell', minWidth: 85},
  {
    headerName: '製品', field: 'product_cd', editable: true, cellEditor: 'agSelectCellEditor',
    cellEditorParams: () => ({ values: products.value.map(p => p.product_cd) }),
    valueFormatter: params => getName(params.value, products.value, 'product_cd', 'product_name'), minWidth: 140, cellClass: 'ag-left-cell'
  },
  { headerName: '能率', field: 'efficiency', editable: false, cellClass: 'ag-center-cell',valueFormatter: params => params.value ? Number(params.value).toFixed(0) : '', minWidth: 90 },
  { headerName: '数量', field: 'quantity', editable: true, cellClass: 'ag-center-cell',cellEditor: 'agNumberCellEditor', minWidth: 90 },
  { headerName: '実績', field: 'actual_qty', editable: false, cellClass: 'ag-center-cell',cellEditor: 'agNumberCellEditor', minWidth: 90 },
  {
    headerName: '不良', field: 'defect_qty', editable: false, cellClass: 'ag-center-cell', minWidth: 90
  },
  {
    headerName: '不良率(%)', field: 'defect_rate', editable: false, cellClass: 'ag-center-cell',
    cellClassRules: { 'cell-defect-high': params => params.value > 3.0 },
    minWidth: 125, valueFormatter: params => params.value != null ? Number(params.value).toFixed(1) : '0.0'
  },
  { headerName: '段取(分)', field: 'setup_time', cellClass: 'ag-center-cell', minWidth: 120 },
  {
  headerName: '進捗',
  field: 'progress_bar',
  cellClass: 'ag-center-cell',
  minWidth: 130,
  cellRenderer: params => {
    const plan = Math.max(0, Math.min(100, params.data.plan_progress || 0))
    const act = Math.max(0, Math.min(100, params.data.actual_progress || 0))
    let barColor = '#faad14', txt = '進行中'
    if (params.data.progress_status === 'Ahead') { barColor = '#52c41a'; txt = '前倒し' }
    if (params.data.progress_status === 'Delay') { barColor = '#ff4d4f'; txt = '遅延' }
    return `
      <div class="progress-bar-cell-flex">
        <div class="progress-bar-wrap">
          <div class="progress-plan" style="width:${plan}%;"></div>
          <div class="progress-actual" style="width:${act}%;background:${barColor};"></div>
          <div class="progress-label">${act}% <span class="progress-status">(${txt})</span></div>
        </div>
      </div>
    `
  },
  cellClass: 'progress-center-cell'
}

,
  { headerName: '計画開始', field: 'plan_start', editable: true, cellClass: 'ag-center-cell',cellEditor: DateTimeCellEditor, cellEditorPopup: true, minWidth: 140, valueFormatter: params => trimSeconds(params.value) },
  { headerName: '計画終了', field: 'plan_end', editable: false, cellClass: 'ag-center-cell',minWidth: 140, valueFormatter: params => trimSeconds(params.value) },
  {
    headerName: '状態', field: 'status', editable: true, cellClass: 'ag-center-cell',cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['未開始', '進行中', '完了'] }, minWidth: 90
  },
  { headerName: '操作', field: 'action', cellClass: 'ag-center-cell',cellRenderer: params => `<button class="btn-delete">削除</button>`, editable: false, width: 80 }
]

const defaultColDef = { resizable: true, sortable: true, filter: true, flex: 1 }

// ---------------- 业务逻辑方法 -----------------

// 新建任务弹窗：自动查能率
async function openDialog() {
  form.value = {
    process_cd: processes.value[0]?.process_cd || '',
    machine_cd: machines.value[0]?.machine_cd || '',
    product_cd: products.value[0]?.product_cd || '',
    quantity: 1000,
    plan_start: toMySQLDateTime(new Date()),
    efficiency: 1.0,
    efficiency_unit: ''
  }
  // 自动查能率
  if (form.value.product_cd && form.value.process_cd && form.value.machine_cd) {
    const { efficiency, unit } = await fetchEfficiency(form.value.process_cd, form.value.machine_cd, form.value.product_cd)
    form.value.efficiency = efficiency
    form.value.efficiency_unit = unit
  }
  dialogVisible.value = true
}

// 新建弹窗内，任一字段变化自动查能率
async function handleFormFieldChange() {
  if (form.value.product_cd && form.value.process_cd && form.value.machine_cd) {
    const { efficiency, unit } = await fetchEfficiency(form.value.process_cd, form.value.machine_cd, form.value.product_cd)
    form.value.efficiency = efficiency
    form.value.efficiency_unit = unit
  } else {
    form.value.efficiency = 1.0
    form.value.efficiency_unit = ''
  }
}

// 新建保存，自动把工程/设备写入筛选区并刷新
async function handleSave() {
  const plan_end = calcPlanEnd(form.value.plan_start, form.value.quantity, form.value.efficiency)
  await axios.post('/api/schedule', {
    ...form.value,
    plan_end,
    status: '未開始'
  })
  dialogVisible.value = false
  filters.value.process_cd = form.value.process_cd
  filters.value.machine_cd = form.value.machine_cd
  await loadData()
  ElMessage.success('作成しました')
}

// 表格单元格修改自动保存
async function onCellValueChanged(event) {
  // 自动查效率
  if (['process_cd', 'machine_cd', 'product_cd'].includes(event.colDef.field)) {
    const { product_cd, process_cd, machine_cd } = event.data
    const { efficiency } = await fetchEfficiency(process_cd, machine_cd, product_cd)
    event.data.efficiency = efficiency
  }
  // 状态自动判定
  const q = Number(event.data.quantity) || 0
  const a = Number(event.data.actual_qty) || 0
  if (q > 0 && a >= q) {
    event.data.status = '完了'
  } else if (a > 0 && a < q) {
    event.data.status = '進行中'
  } else {
    event.data.status = '未開始'
  }
  // 自动算结束时间
  if (
    ['quantity', 'plan_start', 'efficiency'].includes(event.colDef.field) ||
    ['process_cd', 'machine_cd', 'product_cd'].includes(event.colDef.field)
  ) {
    const rawStart = event.data.plan_start
    event.data.plan_end = calcPlanEnd(
      rawStart ? toMySQLDateTime(rawStart) : '',
      event.data.quantity,
      event.data.efficiency
    )
  }
  // 自动算不良率
  if (event.colDef.field === 'defect_qty' && event.data.quantity > 0) {
    event.data.defect_rate = (event.data.defect_qty / event.data.quantity * 100).toFixed(1)
  }
  if (event.colDef.field === 'quantity' && event.data.quantity > 0 && event.data.defect_qty != null) {
    event.data.defect_rate = (event.data.defect_qty / event.data.quantity * 100).toFixed(1)
  }

  // PATCH保存到数据库（全字段同步）
  if (event.data.id) {
    const payload = {
      product_cd: event.data.product_cd,
      process_cd: event.data.process_cd,
      machine_cd: event.data.machine_cd,
      quantity: event.data.quantity,
      efficiency: event.data.efficiency,
      plan_start: event.data.plan_start,
      plan_end: event.data.plan_end,
      status: event.data.status,
      actual_qty: event.data.actual_qty,
      item_no: event.data.item_no,
      defect_qty: event.data.defect_qty,
      defect_rate: event.data.defect_rate,
      setup_time: event.data.setup_time
    }
    await axios.patch(`/api/schedule/${event.data.id}`, payload)
    ElMessage.success('保存しました')
    await loadData()
  }
}

// 删除
async function onRowClicked(event) {
  if (event.event.target && event.event.target.className === 'btn-delete') {
    await ElMessageBox.confirm('この排産を削除しますか？', '確認')
    await axios.delete(`/api/schedule/${event.data.id}`)
    await loadData()
    ElMessage.success('削除しました')
  }
}

// 主数据与表格数据加载
async function loadData() {
  [products.value, processes.value, machines.value] = await Promise.all([
    axios.get('/api/schedule/products').then(res => res.data),
    axios.get('/api/schedule/processes').then(res => res.data),
    axios.get('/api/schedule/machines').then(res => res.data),
  ])
  const params = {
    process_cd: filters.value.process_cd || undefined,
    machine_cd: filters.value.machine_cd || undefined,
    product_cd: filters.value.product_cd || undefined,
    status: filters.value.status || undefined,
    from_date: filters.value.dateRange?.[0] || undefined,
    to_date: filters.value.dateRange?.[1] || undefined
  }
  rowData.value = await axios.get('/api/schedule', { params }).then(res => {
    const rows = res.data.data || res.data
    return rows.map(row => ({
      ...row,
      plan_start: row.plan_start || '',
      plan_end: row.plan_end || ''
    }))
  })
}

// 自动排程再計算
async function handleAutoSchedule() {
  try {
    await axios.post('/api/schedule/auto-schedule', {
      process_cd: filters.value.process_cd,
      machine_cd: filters.value.machine_cd
    })
    await loadData()
    ElMessage.success('排程再計算完了')
  } catch (e) {
    ElMessage.error('排程再計算失敗')
  }
}

// 进捗再分析
async function handleAnalyzeProgress() {
  try {
    await axios.post('/api/schedule/analyze-progress')
    await loadData()
    ElMessage.success('進捗再分析完了')
  } catch (e) {
    ElMessage.error('進捗再分析失敗')
  }
}

// 拖拽完成事件
async function onRowDragEnd(event) {
  const api = event.api
  const newRows = []
  api.forEachNodeAfterFilterAndSort(node => {
    newRows.push({ ...node.data }) // 用当前可见顺序
  })
  // 重新编号
  newRows.forEach((row, idx) => {
    row.item_no = idx + 1
  })
  // 保存
  await axios.post('/api/schedule/batch-update-item-no', {
    items: newRows.map(row => ({ id: row.id, item_no: row.item_no }))
  })
  // 本地 rowData 直接改，不等刷新
  rowData.value = [...newRows]
  ElMessage.success('順序を保存しました')
  // 也可以 await loadData() 强制刷新
}



// 重置筛选
function resetFilters() {
  filters.value = {
    process_cd: '',
    machine_cd: '',
    product_cd: '',
    dateRange: [],
    status: ''
  }
  loadData()
}

onMounted(loadData)

// -------------------- 日文表头 ------------------
const localeJP = {
  page: 'ページ', more: 'さらに', to: '〜', of: '/', next: '次へ', last: '最後', first: '最初', previous: '前へ',
  loadingOoo: '読み込み中...', selectAll: '(すべて選択)', searchOoo: '検索...', blanks: '(空白)',
  filterOoo: 'フィルター...', applyFilter: 'フィルターを適用', equals: '等しい', notEqual: '等しくない', lessThan: 'より小さい', greaterThan: 'より大きい',
  contains: '含む', notContains: '含まない', startsWith: 'で始まる', endsWith: 'で終わる', numberFilters: '数値フィルター', textFilters: '文字フィルター',
  dateFilters: '日付フィルター', setFilter: '選択フィルター', columns: '列', group: 'グループ', rowGroupColumns: 'グループ列',
  rowGroupColumnsEmptyMessage: 'ここにドラッグしてグループ化', pinColumn: '列を固定', valueAggregation: '値の集計',
  autosizeThiscolumn: 'この列を自動調整', autosizeAllColumns: 'すべての列を自動調整', resetColumns: '列をリセット',
  expandAll: 'すべて展開', collapseAll: 'すべて折りたたむ', copy: 'コピー', ctrlC: 'Ctrl+C', paste: '貼り付け', ctrlV: 'Ctrl+V',
  export: 'エクスポート', csvExport: 'CSVをエクスポート', excelExport: 'Excelをエクスポート', noRowsToShow: '表示する行がありません'
}
</script>

<style>
.ag-theme-alpine .ag-cell.cell-defect-high {
  background: #ffeaea;
  color: #d32f2f;
  font-weight: bold;
}

.ag-center-cell { text-align: center !important; vertical-align: middle !important; }
.ag-left-cell { text-align: left !important; vertical-align: middle !important; }
.ag-theme-alpine .ag-cell {
  padding: 2px 8px;
  font-size: 15px;
}
.ag-theme-alpine .ag-header-cell-label {
  font-weight: bold;
  font-size: 1.08em;
  letter-spacing: 1px;
}

.btn-delete {
  color: #fff;
  background: #e74c3c;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
}
.filter-form {
  margin-bottom: 8px;
}
.filter-form .el-select,
.filter-form .el-date-editor,
.filter-form .el-input-number {
  min-width: 180px;
  width: 220px;
}
.filter-form .el-form-item {
  margin-right: 18px;
}
.ag-theme-alpine {
  border-radius: 10px;
}
/* 进捗列整体居中 */
.ag-theme-alpine .ag-cell.progress-center-cell {
  padding: 0 !important;
  text-align: center !important;
  vertical-align: middle !important;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 进捗最外层flex容器 */
.progress-bar-cell-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 进捗条wrap（用于定宽高） */
.progress-bar-wrap {
  position: relative;
  width: 120px;
  height: 20px;
  background: #e3f1fa;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 计划进度条 */
.progress-plan {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  background: #91d5ff;
  border-radius: 10px;
  z-index: 1;
  transition: width 0.3s;
}

/* 实际进度条 */
.progress-actual {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  background: #faad14;
  border-radius: 10px;
  z-index: 2;
  opacity: 0.98;
  transition: width 0.3s;
}

/* 百分比/状态数字，居中 */
.progress-label {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 3;
  top: 0; left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  color: #222;
  pointer-events: none;
  letter-spacing: 1px;
}
.progress-status {
  font-size: 11px;
  color: #666;
  margin-left: 2px;
}

</style>
