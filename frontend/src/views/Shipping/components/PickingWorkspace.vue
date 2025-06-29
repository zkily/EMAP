<template>
  <div class="picking-workspace">
    <!-- 工作区头部 -->
    <div class="workspace-header">
      <div class="picker-info">
        <el-avatar :size="40" class="picker-avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div class="picker-details">
          <span class="picker-name">{{ currentPicker.name }}</span>
          <span class="picker-status">作業中</span>
        </div>
      </div>

      <div class="workspace-actions">
        <el-button @click="refreshTasks" :loading="loading.refresh">
          <el-icon><Refresh /></el-icon>
          更新
        </el-button>
        <el-button type="primary" @click="scanMode = !scanMode">
          <el-icon><Search /></el-icon>
          {{ scanMode ? 'スキャン終了' : 'スキャン開始' }}
        </el-button>
      </div>
    </div>

    <!-- 托盘进度概览 -->
    <el-card class="pallet-overview" shadow="hover">
      <template #header>
        <span>パレット進捗概要</span>
      </template>

      <div class="pallet-progress-grid">
        <div
          v-for="pallet in palletProgress"
          :key="pallet.shipping_no"
          class="pallet-progress-card"
          :class="getPalletStatusClass(pallet.pallet_status)"
          @click="selectPallet(pallet.shipping_no)"
        >
          <div class="pallet-header">
            <span class="pallet-no">{{ pallet.shipping_no }}</span>
            <el-tag :type="getPalletTagType(pallet.pallet_status)" size="small">
              {{ getPalletStatusText(pallet.pallet_status) }}
            </el-tag>
          </div>

          <el-progress
            :percentage="(pallet.completed_items / pallet.total_items) * 100"
            :status="pallet.pallet_status === 'completed' ? 'success' : ''"
            :stroke-width="8"
            class="pallet-progress-bar"
          />

          <div class="pallet-stats">
            <span>{{ pallet.completed_items }}/{{ pallet.total_items }} 完了</span>
            <span v-if="pallet.shortage_items > 0" class="shortage-count">
              欠品: {{ pallet.shortage_items }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 扫码区域 -->
    <el-card v-if="scanMode" class="scan-area" shadow="hover">
      <template #header>
        <div class="scan-header">
          <span>バーコードスキャン</span>
          <el-tag type="success">スキャンモード</el-tag>
        </div>
      </template>

      <div class="scan-content">
        <div class="scan-input">
          <el-input
            v-model="scannedCode"
            placeholder="バーコードをスキャンまたは手動入力"
            size="large"
            @keyup.enter="handleScan"
            ref="scanInput"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleScan" type="primary"> 確認 </el-button>
            </template>
          </el-input>
        </div>

        <div v-if="scanResult" class="scan-result">
          <el-alert
            :title="scanResult.message"
            :type="scanResult.type"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-card>

    <!-- ピッキング作业列表 -->
    <el-card class="task-list" shadow="hover">
      <template #header>
        <div class="task-header">
          <span>ピッキング作業リスト</span>
          <div class="task-filters">
            <el-select
              v-model="taskFilter"
              placeholder="フィルター"
              size="small"
              style="width: 120px"
            >
              <el-option label="全て" value="all" />
              <el-option label="待機中" value="pending" />
              <el-option label="作業中" value="picking" />
              <el-option label="完了" value="completed" />
              <el-option label="欠品" value="shortage" />
            </el-select>
            <el-select v-model="sortBy" placeholder="並び順" size="small" style="width: 120px">
              <el-option label="優先度順" value="priority" />
              <el-option label="場所順" value="location" />
              <el-option label="製品順" value="product" />
            </el-select>
          </div>
        </div>
      </template>

      <div class="task-table-container" v-loading="loading.tasks">
        <el-table
          :data="filteredTasks"
          @row-click="selectTask"
          :row-class-name="getTaskRowClass"
          height="500"
        >
          <el-table-column label="優先度" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="shipping_no" label="パレット" width="120" />

          <el-table-column prop="product_cd" label="製品CD" width="100" />

          <el-table-column
            prop="product_name"
            label="製品名"
            min-width="200"
            show-overflow-tooltip
          />

          <el-table-column label="数量" width="120" align="right">
            <template #default="{ row }">
              <div class="quantity-display">
                <span class="picked">{{ row.picked_quantity }}</span>
                <span class="separator">/</span>
                <span class="required">{{ row.confirmed_boxes }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="location_cd" label="保管場所" width="100" />

          <el-table-column prop="shelf_position" label="棚位置" width="100" />

          <el-table-column label="状態" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="task-actions">
                <el-button
                  v-if="row.status === 'pending'"
                  size="small"
                  type="primary"
                  @click.stop="startTask(row)"
                >
                  開始
                </el-button>

                <el-button
                  v-if="row.status === 'picking'"
                  size="small"
                  type="success"
                  @click.stop="completeTask(row)"
                >
                  完了
                </el-button>

                <el-button
                  v-if="row.status === 'picking'"
                  size="small"
                  type="warning"
                  @click.stop="reportShortage(row)"
                >
                  欠品報告
                </el-button>

                <el-button size="small" @click.stop="showTaskDetail(row)"> 詳細 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="taskDetailVisible" title="ピッキング作業詳細" width="600px">
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ピッキングID">
            {{ selectedTask.picking_id }}
          </el-descriptions-item>
          <el-descriptions-item label="パレット番号">
            {{ selectedTask.shipping_no }}
          </el-descriptions-item>
          <el-descriptions-item label="製品コード">
            {{ selectedTask.product_cd }}
          </el-descriptions-item>
          <el-descriptions-item label="製品名">
            {{ selectedTask.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="必要数量">
            {{ selectedTask.confirmed_boxes }}
          </el-descriptions-item>
          <el-descriptions-item label="ピッキング済み">
            {{ selectedTask.picked_quantity }}
          </el-descriptions-item>
          <el-descriptions-item label="保管場所">
            {{ selectedTask.location_cd }}
          </el-descriptions-item>
          <el-descriptions-item label="棚位置">
            {{ selectedTask.shelf_position }}
          </el-descriptions-item>
          <el-descriptions-item label="優先度">
            {{ getPriorityText(selectedTask.priority) }}
          </el-descriptions-item>
          <el-descriptions-item label="状態">
            {{ getStatusText(selectedTask.status) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedTask.status === 'picking'" class="quantity-input">
          <el-form :model="quantityForm" label-width="120px">
            <el-form-item label="ピッキング数量">
              <el-input-number
                v-model="quantityForm.quantity"
                :min="0"
                :max="selectedTask.confirmed_boxes"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="備考">
              <el-input
                v-model="quantityForm.remarks"
                type="textarea"
                :rows="3"
                placeholder="特記事項があれば入力"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDetailVisible = false">閉じる</el-button>
          <el-button
            v-if="selectedTask?.status === 'picking'"
            type="success"
            @click="updateTaskQuantity"
          >
            数量更新
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Refresh, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useMainStore } from '@/store/main'

interface PickingTask {
  picking_id: string
  shipping_no_p: string
  shipping_no: string
  product_cd: string
  product_name: string
  confirmed_boxes: number
  picked_quantity: number
  location_cd: string
  shelf_position: string
  priority: number
  status: 'pending' | 'picking' | 'completed' | 'shortage'
  pallet_sequence: number
  start_time?: string
  complete_time?: string
}

interface PalletProgress {
  shipping_no: string
  total_items: number
  completed_items: number
  picking_items: number
  shortage_items: number
  pallet_status: string
}

const emit = defineEmits(['refresh'])
const mainStore = useMainStore()

// 响应式数据
const loading = ref({
  refresh: false,
  tasks: false,
})

const currentPicker = ref({
  id: '',
  name: '',
})

const pickingTasks = ref<PickingTask[]>([])
const palletProgress = ref<PalletProgress[]>([])

const scanMode = ref(false)
const scannedCode = ref('')
const scanResult = ref<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(
  null,
)
const scanInput = ref()

const taskFilter = ref('all')
const sortBy = ref('priority')
const selectedPalletNo = ref('')

const taskDetailVisible = ref(false)
const selectedTask = ref<PickingTask | null>(null)
const quantityForm = ref({
  quantity: 0,
  remarks: '',
})

// 计算属性
const filteredTasks = computed(() => {
  let tasks = pickingTasks.value

  // 按状态筛选
  if (taskFilter.value !== 'all') {
    tasks = tasks.filter((task) => task.status === taskFilter.value)
  }

  // 按托盘筛选
  if (selectedPalletNo.value) {
    tasks = tasks.filter((task) => task.shipping_no === selectedPalletNo.value)
  }

  // 排序
  tasks = [...tasks].sort((a, b) => {
    switch (sortBy.value) {
      case 'priority':
        return a.priority - b.priority
      case 'location':
        return a.location_cd.localeCompare(b.location_cd)
      case 'product':
        return a.product_cd.localeCompare(b.product_cd)
      default:
        return 0
    }
  })

  return tasks
})

// 方法
async function fetchPickingTasks() {
  loading.value.tasks = true
  try {
    const response = await request.get('/api/shipping/picking/tasks', {
      params: {
        picker_id: currentPicker.value.id,
        status: 'active',
      },
    })

    if (response.success) {
      pickingTasks.value = response.data
    }
  } catch (error) {
    console.error('ピッキング作業取得エラー:', error)
    ElMessage.error('ピッキング作業の取得に失敗しました')
  } finally {
    loading.value.tasks = false
  }
}

async function fetchPalletProgress() {
  try {
    const response = await request.get('/api/shipping/picking/pallet-progress', {
      params: {
        picker_id: currentPicker.value.id,
      },
    })

    if (response.success) {
      palletProgress.value = response.data
    }
  } catch (error) {
    console.error('パレット進捗取得エラー:', error)
  }
}

async function refreshTasks() {
  loading.value.refresh = true
  try {
    await Promise.all([fetchPickingTasks(), fetchPalletProgress()])
    ElMessage.success('データを更新しました')
  } finally {
    loading.value.refresh = false
  }
}

function selectPallet(shippingNo: string) {
  selectedPalletNo.value = selectedPalletNo.value === shippingNo ? '' : shippingNo
}

function selectTask(task: PickingTask) {
  selectedTask.value = task
  taskDetailVisible.value = true
  quantityForm.value.quantity = task.picked_quantity
}

async function startTask(task: PickingTask) {
  try {
    const response = await request.put(`/api/shipping/picking/tasks/${task.picking_id}/start`)

    if (response.success) {
      ElMessage.success('ピッキング作業を開始しました')
      await refreshTasks()
      emit('refresh')
    }
  } catch (error) {
    console.error('作業開始エラー:', error)
    ElMessage.error('作業開始に失敗しました')
  }
}

async function completeTask(task: PickingTask) {
  try {
    await ElMessageBox.confirm(`${task.product_name} のピッキングを完了しますか？`, '確認', {
      confirmButtonText: '完了',
      cancelButtonText: 'キャンセル',
      type: 'success',
    })

    const response = await request.put(`/api/shipping/picking/tasks/${task.picking_id}/complete`, {
      picked_quantity: task.confirmed_boxes,
    })

    if (response.success) {
      ElMessage.success('ピッキング作業を完了しました')
      await refreshTasks()
      emit('refresh')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('作業完了エラー:', error)
      ElMessage.error('作業完了に失敗しました')
    }
  }
}

async function reportShortage(task: PickingTask) {
  try {
    const { value: shortageData } = await ElMessageBox.prompt(
      '欠品数量と理由を入力してください',
      '在庫欠品報告',
      {
        confirmButtonText: '報告',
        cancelButtonText: 'キャンセル',
        inputPlaceholder: '欠品理由を入力',
      },
    )

    const response = await request.put(`/api/shipping/picking/tasks/${task.picking_id}/shortage`, {
      shortage_reason: shortageData,
    })

    if (response.success) {
      ElMessage.success('在庫欠品を報告しました')
      await refreshTasks()
      emit('refresh')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('欠品報告エラー:', error)
      ElMessage.error('欠品報告に失敗しました')
    }
  }
}

async function handleScan() {
  if (!scannedCode.value.trim()) {
    ElMessage.warning('バーコードを入力してください')
    return
  }

  try {
    const response = await request.post('/api/shipping/picking/scan', {
      barcode: scannedCode.value,
      picker_id: currentPicker.value.id,
    })

    if (response.success) {
      scanResult.value = {
        message: response.message,
        type: 'success',
      }

      // 清空扫码输入
      scannedCode.value = ''

      // 刷新任务列表
      await refreshTasks()
      emit('refresh')
    } else {
      scanResult.value = {
        message: response.message || 'スキャンに失敗しました',
        type: 'error',
      }
    }
  } catch (error) {
    console.error('スキャンエラー:', error)
    scanResult.value = {
      message: 'スキャン処理でエラーが発生しました',
      type: 'error',
    }
  }

  // 3秒后清除扫描结果
  setTimeout(() => {
    scanResult.value = null
  }, 3000)

  // 重新聚焦到输入框
  nextTick(() => {
    if (scanInput.value) {
      scanInput.value.focus()
    }
  })
}

async function updateTaskQuantity() {
  if (!selectedTask.value) return

  try {
    const response = await request.put(
      `/api/shipping/picking/tasks/${selectedTask.value.picking_id}/quantity`,
      {
        picked_quantity: quantityForm.value.quantity,
        remarks: quantityForm.value.remarks,
      },
    )

    if (response.success) {
      ElMessage.success('数量を更新しました')
      taskDetailVisible.value = false
      await refreshTasks()
      emit('refresh')
    }
  } catch (error) {
    console.error('数量更新エラー:', error)
    ElMessage.error('数量更新に失敗しました')
  }
}

function showTaskDetail(task: PickingTask) {
  selectedTask.value = task
  taskDetailVisible.value = true
  quantityForm.value.quantity = task.picked_quantity
  quantityForm.value.remarks = ''
}

// 样式辅助函数
function getPalletStatusClass(status: string) {
  return `pallet-${status}`
}

function getPalletTagType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    pending: 'info',
    picking: 'warning',
    completed: 'success',
    shortage: 'danger',
  }
  return typeMap[status] || 'info'
}

function getPalletStatusText(status: string) {
  const textMap: Record<string, string> = {
    pending: '待機',
    picking: '作業中',
    completed: '完了',
    shortage: '欠品',
  }
  return textMap[status] || status
}

function getTaskRowClass({ row }: { row: PickingTask }) {
  return `task-row-${row.status}`
}

function getPriorityType(priority: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  if (priority === 1) return 'danger'
  if (priority === 2) return 'warning'
  return 'info'
}

function getPriorityText(priority: number) {
  const textMap: Record<number, string> = {
    1: '高',
    2: '中',
    3: '低',
  }
  return textMap[priority] || '中'
}

function getStatusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    pending: 'info',
    picking: 'warning',
    completed: 'success',
    shortage: 'danger',
  }
  return typeMap[status] || 'info'
}

function getStatusText(status: string) {
  const textMap: Record<string, string> = {
    pending: '待機中',
    picking: '作業中',
    completed: '完了',
    shortage: '在庫欠品',
  }
  return textMap[status] || status
}

onMounted(() => {
  // 设置当前用户信息
  if (mainStore.userInfo) {
    currentPicker.value = {
      id: mainStore.userInfo.id.toString(),
      name: mainStore.userInfo.name,
    }
  }
  refreshTasks()
})
</script>

<style scoped>
.picking-workspace > * + * {
  margin-top: 20px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.picker-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.picker-details {
  display: flex;
  flex-direction: column;
}

.picker-name {
  font-weight: bold;
  color: #303133;
}

.picker-status {
  font-size: 12px;
  color: #67c23a;
}

.workspace-actions {
  display: flex;
  gap: 10px;
}

.pallet-overview {
  margin-bottom: 20px;
}

.pallet-progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pallet-progress-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pallet-progress-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.pallet-progress-card.pallet-completed {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.pallet-progress-card.pallet-picking {
  border-color: #e6a23c;
  background-color: #fef7e6;
}

.pallet-progress-card.pallet-shortage {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.pallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pallet-no {
  font-weight: bold;
  color: #303133;
}

.pallet-progress-bar {
  margin-bottom: 12px;
}

.pallet-stats {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
}

.shortage-count {
  color: #f56c6c;
  font-weight: bold;
}

.scan-area {
  margin-bottom: 20px;
}

.scan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scan-content {
  padding: 20px 0;
}

.scan-input {
  margin-bottom: 16px;
}

.scan-result {
  margin-top: 16px;
}

.task-list {
  margin-bottom: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-filters {
  display: flex;
  gap: 10px;
}

.task-table-container {
  margin-top: 16px;
}

.quantity-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.picked {
  font-weight: bold;
  color: #67c23a;
}

.separator {
  color: #909399;
}

.required {
  color: #303133;
}

.task-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.task-detail {
  margin-bottom: 20px;
}

.quantity-input {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

:deep(.task-row-pending) {
  background-color: #fafafa;
}

:deep(.task-row-picking) {
  background-color: #fef7e6;
}

:deep(.task-row-completed) {
  background-color: #f0f9ff;
}

:deep(.task-row-shortage) {
  background-color: #fef0f0;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}
</style>
