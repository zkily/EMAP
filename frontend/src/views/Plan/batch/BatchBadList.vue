<template>
  <el-dialog v-model="dialogVisible" title="🚨 不良バッチ一覧（自動監視）" width="900px" :close-on-click-modal="false"
    @close="emit('update:visible', false)">
    <div class="bad-batch-list-container">
      <el-form :inline="true" class="filter-bar">
        <el-form-item label="製品CD">
          <el-input v-model="filters.product_cd" style="width: 180px" clearable />
        </el-form-item>
        <el-form-item label="期間">
          <el-date-picker v-model="filters.range" type="daterange" range-separator="~" start-placeholder="開始日"
            end-placeholder="終了日" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList" :disabled="loading">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="badList" :row-key="row => row.batch_no" border stripe style="margin-top: 16px" size="small">
        <el-table-column label="バッチNo" prop="batch_no" width="230" />
        <el-table-column label="製品CD" prop="product_cd" width="120" />
        <el-table-column label="開始日" prop="from_date" width="110" />
        <el-table-column label="終了日" prop="to_date" width="110" />
        <el-table-column label="予定数量" prop="planned_qty" width="110" />
        <el-table-column label="実際数量" prop="actual_output_qty" width="110" />
        <el-table-column label="不良率" width="120">
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
        <el-table-column label="バッチ種別" prop="batch_type" width="100" />
        <el-table-column label="ステータス" prop="status" width="100" />
      </el-table>

      <div v-if="!loading && badList.length === 0" style="margin-top:16px; color: #999;">
        （不良バッチはありません）
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])

interface BadBatchItem {
  batch_no: string
  product_cd: string
  from_date: string
  to_date: string
  planned_qty: number
  actual_output_qty: number
  batch_type: string
  status: string
}

const filters = ref<{ product_cd: string; range: string[] }>({
  product_cd: '',
  range: [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD')
  ]
})
const loading = ref(false)
const badList = ref<BadBatchItem[]>([])

const dialogVisible = ref(false)

const fetchList = async () => {
  loading.value = true
  badList.value = []
  try {
    const params = {
      from_date: filters.value.range[0] || '',
      to_date: filters.value.range[1] || ''
    }
    const res = await request.get('/api/plan/batch/bad-list', { params })
    let list: BadBatchItem[] = res.data || res
    if (filters.value.product_cd) {
      list = list.filter((item: BadBatchItem) => item.product_cd.includes(filters.value.product_cd))
    }
    badList.value = list
  } catch {
    badList.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    fetchList()
  }
})
watch(dialogVisible, (val) => {
  if (!val) emit('update:visible', false)
})
</script>

<style scoped>
.bad-batch-list-container {
  padding: 32px;
  max-width: 1200px;
}

.filter-bar {
  margin-bottom: 12px;
}
</style>
