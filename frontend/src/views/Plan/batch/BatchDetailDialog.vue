<template>
  <el-dialog v-model="visible" title="📄 生産No.詳細" width="800px" :close-on-click-modal="false" @close="handleClose">
    <el-descriptions v-if="batch" title="生産No.情報" :column="2" border>
      <el-descriptions-item label="生産No.番号">{{ batch.batch_no }}</el-descriptions-item>
      <el-descriptions-item label="製品CD">{{ batch.product_cd }}</el-descriptions-item>
      <el-descriptions-item label="予定数量">{{ batch.planned_qty }}</el-descriptions-item>
      <el-descriptions-item label="実際数量">{{ batch.actual_output_qty }}</el-descriptions-item>
      <el-descriptions-item label="期間">
        {{ batch.from_date }} ~ {{ batch.to_date }}
      </el-descriptions-item>
      <el-descriptions-item label="状態">
        <el-select v-model="batch.status" @change="updateStatus" style="width:120px">
          <el-option label="未開始" value="未開始" />
          <el-option label="計画済" value="計画済" />
          <el-option label="生産中" value="生産中" />
          <el-option label="生産完了" value="生産完了" />
          <el-option label="ロック済" value="ロック済" />
        </el-select>
      </el-descriptions-item>
      <el-descriptions-item label="ロック">
        <el-switch v-model="batch.is_locked" :active-value="1" :inactive-value="0" :active-text="'🔒 ロック中'"
          :inactive-text="'🔓 ロック解除'" :active-color="'#F56C6C'" :inactive-color="'#67C23A'" @change="toggleLock" />
      </el-descriptions-item>
    </el-descriptions>

    <el-divider>📋 関連受注（order_daily）</el-divider>

    <el-table :data="orders" border stripe highlight-current-row>
      <el-table-column prop="order_date" label="受注日" width="120" />
      <el-table-column prop="confirmed_units" label="確定数" width="100" />
      <el-table-column prop="forecast_units" label="内示数" width="100" />
      <el-table-column prop="supply_status" label="供給状態" width="120" />
      <el-table-column prop="fulfilled_from_stock" label="製品在庫" width="100" />
      <el-table-column prop="fulfilled_from_wip" label="仕掛在庫" width="100" />
    </el-table>

    <template #footer>
      <el-button @click="close">閉じる</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getBatchDetail,
  updateBatchStatus,
  toggleBatchLock,
} from '@/api/plan/plan'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  batchId: { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const batch = ref({})
const orders = ref([])

watchEffect(() => {
  visible.value = props.modelValue
  if (visible.value && props.batchId) {
    fetchDetail()
  }
})

const fetchDetail = async () => {
  console.log('▶️ 呼び出された batchId:', props.batchId)

  try {
    const res = await getBatchDetail(props.batchId)
    const data = res.data || res  // 拦截器兼容
    if (!data?.batch) {
      ElMessage.error('生産No.情報が見つかりません')
      return
    }

    batch.value = data.batch
    orders.value = (data.orders || []).map((o) => ({
      ...o,
      order_date:
        o.order_date ||
        `${o.year}-${String(o.month).padStart(2, '0')}-${String(o.day).padStart(2, '0')}`,
    }))
  } catch (e) {
    if (e?.response?.data?.message) {
      console.error('❌ 詳細取得失敗:', e.response.data)
      ElMessage.error(e.response.data.message)
    } else {
      console.error('❌ 詳細取得失敗:', e)
      ElMessage.error('詳細取得失敗')
    }
  }
}

const updateStatus = async () => {
  try {
    await updateBatchStatus({ batch_id: batch.value.id, status: batch.value.status })
    ElMessage.success('状態更新成功')
  } catch (e) {
    ElMessage.error('更新失敗')
  }
}

const toggleLock = async () => {
  try {
    await toggleBatchLock({ batch_id: batch.value.id, is_locked: batch.value.is_locked })
    ElMessage.success(batch.value.is_locked ? 'ロックしました' : 'ロック解除しました')
    fetchDetail()
  } catch (e) {
    ElMessage.error('ロック切替失敗')
  }
}


const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}
const handleClose = () => {
  emit('update:modelValue', false)
}
</script>
