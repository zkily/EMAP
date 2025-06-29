<template>
  <el-card shadow="always" class="route-step-card" v-loading="loading">
    <template #header>
      <div class="header-bar">
        <span>🛠️ 製品別工程ステップ</span>
        <div class="button-group">
          <el-button type="success" size="small" @click="dialogVisible = true" :disabled="loading">
            ➕ 工程追加
          </el-button>
          <el-button type="info" size="small" @click="resetData" :disabled="loading || !dataLoaded">
            🔄 リセット
          </el-button>
          <el-button type="primary" size="small" @click="saveSteps" :disabled="loading || !dataLoaded">
            💾 保存
          </el-button>
        </div>
      </div>
    </template>

    <!-- 加载状态 -->
    <template v-if="loading && !dataLoaded">
      <div class="loading-message">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>データを読み込み中...</span>
      </div>
    </template>

    <!-- 空状态 -->
    <template v-else-if="!loading && dataLoaded && steps.length === 0">
      <div class="empty-message">
        <el-icon>
          <DocumentRemove />
        </el-icon>
        <p>工程ルート未設定 または ステップがありません</p>
        <el-button type="primary" @click="dialogVisible = true">工程を追加</el-button>
      </div>
    </template>

    <!-- 数据显示 -->
    <div v-else-if="dataLoaded && steps.length > 0" class="steps-container">
      <div v-for="(step, stepIndex) in steps" :key="step.step_no" class="step-card">
        <el-card shadow="hover" class="process-card">
          <template #header>
            <div class="process-header">
              <div class="process-info">
                <el-tag type="primary" size="small">順序 {{ step.step_no }}</el-tag>
                <span class="process-code">{{ step.process_cd }}</span>
                <span class="process-name">{{ step.process_name }}</span>
                <el-tag v-if="step.id" type="success" size="small">保存済み</el-tag>
                <el-tag v-else type="warning" size="small">未保存</el-tag>
              </div>
              <el-button type="danger" size="small" @click="removeStep(stepIndex)" :disabled="loading">
                🗑️ 削除
              </el-button>
            </div>
          </template>

          <div class="machines-section">
            <div class="section-title">
              <span>🔧 設備一覧
                <el-tag v-if="step.machines && step.machines.length > 0" type="info" size="small">
                  {{ step.machines.length }}台
                </el-tag>
              </span>
              <el-button type="primary" size="small" @click="addMachine(step)" :disabled="loading">
                ➕ 設備追加
              </el-button>
            </div>

            <div v-if="!step.machines || step.machines.length === 0" class="no-machines">
              <el-icon>
                <Tools />
              </el-icon>
              <p>設備が設定されていません</p>
              <el-button type="primary" size="small" @click="addMachine(step)">設備を追加</el-button>
            </div>

            <div v-else class="machines-grid">
              <el-card v-for="(machine, idx) in step.machines" :key="machine._uid || idx" shadow="never"
                class="machine-card" :class="{ 'machine-saved': machine.id, 'machine-new': !machine.id }">
                <div class="machine-form">
                  <div class="machine-status">
                    <el-tag v-if="machine.id" type="success" size="small">保存済み</el-tag>
                    <el-tag v-else type="warning" size="small">新規</el-tag>
                  </div>

                  <div class="form-row">
                    <div class="form-item">
                      <label class="form-label">設備CD</label>
                      <el-select v-model="machine.machine_cd" filterable placeholder="設備を選択" style="width: 100%;"
                        @change="cd => onMachineChange(step, idx, cd)" :disabled="loading">
                        <el-option v-for="opt in getFilteredMachines(step.process_name)" :key="opt.machine_cd"
                          :label="`${opt.machine_cd} - ${opt.machine_name}`" :value="opt.machine_cd" />
                      </el-select>
                    </div>
                    <div class="form-item">
                      <label class="form-label">設備名</label>
                      <el-input v-model="machine.machine_name" placeholder="設備名" readonly style="width: 100%;" />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-item">
                      <label class="form-label">加工時間 (秒)</label>
                      <el-input-number v-model="machine.process_time_sec" :min="0" :step="1" style="width: 100%;"
                        placeholder="加工時間を入力" :disabled="loading" />
                    </div>
                    <div class="form-item">
                      <label class="form-label">段取り時間 (秒)</label>
                      <el-input-number v-model="machine.setup_time" :min="0" :step="1" style="width: 100%;"
                        placeholder="段取り時間を入力" :disabled="loading" />
                    </div>
                  </div>

                  <div class="machine-actions">
                    <el-button v-if="machine.machine_cd" type="success" size="small" @click="updateMachine(step, idx)"
                      :disabled="loading">
                      <el-icon>
                        <Check />
                      </el-icon>
                      {{ machine.id ? '更新' : '保存' }}
                    </el-button>
                    <el-button type="danger" size="small" @click="removeMachine(step, idx)" :disabled="loading">
                      <el-icon>
                        <Delete />
                      </el-icon>
                      削除
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- ✅ 工程選択ダイアログ -->
    <ProcessSelectDialog v-model:visible="dialogVisible" @selected="addProcess" />
  </el-card>
