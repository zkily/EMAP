<template>
  <el-dialog
    v-model="visible"
    title="納入先グループ管理"
    width="90%"
    :close-on-click-modal="false"
    class="destination-group-dialog"
    @close="handleClose"
  >
    <div class="group-manager">
      <!-- 顶部纳入先标签区域 -->
      <div class="destinations-section">
        <h3 class="section-title">
          <el-icon><Collection /></el-icon>
          利用可能な納入先
        </h3>
        <div class="destinations-container">
          <div
            v-for="destination in availableDestinations"
            :key="destination.value"
            :data-destination="JSON.stringify(destination)"
            class="destination-tag"
            draggable="true"
            @dragstart="handleDragStart"
          >
            <el-tag size="default" type="info" class="draggable-tag">
              {{ destination.label }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 分组池子区域 -->
      <div class="pools-section">
        <el-row :gutter="20">
          <el-col :span="8" v-for="(pool, index) in pools" :key="index">
            <div
              :class="['pool-container', `pool-${index + 1}`]"
              @drop="handleDrop($event, index)"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
            >
              <div class="pool-header">
                <h4>
                  <el-icon><Box /></el-icon>
                  グループ {{ index + 1 }}
                  <el-badge :value="pool.destinations.length" type="primary" />
                </h4>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="clearPool(index)"
                  :disabled="pool.destinations.length === 0"
                >
                  クリア
                </el-button>
              </div>
              <div class="pool-content">
                <div
                  v-for="destination in pool.destinations"
                  :key="destination.value"
                  class="pool-item"
                >
                  <el-tag
                    :type="getPoolTagType(index)"
                    closable
                    @close="removeFromPool(index, destination)"
                  >
                    {{ destination.label }}
                  </el-tag>
                </div>
                <div v-if="pool.destinations.length === 0" class="empty-pool">
                  <el-icon><Plus /></el-icon>
                  <span>ここに納入先をドラッグ</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <el-button @click="resetToDefault">
          <el-icon><Refresh /></el-icon>
          デフォルトに戻す
        </el-button>
        <el-button type="primary" @click="saveGroups">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">キャンセル</el-button>
        <el-button type="primary" @click="saveAndClose">
          <el-icon><Check /></el-icon>
          保存して閉じる
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Collection, Box, Plus, Refresh, Check } from '@element-plus/icons-vue'
import request from '@/utils/request'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'groupsUpdated'])

// 响应式数据
const visible = ref(props.modelValue)
const loading = ref(false)
const allDestinations = ref([])

// 3个池子的数据
const pools = reactive([{ destinations: [] }, { destinations: [] }, { destinations: [] }])

// 计算可用的纳入先（未分组的）
const availableDestinations = computed(() => {
  const assignedValues = new Set()
  pools.forEach((pool) => {
    pool.destinations.forEach((dest) => {
      assignedValues.add(dest.value)
    })
  })

  return allDestinations.value.filter((dest) => !assignedValues.has(dest.value))
})

// 监听props变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      loadDestinations()
      loadSavedGroups()
    }
  },
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 生命周期
onMounted(() => {
  loadDestinations()
  loadSavedGroups()
})

// 方法
async function loadDestinations() {
  try {
    loading.value = true
    const response = await request.get('/api/master/options/destination-options')

    // 处理不同的响应格式
    let data = null
    if (response && response.success === true && Array.isArray(response.data)) {
      // 格式1: { success: true, data: [...] }
      data = response.data
    } else if (Array.isArray(response)) {
      // 格式2: 直接返回数组
      data = response
    } else if (response && Array.isArray(response.data)) {
      // 格式3: { data: [...] }
      data = response.data
    }

    if (data && Array.isArray(data)) {
      allDestinations.value = data.map((item) => ({
        value: item.cd,
        label: `${item.cd} - ${item.name}`,
      }))
    } else {
      console.error('納入先データ格式不正确:', response)
      ElMessage.error('納入先データの取得に失敗しました')
    }
  } catch (error) {
    console.error('获取纳入先失败:', error)
    ElMessage.error('納入先データの取得に失敗しました')
  } finally {
    loading.value = false
  }
}

