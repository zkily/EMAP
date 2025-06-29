<template>
  <el-dialog v-model="visible" title="新規計画作成" width="620px" @close="handleClose">
    <el-form :model="form" label-width="110px">
      <el-form-item label="工程">
        <el-select v-model="form.process_cd" @change="handleProcessOrMachineChange" style="width: 100%">
          <el-option v-for="p in processes" :key="p.process_cd" :label="p.process_name" :value="p.process_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="設備">
        <el-select v-model="form.machine_cd" @change="handleProcessOrMachineChange" style="width: 100%">
          <el-option v-for="m in machines" :key="m.machine_cd" :label="m.machine_name" :value="m.machine_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="生産バッチ">
        <el-select
          v-model="form.selectedBatchNos"
          multiple
          style="width: 100%"
          filterable
          :disabled="!form.process_cd || !form.machine_cd"
          @focus="loadBatchList"
        >
          <el-option
            v-for="batch in batchList"
            :key="batch.batch_no"
            :label="batch.product_name + ' / ' + batch.batch_no + ' / 数量:' + batch.planned_qty"
            :value="batch.batch_no"
          />
        </el-select>
        <div v-if="form.process_cd && form.machine_cd && batchList.length === 0" style="color:#999;margin-top:2px;">該当するバッチはありません</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">キャンセル</el-button>
      <el-button type="primary" @click="handleCreatePlans" :disabled="!form.selectedBatchNos.length">生成計画</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 由父组件传入是否显示弹窗、工程/设备/主数据等
const props = defineProps({
  modelValue: Boolean,  // 控制弹窗显示
  processes: { type: Array, default: () => [] },
  machines: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'created'])

// 弹窗可见性
const visible = ref(props.modelValue)
watch(() => props.modelValue, v => visible.value = v)
watch(visible, v => emit('update:modelValue', v))

// 表单状态
const form = ref({
  process_cd: '',
  machine_cd: '',
  selectedBatchNos: []
})
const batchList = ref([])

function handleProcessOrMachineChange() {
  form.value.selectedBatchNos = []
  batchList.value = []
}

async function loadBatchList() {
  // 只有选择了工序和设备才查
  if (!form.value.process_cd || !form.value.machine_cd) {
    batchList.value = []
    return
  }
  const { data } = await axios.get('/api/schedule/production-batches', {
    params: {
      process_cd: form.value.process_cd,
      machine_cd: form.value.machine_cd
    }
  })
  batchList.value = data.list || []
}

// 创建计划
async function handleCreatePlans() {
  try {
    await axios.post('/api/schedule/create-batch-plans', {
      process_cd: form.value.process_cd,
      machine_cd: form.value.machine_cd,
      batch_nos: form.value.selectedBatchNos
    })
    ElMessage.success('計画を作成しました')
    visible.value = false
    emit('created') // 通知父组件刷新
  } catch (e) {
    ElMessage.error('作成失敗: ' + (e.response?.data?.message || e.message))
  }
}

function handleClose() {
  // 关闭弹窗时重置
  form.value = { process_cd: '', machine_cd: '', selectedBatchNos: [] }
  batchList.value = []
}
</script>
