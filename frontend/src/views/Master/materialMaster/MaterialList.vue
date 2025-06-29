<!-- MaterialList.vue -->
<template>
  <div class="material-master-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">
            <el-icon class="title-icon">
              <Box />
            </el-icon>
            材料マスタ管理
          </h1>
          <p class="subtitle">材料の登録・編集・仕入先管理を行います</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-number">{{ materialList.length }}</div>
            <div class="stat-label">総材料数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ activeCount }}</div>
            <div class="stat-label">有効材料</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能操作区 -->
    <div class="action-section">
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <Filter />
          </el-icon>
          <span>検索・絞り込み</span>
        </div>
        <div class="filter-actions">
          <el-button text @click="clearFilters" :icon="Refresh" class="clear-btn">クリア</el-button>
          <el-button type="primary" @click="openForm()" :icon="Plus" class="add-material-btn">材料追加</el-button>
        </div>
      </div>

      <!-- 筛选区 -->
      <div class="filters-grid">
        <!-- 搜索 -->
        <div class="filter-item search-item">
          <label class="filter-label">
            <el-icon>
              <Search />
            </el-icon>
            キーワード検索
          </label>
          <el-input v-model="filters.keyword" placeholder="材料CD・材料名・仕入先" clearable @input="handleFilter"
            class="filter-input">
            <template #suffix>
              <el-icon v-if="filters.keyword" class="search-active">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
        <!-- 状态 -->
        <div class="filter-item">
          <label class="filter-label"><el-icon>
              <CircleCheck />
            </el-icon>状態</label>
          <el-select v-model="filters.status" placeholder="全て" clearable @change="handleFilter" class="filter-input">
            <el-option label="有効" :value="1">
              <el-tag type="success" size="small">有効</el-tag>
              <span class="status-desc">利用可能</span>
            </el-option>
            <el-option label="無効" :value="0">
              <el-tag type="info" size="small">無効</el-tag>
              <span class="status-desc">利用停止</span>
            </el-option>
          </el-select>
        </div>
        <!-- 材料种类 -->
        <div class="filter-item">
          <label class="filter-label"><el-icon>
              <Management />
            </el-icon>材料種類</label>
          <el-select v-model="filters.material_type" placeholder="全て" clearable @change="handleFilter"
            class="filter-input">
            <el-option label="鋼材" value="鋼材" />
            <el-option label="樹脂" value="樹脂" />
            <el-option label="アルミ" value="アルミ" />
            <el-option label="その他" value="その他" />
          </el-select>
        </div>
        <!-- 支给区分 -->
        <div class="filter-item">
          <label class="filter-label"><el-icon>
              <Tickets />
            </el-icon>支給区分</label>
          <el-select v-model="filters.supply_classification" placeholder="全て" clearable @change="handleFilter"
            class="filter-input">
            <el-option label="自社支給" value="自社支給" />
            <el-option label="先方支給" value="先方支給" />
          </el-select>
        </div>
      </div>

      <!-- 筛选结果摘要 -->
      <div class="filter-summary" v-if="hasActiveFilters">
        <div class="summary-text">
          <el-icon class="summary-icon">
            <InfoFilled />
          </el-icon>
          <span>{{ filteredList.length }}件 / {{ materialList.length }}件中を表示</span>
        </div>
        <div class="active-filters">
          <el-tag v-if="filters.keyword" closable @close="filters.keyword = ''; handleFilter()" type="primary"
            size="small">検索:
            {{ filters.keyword }}</el-tag>
          <el-tag v-if="filters.status !== ''" closable @close="filters.status = ''; handleFilter()" type="info"
            size="small">状態:
            {{ filters.status == 1 ? '有効' : '無効' }}</el-tag>
          <el-tag v-if="filters.material_type" closable @close="filters.material_type = ''; handleFilter()"
            type="success" size="small">種類: {{ filters.material_type }}</el-tag>
          <el-tag v-if="filters.supply_classification" closable
            @close="filters.supply_classification = ''; handleFilter()" type="warning" size="small">支給: {{
              filters.supply_classification }}</el-tag>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card">
      <el-table :data="filteredList" stripe highlight-current-row v-loading="loading" class="modern-table">
        <el-table-column prop="material_cd" label="材料CD" width="110" align="center">
          <template #default="{ row }">
            <span class="material-cd">{{ row.material_cd }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="material_name" label="材料名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="supplier_name" label="仕入先名" min-width="140" show-overflow-tooltip />
        <el-table-column prop="standard_spec" label="規格" width="100" show-overflow-tooltip />
        <el-table-column prop="pieces_per_bundle" label="束本数" width="80" align="center" />
        <el-table-column prop="unit" label="単位" width="60" align="center" />
        <el-table-column prop="supply_classification" label="支給区分" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.supply_classification === '自社支給' ? 'success' : 'warning'" size="small">{{
              row.supply_classification }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="material_type" label="材料種類" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.material_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状態" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)"
              :loading="row.statusLoading" inline-prompt active-text="有効" inactive-text="無効" />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="140" align="center">
          <template #default="{ row }">
            <div class="action-buttons-table">
              <el-button size="small" type="primary" link @click="openForm(row)">編集</el-button>
              <el-button size="small" type="danger" link @click="deleteMaterial(row.id)">削除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="result-section">
      <div class="result-info">
        表示件数: {{ filteredList.length }} / {{ materialList.length }}
      </div>
    </div>

    <MaterialEditDialog v-model:visible="formVisible" :data-id="editId" @refresh="fetchList" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box, Filter, Refresh, Plus, Search, CircleCheck, InfoFilled, Management, Tickets
} from '@element-plus/icons-vue'
import MaterialEditDialog from './MaterialForm.vue'
import { getMaterialList, deleteMaterialById, updateMaterial } from '@/api/master/materialMaster'
import type { Material as MaterialOrigin } from '@/types/master'