// 加载已保存的分组
function loadSavedGroups() {
  try {
    const savedGroups = localStorage.getItem('destination_groups')
    if (savedGroups) {
      const groups = JSON.parse(savedGroups)
      groups.forEach((group, index) => {
        if (index < pools.length) {
          pools[index].destinations = group.destinations || []
        }
      })
    }
  } catch (error) {
    console.error('加载已保存分组失败:', error)
  }
}

// 保存分组到本地存储
function saveGroups() {
  try {
    const groupsData = pools.map((pool) => ({
      destinations: pool.destinations,
    }))
    localStorage.setItem('destination_groups', JSON.stringify(groupsData))
    ElMessage.success('グループが保存されました')

    // 通知父组件分组已更新
    emit('groupsUpdated', groupsData)
  } catch (error) {
    console.error('保存分组失败:', error)
    ElMessage.error('グループの保存に失敗しました')
  }
}

// 拖拽开始
function handleDragStart(event) {
  const destinationData = event.target.dataset.destination
  event.dataTransfer.setData('text/plain', destinationData)
  event.dataTransfer.effectAllowed = 'move'
}

// 拖拽悬停
function handleDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

// 拖拽进入
function handleDragEnter(event) {
  event.preventDefault()
  event.currentTarget.classList.add('drag-over')
}

// 拖拽离开
function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

// 拖拽放下
function handleDrop(event, poolIndex) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const destinationData = event.dataTransfer.getData('text/plain')
    const destination = JSON.parse(destinationData)

    // 检查是否已经在该池子中
    const isAlreadyInPool = pools[poolIndex].destinations.some(
      (dest) => dest.value === destination.value,
    )

    if (!isAlreadyInPool) {
      // 从其他池子中移除（如果存在）
      pools.forEach((pool) => {
        pool.destinations = pool.destinations.filter((dest) => dest.value !== destination.value)
      })

      // 添加到目标池子
      pools[poolIndex].destinations.push(destination)
    }
  } catch (error) {
    console.error('拖拽处理失败:', error)
  }
}

// 从池子中移除纳入先
function removeFromPool(poolIndex, destination) {
  pools[poolIndex].destinations = pools[poolIndex].destinations.filter(
    (dest) => dest.value !== destination.value,
  )
}

// 清空池子
function clearPool(poolIndex) {
  pools[poolIndex].destinations = []
}

// 重置为默认
function resetToDefault() {
  pools.forEach((pool) => {
    pool.destinations = []
  })
  ElMessage.success('デフォルトに戻しました')
}

// 获取池子标签类型
function getPoolTagType(poolIndex) {
  const types = ['success', 'warning', 'danger']
  return types[poolIndex] || 'info'
}

// 关闭弹窗
function handleClose() {
  visible.value = false
}

// 保存并关闭
function saveAndClose() {
  saveGroups()
  handleClose()
}

// 暴露方法给父组件
defineExpose({
  getGroups: () => pools.map((pool) => ({ destinations: pool.destinations })),
})
</script>

<style scoped>
.destination-group-dialog {
  --el-dialog-content-font-size: 14px;
}

.group-manager {
  min-height: 600px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

/* 纳入先标签区域 */
.destinations-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #e4e7ed;
}

.destinations-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 80px;
}

.destination-tag {
  cursor: move;
  user-select: none;
}

.destination-tag:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

.draggable-tag {
  cursor: move;
}

/* 池子区域 */
.pools-section {
  margin-bottom: 30px;
}

.pool-container {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  min-height: 300px;
  transition: all 0.3s ease;
}

.pool-container.drag-over {
  border-color: #409eff;
  background: #f0f9ff;
  transform: scale(1.02);
}

.pool-1 {
  border-left: 4px solid #67c23a;
}

.pool-2 {
  border-left: 4px solid #e6a23c;
}

.pool-3 {
  border-left: 4px solid #f56c6c;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 6px 6px 0 0;
}

.pool-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.pool-content {
  padding: 16px;
  min-height: 240px;
}

.pool-item {
  margin-bottom: 8px;
}

.empty-pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}

.empty-pool .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
  border-top: 1px solid #e4e7ed;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .destinations-container {
    justify-content: center;
  }

  .pool-container {
    margin-bottom: 16px;
  }
}
</style>
