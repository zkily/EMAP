<template>
  <el-dialog
    v-model="visible"
    title="納入先グループ選択"
    width="1200px"
    class="destination-drag-dialog"
    :before-close="handleClose"
  >
    <div class="destination-drag-container">
      <!-- 上方搜索区域 -->
      <div class="search-section">
        <div class="search-header">
          <h3 class="section-title">
            <el-icon><Van /></el-icon>
            納入先一覧
          </h3>
          <div class="search-controls">
            <el-input
              v-model="searchKeyword"
              placeholder="納入先を検索..."
              clearable
              class="search-input"
              size="small"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-radio-group v-model="sortOrder" size="small">
              <el-radio-button label="code">コード順</el-radio-button>
              <el-radio-button label="name">名称順</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 納入先按钮区域 -->
        <div class="destinations-grid" v-loading="loading">
          <div v-if="allDestinations.length === 0 && !loading" class="no-data-message">
            <el-icon class="no-data-icon"><Box /></el-icon>
            <p>納入先データがありません</p>
          </div>
          <div
            v-for="destination in filteredDestinations"
            :key="destination.value"
            :data-destination="JSON.stringify(destination)"
            draggable="true"
            @dragstart="handleDragStart"
            class="destination-item"
            :class="{ 'in-pool': isDestinationInPool(destination.value) }"
          >
            <div class="destination-code">{{ destination.value }}</div>
            <div class="destination-name">
              {{ destination.label.split(' - ')[1] || destination.label }}
            </div>
            <div class="drag-handle">
              <el-icon><Rank /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <el-divider>
        <span class="divider-text">
          <el-icon><ArrowDown /></el-icon>
          ドラッグしてグループに追加
        </span>
      </el-divider>

      <!-- 下方4个池子区域 -->
      <div class="pools-section">
        <div class="pools-header">
          <h3 class="section-title">
            <el-icon><Collection /></el-icon>
            納入先グループ
          </h3>
          <div class="pools-actions">
            <el-button @click="clearAllPools" size="small" type="warning">
              <el-icon><Delete /></el-icon>
              全てクリア
            </el-button>
            <el-button @click="saveGroups" size="small" type="success">
              <el-icon><Check /></el-icon>
              保存
            </el-button>
          </div>
        </div>

        <div class="pools-grid">
          <div
            v-for="(pool, index) in pools"
            :key="index"
            class="pool-container"
            @drop="handleDrop($event, index)"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
          >
            <div class="pool-header">
              <div class="pool-title">
                <el-input
                  v-model="pool.name"
                  placeholder="グループ名"
                  size="small"
                  class="pool-name-input"
                />
                <div class="pool-count">{{ pool.destinations.length }}件</div>
              </div>
              <el-button
                @click="clearPool(index)"
                size="small"
                type="danger"
                text
                class="clear-pool-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <div class="pool-content" :class="{ 'drag-over': pool.dragOver }">
              <div v-if="pool.destinations.length === 0" class="pool-empty">
                <el-icon class="empty-icon"><Box /></el-icon>
                <p>ここにドラッグ</p>
              </div>
              <div
                v-for="destination in pool.destinations"
                :key="destination.value"
                class="pool-item"
              >
                <div class="pool-item-content">
                  <div class="pool-item-code">{{ destination.value }}</div>
                  <div class="pool-item-name">
                    {{ destination.label.split(' - ')[1] || destination.label }}
                  </div>
                </div>
                <el-button
                  @click="removeFromPool(index, destination.value)"
                  size="small"
                  type="danger"
                  text
                  class="remove-btn"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span class="info-text">
            合計: {{ totalSelectedCount }}件の納入先が選択されています
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose" size="default"> キャンセル </el-button>
          <el-button @click="resetToDefault" size="default">
            <el-icon><Refresh /></el-icon>
            リセット
          </el-button>
          <el-button type="primary" @click="confirmSelection" size="default" class="confirm-button">
            <el-icon><Check /></el-icon>
            確定 ({{ totalSelectedCount }})
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Van,
  Search,
  ArrowDown,
  Collection,
  Delete,
  Check,
  Close,
  Box,
  Refresh,
  Rank,
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 定义接口
interface DestinationOption {
  value: string
  label: string
}