</template>

<!--
后端需要支持的API接口：

1. 单个设备新增：POST /api/master/product/process/routes/machines
   请求体：{
     product_cd: string,
     route_cd: string,
     step_no: number,
     machine_cd: string,
     machine_name: string,
     process_time_sec: number,
     setup_time: number
   }
   返回：{ id: number, ...其他字段 }

2. 单个设备更新：PUT /api/master/product/process/routes/machines/:id
   请求体：同新增接口
   返回：{ success: true }

3. 单个设备删除：DELETE /api/master/product/process/routes/machines/:id
   返回：{ success: true }

4. 获取工程步骤（含设备）：GET /api/master/product/process/routes/:productCd/:routeCd
   返回：[{
     id: number,
     product_cd: string,
     route_cd: string,
     step_no: number,
     process_cd: string,
     process_name: string,
     machines: [{
       id: number,
       machine_cd: string,
       machine_name: string,
       process_time_sec: number,
       setup_time: number
     }]
   }]
-->

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, DocumentRemove, Tools, Check, Delete } from '@element-plus/icons-vue'
import ProcessSelectDialog from './ProcessSelectDialog.vue'

const props = defineProps<{ productCd: string }>()

interface MachineInfo {
  id?: number // 数据库ID，用于更新操作
  machine_cd: string
  machine_name: string
  process_time_sec: number
  setup_time: number
  _uid?: string // 前端唯一key
}
interface ProductRouteStep {
  id?: number // 数据库ID
  product_cd: string
  route_cd: string
  step_no: number
  process_cd: string
  process_name: string
  machines?: MachineInfo[]
}

interface Machine {
  machine_cd: string
  machine_name: string
  machine_type: string
}

const steps = ref<ProductRouteStep[]>([])
const dialogVisible = ref(false)
const allMachines = ref<Machine[]>([])
const loading = ref(false)
const dataLoaded = ref(false)

// 计算属性：检查是否有数据变更
const hasChanges = computed(() => {
  return steps.value.some(step =>
    step.machines?.some(machine =>
      machine.machine_cd || machine.process_time_sec > 0 || machine.setup_time > 0
    )
  )
})

onMounted(async () => {
  // 获取所有设备列表
  try {
    loading.value = true
    const res = await request.get('/api/master/machines')
    allMachines.value = res.data?.list || res.list || res
    console.log('设备列表加载成功:', allMachines.value.length, '个设备')
  } catch (e: unknown) {
    console.error('获取设备列表失败:', e)
    ElMessage.error('设备列表加载失败')
  } finally {
    loading.value = false
  }
})

// 根据工程名筛选对应的设备
const getFilteredMachines = (processName: string) => {
  if (!processName) return []
  const filtered = allMachines.value.filter(machine => machine.machine_type === processName)
  console.log(`工程 "${processName}" 对应的设备:`, filtered.length, '个')
  return filtered
}

