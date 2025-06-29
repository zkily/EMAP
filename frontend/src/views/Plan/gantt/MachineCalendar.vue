<template>
  <div class="page-container">
    <h2>🛠 設備カレンダー管理</h2>
    <el-form :inline="true" style="margin-bottom: 16px">
      <el-form-item label="設備選択">
        <el-select v-model="selectedMachine" placeholder="機台を選択" style="width: 200px" @change="fetchList">
          <el-option v-for="m in machineList" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!selectedMachine" @click="dialogVisible = true">➕ 例外追加</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="exceptionList" border style="width: 100%">
      <el-table-column label="日付" prop="exception_date" width="120" />
      <el-table-column label="時間帯" width="180">
        <template #default="{ row }">
          {{ row.start_time }} ~ {{ row.end_time }}
        </template>
      </el-table-column>
      <el-table-column label="理由" prop="reason" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="remove(row)">削除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 例外日追加ダイアログ -->
    <el-dialog v-model="dialogVisible" title="例外日追加" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="日付">
          <el-date-picker v-model="form.exception_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="時間">
          <el-time-picker v-model="form.start_time" placeholder="開始" style="width: 48%" />
          <el-time-picker v-model="form.end_time" placeholder="終了" style="width: 48%" />
        </el-form-item>
        <el-form-item label="理由">
          <el-input v-model="form.reason" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const selectedMachine = ref('')
const machineList = ref<string[]>([])
const exceptionList = ref<any[]>([])

const dialogVisible = ref(false)
const form = ref({
  exception_date: '',
  start_time: '00:00:00',
  end_time: '23:59:59',
  reason: ''
})

/** 获取所有设备列表 */
async function fetchMachines() {
  const res = await axios.get('/api/plan/machines/all') // 你也可以换成更正式的设备主表接口
  machineList.value = res.data.map((m: any) => m.machine_cd)
}

/** 拉取当前设备的例外日数据 */
async function fetchList() {
  if (!selectedMachine.value) return
  const res = await axios.get('/api/plan/machine/exception', {
    params: { machine_cd: selectedMachine.value }
  })
  exceptionList.value = res.data
}

/** 新增例外日 */
async function submit() {
  if (!selectedMachine.value) return
  await axios.post('/api/plan/machine/exceptions/add', {
    machine_cd: selectedMachine.value,
    ...form.value
  })
  ElMessage.success('例外日を追加しました')
  dialogVisible.value = false
  await fetchList()
}

/** 删除例外日 */
async function remove(row: any) {
  await ElMessageBox.confirm('削除してもよろしいですか？', '確認', { type: 'warning' })
  await axios.post('/api/plan/machine/exceptions/delete', {
    id: row.id
  })
  ElMessage.success('削除しました')
  await fetchList()
}

// 初始化加载
onMounted(fetchMachines)
watch(selectedMachine, fetchList)
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
