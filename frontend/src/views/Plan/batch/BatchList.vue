<template>
  <div class="batch-list-page">
    <div class="title-bar">
      <h2 class="title">📦 生産ロットNo.管理</h2>
      <div>
        <el-button type="success" icon="Plus" @click="showGenerateDialog = true">
          生産ロットNo.生成
        </el-button>
        <el-button type="primary" icon="Plus" @click="showAddDialog = true" style="margin-left: 8px;">
          追加
        </el-button>
        <el-button type="warning" icon="Warning" @click="showBadDialog = true" style="margin-left: 8px;">
          🚨 不良バッチ一覧
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-form :inline="true" class="filter-bar" style="flex-wrap: wrap; align-items: flex-end;">
      <el-form-item label="製品" style="margin-right: 8px;">
        <el-select v-model="filters.product_cd" placeholder="製品を選択" filterable clearable style="width: 140px;">
          <el-option v-for="item in productOptions" :key="item.cd" :label="`${item.cd} - ${item.name}`"
            :value="item.cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="期間" style="margin-right: 8px;">
        <el-date-picker v-model="filters.range" type="daterange" range-separator="~" start-placeholder="開始日"
          end-placeholder="終了日" value-format="YYYY-MM-DD" style="width: 260px;" />
      </el-form-item>
      <el-form-item label="No.種別" style="margin-right: 8px;">
        <el-select v-model="filters.batch_type" clearable placeholder="種別選択" style="width: 100px;">
          <el-option label="すべて" value="" />
          <el-option label="自動" value="自動" />
          <el-option label="追加" value="追加" />
        </el-select>
      </el-form-item>
      <el-form-item label="状態" style="margin-right: 8px;">
        <el-select v-model="filters.status" clearable placeholder="状態選択" style="width: 90px;">
          <el-option label="すべて" value="" />
          <el-option label="未開始" value="未開始" />
          <el-option label="計画済" value="計画済" />
          <el-option label="生産中" value="生産中" />
          <el-option label="生産完了" value="生産完了" />
          <el-option label="ロック済" value="ロック済" />
        </el-select>
      </el-form-item>
      <el-form-item style="margin-left:auto;">
        <el-button type="primary" @click="fetchList" :disabled="loading">🔍 検索</el-button>
        <el-button @click="resetFilter" style="margin-left: 6px;">リセット</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="filteredList" :row-key="row => row.batch_no" border stripe style="margin-top: 18px" size="small"
      height="540">
      <!-- <el-table-column label="生産No" prop="batch_no" width="240" /> -->
      <el-table-column label="製品CD" prop="product_cd" width="65" align="center" />
      <el-table-column label="製品名" prop="product_name" min-width="150" />
      <el-table-column label="No種別" prop="batch_type" width="65" align="center" />
      <el-table-column label="予定数量" prop="planned_qty" width="70" align="center" />
      <el-table-column label="実際数量" prop="actual_output_qty" width="70" align="center" />
      <el-table-column label="不良率" width="90" align="center">
        <template #default="{ row }">
          <span :style="row.actual_output_qty < row.planned_qty ? 'color:#f56c6c;font-weight:bold;' : ''">
            {{
              row.planned_qty > 0
                ? ((1 - (row.actual_output_qty ?? row.planned_qty) / row.planned_qty) * 100).toFixed(1)
                : '0'
            }} %
            <span v-if="row.actual_output_qty < row.planned_qty">🚨</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="開始日" prop="from_date" width="90" align="center">
        <template #default="{ row }">{{ formatDate(row.from_date) }}</template>
      </el-table-column>
      <el-table-column label="終了日" prop="to_date" width="90" align="center">
        <template #default="{ row }">{{ formatDate(row.to_date) }}</template>
      </el-table-column>
      <el-table-column label="状態" prop="status" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '未開始' ? 'info' :
            row.status === '計画済' ? 'primary' :
              row.status === '生産中' ? 'warning' :
                row.status === '生産完了' ? 'success' :
                  row.status === 'ロック済' ? 'danger' :
                    undefined
            " disable-transitions>
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click.stop="onShowDetail(row)">詳細</el-button>
          <el-button size="small" :type="row.is_locked ? 'danger' : 'success'" @click.stop="handleLock(row)" round>
            <span v-if="row.is_locked">解除</span>
            <span v-else>ロック</span>
          </el-button>
          <el-button size="small" type="danger" @click.stop="handleDelete(row)" style="margin-left: 4px;">削除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && filteredList.length === 0" class="empty-tip">（該当生産No.がありません）</div>

    <!-- 弹窗组件 -->
    <BatchGenerateRangeDialog v-model="showGenerateDialog" @success="fetchList" />
    <BatchDetailDialog v-model="showDetail" :batchId="currentBatchId" />
    <el-dialog v-model="showAddDialog" title="生産ロットNo.追加" width="500px" :before-close="() => (showAddDialog = false)">
      <el-form :model="addForm" ref="addFormRef" label-width="120px">
        <el-form-item label="生産No" prop="batch_no">
          <el-input v-model="addForm.batch_no" readonly />
        </el-form-item>
        <el-form-item label="製品CD" prop="product_cd">
          <el-select v-model="addForm.product_cd" filterable clearable placeholder="製品を選択"
            @change="onAddProductCdInput">
            <el-option v-for="item in productOptions" :key="item.cd" :label="`${item.cd} - ${item.name}`"
              :value="item.cd" />
          </el-select>
        </el-form-item>
        <el-form-item label="製品名" prop="product_name">
          <el-input v-model="addForm.product_name" readonly />
        </el-form-item>
        <el-form-item label="No種別" prop="batch_type">
          <el-select v-model="addForm.batch_type" placeholder="種別選択">
            <el-option label="自動" value="自動" />
            <el-option label="追加" value="追加" />
          </el-select>
        </el-form-item>
        <el-form-item label="予定数量" prop="planned_qty">
          <el-input-number v-model="addForm.planned_qty" :min="0" />
        </el-form-item>
        <el-form-item label="開始日" prop="from_date">
          <el-date-picker v-model="addForm.from_date" type="date" value-format="YYYY-MM-DD"
            @change="updateAddBatchNo" />
        </el-form-item>
        <el-form-item label="終了日" prop="to_date">
          <el-date-picker v-model="addForm.to_date" type="date" value-format="YYYY-MM-DD" @change="updateAddBatchNo" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">キャンセル</el-button>
        <el-button type="primary" @click="handleAddBatch">保存</el-button>
      </template>
    </el-dialog>
    <BatchBadListDialog v-model:visible="showBadDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { getProductOptions, OptionItem } from '@/api/options'