interface Pool {
  name: string
  destinations: DestinationOption[]
  dragOver: boolean
}

// Props和Emits
const props = defineProps<{
  modelValue: boolean
  selectedDestinations?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [groups: Pool[], allSelected: string[]]
}>()

// 响应式数据
const visible = ref(props.modelValue)
const loading = ref(false)
const searchKeyword = ref('')
const sortOrder = ref<'code' | 'name'>('code')

// 納入先数据
const allDestinations = ref<DestinationOption[]>([])

// 4个池子
const pools = ref<Pool[]>([
  { name: 'グループ1', destinations: [], dragOver: false },
  { name: 'グループ2', destinations: [], dragOver: false },
  { name: 'グループ3', destinations: [], dragOver: false },
  { name: 'グループ4', destinations: [], dragOver: false },
])

// 计算属性
const filteredDestinations = computed(() => {
  if (!allDestinations.value || allDestinations.value.length === 0) {
    return []
  }

  let destinations = [...allDestinations.value]

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    destinations = destinations.filter(
      (dest) =>
        dest.value.toLowerCase().includes(keyword) || dest.label.toLowerCase().includes(keyword),
    )
  }

  // 排序
  if (sortOrder.value === 'name') {
    destinations.sort((a, b) => {
      const nameA = a.label.split(' - ')[1] || a.label
      const nameB = b.label.split(' - ')[1] || b.label
      return nameA.localeCompare(nameB, 'ja')
    })
  } else {
    destinations.sort((a, b) => a.value.localeCompare(b.value))
  }

  return destinations
})

// 计算总选中数量
const totalSelectedCount = computed(() => {
  return pools.value.reduce((total, pool) => total + pool.destinations.length, 0)
})

// 检查納入先是否已在池子中
const isDestinationInPool = (destinationValue: string) => {
  return pools.value.some((pool) =>
    pool.destinations.some((dest) => dest.value === destinationValue),
  )
}

