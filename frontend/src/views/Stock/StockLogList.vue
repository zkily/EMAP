<template>
  <div class="stock-log-container">
    <!-- 动态背景 -->
    <div class="dynamic-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon size="32">
              <DocumentAdd />
            </el-icon>
          </div>
          <div class="header-text">
            <h1 class="main-title">入出庫実績履歴一覧</h1>
            <p class="subtitle">CSV在庫ファイルから入出庫履歴を取込・管理できます</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            @click="handleImport"
            :loading="loading"
            :icon="DocumentAdd"
            class="import-button"
            size="large"
          >
            CSV データ取込
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 导入状态提示 -->
      <transition name="fade-slide" appear>
        <div v-if="importStatus !== 'idle'" class="import-status-container">
          <el-alert
            v-if="importStatus === 'reading'"
            title="📂 CSV ファイル読込中..."
            type="info"
            show-icon
            class="status-alert"
          />
          <el-alert
            v-if="importStatus === 'saving'"
            title="📤 データベース登録中..."
            type="warning"
            show-icon
            class="status-alert"
          />
          <el-alert
            v-if="importStatus === 'done'"
            title="✅ CSV取込完了"
            type="success"
            show-icon
            class="status-alert"
          />
          <el-alert
            v-if="importStatus === 'error'"
            title="❌ エラーが発生しました"
            type="error"
            show-icon
            class="status-alert"
          />

          <el-progress
            v-if="
              (importStatus as ImportStatus) !== 'idle' &&
              importStatus !== 'done' &&
              importStatus !== 'error'
            "
            :percentage="importProgress"
            :text-inside="true"
            class="import-progress"
            :stroke-width="12"
            :color="progressColor"
          />
        </div>
      </transition>

      <!-- 筛选表单 -->
      <el-card class="filter-card" shadow="hover">
        <template #header>
          <div class="filter-header">
            <el-icon class="filter-icon">
              <Search />
            </el-icon>
            <span class="filter-title">検索フィルタ</span>
          </div>
        </template>

        <el-form :inline="true" :model="filters" class="filter-form" @submit.prevent>
          <div class="filter-row">
            <el-form-item label="在庫種別" class="filter-item">
              <el-radio-group v-model="filters.stock_type" class="stock-type-radio">
                <el-radio value="">全て</el-radio>
                <el-radio value="製品">製品</el-radio>
                <el-radio value="仕掛品">仕掛品</el-radio>
                <el-radio value="部品">部品</el-radio>
                <el-radio value="材料">材料</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>

          <div class="filter-row">
            <el-form-item label="キーワード" class="filter-item">
              <el-input
                v-model="filters.keyword"
                placeholder="対象CD / 名称で検索"
                clearable
                class="filter-input"
                :prefix-icon="Search"
              />
            </el-form-item>

            <el-form-item label="保管場所" class="filter-item">
              <el-select
                v-model="filters.location_cd"
                placeholder="選択"
                clearable
                class="filter-select"
              >
                <el-option
                  v-for="item in locationOptions"
                  :key="item.cd"
                  :label="item.name"
                  :value="item.cd"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="操作種別" class="filter-item">
              <el-select
                v-model="filters.transaction_type"
                placeholder="選択"
                clearable
                class="filter-select"
              >
                <el-option
                  v-for="item in transactionTypeOptions"
                  :key="item.cd"
                  :label="item.name"
                  :value="item.cd"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="操作日" class="filter-item">
              <el-date-picker
                v-model="filters.date_range"
                type="daterange"
                range-separator="～"
                start-placeholder="開始日"
                end-placeholder="終了日"
                value-format="YYYY-MM-DD"
                unlink-panels
                class="date-picker"
              />
            </el-form-item>
          </div>

          <div class="filter-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch" class="search-button">
              検索
            </el-button>
            <el-button :icon="RefreshLeft" @click="resetFilters" class="reset-button">
              リセット
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 数据表格 -->
      <el-card class="table-card" shadow="hover">
        <template #header>
          <div class="table-header">
            <div class="table-title">
              <el-icon class="table-icon">
                <DocumentAdd />
              </el-icon>
              <span>履歴データ一覧</span>
            </div>
            <div class="table-stats">
              <span class="stats-text">総件数: {{ pagination.total }}件</span>
            </div>
          </div>
        </template>

        <el-table
          :data="logList"
          border
          stripe
          highlight-current-row
          class="data-table"
          v-loading="loading"
          :loading-text="loadingText"
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
          <el-table-column label="在庫種別" prop="stock_type" width="100" align="center">
            <template #default="scope">
              <el-tag
                :type="getStockTypeColor(scope.row.stock_type)"
                effect="light"
                class="stock-type-tag"
              >
                {{ scope.row.stock_type }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="対象CD" prop="target_cd" width="100" align="center">
            <template #default="scope">
              <div class="target-cd">{{ scope.row.target_cd }}</div>
            </template>
          </el-table-column>

          <el-table-column label="対象名" min-width="140">
            <template #default="scope">
              <div class="target-name-cell">
                <span
                  :class="
                    getTargetName(
                      scope.row.stock_type,
                      scope.row.target_cd,
                      scope.row.target_name,
                    ) === scope.row.target_cd
                      ? 'no-name-placeholder'
                      : 'target-name'
                  "
                >
                  {{
                    getTargetName(scope.row.stock_type, scope.row.target_cd, scope.row.target_name)
                  }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="保管場所" prop="location_cd" width="120" align="center">
            <template #default="scope">
              <div class="location-cell">{{ scope.row.location_cd }}</div>
            </template>
          </el-table-column>

          <el-table-column label="操作種別" prop="transaction_type" width="100" align="center">
            <template #default="scope">
              <el-tag
                :type="getTransactionTypeColor(scope.row.transaction_type)"
                effect="dark"
                class="transaction-type-tag"
              >
                {{ scope.row.transaction_type }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="quantity" width="90" align="center">
            <template #default="scope">
              <div class="quantity-cell" :class="{ negative: scope.row.quantity < 0 }">
                {{ scope.row.quantity }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="単位" prop="unit" width="70" align="center">
            <template #default="scope">
              <div class="unit-cell">{{ scope.row.unit || '-' }}</div>
            </template>
          </el-table-column>

          <el-table-column label="操作日時" prop="transaction_time" width="180" align="center">
            <template #default="scope">
              <div class="datetime-cell">{{ formatDate(scope.row.transaction_time) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="工程名" width="110" align="center">
            <template #default="scope">
              <div class="process-cell">
                <span v-if="scope.row.process_name && scope.row.process_name.trim()">
                  {{ scope.row.process_name }}
                </span>
                <span v-else class="no-name-placeholder">-</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" width="100" align="center">
            <template #default="scope">
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
                :icon="Delete"
                class="delete-button"
              >
                削除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.page"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            background
            class="custom-pagination"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import request, { ApiResponse } from '@/utils/request'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { getProductOptions, getMaterialOptions, getComponentOptions } from '@/api/options'
import type { OptionItem } from '@/types/master'

// ✅ Element Plus 图标组件
import { DocumentAdd, Search, RefreshLeft } from '@element-plus/icons-vue'

const getStockTypeColor = (type: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (type) {
    case '製品':
      return 'primary'
    case '材料':
      return 'success'
    case '部品':
      return 'warning'
    case '仕掛品':
      return 'info'
    default:
      return 'danger'
  }
}

const getTransactionTypeColor = (
  type: string,
): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (type) {
    case '入庫':
      return 'success'
    case '出庫':
      return 'info'
    case '調整':
      return 'warning'
    case '廃棄':
      return 'danger'
    case '保留':
      return 'info'
    case '実績':
      return 'success'
    case '不良':
      return 'danger'
    case '取消':
      return 'info'
    case '出荷':
      return 'primary'
    default:
      return 'info'
  }
}

const locationOptions = ref([
  { cd: '製品倉庫', name: '製品倉庫' },
  { cd: '仮設倉庫', name: '仮設倉庫' },
  { cd: '部品倉庫', name: '部品倉庫' },
  { cd: '仕上倉庫', name: '仕上倉庫' },
  { cd: 'メッキ倉庫', name: 'メッキ倉庫' },
  { cd: '工程中間在庫', name: '工程中間在庫' },
  { cd: '材料置場', name: '材料置場' },
  { cd: 'その他', name: 'その他' },
])

const transactionTypeOptions = ref([
  { cd: '入庫', name: '入庫' },
  { cd: '出庫', name: '出庫' },
  { cd: '調整', name: '調整' },
  { cd: '廃棄', name: '廃棄' },
  { cd: '保留', name: '保留' },
  { cd: '実績', name: '実績' },
  { cd: '不良', name: '不良' },
  { cd: '取消', name: '取消' },
  { cd: '出荷', name: '出荷' },
])

const loading = ref(false)
const logList = ref<StockLog[]>([])

const filters = ref({
  stock_type: '',
  keyword: '',
  location_cd: '',
  transaction_type: '',
  date_range: [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
})

interface StockLog {
  id: number
  stock_type: string
  target_cd: string
  target_name?: string
  location_cd: string
  transaction_type: string
  quantity: number
  unit?: string
  process_cd?: string
  process_name?: string
  related_doc_type?: string
  related_doc_no?: string
  remarks?: string
  transaction_time: string
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

const formatDate = (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss')

type ImportStatus = 'idle' | 'reading' | 'saving' | 'done' | 'error'
const importStatus = ref<ImportStatus>('idle')

const importProgress = ref(0) // 0～100，导入进度

// 计算属性
const progressColor = computed(() => {
  if (importProgress.value < 30) return '#f56c6c'
  if (importProgress.value < 70) return '#e6a23c'
  return '#67c23a'
})

const loadingText = computed(() => {
  const texts = ['データを読み込み中...', 'しばらくお待ちください...', '処理中...']
  return texts[Math.floor(Math.random() * texts.length)]
})

const handleImport = async () => {
  loading.value = true
  importProgress.value = 0
  importStatus.value = 'reading'

  try {
    // 📂 CSV文件読み込み段階
    importProgress.value = 20
    await sleep(300)

    const rawRes = await request.post<ApiResponse>('/api/stock/import-stock')

    importStatus.value = 'saving'
    importProgress.value = 70
    await sleep(500)
    await fetchLogs()

    // ✅ 完了
    importProgress.value = 100
    importStatus.value = 'done'
    ElMessage.success('✅ ' + (rawRes?.message ?? 'CSV取込成功'))
  } catch (err: unknown) {
    importStatus.value = 'error'
    const apiError = err as ApiError
    const msg = apiError?.response?.data?.message || apiError?.message || 'CSV取込失敗'
    ElMessage.error('❌ ' + msg)
  } finally {
    setTimeout(() => {
      importStatus.value = 'idle'
      loading.value = false
    }, 1500)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const handleDelete = async (row: StockLog) => {
  try {
    await ElMessageBox.confirm(`本当に削除しますか？ 対象CD: ${row.target_cd}`, '確認', {
      type: 'warning',
    })
    loading.value = true
    await request.delete(`/api/stock/logs/${row.id}`)
    ElMessage.success('✅ 削除しました')
    fetchLogs() // 再取得
  } catch (err: unknown) {
    if (err !== 'cancel') {
      const apiError = err as ApiError
      ElMessage.error(
        '❌ 削除失敗: ' + (apiError?.response?.data?.message || apiError?.message || ''),
      )
    }
  } finally {
    loading.value = false
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const { list, total } = await request.get('/api/stock/logs', {
      params: {
        ...filters.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
      },
    })

    logList.value = list || []
    pagination.value.total = total || 0
  } catch (err) {
    console.error('在庫ログ取得失敗', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchLogs()
}

const resetFilters = () => {
  filters.value = {
    stock_type: '',
    keyword: '',
    location_cd: '',
    transaction_type: '',
    date_range: [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  }
  pagination.value.page = 1
  fetchLogs()
}

const handlePageChange = (newPage: number) => {
  pagination.value.page = newPage
  fetchLogs()
}

const handleSizeChange = (newSize: number) => {
  pagination.value.pageSize = newSize
  pagination.value.page = 1
  fetchLogs()
}

// 缓存各种选项数据
const productOptions = ref<OptionItem[]>([])
const materialOptions = ref<OptionItem[]>([])
const componentOptions = ref<OptionItem[]>([])

// 根据库存种别获取对象名称
const getTargetName = (stockType: string, targetCd: string, originalName?: string): string => {
  // 如果原始名称存在且不为空，直接返回
  if (originalName && originalName.trim()) {
    return originalName
  }

  // 根据库存种别从对应的选项中查找
  let options: OptionItem[] = []
  switch (stockType) {
    case '製品':
    case '仕掛品':
      options = productOptions.value
      break
    case '部品':
      options = componentOptions.value
      break
    case '材料':
      options = materialOptions.value
      break
    default:
      return targetCd // 未知类型，返回CD
  }

  const found = options.find((item) => item.cd === targetCd)
  return found?.name || targetCd
}

// 加载所有选项数据
const loadAllOptions = async () => {
  try {
    const [products, materials, components] = await Promise.all([
      getProductOptions(),
      getMaterialOptions(),
      getComponentOptions(),
    ])
    productOptions.value = products
    materialOptions.value = materials
    componentOptions.value = components
  } catch (error) {
    console.error('选项数据加载失败:', error)
  }
}

onMounted(async () => {
  await loadAllOptions()
  fetchLogs()
})
</script>

<style scoped>
.stock-log-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7b42c 0%, #fc575e 100%);
  position: relative;
  overflow-x: hidden;
  padding: 20px;
}

/* 动态背景 */
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  will-change: transform;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(247, 180, 44, 0.08), rgba(252, 87, 94, 0.08));
  animation: floatOrb 25s ease-in-out infinite;
  will-change: transform;
}

.orb-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -200px;
  animation-delay: -8s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -150px;
  animation-delay: -15s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  top: 40%;
  left: 60%;
  transform: translate(-50%, -50%);
  animation-delay: -22s;
}

@keyframes floatOrb {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  25% {
    transform: translateY(-30px) rotate(90deg);
  }

  50% {
    transform: translateY(-10px) rotate(180deg);
  }

  75% {
    transform: translateY(20px) rotate(270deg);
  }
}

/* 页面头部 */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: slideInDown 0.6s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(247, 180, 44, 0.3);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.header-text {
  flex: 1;
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 14px;
  color: #7c8db5;
  margin: 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.import-button {
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(247, 180, 44, 0.3);
  transition: all 0.3s ease;
}

.import-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(247, 180, 44, 0.4);
}

/* 主要内容区域 */
.content-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 导入状态 */
.import-status-container {
  margin-bottom: 20px;
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-alert {
  margin-bottom: 12px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.import-progress {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: slideInLeft 0.6s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-icon {
  color: #f7b42c;
  font-size: 18px;
}

.filter-title {
  font-size: 16px;
}

.filter-form {
  padding: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-item {
  margin-bottom: 0;
}

.stock-type-radio {
  display: flex;
  gap: 12px;
}

.filter-input,
.filter-select,
.date-picker {
  width: 200px;
  border-radius: 6px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.search-button {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.reset-button {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.reset-button:hover {
  transform: translateY(-1px);
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: slideInRight 0.6s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.table-icon {
  color: #f7b42c;
  font-size: 18px;
}

.table-stats {
  display: flex;
  align-items: center;
}

.stats-text {
  font-size: 14px;
  color: #7c8db5;
  font-weight: 500;
}

/* 数据表格样式 */
.data-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.data-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.data-table :deep(.el-table__header th) {
  background: transparent;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid #f7b42c;
}

.data-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.data-table :deep(.el-table__row:hover) {
  background-color: rgba(247, 180, 44, 0.05);
  transform: scale(1.001);
}

/* 表格单元格样式 */
.stock-type-tag,
.transaction-type-tag {
  font-weight: 600;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.target-cd,
.location-cell,
.unit-cell,
.datetime-cell,
.process-cell {
  font-weight: 500;
  color: #2c3e50;
}

.target-name-cell {
  padding: 0 8px;
}

.target-name {
  color: #2c3e50;
  font-weight: 500;
}

.no-name-placeholder {
  color: #bbb;
  font-style: italic;
  font-size: 12px;
}

.quantity-cell {
  font-weight: 700;
  font-size: 14px;
  color: #67c23a;
}

.quantity-cell.negative {
  color: #f56c6c;
}

.delete-button {
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.custom-pagination {
  border-radius: 8px;
}

.custom-pagination :deep(.el-pagination__jump) {
  margin-left: 16px;
}

.custom-pagination :deep(.btn-next),
.custom-pagination :deep(.btn-prev) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.btn-next:hover),
.custom-pagination :deep(.btn-prev:hover) {
  transform: translateY(-1px);
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-container {
    padding: 0 16px;
  }

  .filter-row {
    flex-direction: column;
    gap: 12px;
  }

  .filter-input,
  .filter-select,
  .date-picker {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stock-log-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .main-title {
    font-size: 20px;
  }

  .subtitle {
    font-size: 13px;
  }

  .data-table {
    font-size: 12px;
  }

  .pagination-wrapper {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-icon {
    width: 40px;
    height: 40px;
  }

  .main-title {
    font-size: 18px;
  }

  .import-button {
    padding: 8px 16px;
    font-size: 12px;
  }

  .filter-actions {
    justify-content: center;
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .stock-log-container {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .page-header,
  .filter-card,
  .table-card {
    background: rgba(45, 55, 72, 0.95);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .main-title,
  .filter-title,
  .table-title {
    color: #e2e8f0;
  }

  .subtitle,
  .stats-text {
    color: #a0aec0;
  }

  .data-table :deep(.el-table__header th) {
    background: rgba(26, 32, 44, 0.8);
    color: #e2e8f0;
  }

  .data-table :deep(.el-table__row:hover) {
    background-color: rgba(247, 180, 44, 0.1);
  }
}
</style>