import BatchGenerateRangeDialog from './BatchGenerateRangeDialog.vue'
import BatchDetailDialog from './BatchDetailDialog.vue'
import BatchBadListDialog from './BatchBadList.vue'

const showDetail = ref(false)
const currentBatchId = ref(null)
const showGenerateDialog = ref(false)
const showAddDialog = ref(false)
const showBadDialog = ref(false)

const filters = ref({
  product_cd: '',
  range: [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD')
  ],
  batch_type: '',
  status: ''
})

const loading = ref(false)

const productOptions = ref<OptionItem[]>([])
const fetchProductOptionsList = async () => {
  try {
    productOptions.value = await getProductOptions()
  } catch (e) {
    console.error('❌ 製品リスト取得失敗', e)
    ElMessage.error('製品リストの取得に失敗しました')
  }
}

const addForm = ref<BatchItem>({
  batch_no: '',
  product_cd: '',
  product_name: '',
  batch_type: '',
  planned_qty: 0,
  from_date: '',
  to_date: '',
  status: '未開始'
})
const addFormRef = ref()

// 自动生成生産No
const updateAddBatchNo = () => {
  const cd = addForm.value.product_cd || ''
  const from = addForm.value.from_date || ''
  const to = addForm.value.to_date || ''
  // 流水号默认001
  if (cd && from && to) {
    addForm.value.batch_no = `PB-${cd}-${from}_to_${to}-001`
  } else {
    addForm.value.batch_no = ''
  }
}

// 输入製品CD时自动带出製品名并刷新生産No
const onAddProductCdInput = () => {
  const cd = addForm.value.product_cd
  const found = productOptions.value.find(opt => opt.cd === cd)
  addForm.value.product_name = found ? found.name : ''
  updateAddBatchNo()
}

watch(() => addForm.value.from_date, updateAddBatchNo)
watch(() => addForm.value.to_date, updateAddBatchNo)

const handleAddBatch = async () => {
  try {
    await request.post('/api/plan/batch/add', addForm.value)
    ElMessage.success('追加成功！')
    showAddDialog.value = false
    fetchList()
  } catch {
    ElMessage.error('追加失敗')
  }
}

