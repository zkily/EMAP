<template>
  <div class="process-master-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">
            <el-icon class="title-icon">⚙️</el-icon>
            工程マスタ管理
          </h1>
          <p class="subtitle">工程情報の登録・編集・管理を行います</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-number">{{ tableData.length }}</div>
            <div class="stat-label">総工程数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能操作区 -->
    <div class="action-section">
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <el-icon>🔍</el-icon>
          </el-icon>
          <span>検索・絞り込み</span>
        </div>
        <div class="filter-actions">
          <el-button text @click="clearFilters" class="clear-btn">クリア</el-button>
          <el-button type="primary" @click="openAddDialog" class="add-btn">工程追加</el-button>
        </div>
      </div>
      <div class="filters-grid">
        <div class="filter-item search-item">
          <label class="filter-label">
            <el-icon>🔍</el-icon>
            キーワード検索
          </label>
          <el-input v-model="filters.keyword" placeholder="コード・名称 検索" clearable @input="handleFilter"
            class="filter-input">
            <template #suffix>
              <el-icon v-if="filters.keyword" class="search-active">🔍</el-icon>
            </template>
          </el-input>
        </div>
      </div>
      <div class="filter-summary" v-if="hasActiveFilters">
        <div class="summary-text">
          <el-icon class="summary-icon">ℹ️</el-icon>
          <span>{{ filteredList.length }}件 / {{ tableData.length }}件中を表示</span>
        </div>
        <div class="active-filters">
          <el-tag v-if="filters.keyword" closable @close="filters.keyword = ''; handleFilter()" type="primary"
            size="small">検索: {{ filters.keyword }}</el-tag>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card">
      <el-table :data="filteredList" border stripe v-loading="loading" class="modern-table">
        <el-table-column label="コード" prop="process_cd" width="80" align="center" />
        <el-table-column label="名称" prop="process_name" min-width="80" />
        <el-table-column label="略称" prop="short_name" />
        <el-table-column label="分類" prop="category" width="100" />
        <el-table-column label="区分" prop="is_outsource" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_outsource ? 'danger' : 'success'">
              {{ row.is_outsource ? '外注' : '社内' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="標準サイクル(s)" prop="default_cycle_sec" width="150" align="center" />
        <el-table-column label="歩留(%)" prop="default_yield" width="90" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons-table">
              <el-button size="small" type="primary" link @click="openEditDialog(row)">編集</el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row.id)">削除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="result-section">
      <div class="result-info">
        表示件数: {{ filteredList.length }} / {{ tableData.length }}
      </div>
    </div>

    <!-- ✏️ ダイアログ -->
    <ProcessEditDialog v-model:visible="dialogVisible" :mode="dialogMode" :initialData="editTarget"
      @saved="fetchList" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { fetchProcesses, deleteProcess } from '@/api/master/processMaster'
import type { ProcessItem } from '@/types/master'
import ProcessEditDialog from './ProcessEditDialog.vue'

const filters = ref({ keyword: '' })
const tableData = ref<ProcessItem[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editTarget = ref<ProcessItem | null>(null)

const hasActiveFilters = computed(() => !!filters.value.keyword)

const filteredList = computed(() => {
  let result = tableData.value
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(row =>
      row.process_cd?.toLowerCase().includes(keyword) ||
      row.process_name?.toLowerCase().includes(keyword) ||
      row.short_name?.toLowerCase().includes(keyword)
    )
  }
  return result
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await fetchProcesses({
      keyword: filters.value.keyword,
      page: 1,
      pageSize: 100
    })
    tableData.value = res.list
  } catch (err) {
    console.error('工程一覧取得失敗', err)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  editTarget.value = null
  dialogVisible.value = true
}

const openEditDialog = (row: ProcessItem) => {
  dialogMode.value = 'edit'
  editTarget.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('この工程を削除してもよろしいですか？', '確認', {
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル',
      type: 'warning'
    })
    await deleteProcess(id)
    ElMessage.success('削除しました')
    fetchList()
  } catch {
    // Cancel の場合は無視
  }
}

function handleFilter() {
  // computed 已自动筛选
}
function clearFilters() {
  filters.value = { keyword: '' }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.process-master-container {
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

.action-section {
  background: white;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

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
  transition: all 0.3s;
}

.clear-btn:hover {
  color: #2980b9;
  transform: scale(1.05);
}

.add-btn {
  background: linear-gradient(135deg, #27ae60 0%, #2980b9 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(41, 128, 185, 0.18);
  transition: all 0.3s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(41, 128, 185, 0.23);
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr;
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

.action-buttons-table {
  display: flex;
  gap: 8px;
  justify-content: center;
}

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
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .search-item {
    grid-column: span 1;
  }
}

@media (max-width:768px) {
  .process-master-container {
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

@media (prefers-color-scheme: dark) {
  .process-master-container {
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
</style>
