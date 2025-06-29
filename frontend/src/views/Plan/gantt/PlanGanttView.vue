<template>
  <div class="page-container">
    <h2>📅 生産ガントチャート</h2>

    <div class="toolbar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="〜" start-placeholder="開始日"
        end-placeholder="終了日" />
      <el-button @click="fetchData">🔄 更新</el-button>
      <el-button @click="zoomLevel = 'day'">📆 日単位</el-button>
      <el-button @click="zoomLevel = 'hour'">⏱ 時間単位</el-button>
      <el-button @click="exportToPDF">📄 PDF出力</el-button>
    </div>

    <GanttChart :items="items" :groups="groupList" :zoomLevel="zoomLevel" @change="handleChange" @edit="openEditDialog"
      @create="openCreateDialog" />

    <!-- 编辑/新建 弹窗 -->
    <PlanStepDialog v-model="dialogVisible" :isEdit="isEditMode" :data="currentItem" @refresh="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrAfter)
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)
import { ElMessage } from 'element-plus'

import GanttChart from './GanttChart.vue'
import PlanStepDialog from './PlanStepDialog.vue'
import {
  getGanttItems,
  getMachineGroup,
  updatePlanStepTime,
  validateStepDrag,
  getMachineAvailability,
  getMachineExceptions,
} from '@/api/plan/plangantt'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const dateRange = ref<[Date, Date]>([new Date(), dayjs().add(7, 'day').toDate()])
const items = ref<any[]>([])
const groupList = ref<any[]>([])
const zoomLevel = ref<'hour' | 'day'>('hour')

// 编辑对话框相关
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentItem = ref<any>({})

/** 拉取设备组（group）列表 */
async function fetchGroups() {
  // 这里假设 getMachineGroup() 返回 [{ machine_cd, ... }]
  const machines = await getMachineGroup()
  groupList.value = machines.map((row: any) => ({
    id: row.machine_cd,
    content: `${row.process_name} - ${row.machine_name}`, // ✅ 优先显示设备名
  }))
}

/** 拉取数据 */
async function fetchData() {
  try {
    if (!dateRange.value) return
    const [from, to] = dateRange.value.map(d => dayjs(d).format('YYYY-MM-DD'))
    items.value = await getGanttItems(from, to)
    await fetchGroups()
  } catch (err) {
    console.error('GanttData fetch error:', err)
  }
}
onMounted(fetchData)

/** PDF导出 */
async function exportToPDF() {
  const el = document.querySelector('.gantt-container')
  if (!el) return
  const canvas = await html2canvas(el as HTMLElement, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`排程Gantt_${dayjs().format('YYYYMMDD_HHmm')}.pdf`)
}

/** 拖拽/调整保存逻辑 */
async function handleChange({ items: changedItems }: { items: any[] }) {
  for (const changed of changedItems) {
    const id = changed.id
    const start_time = dayjs(changed.start).format('YYYY-MM-DD HH:mm:ss')
    const end_time = dayjs(changed.end).format('YYYY-MM-DD HH:mm:ss')
    const machine_cd = changed.group
    // 关联信息
    const raw = items.value.find(i => i.id === id)
    const plan_id = raw?.plan_id
    const process_cd = raw?.process_cd

    // 1. 校验工序顺序
    const result = await validateStepDrag(id, plan_id, process_cd, start_time)
    if (!result.valid) {
      ElMessage.warning(`⛔ 工程「${result.conflictStep}」未完成，工序顺序不正`)
      continue
    }

    // 2. 校验设备可用时间
    if (!(await isWithinMachineAvailableHours(machine_cd, start_time, end_time))) {
      ElMessage.warning('⛔ 選択時間帯は設備の稼働時間外です')
      continue
    }

    // 3. 校验例外日/假期
    if (!(await isWithinExceptionHours(machine_cd, start_time, end_time))) {
      ElMessage.warning('⛔ 設備が例外日または停止中です')
      continue
    }

    // 通过后才保存
    await updatePlanStepTime(id, start_time, end_time, machine_cd)
  }
  fetchData()
}

/** 校验设备可用时间（通用） */
async function isWithinMachineAvailableHours(machine_cd: string, start_time: string, end_time: string) {
  const availList = await getMachineAvailability(machine_cd)
  const start = dayjs(start_time)
  const end = dayjs(end_time)
  const dow = start.format('dddd') // e.g. 'Monday'
  const slots = availList.filter((a: any) => a.day_of_week === dow)
  if (!slots.length) return false
  return slots.some((a: any) => {
    const [sh, sm] = a.start_time.split(':')
    const [eh, em] = a.end_time.split(':')
    const availableStart = dayjs(start).set('hour', sh).set('minute', sm)
    const availableEnd = dayjs(start).set('hour', eh).set('minute', em)
    return start.isSameOrAfter(availableStart) && end.isSameOrBefore(availableEnd)
  })
}

/** 校验例外日/假期 */
async function isWithinExceptionHours(machine_cd: string, start_time: string, end_time: string) {
  const list = await getMachineExceptions(machine_cd)
  const s = dayjs(start_time)
  const e = dayjs(end_time)
  return !list.some((row: any) => {
    const excStart = dayjs(`${row.exception_date} ${row.start_time}`)
    const excEnd = dayjs(`${row.exception_date} ${row.end_time}`)
    return s.isBefore(excEnd) && e.isAfter(excStart) // 有重叠就是冲突
  })
}

/** 双击编辑 */
function openEditDialog(item: any) {
  isEditMode.value = true
  currentItem.value = {
    ...item,
    plan_id: item.plan_id,
    process_cd: item.process_cd,
    machine_cd: item.group,
    start_time: item.start,
  }
  dialogVisible.value = true
}

/** 拖入新建 */
function openCreateDialog({ start, group }: any) {
  isEditMode.value = false
  currentItem.value = {
    plan_id: '',
    process_cd: '',
    machine_cd: group,
    start_time: start
  }
  dialogVisible.value = true
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
