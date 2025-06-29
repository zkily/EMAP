<template>
  <el-dialog :model-value="modelValue" :title="isEdit ? '🛠 計画ステップ編集' : '➕ 新規ステップ作成'" width="500px"
    @update:modelValue="val => emit('update:modelValue', val)" destroy-on-close>
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <!-- 计划选择 -->
      <el-form-item label="計画" prop="plan_id">
        <el-select v-model="form.plan_id" placeholder="選択してください" @change="onPlanChange">
          <el-option v-for="plan in planOptions" :key="plan.value" :label="plan.label" :value="plan.value" />
        </el-select>
      </el-form-item>
      <!-- 工序下拉 -->
      <el-form-item label="工序" prop="process_cd">
        <el-select v-model="form.process_cd" placeholder="選択してください" @change="onProcessChange">
          <el-option v-for="opt in processOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <!-- 设备下拉 -->
      <el-form-item label="設備" prop="machine_cd">
        <el-select v-model="form.machine_cd" placeholder="選択してください">
          <el-option v-for="opt in machineOptions" :key="opt.value" :label="opt.label" :value="opt.value">
            {{ opt.label }}
            <span v-if="opt.recommended" style="color: red; font-size: 12px;">🔥 推奨</span>
          </el-option>
        </el-select>
      </el-form-item>
      <!-- 开始时间 -->
      <el-form-item label="開始時間" prop="start_time">
        <el-date-picker v-model="form.start_time" type="datetime" format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
      <!-- 实时效率预览 -->
      <el-form-item v-if="efficiencyInfo" label="能率">
        <span>{{ efficiencyInfo.efficiency_per_hour }} pcs/h</span>
      </el-form-item>
      <!-- 实时结束时间预览 -->
      <el-form-item label="終了時間">
        <el-input v-model="estimatedEndTime" disabled />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">キャンセル</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  getAllPlans,
  getEfficiency,
  validateStepOrder,
  createPlanStepAuto,
  updatePlanStepTime,
  getMachineOptions,
  getProcessOptions,
} from '@/api/plan/plangantt'

const props = defineProps<{
  modelValue: boolean
  isEdit: boolean
  data?: any
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const formRef = ref()
const form = ref<{
  id?: number
  plan_id: string
  product_cd: string
  process_cd: string
  machine_cd: string
  start_time: string
}>({
  id: undefined,
  plan_id: '',
  product_cd: '',
  process_cd: '',
  machine_cd: '',
  start_time: ''
})

const rules = {
  plan_id: [{ required: true, message: '計画IDは必須です' }],
  process_cd: [{ required: true, message: '工序CDは必須です' }],
  machine_cd: [{ required: true, message: '設備CDは必須です' }],
  start_time: [{ required: true, message: '開始時間は必須です' }]
}

const planOptions = ref<any[]>([])
const processOptions = ref<any[]>([])
const machineOptions = ref<any[]>([])
const efficiencyInfo = ref<any>(null)
const estimatedEndTime = ref('')

// 载入下拉选项
onMounted(async () => {
  planOptions.value = await getAllPlans()        // 已经是数组
  processOptions.value = await getProcessOptions()
})

// 打开弹窗时自动初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.data) {
      form.value = { ...props.data }
      // 若有计划，自动填充产品CD
      const plan = planOptions.value.find(p => p.value == form.value.plan_id)
      if (plan) form.value.product_cd = plan.product_cd
    } else {
      // 新建时清空
      form.value = {
        id: undefined,
        plan_id: '',
        product_cd: '',
        process_cd: '',
        machine_cd: '',
        start_time: ''
      }
    }
  }
})

// 选择计划后，填充产品CD
async function onPlanChange(plan_id: string) {
  const selected = planOptions.value.find(p => p.value === plan_id)
  form.value.product_cd = selected?.product_cd || ''
  form.value.process_cd = ''
  form.value.machine_cd = ''
  efficiencyInfo.value = null
  machineOptions.value = []
}

// 选择工序后，获取机台选项
async function onProcessChange(process_cd: string) {
  if (form.value.product_cd && process_cd) {
    const list = await getMachineOptions(form.value.product_cd, process_cd)
    machineOptions.value = list.map((item: any, idx: number) => ({
      ...item,
      recommended: idx === 0
    }))
    if (machineOptions.value.length) form.value.machine_cd = machineOptions.value[0].value
    else form.value.machine_cd = ''
  } else {
    machineOptions.value = []
    form.value.machine_cd = ''
  }
}

// 实时查能率
watch(
  () => [form.value.product_cd, form.value.process_cd, form.value.machine_cd],
  async ([product_cd, process_cd, machine_cd]) => {
    if (product_cd && process_cd && machine_cd) {
      try {
        efficiencyInfo.value = await getEfficiency(product_cd, process_cd, machine_cd)
      } catch (e) {
        efficiencyInfo.value = null
      }
    } else {
      efficiencyInfo.value = null
    }
  }
)

// 实时估算结束时间
watch(
  () => [form.value.start_time, efficiencyInfo.value?.efficiency_per_hour, form.value.plan_id],
  () => {
    const start = form.value.start_time
    const eff = efficiencyInfo.value?.efficiency_per_hour
    const plan = planOptions.value.find(p => p.value === form.value.plan_id)
    if (start && eff && plan?.planned_qty) {
      const hours = plan.planned_qty / eff
      estimatedEndTime.value = dayjs(start).add(hours, 'hour').format('YYYY-MM-DD HH:mm')
    } else {
      estimatedEndTime.value = ''
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  await formRef.value.validate()
  // 工序顺序校验（仅新建时）
  if (!props.isEdit) {
    const result = await validateStepOrder(form.value.plan_id, form.value.process_cd)
    if (!result.valid) {
      ElMessage.warning(`⛔ 工序順序不正。以下工程を先に追加してください：${result.missedSteps.join(', ')}`)
      return
    }
  }
  try {
    if (props.isEdit) {
      const id = form.value.id
      if (!id || typeof id !== 'number') {
        ElMessage.error('ID不正，編集できません')
        return
      }
      await updatePlanStepTime(
        id,
        form.value.start_time,
        '',
        form.value.machine_cd
      )
    } else {
      await createPlanStepAuto({
        plan_id: form.value.plan_id,
        process_cd: form.value.process_cd,
        machine_cd: form.value.machine_cd,
        start_time: form.value.start_time
      })
    }
    ElMessage.success('保存しました')
    close()
    emit('refresh')
  } catch (err: any) {
    ElMessage.error(err.message || '保存に失敗しました')
  }
}
</script>