const fetchList = async () => {
  loading.value = true
  batchList.value = []
  try {
    const params = {
      product_cd: filters.value.product_cd || null,
      from_date: filters.value.range[0] || null,
      to_date: filters.value.range[1] || null
    }
    const res = await request.get('/api/plan/batch/list', { params })
    batchList.value = (res.data || res).map((row: BatchItem & { id?: number }) => ({
      ...row,
      batch_id: row.batch_id || row.id
    }))
  } catch {
    batchList.value = []
  } finally {
    loading.value = false
  }
}

interface BatchItem {
  batch_id?: number
  batch_no: string
  product_cd: string
  product_name?: string
  batch_type: string
  planned_qty: number
  actual_output_qty?: number
  from_date: string
  to_date: string
  status: string
  is_locked?: boolean
}

const batchList = ref<BatchItem[]>([])
const filteredList = computed(() => {
  let list = batchList.value
  if (filters.value.product_cd)
    list = list.filter(r => r.product_cd && r.product_cd.includes(filters.value.product_cd))
  if (filters.value.batch_type)
    list = list.filter(r => r.batch_type === filters.value.batch_type)
  if (filters.value.status)
    list = list.filter(r => r.status === filters.value.status)
  return list
})

const onShowDetail = (row: { batch_id: null }) => {
  if (!row.batch_id) {
    ElMessage.error('生産No.IDが存在しません')
    return
  }
  currentBatchId.value = row.batch_id
  showDetail.value = true
}

const handleLock = async (row: BatchItem) => {
  const newLock = row.is_locked ? 0 : 1
  const batchId = row.batch_id
  if (!batchId) {
    ElMessage.error('生産No.IDが存在しません')
    return
  }
  try {
    await request.post('/api/plan/batch/toggle-lock', {
      batch_id: batchId,
      is_locked: newLock
    })
    ElMessage.success(newLock ? 'ロックしました' : 'ロック解除しました')
    await fetchList()
  } catch {
    ElMessage.error('ロック切替失敗')
  }
}

const handleDelete = async (row: BatchItem) => {
  if (!row.batch_id) {
    ElMessage.error('生産No.IDが存在しません')
    return
  }
  try {
    await ElMessageBox.confirm('この生産No.データを削除しますか？', '確認', {
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      type: 'warning'
    })
    await request.post('/api/plan/batch/delete', { batch_id: row.batch_id })
    ElMessage.success('削除成功！')
    fetchList()
  } catch { }
}

const formatDate = (val: string | number | Date | dayjs.Dayjs | null | undefined) => {
  return val ? dayjs(val).format('YYYY-MM-DD') : ''
}

const resetFilter = () => {
  filters.value = {
    product_cd: '',
    range: [
      dayjs().startOf('month').format('YYYY-MM-DD'),
      dayjs().endOf('month').format('YYYY-MM-DD')
    ],
    batch_type: '',
    status: ''
  }
  fetchList()
}

onMounted(() => {
  fetchProductOptionsList()
  fetchList()
})
</script>

<style scoped>
.batch-list-page {
  padding: 40px 24px 32px 24px;
  max-width: 1400px;
  background: #f7f9fb;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 6px;
  color: #222;
  letter-spacing: 1px;
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar .el-button {
  border-radius: 8px;
  font-weight: bold;
  margin-left: 8px;
}

.filter-bar {
  background: #fff;
  padding: 10px 12px 4px 12px;
  border-radius: 12px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 4px 4px;
}

.el-form-item {
  margin-bottom: 0;
  min-width: 120px;
}

.el-table {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-table th {
  background-color: #f2f3f5;
  color: #555;
  font-weight: bold;
  font-size: 15px;
}

.el-table tr:hover {
  background-color: #f0f9ff;
}

.el-table td {
  padding: 12px 8px;
  font-size: 14px;
}

.el-tag {
  font-size: 13px;
  border-radius: 6px;
  padding: 0 12px;
}

.empty-tip {
  margin-top: 18px;
  color: #999;
  text-align: center;
  font-size: 16px;
}

.el-dialog {
  border-radius: 14px;
}

.el-dialog__header {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.el-dialog__body {
  padding-top: 10px;
}

.el-form-item__label {
  font-weight: bold;
  color: #333;
}

.el-input,
.el-select,
.el-input-number,
.el-date-picker {
  border-radius: 8px;
}

.el-button {
  border-radius: 8px;
  transition: all 0.3s;
}

.el-button:hover {
  opacity: 0.92;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
}

@media (max-width: 900px) {
  .batch-list-page {
    padding: 10px;
  }

  .filter-bar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px 8px;
    padding: 6px 4px 2px 4px;
  }

  .el-form-item {
    min-width: 90px;
    margin-bottom: 0;
  }
}
</style>