// 扩展 Material 类型，增加 statusLoading 字段
interface Material extends MaterialOrigin {
  statusLoading?: boolean
  supplier?: { name: string }
}

// 筛选相关
const filters = ref({
  keyword: '',
  status: '' as string | number,
  material_type: '',
  supply_classification: ''
})
const loading = ref(false)
const materialList = ref<Material[]>([])
const formVisible = ref(false)
const editId = ref<number | null>(null)

const handleFilter = () => { }
const clearFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    material_type: '',
    supply_classification: ''
  }
}

// 统计有効件数
const activeCount = computed(() => materialList.value.filter(row => row.status == 1).length)

const hasActiveFilters = computed(() =>
  filters.value.keyword ||
  filters.value.status !== '' ||
  filters.value.material_type ||
  filters.value.supply_classification
)

// 列表筛选
const filteredList = computed(() => {
  let result = materialList.value
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(row =>
      row.material_cd?.toLowerCase().includes(keyword) ||
      row.material_name?.toLowerCase().includes(keyword)
      || row.supplier?.name?.toLowerCase().includes(keyword)
    )
  }
  if (filters.value.status !== '') {
    result = result.filter(row => row.status === filters.value.status)
  }
  if (filters.value.material_type) {
    result = result.filter(row => row.material_type === filters.value.material_type)
  }
  if (filters.value.supply_classification) {
    result = result.filter(row => row.supply_classification === filters.value.supply_classification)
  }
  return result
})

// 数据操作
function fetchList() {
  loading.value = true
  getMaterialList({ keyword: filters.value.keyword }).then(res => {
    materialList.value = (res.data || []).map((row: MaterialOrigin) => ({ ...row, statusLoading: false }))
  }).finally(() => loading.value = false)
}

function openForm(row: Material | null = null) {
  editId.value = row ? row.id : null
  formVisible.value = true
}

async function deleteMaterial(id: number) {
  try {
    await ElMessageBox.confirm('この材料を削除しますか？', '確認', {
      type: 'warning',
      confirmButtonText: 'はい',
      cancelButtonText: 'キャンセル'
    })
    await deleteMaterialById(id)
    ElMessage.success('削除しました')
    fetchList()
  } catch { }
}

async function toggleStatus(row: Material) {
  row.statusLoading = true
  try {
    await updateMaterial({ ...row })
    ElMessage.success('状態を更新しました')
  } catch {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状態の更新に失敗しました')
  } finally {
    row.statusLoading = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
/* 基本容器、头部、统计区块，和customer页面风格一致 */
.material-master-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
  color: #2980b9;
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
  background: linear-gradient(135deg, #2980b9 0%, #27ae60 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(41, 128, 185, 0.2);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 4px;
}

/* 操作区块 */
.action-section {
  background: white;
  border-radius: 20px;
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
  color: #2980b9;
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
  color: #2980b9;
  transform: scale(1.05);
}

.add-material-btn {
  background: linear-gradient(135deg, #27ae60 0%, #2980b9 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(41, 128, 185, 0.18);
  transition: all 0.3s;
}

.add-material-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(41, 128, 185, 0.23);
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
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
  color: #2980b9;
}

.filter-input {
  transition: all 0.3s;
}

.filter-input:hover {
  transform: translateY(-1px);
}

.search-active {
  color: #27ae60;
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
  color: #2980b9;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.active-filters .el-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.active-filters .el-tag:hover {
  transform: scale(1.05);
}

/* 表格 */
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  margin-bottom: 16px;
}

.modern-table {
  border-radius: 12px;
  overflow: hidden;
}

.material-cd {
  font-family: monospace;
  color: #2980b9;
  font-weight: bold;
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

/* 响应式 */
@media (max-width:1200px) {
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
}

@media (max-width:768px) {
  .material-master-container {
    padding: 12px;
  }

  .page-header {
    padding: 18px 10px;
  }

  .main-title {
    font-size: 1.5rem;
  }

  .filter-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 10px;
  }

  .filter-actions>* {
    flex: 1;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 14px 8px;
  }

  .search-item {
    grid-column: span 1;
  }

  .filter-summary {
    padding: 10px 10px;
  }

  .stat-card {
    min-width: auto;
    flex: 1;
  }
}

@media (max-width:480px) {
  .main-title {
    font-size: 1.2rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .material-master-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

  .page-header,
  .action-section,
  .table-card,
  .result-section {
    background: rgba(45, 55, 72, 0.88);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.12);
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
.table-card,
.page-header,
.action-section,
.result-section {
  animation: fadeInUp 0.6s;
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

/* ElementPlus覆盖 */
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

:deep(.el-switch) {
  --el-switch-on-color: #2980b9;
}
</style>