const loadData = async () => {
  if (!props.productCd) {
    steps.value = []
    dataLoaded.value = false
    return
  }

  try {
    loading.value = true
    console.log('开始加载产品数据:', props.productCd)

    // 1. 获取产品的路线信息
    const product = await request.get(`/api/master/product/process/routes/${props.productCd}`)
    console.log('产品路线信息:', product)

    const routeCd = product.route_cd || product.data?.route_cd

    if (!routeCd) {
      console.log('产品未设置工程路线')
      steps.value = []
      dataLoaded.value = true
      return
    }

    // 2. 获取产品工程步骤数据（包含设备信息）
    console.log('加载工程步骤数据:', props.productCd, routeCd)
    const productSteps = await request.get(`/api/master/product/process/routes/${props.productCd}/${routeCd}`)
    console.log('获取到的工程步骤数据:', productSteps)

    if (productSteps && productSteps.length > 0) {
      // 有已保存的数据，确保设备数据完整加载
      steps.value = productSteps.map((step: ProductRouteStep) => {
        const processedStep: ProductRouteStep = {
          ...step,
          machines: []
        }

        // 处理设备数据，确保每个设备都有完整信息
        if (step.machines && Array.isArray(step.machines)) {
          processedStep.machines = step.machines.map((m: MachineInfo) => ({
            id: m.id, // 保持数据库ID
            machine_cd: m.machine_cd || '',
            machine_name: m.machine_name || '',
            process_time_sec: Number(m.process_time_sec) || 0,
            setup_time: Number(m.setup_time) || 0,
            _uid: Math.random().toString(36).slice(2)
          }))
        }

        return processedStep
      })
      console.log('加载已保存的工程步骤:', steps.value.length, '个步骤')

      // 输出每个步骤的设备信息
      steps.value.forEach((step, index) => {
        console.log(`步骤 ${index + 1} (${step.process_name}):`, step.machines?.length || 0, '个设备')
        step.machines?.forEach((machine, machineIndex) => {
          console.log(`  设备 ${machineIndex + 1}:`, {
            id: machine.id,
            machine_cd: machine.machine_cd,
            machine_name: machine.machine_name,
            process_time_sec: machine.process_time_sec,
            setup_time: machine.setup_time
          })
        })
      })
    } else {
      // 没有保存的数据，从路线模板创建
      console.log('没有已保存数据，从路线模板创建')
      const routeSteps = await request.post(`/api/master/product/process/routes/${routeCd}`)
      console.log('路线模板数据:', routeSteps)

      steps.value = (routeSteps as ProductRouteStep[]).map((step) => ({
        product_cd: props.productCd,
        route_cd: routeCd,
        step_no: step.step_no,
        process_cd: step.process_cd,
        process_name: step.process_name ?? '',
        machines: [] // 新建时设备列表为空
      }))
      console.log('创建新的工程步骤:', steps.value.length, '个步骤')
    }

    dataLoaded.value = true

  } catch (e: unknown) {
    console.error('加载数据失败:', e)
    ElMessage.error('数据加载失败，请检查网络连接')
    steps.value = []
    dataLoaded.value = false
  } finally {
    loading.value = false
  }
}

watch(() => props.productCd, loadData, { immediate: true })

const addProcess = (process: { process_cd: string; process_name: string }) => {
  const maxStepNo = steps.value.length > 0 ? Math.max(...steps.value.map(s => s.step_no)) : 0
  const newStep: ProductRouteStep = {
    product_cd: props.productCd,
    route_cd: steps.value[0]?.route_cd ?? '',
    step_no: maxStepNo + 1,
    process_cd: process.process_cd,
    process_name: process.process_name,
    machines: []
  }
  steps.value.push(newStep)
  console.log('添加新工程:', newStep)
}

const addMachine = (step: ProductRouteStep) => {
  if (!step.machines) step.machines = []
  const newMachine: MachineInfo = {
    machine_cd: '',
    machine_name: '',
    process_time_sec: 0,
    setup_time: 0,
    _uid: Math.random().toString(36).slice(2)
  }
  step.machines.push(newMachine)
  console.log('添加新设备到工程:', step.process_name)
}

const onMachineChange = (step: ProductRouteStep, idx: number, machineCd: string) => {
  const machine = allMachines.value.find(m => m.machine_cd === machineCd)
  if (machine && step.machines && step.machines[idx]) {
    step.machines[idx].machine_name = machine.machine_name
    console.log('设备选择变更:', machineCd, '->', machine.machine_name)
  }
}

const removeStep = (index: number) => {
  if (steps.value.length > index) {
    const removedStep = steps.value[index]
    steps.value.splice(index, 1)
    // 重新排序步骤号
    steps.value.forEach((s, i) => s.step_no = i + 1)
    console.log('删除工程步骤:', removedStep.process_name)
  }
}

