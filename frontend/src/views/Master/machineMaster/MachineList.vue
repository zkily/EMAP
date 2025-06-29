<template>
  <div class="machine-master-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">
            <el-icon class="title-icon">
              <Tools />
            </el-icon>
            設備マスタ管理
          </h1>
          <p class="subtitle">設備情報の登録・編集・管理を行います</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-number">{{ machines.length }}</div>
            <div class="stat-label">総設備数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ activeMachinesCount }}</div>
            <div class="stat-label">稼働中</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ averageEfficiency }}%</div>
            <div class="stat-label">平均効率</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能操作区域 -->
    <div class="action-section">
      <!-- 筛选标题 -->
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <Filter />
          </el-icon>
          <span>検索・絞り込み</span>
        </div>
        <div class="filter-actions">
          <el-button text @click="clearFilters" :icon="Refresh" class="clear-btn">
            クリア
          </el-button>
          <el-button type="primary" @click="openDialog()" :icon="Plus" class="add-machine-btn">
            設備追加
          </el-button>
        </div>
      </div>

      <!-- 筛选内容 -->
      <div class="filters-grid">
        <!-- 搜索框 -->
        <div class="filter-item search-item">
          <label class="filter-label">
            <el-icon>
              <Search />
            </el-icon>
            キーワード検索
          </label>
          <el-input v-model="filters.searchText" placeholder="設備CD・設備名で検索" clearable @input="handleFilter"
            class="filter-input">
            <template #suffix>
              <el-icon v-if="filters.searchText" class="search-active">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>

        <!-- 设备类型筛选 -->
        <div class="filter-item">
          <label class="filter-label">
            <el-icon>
              <Management />
            </el-icon>
            設備タイプ
          </label>
          <el-select v-model="filters.machineType" placeholder="全てのタイプ" clearable @change="handleFilter"
            class="filter-input">
            <el-option label="切断" value="切断">
              <div class="type-option">
                <el-tag type="primary" size="small">切断</el-tag>
                <span class="type-desc">カッティング</span>
              </div>
            </el-option>
            <el-option label="面取" value="面取">
              <div class="type-option">
                <el-tag type="success" size="small">面取</el-tag>
                <span class="type-desc">エッジング</span>
              </div>
            </el-option>
            <el-option label="SW" value="SW">
              <div class="type-option">
                <el-tag type="warning" size="small">SW</el-tag>
                <span class="type-desc">スイッチング</span>
              </div>
            </el-option>
            <el-option label="成型" value="成型">
              <div class="type-option">
                <el-tag type="info" size="small">成型</el-tag>
                <span class="type-desc">モールディング</span>
              </div>
            </el-option>
            <el-option label="溶接" value="溶接">
              <div class="type-option">
                <el-tag type="danger" size="small">溶接</el-tag>
                <span class="type-desc">ウェルディング</span>
              </div>
            </el-option>
            <el-option label="メッキ" value="メッキ">
              <div class="type-option">
                <el-tag color="#8e44ad" size="small">メッキ</el-tag>
                <span class="type-desc">プレーティング</span>
              </div>
            </el-option>
            <el-option label="検査" value="検査">
              <div class="type-option">
                <el-tag color="#2c3e50" size="small">検査</el-tag>
                <span class="type-desc">インスペクション</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 状态筛选 -->
        <div class="filter-item">
          <label class="filter-label">
            <el-icon>
              <CircleCheck />
            </el-icon>
            稼働状態
          </label>
          <el-select v-model="filters.status" placeholder="全ての状態" clearable @change="handleFilter" class="filter-input">
            <el-option label="稼働中" value="active">
              <div class="status-option">
                <el-tag type="success" size="small">稼働中</el-tag>
                <span class="status-desc">正常稼働</span>
              </div>
            </el-option>
            <el-option label="修理中" value="maintenance">
              <div class="status-option">
                <el-tag type="warning" size="small">修理中</el-tag>
                <span class="status-desc">メンテナンス</span>
              </div>
            </el-option>
            <el-option label="停止中" value="inactive">
              <div class="status-option">
                <el-tag type="info" size="small">停止中</el-tag>
                <span class="status-desc">停止状態</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 效率范围筛选 -->
        <div class="filter-item efficiency-range">
          <label class="filter-label">
            <el-icon>
              <DataAnalysis />
            </el-icon>
            効率範囲
          </label>
          <div class="efficiency-inputs">
            <el-input-number v-model="filters.minEfficiency" placeholder="最小" :min="0" :max="300" @change="handleFilter"
              size="small" controls-position="right" />
            <span class="range-separator">〜</span>
            <el-input-number v-model="filters.maxEfficiency" placeholder="最大" :min="0" :max="300" @change="handleFilter"
              size="small" controls-position="right" />
          </div>
        </div>
      </div>

      <!-- 筛选结果摘要 -->
      <div class="filter-summary" v-if="hasActiveFilters">
        <div class="summary-text">
          <el-icon class="summary-icon">
            <InfoFilled />
          </el-icon>
          <span>{{ filteredMachines.length }}件 / {{ machines.length }}件中を表示</span>
        </div>
        <div class="active-filters">
          <el-tag v-if="filters.searchText" closable @close="filters.searchText = ''; handleFilter()" type="primary"
            size="small">
            検索: {{ filters.searchText }}
          </el-tag>
          <el-tag v-if="filters.machineType" closable @close="filters.machineType = ''; handleFilter()" type="warning"
            size="small">
            タイプ: {{ filters.machineType }}
          </el-tag>
          <el-tag v-if="filters.status" closable @close="filters.status = ''; handleFilter()" type="info" size="small">
            状態: {{ getStatusText(filters.status) }}
          </el-tag>
          <el-tag v-if="filters.minEfficiency !== undefined || filters.maxEfficiency !== undefined" closable
            @close="clearEfficiencyRange" type="success" size="small">
            効率: {{ filters.minEfficiency || 0 }}% 〜 {{ filters.maxEfficiency || 300 }}%
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 设备卡片视图（移动端） -->
    <div class="mobile-view" v-if="isMobile">
      <div class="machines-grid">
        <div v-for="machine in filteredMachines" :key="machine.id" class="machine-card" @click="openDialog(machine)">
          <div class="machine-avatar">
            <el-icon>
              <Tools />
            </el-icon>
          </div>
          <div class="machine-info">
            <h3 class="machine-name">{{ machine.machine_name }}</h3>
            <p class="machine-code">{{ machine.machine_cd }}</p>
            <p class="machine-type">
              <el-icon>
                <Management />
              </el-icon>
              {{ machine.machine_type }}
            </p>
            <p class="machine-time" v-if="machine.available_from && machine.available_to">
              <el-icon>
                <Clock />
              </el-icon>
              {{ machine.available_from }} 〜 {{ machine.available_to }}
            </p>
            <div class="machine-meta">
              <el-tag :type="getStatusTagType(machine.status || '')" size="small">
                {{ getStatusText(machine.status || '') }}
              </el-tag>
              <el-tag color="#8e44ad" size="small" v-if="machine.efficiency">
                効率: {{ machine.efficiency }}%
              </el-tag>
            </div>
          </div>
          <div class="machine-actions">
            <el-dropdown @command="handleCommand">
              <el-button circle size="small" :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`edit-${machine.id}`" :icon="Edit">編集</el-dropdown-item>
                  <el-dropdown-item :command="`delete-${machine.id}`" :icon="Delete" divided>削除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格视图（桌面端） -->
    <div class="desktop-view" v-else>
      <el-card class="table-card">
        <el-table :data="filteredMachines" stripe highlight-current-row v-loading="loading" class="modern-table">
          <el-table-column prop="machine_cd" label="設備CD" width="120" align="center">
            <template #default="{ row }">
              <div class="machine-code-cell">
                <el-icon class="code-icon">
                  <Tickets />
                </el-icon>
                <span>{{ row.machine_cd }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="machine_name" label="設備名" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="machine-name-cell">
                <el-icon class="name-icon">
                  <Tools />
                </el-icon>
                <span>{{ row.machine_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="machine_type" label="タイプ" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getMachineTypeTagType(row.machine_type)" size="small">
                {{ row.machine_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状態" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status || '')" size="small">
                {{ getStatusText(row.status || '') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="稼働時間" width="200" align="center">
            <template #default="{ row }">
              <div v-if="row.available_from && row.available_to" class="time-cell">
                <el-icon class="time-icon">
                  <Clock />
                </el-icon>
                <span>{{ row.available_from }} 〜 {{ row.available_to }}</span>
              </div>
              <span v-else class="no-data">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="efficiency" label="効率" width="100" align="center">
            <template #default="{ row }">
              <div v-if="row.efficiency !== undefined" class="efficiency-cell">
                <el-progress :percentage="Math.min(row.efficiency, 100)" :color="getEfficiencyColor(row.efficiency)"
                  :stroke-width="8" :show-text="false" />
                <span class="efficiency-text">{{ row.efficiency }}%</span>
              </div>
              <span v-else class="no-data">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="140" align="center">
            <template #default="{ row }">
              <div class="action-buttons-table">
                <el-button size="small" type="primary" link @click="openDialog(row)" :icon="Edit">
                  編集
                </el-button>
                <el-button size="small" type="danger" link @click="handleDelete(row.id)" :icon="Delete">
                  削除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 结果统计 -->
    <div class="result-section">
      <div class="result-info">
        表示件数: {{ filteredMachines.length }} / {{ machines.length }}
      </div>
    </div>

    <!-- 设备表单弹窗 -->
    <MachineEditDialog v-model="dialogVisible" :machine="selectedMachine" @saved="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Tools,
  Filter,
  Refresh,
  Plus,
  Search,
  Management,
  CircleCheck,
  DataAnalysis,
  InfoFilled,
  Edit,
  Delete,
  MoreFilled,
  Clock,
  Tickets
} from '@element-plus/icons-vue'
import { fetchMachines, deleteMachine } from '@/api/master/machineMaster'
import MachineEditDialog from './MachineEditDialog.vue'
import { Machine } from '@/types/master'

// 响应式检测
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// 数据状态
const machines = ref<Machine[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const selectedMachine = ref<Machine | null>(null)

// 筛选状态
const filters = ref({
  searchText: '',
  machineType: '',
  status: '',
  minEfficiency: undefined as number | undefined,
  maxEfficiency: undefined as number | undefined
})

// 计算属性
const activeMachinesCount = computed(() =>
  machines.value.filter(machine => machine.status === 'active').length
)

const averageEfficiency = computed(() => {
  const validMachines = machines.value.filter(machine => machine.efficiency !== undefined)
  if (validMachines.length === 0) return 0
  const total = validMachines.reduce((sum, machine) => sum + (machine.efficiency || 0), 0)
  return Math.round(total / validMachines.length)
})

const hasActiveFilters = computed(() => {
  return filters.value.searchText ||
    filters.value.machineType ||
    filters.value.status ||
    filters.value.minEfficiency !== undefined ||
    filters.value.maxEfficiency !== undefined
})

// 筛选后的设备列表
const filteredMachines = computed(() => {
  let result = machines.value

  // 按搜索文本筛选（设备CD或设备名）
  if (filters.value.searchText) {
    const searchText = filters.value.searchText.toLowerCase()
    result = result.filter(machine =>
      machine.machine_cd?.toLowerCase().includes(searchText) ||
      machine.machine_name?.toLowerCase().includes(searchText)
    )
  }

  // 按设备类型筛选
  if (filters.value.machineType) {
    result = result.filter(machine => machine.machine_type === filters.value.machineType)
  }

  // 按状态筛选
  if (filters.value.status) {
    result = result.filter(machine => machine.status === filters.value.status)
  }

  // 按效率范围筛选
  if (filters.value.minEfficiency !== undefined) {
    result = result.filter(machine =>
      machine.efficiency !== undefined && machine.efficiency >= filters.value.minEfficiency!
    )
  }

  if (filters.value.maxEfficiency !== undefined) {
    result = result.filter(machine =>
      machine.efficiency !== undefined && machine.efficiency <= filters.value.maxEfficiency!
    )
  }

  return result
})

// 辅助函数
const getMachineTypeTagType = (type: string) => {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    切断: 'primary',
    面取: 'success',
    SW: 'warning',
    成型: 'info',
    溶接: 'danger',
    メッキ: 'warning',
    検査: 'info'
  }
  return typeMap[type] || 'info'
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'inactive':
      return 'info'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return '稼働中'
    case 'maintenance':
      return '修理中'
    case 'inactive':
      return '停止中'
    default:
      return status
  }
}

const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 90) return '#67c23a'
  if (efficiency >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 事件处理
const handleFilter = () => {
  // 筛选逻辑已通过computed属性实现
}

const clearFilters = () => {
  filters.value = {
    searchText: '',
    machineType: '',
    status: '',
    minEfficiency: undefined,
    maxEfficiency: undefined
  }
}

const clearEfficiencyRange = () => {
  filters.value.minEfficiency = undefined
  filters.value.maxEfficiency = undefined
  handleFilter()
}

const handleCommand = (command: string) => {
  const [action, machineId] = command.split('-')
  const machine = machines.value.find(m => m.id === parseInt(machineId))

  if (!machine) return

  if (action === 'edit') {
    openDialog(machine)
  } else if (action === 'delete') {
    handleDelete(machine.id)
  }
}

// 数据操作
const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchMachines()
    machines.value = data.list
  } catch {
    ElMessage.error('設備データの読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

const openDialog = (machine?: Machine) => {
  selectedMachine.value = machine ? { ...machine } : null
  dialogVisible.value = true
}

const handleDelete = async (id: number | undefined) => {
  if (!id) {
    ElMessage.error('設備IDが無効です')
    return
  }

  try {
    await ElMessageBox.confirm('この設備を削除しますか？', '確認', {
      type: 'warning',
      confirmButtonText: 'はい',
      cancelButtonText: 'キャンセル'
    })

    await deleteMachine(id)
    ElMessage.success('削除しました')
    loadData()
  } catch {
    // ユーザーがキャンセルした場合は何もしない
  }
}

// 页面初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.machine-master-container {
  padding: 20px;
  background: linear-gradient(135deg, #f3e7f8 0%, #d1c4e9 100%);
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.main-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.8rem;
  color: #8e44ad;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 4px;
}

/* 操作区域 */
.action-section {
  background: white;
  border-radius: 20px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* 筛选标题区 */
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.filter-icon {
  font-size: 1.3rem;
  color: #8e44ad;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.clear-btn {
  color: #718096;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  color: #8e44ad;
  transform: scale(1.05);
}

.add-machine-btn {
  background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
  transition: all 0.3s ease;
}

.add-machine-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(142, 68, 173, 0.4);
}

/* 筛选网格 */
.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 24px;
  padding: 32px;
  background: white;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-item {
  grid-column: span 1;
}

.efficiency-range {
  grid-column: span 1;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 4px;
}

.filter-label .el-icon {
  font-size: 1rem;
  color: #8e44ad;
}

.filter-input {
  transition: all 0.3s ease;
}

.filter-input:hover {
  transform: translateY(-1px);
}

.efficiency-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: #8e44ad;
  font-weight: 600;
}

.search-active {
  color: #8e44ad;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 选项样式 */
.type-option,
.status-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.type-desc,
.status-desc {
  font-size: 0.8rem;
  color: #718096;
  margin-left: 8px;
}

/* 筛选摘要 */
.filter-summary {
  padding: 20px 32px;
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  border-top: 1px solid #e2e8f0;
}

.summary-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.summary-icon {
  color: #8e44ad;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.active-filters .el-tag {
  cursor: pointer;
  transition: all 0.3s ease;
}

.active-filters .el-tag:hover {
  transform: scale(1.05);
}

/* 移动端卡片视图 */
.mobile-view {
  margin-bottom: 24px;
}

.machines-grid {
  display: grid;
  gap: 16px;
}

.machine-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.machine-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.machine-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.machine-info {
  flex: 1;
}

.machine-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #2c3e50;
}

.machine-code {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 8px;
  font-family: monospace;
}

.machine-type,
.machine-time {
  font-size: 0.9rem;
  color: #95a5a6;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.machine-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.machine-actions {
  flex-shrink: 0;
}

/* 桌面端表格视图 */
.desktop-view {
  margin-bottom: 24px;
}

.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.modern-table {
  border-radius: 12px;
  overflow: hidden;
}

.machine-code-cell,
.machine-name-cell,
.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-icon,
.name-icon,
.time-icon {
  color: #8e44ad;
  font-size: 1rem;
  flex-shrink: 0;
}

.efficiency-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.efficiency-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.no-data {
  color: #bdc3c7;
  font-style: italic;
}

.action-buttons-table {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 结果区域 */
.result-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.result-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-stats {
    align-self: stretch;
    justify-content: space-around;
  }

  .filters-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .search-item {
    grid-column: span 2;
  }

  .efficiency-range {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .machine-master-container {
    padding: 16px;
  }

  .page-header {
    padding: 24px 20px;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .filter-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px 24px;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions>* {
    flex: 1;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 24px 20px;
  }

  .search-item,
  .efficiency-range {
    grid-column: span 1;
  }

  .filter-summary {
    padding: 16px 20px;
  }

  .stat-card {
    min-width: auto;
    flex: 1;
  }

  .efficiency-inputs {
    flex-direction: column;
    gap: 8px;
  }

  .range-separator {
    display: none;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.4rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .machine-card {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .machine-actions {
    align-self: flex-end;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .machine-master-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

  .page-header,
  .action-section,
  .table-card,
  .result-section,
  .machine-card {
    background: rgba(45, 55, 72, 0.8);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .main-title {
    color: #e2e8f0;
  }

  .subtitle,
  .result-info {
    color: #a0aec0;
  }
}

/* 动画效果 */
.machine-card,
.table-card,
.page-header,
.action-section,
.result-section {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-table th) {
  background-color: #f8fafc;
  color: #2d3748;
  font-weight: 600;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #f7fafc;
}

:deep(.el-tag) {
  border-radius: 12px;
  font-weight: 500;
}

:deep(.el-progress-bar__outer) {
  border-radius: 6px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 6px;
}
</style>
