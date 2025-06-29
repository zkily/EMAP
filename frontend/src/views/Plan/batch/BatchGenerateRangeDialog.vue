<!-- src/views/plan/BatchGenerateRangeDialog.vue -->
<template>
  <el-dialog v-model="visible" title="📦 全製品生産No.生成（期間指定）" width="40%" :close-on-click-modal="false"
    @close="emit('update:modelValue', false)">
    <el-form :model="form" label-width="90px" class="form-area">
      <el-form-item label="開始日">
        <el-date-picker v-model="form.from_date" type="date" placeholder="開始日を選択" style="width: 240px" />
      </el-form-item>
      <el-form-item label="終了日">
        <el-date-picker v-model="form.to_date" type="date" placeholder="終了日を選択" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="generateBatches" :disabled="loading || !form.from_date || !form.to_date">
          ➕ 生産No.生成実行
        </el-button>
      </el-form-item>
    </el-form>

    <div v-if="loading" class="status-msg">⏳ バッチ生成中...</div>
    <div v-else-if="error" class="status-msg error">❌ {{ error }}</div>
    <div v-else-if="result" class="status-msg success">✅ {{ result }}</div>

    <el-table v-if="!loading && !error && resultBatches.length" :data="resultBatches" :row-key="row => row.batch_no"
      style="margin-top: 20px" border stripe size="small" height="300">
      <el-table-column label="生産No" prop="batch_no" />
      <el-table-column label="製品CD" prop="product_cd" width="80px" />
      <el-table-column label="計画数量" prop="planned_qty" width="80px" />
      <el-table-column label="開始日" prop="from_date" width="100px" />
      <el-table-column label="終了日" prop="to_date" width="100px" />
      <el-table-column label="ステータス" prop="status" width="100px" />
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import request from '@/utils/request'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)

const form = ref({
  from_date: '',
  to_date: '',
})
const loading = ref(false)
const result = ref('')
const error = ref('')

// 类型声明
interface BatchResult {
  batch_no: string
  product_cd: string
  planned_qty: number
  from_date: string
  to_date: string
  status: string
}

interface GenerateRes {
  message?: string
  batches?: BatchResult[]
}

const resultBatches = ref<BatchResult[]>([])

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 初期化
    form.value.from_date = ''
    form.value.to_date = ''
    result.value = ''
    error.value = ''
    resultBatches.value = []
  }
})
watch(visible, (val) => {
  if (!val) emit('update:modelValue', false)
})

// 日期统一格式化为 YYYY-MM-DD
function formatDate(date: string | Date | undefined): string {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  if (date instanceof Date) return date.toISOString().slice(0, 10)
  return ''
}

const generateBatches = async () => {
  loading.value = true
  result.value = ''
  error.value = ''
  resultBatches.value = []
  try {
    const res = await request.post<GenerateRes>('/api/plan/batch/generate-range-auto', {
      from_date: formatDate(form.value.from_date),
      to_date: formatDate(form.value.to_date),
    })
    resultBatches.value = (res && res.batches) ? res.batches : []
    const count = resultBatches.value.length
    result.value = (res && res.message ? res.message : '生成成功') + `（生成了${count}件）`
    emit('success') // 通知父页面刷新列表
  } catch (e: unknown) {
    let msg = '生成失敗'
    if (typeof e === 'object' && e !== null) {
      const errObj = e as { message?: string; msg?: string; response?: { data?: { message?: string } } }
      msg = errObj.message || errObj.msg || errObj.response?.data?.message || msg
    } else if (typeof e === 'string') {
      msg = e
    }
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-area {
  margin-top: 16px;
}

.status-msg {
  margin-top: 16px;
  font-weight: bold;
}

.status-msg.success {
  color: #67c23a;
}

.status-msg.error {
  color: #f56c6c;
}
</style>