// 监听props变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    // 当对话框打开时，获取数据
    if (newVal && allDestinations.value.length === 0) {
      fetchDestinations()
    }
  },
  { immediate: true },
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 拖拽处理
const handleDragStart = (event: DragEvent) => {
  const destinationData = (event.target as HTMLElement).dataset.destination
  if (destinationData) {
    event.dataTransfer?.setData('text/plain', destinationData)
    event.dataTransfer!.effectAllowed = 'move'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  const poolIndex = getPoolIndexFromEvent(event)
  if (poolIndex !== -1) {
    pools.value[poolIndex].dragOver = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  const poolIndex = getPoolIndexFromEvent(event)
  if (poolIndex !== -1) {
    pools.value[poolIndex].dragOver = false
  }
}

const handleDrop = (event: DragEvent, poolIndex: number) => {
  event.preventDefault()
  pools.value[poolIndex].dragOver = false

  const destinationData = event.dataTransfer?.getData('text/plain')
  if (destinationData) {
    try {
      const destination: DestinationOption = JSON.parse(destinationData)

      // 检查是否已在其他池子中
      if (isDestinationInPool(destination.value)) {
        ElMessage.warning(`${destination.value} は既に他のグループに追加されています`)
        return
      }

      // 添加到池子
      pools.value[poolIndex].destinations.push(destination)
      ElMessage.success(`${destination.value} を ${pools.value[poolIndex].name} に追加しました`)
    } catch (error) {
      console.error('拖拽数据解析失败:', error)
      ElMessage.error('拖拽操作に失敗しました')
    }
  }
}

// 获取池子索引
const getPoolIndexFromEvent = (event: DragEvent): number => {
  const target = event.currentTarget as HTMLElement
  const poolContainer = target.closest('.pool-container')
  if (poolContainer) {
    const poolsGrid = poolContainer.parentElement
    if (poolsGrid) {
      return Array.from(poolsGrid.children).indexOf(poolContainer)
    }
  }
  return -1
}

// 从池子中移除
const removeFromPool = (poolIndex: number, destinationValue: string) => {
  const pool = pools.value[poolIndex]
  const index = pool.destinations.findIndex((dest) => dest.value === destinationValue)
  if (index !== -1) {
    pool.destinations.splice(index, 1)
    ElMessage.success(`${destinationValue} を ${pool.name} から削除しました`)
  }
}

// 清空单个池子
const clearPool = (poolIndex: number) => {
  const pool = pools.value[poolIndex]
  if (pool.destinations.length === 0) return

  ElMessageBox.confirm(`${pool.name} の全ての納入先を削除しますか？`, '確認', {
    confirmButtonText: '削除',
    cancelButtonText: 'キャンセル',
    type: 'warning',
  })
    .then(() => {
      pool.destinations = []
      ElMessage.success(`${pool.name} をクリアしました`)
    })
    .catch(() => {
      // 用户取消
    })
}

// 清空所有池子
const clearAllPools = () => {
  if (totalSelectedCount.value === 0) return

  ElMessageBox.confirm('全てのグループをクリアしますか？', '確認', {
    confirmButtonText: 'クリア',
    cancelButtonText: 'キャンセル',
    type: 'warning',
  })
    .then(() => {
      pools.value.forEach((pool) => {
        pool.destinations = []
      })
      ElMessage.success('全てのグループをクリアしました')
    })
    .catch(() => {
      // 用户取消
    })
}

// 保存分组
const saveGroups = () => {
  try {
    const groupsData = pools.value.map((pool) => ({
      name: pool.name,
      destinations: pool.destinations,
    }))
    localStorage.setItem('destination_groups', JSON.stringify(groupsData))
    ElMessage.success('グループを保存しました')
  } catch (error) {
    console.error('保存分组失败:', error)
    ElMessage.error('グループの保存に失敗しました')
  }
}

// 加载已保存的分组
const loadSavedGroups = () => {
  try {
    const savedGroups = localStorage.getItem('destination_groups')
    if (savedGroups) {
      const groups = JSON.parse(savedGroups)
      groups.forEach((group: any, index: number) => {
        if (index < pools.value.length) {
          pools.value[index].name = group.name || `グループ${index + 1}`
          pools.value[index].destinations = group.destinations || []
        }
      })
    }
  } catch (error) {
    console.error('加载已保存分组失败:', error)
  }
}

// 重置到默认状态
const resetToDefault = () => {
  ElMessageBox.confirm('全ての設定をリセットしますか？', '確認', {
    confirmButtonText: 'リセット',
    cancelButtonText: 'キャンセル',
    type: 'warning',
  })
    .then(() => {
      pools.value = [
        { name: 'グループ1', destinations: [], dragOver: false },
        { name: 'グループ2', destinations: [], dragOver: false },
        { name: 'グループ3', destinations: [], dragOver: false },
        { name: 'グループ4', destinations: [], dragOver: false },
      ]
      searchKeyword.value = ''
      sortOrder.value = 'code'
      ElMessage.success('設定をリセットしました')
    })
    .catch(() => {
      // 用户取消
    })
}

// 确认选择
const confirmSelection = () => {
  const allSelected = pools.value.reduce((acc: string[], pool) => {
    return acc.concat(pool.destinations.map((dest) => dest.value))
  }, [])

  emit('confirm', pools.value, allSelected)
  visible.value = false
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 获取納入先数据
const fetchDestinations = async () => {
  try {
    loading.value = true
    const response = await request.get('/api/master/options/destination-options')

    // 处理两种可能的响应格式
    let dataArray: any[] = []

    if (Array.isArray(response)) {
      // 直接返回数组的情况
      dataArray = response
    } else if (response && response.success === true && Array.isArray(response.data)) {
      // 返回对象包含data字段的情况
      dataArray = response.data
    } else if (response && Array.isArray(response.data)) {
      // 返回对象包含data字段但没有success字段的情况
      dataArray = response.data
    } else {
      console.error('納入先データ格式不正确:', response)
      ElMessage.error('納入先データの取得に失敗しました')
      return
    }

    const processedData = dataArray.map((item: any) => ({
      value: item.cd,
      label: `${item.cd} - ${item.name}`,
    }))

    allDestinations.value = processedData

    if (processedData.length > 0) {
      ElMessage.success(`成功获取 ${processedData.length} 件納入先数据`)
    }
  } catch (error) {
    console.error('获取納入先失败:', error)
    ElMessage.error('納入先データの取得に失敗しました')
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  fetchDestinations()
  loadSavedGroups()
})
</script>

<style scoped>
.destination-drag-dialog {
  border-radius: 16px;
}

.destination-drag-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  max-height: 90vh;
  overflow: hidden;
}

.destination-drag-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 24px;
  margin: 0;
}

.destination-drag-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.destination-drag-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.destination-drag-container {
  padding: 24px;
}

/* 搜索区域样式 */
.search-section {
  margin-bottom: 24px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.search-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 250px;
}

/* 納入先按钮网格 */
.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  border: 2px dashed #e1e8ed;
  border-radius: 8px;
  background: #fafbfc;
}

