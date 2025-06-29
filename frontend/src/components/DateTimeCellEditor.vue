<template>
  <div style="min-width: 200px;">
    <el-date-picker
      v-model="value"
      type="datetime"
      format="YYYY/MM/DD HH:mm"
      value-format="YYYY-MM-DD HH:mm:ss"
      :editable="true"
      :clearable="false"
      @change="onChange"
      @focus="onFocus"
      style="width: 180px"
      ref="picker"
      popper-class="aggrid-datepicker-popup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
const params = defineProps()  // 拿到 ag-grid params 对象
const value = ref(params.value)
const picker = ref()

function getValue() {
  return value.value
}
defineExpose({ getValue })

onMounted(() => {
  nextTick(() => {
    if (picker.value && picker.value.focus) {
      picker.value.focus()
    }
  })
})

function onChange(val) {
  value.value = val
  setTimeout(() => {
    if (params.api && params.api.stopEditing) {
      params.api.stopEditing()
    }
  }, 200)
}

function onFocus() {
  if (picker.value && picker.value.focus) {
    setTimeout(() => picker.value.focus(), 50)
  }
}
</script>

<style>
.aggrid-datepicker-popup {
  z-index: 9999 !important;
}
</style>
