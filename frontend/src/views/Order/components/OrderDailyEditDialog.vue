<template>
  <el-dialog :model-value="props.visible" @update:modelValue="(val) => emit('update:visible', val)" title="✏️ 日別受注編集"
    width="600px" :before-close="handleClose" destroy-on-close>
    <el-form :model="editForm" :rules="rules" ref="formRef" label-width="120px" class="form-body">
      <el-form-item label="納入先CD">
        <el-input v-model="editForm.destination_cd" disabled />
      </el-form-item>

      <el-form-item label="製品CD">
        <el-input v-model="editForm.product_cd" disabled />
      </el-form-item>

      <el-form-item label="製品名">
        <el-input v-model="editForm.product_name" disabled />
      </el-form-item>

      <el-form-item label="確定箱数" prop="confirmed_boxes">
        <el-input-number v-model="editForm.confirmed_boxes" :min="0" style="width: 200px" :disabled="isLocked" />
      </el-form-item>

      <el-form-item label="確定本数" prop="confirmed_units">
        <el-input-number v-model="editForm.confirmed_units" :min="0" style="width: 200px" :disabled="isLocked" />
      </el-form-item>

      <el-form-item label="状態" prop="status">
        <el-select v-model="editForm.status" placeholder="選択" :disabled="isLocked">
          <el-option label="未出荷" value="未出荷" />
          <el-option label="出荷済み" value="出荷済み" />
          <el-option label="キャンセル" value="キャンセル" />
        </el-select>
      </el-form-item>

      <el-form-item label="備考">
        <el-input v-model="editForm.remarks" type="textarea" :disabled="isLocked" placeholder="備考を入力"
          :autosize="{ minRows: 3, maxRows: 5 }" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">キャンセル</el-button>
      <el-button type="primary" @click="handleSave">保存する</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { updateDailyOrder } from '@/api/order/order'
import { ElMessage } from 'element-plus'
import type { OrderDaily } from '@/types/order'

// 正确声明 props
const props = defineProps<{
  visible: boolean
  order: OrderDaily | null
}>()

// 正确声明 emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

// 本地编辑表单
const editForm = ref<Partial<OrderDaily>>({})

// 表单校验规则
const rules = {
  confirmed_boxes: [{ required: true, message: '確定箱数は必須です', trigger: 'blur' }],
  confirmed_units: [{ required: true, message: '確定本数は必須です', trigger: 'blur' }],
  status: [{ required: true, message: '状態は必須です', trigger: 'change' }]
}

// 锁定状态（出荷済み时禁止修改）
const isLocked = computed(() => editForm.value.status === '出荷済')

// 表单ref
const formRef = ref()

// 监听传入的props.order，赋值到editForm
watch(() => props.order, (val) => {
  if (val) {
    editForm.value = {
      ...val,
      status: val.status || '未出荷'
    }
  }
}, { immediate: true })


// 保存按钮点击
const handleSave = async () => {
  if (!editForm.value.id) {
    ElMessage.error('対象データが正しくありません')
    return
  }
  try {
    await formRef.value?.validate()
  } catch (validateError) {
    console.error('フォーム検証失敗', validateError)
    ElMessage.error('必須項目を入力してください')
    return
  }

  try {
    await updateDailyOrder(editForm.value.id, editForm.value)
    ElMessage.success('更新成功！')
    emit('saved')
    emit('update:visible', false)
  } catch (error) {
    console.error('更新失敗', error)
    ElMessage.error('更新に失敗しました')
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.form-body {
  padding: 10px 0;
}
</style>