.no-data-message {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.no-data-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.destination-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid #e1e8ed;
  background: white;
  cursor: grab;
  transition: all 0.3s ease;
  position: relative;
  min-height: 60px;
}

.destination-item:hover {
  border-color: #3498db;
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.destination-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.destination-item.in-pool {
  opacity: 0.5;
  border-color: #95a5a6;
  background: #ecf0f1;
  cursor: not-allowed;
}

.destination-item.in-pool:hover {
  transform: none;
  box-shadow: none;
}

.destination-code {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.destination-name {
  font-size: 11px;
  color: #7f8c8d;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
}

.drag-handle {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #bdc3c7;
  font-size: 12px;
}

/* 分割线样式 */
.divider-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3498db;
  font-weight: 600;
}

/* 池子区域样式 */
.pools-section {
  margin-top: 24px;
}

.pools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pools-actions {
  display: flex;
  gap: 8px;
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.pool-container {
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.pool-container:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.pool-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.pool-name-input {
  max-width: 120px;
}

.pool-count {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.clear-pool-btn {
  padding: 4px !important;
  width: 24px !important;
  height: 24px !important;
}

.pool-content {
  flex: 1;
  padding: 12px;
  min-height: 150px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-content.drag-over {
  background: rgba(52, 152, 219, 0.1);
  border: 2px dashed #3498db;
  border-radius: 8px;
}

.pool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bdc3c7;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.pool-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, #e8f4fd, #d1ecf1);
  border-radius: 6px;
  border: 1px solid #3498db;
  transition: all 0.3s ease;
}

.pool-item:hover {
  background: linear-gradient(135deg, #d1ecf1, #b3d9e8);
  transform: translateX(4px);
}

.pool-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pool-item-code {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.pool-item-name {
  font-size: 10px;
  color: #7f8c8d;
}

.remove-btn {
  padding: 2px !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
}

/* 对话框底部样式 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-top: 1px solid #e1e8ed;
  background: #f8f9fa;
}

.footer-info {
  flex: 1;
}

.info-text {
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.confirm-button {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .destination-drag-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 2.5vh auto !important;
  }

  .pools-grid {
    grid-template-columns: 1fr;
  }

  .destinations-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    max-height: 250px;
  }
}

@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-controls {
    justify-content: space-between;
  }

  .search-input {
    width: 200px;
  }

  .destinations-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    max-height: 200px;
  }

  .pools-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .footer-actions {
    justify-content: center;
  }
}

/* 滚动条样式 */
.destinations-grid::-webkit-scrollbar,
.pool-content::-webkit-scrollbar {
  width: 6px;
}

.destinations-grid::-webkit-scrollbar-track,
.pool-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.destinations-grid::-webkit-scrollbar-thumb,
.pool-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.destinations-grid::-webkit-scrollbar-thumb:hover,
.pool-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