const saveSteps = async () => {
  if (!dataLoaded.value) {
    ElMessage.warning('数据尚未加载完成，请稍后再试')
    return
  }

  // 数据验证
  const invalidSteps = steps.value.filter(step =>
    !step.process_cd || !step.process_name
  )
  if (invalidSteps.length > 0) {
    ElMessage.error('存在无效的工程步骤，请检查数据')
    return
  }

  // 验证设备数据
  for (const step of steps.value) {
    if (step.machines) {
      const invalidMachines = step.machines.filter(m =>
        m.machine_cd && (!m.machine_name || m.process_time_sec < 0 || m.setup_time < 0)
      )
      if (invalidMachines.length > 0) {
        ElMessage.error(`工程 "${step.process_name}" 中存在无效的设备配置`)
        return
      }
    }
  }

  try {
    loading.value = true
    console.log('开始保存数据:', steps.value)

    // 清理空的设备记录
    const cleanedSteps = steps.value.map(step => ({
      ...step,
      machines: (step.machines || []).filter(m => m.machine_cd) // 只保存有设备CD的记录
    }))

    await request.post('/api/master/product/process/routes/bulk', cleanedSteps)
    ElMessage.success('保存成功！')

    // 重新加载数据以获取最新的ID等信息
    await loadData()

  } catch (e: unknown) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}

// 重置数据
const resetData = async () => {
  if (hasChanges.value) {
    const confirmed = await ElMessageBox.confirm(
      '当前有未保存的修改，确定要重置吗？',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).catch(() => false)

    if (!confirmed) return
  }

  await loadData()
  ElMessage.success('数据已重置')
}

// 单个设备更新功能
const updateMachine = async (step: ProductRouteStep, machineIndex: number) => {
  const machine = step.machines?.[machineIndex]
  if (!machine || !machine.machine_cd) {
    ElMessage.warning('请先选择设备')
    return
  }

  try {
    loading.value = true
    console.log('更新单个设备:', machine)

    const updateData = {
      product_cd: step.product_cd,
      route_cd: step.route_cd,
      step_no: step.step_no,
      machine_cd: machine.machine_cd,
      machine_name: machine.machine_name,
      process_time_sec: machine.process_time_sec,
      setup_time: machine.setup_time
    }

    if (machine.id) {
      // 更新现有设备
      await request.put(`/api/master/product/process/routes/machines/${machine.id}`, updateData)
      ElMessage.success('设备更新成功')
    } else {
      // 新增设备
      const result = await request.post('/api/master/product/process/routes/machines', updateData)
      machine.id = result.id || result.data?.id
      ElMessage.success('设备添加成功')
    }

    console.log('设备操作成功:', machine)
  } catch (e: unknown) {
    console.error('设备操作失败:', e)
    ElMessage.error('设备操作失败')
  } finally {
    loading.value = false
  }
}

// 单个设备删除功能
const deleteMachine = async (step: ProductRouteStep, machineIndex: number) => {
  const machine = step.machines?.[machineIndex]
  if (!machine) return

  try {
    const confirmed = await ElMessageBox.confirm(
      `确定要删除设备 "${machine.machine_name || machine.machine_cd}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    if (!confirmed) return

    loading.value = true

    if (machine.id) {
      // 删除数据库中的设备
      await request.delete(`/api/master/product/process/routes/machines/${machine.id}`)
      console.log('从数据库删除设备:', machine.id)
    }

    // 从前端数组中移除
    step.machines?.splice(machineIndex, 1)
    ElMessage.success('设备删除成功')
    console.log('设备删除成功:', machine.machine_cd)

  } catch (e: unknown) {
    if (e !== false) { // 不是用户取消
      console.error('删除设备失败:', e)
      ElMessage.error('删除设备失败')
    }
  } finally {
    loading.value = false
  }
}

const removeMachine = (step: ProductRouteStep, idx: number) => {
  // 调用删除功能
  deleteMachine(step, idx)
}
</script>

<style scoped>
.route-step-card {
  padding: 10px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-group>.el-button+.el-button {
  margin-left: 8px;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #606266;
  gap: 12px;
}

.loading-message .el-icon {
  font-size: 24px;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
  gap: 12px;
}

.empty-message .el-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.empty-message p {
  margin: 0;
  font-size: 16px;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-card {
  width: 100%;
}

.process-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.process-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.process-code {
  font-weight: bold;
  color: #409eff;
}

.process-name {
  font-size: 16px;
  color: #303133;
}

.machines-section {
  margin-top: 16px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  color: #606266;
}

.no-machines {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
  gap: 12px;
}

.no-machines .el-icon {
  font-size: 32px;
  color: #c0c4cc;
}

.no-machines p {
  margin: 0;
  font-size: 14px;
}

.machines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 12px;
}

.machine-card {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.machine-card.machine-saved {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.machine-card.machine-new {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.machine-form {
  padding: 8px;
}

.machine-status {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  font-weight: 500;
}

.machine-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.machine-actions .el-button {
  min-width: 70px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .machines-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .process-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
