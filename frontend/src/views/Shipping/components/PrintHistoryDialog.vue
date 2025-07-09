<template>
  <el-dialog
    v-model="visible"
    width="95%"
    :close-on-click-modal="false"
    class="print-history-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <el-icon class="header-icon">
            <Document />
          </el-icon>
          <span class="header-title">印刷履歴管理</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="fetchData" :icon="Refresh">更新</el-button>
          <el-button @click="handleClose">閉じる</el-button>
        </div>
      </div>
    </template>

    <div class="print-history-content">
      <!-- フィルター条件 -->
      <div class="filter-section">
        <el-card class="filter-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Search /></el-icon>
              <span>フィルター条件</span>
            </div>
          </template>
          <el-form :inline="true" :model="queryParams" size="default" class="filter-form">
            <el-form-item label="レポート種別:">
              <el-select
                v-model="queryParams.report_type"
                placeholder="レポート種別を選択"
                clearable
                style="width: 200px"
              >
                <el-option label="出荷レポート" value="shipping_report" />
                <el-option label="出荷カレンダー" value="shipping_calendar" />
                <el-option label="その他レポート" value="other_report" />
              </el-select>
            </el-form-item>
            <el-form-item label="ユーザー名:">
              <el-input
                v-model="queryParams.user_name"
                placeholder="ユーザー名を入力"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="印刷日:">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                start-placeholder="開始日"
                end-placeholder="終了日"
                value-format="YYYY-MM-DD"
                style="width: 280px"
                @change="handleDateChange"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="fetchData" :loading="loading">
                検索
              </el-button>
              <el-button :icon="Refresh" @click="resetFilters">リセット</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 統計情報 -->
      <div v-if="stats" class="stats-section">
        <el-card class="stats-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>統計情報</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ stats.total || 0 }}</div>
                <div class="stat-label">総印刷数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item success">
                <div class="stat-value">{{ getStatusCount('成功') }}</div>
                <div class="stat-label">成功件数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item danger">
                <div class="stat-value">{{ getStatusCount('失败') }}</div>
                <div class="stat-label">失敗件数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item warning">
                <div class="stat-value">{{ getStatusCount('取消') }}</div>
                <div class="stat-label">キャンセル件数</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- データテーブル -->
      <div class="table-section">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>印刷履歴一覧 ({{ total }}件)</span>
            </div>
          </template>
          <div v-loading="loading" class="table-container">
            <el-table
              :data="historyData"
              border
              stripe
              style="width: 100%"
              size="small"
              @selection-change="handleSelectionChange"
              empty-text="データがありません"
            >
              <el-table-column type="selection" width="55" />

              <el-table-column label="ID" prop="id" width="80" align="center" />

              <el-table-column label="レポート種別" prop="report_type" width="140" align="center">
                <template #default="{ row }">
                  <el-tag :type="getReportTypeTagType(row.report_type)" size="small">
                    {{ getReportTypeName(row.report_type) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column
                label="レポートタイトル"
                prop="report_title"
                min-width="300"
                show-overflow-tooltip
              />

              <el-table-column label="ユーザー" prop="user_name" width="120" align="center" />

              <el-table-column label="印刷時間" prop="print_date" width="160" align="center">
                <template #default="{ row }">
                  <div class="time-cell">
                    <el-icon><Clock /></el-icon>
                    {{ formatDateTime(row.print_date) }}
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="レコード数" prop="record_count" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.record_count || 0 }}</el-tag>
                </template>
              </el-table-column>

              <el-table-column label="ステータス" prop="status" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    <el-icon>
                      <Check v-if="row.status === '成功'" />
                      <Close v-else-if="row.status === '失败'" />
                      <Warning v-else />
                    </el-icon>
                    {{ getStatusName(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="フィルター条件" prop="filters" min-width="200">
                <template #default="{ row }">
                  <div class="filters-cell">
                    <el-popover
                      placement="top-start"
                      :width="400"
                      trigger="hover"
                      popper-class="filters-popover"
                    >
                      <template #reference>
                        <el-text type="info" truncated class="filters-text">
                          {{ formatFiltersShort(row.filters) }}
                        </el-text>
                      </template>
                      <div class="filters-detail">
                        <pre>{{ formatFilters(row.filters) }}</pre>
                      </div>
                    </el-popover>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="120" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    @click="handleDelete(row)"
                    title="削除"
                    circle
                  />
                </template>
              </el-table-column>
            </el-table>

            <!-- ページネーション -->
            <div class="pagination-section">
              <el-pagination
                v-model:current-page="queryParams.page"
                v-model:page-size="queryParams.limit"
                :page-sizes="[10, 20, 50, 100]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Search,
  Refresh,
  Delete,
  Download,
  DataAnalysis,
  Clock,
  Check,
  Close,
  Warning,
  List,
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// レスポンシブデータ
const visible = ref(false)
const loading = ref(false)
const historyData = ref([])
const total = ref(0)
const selectedRows = ref([])
const stats = ref(null)
const dateRange = ref(null)
const debugInfo = ref('')

// クエリパラメータ
const queryParams = reactive({
  page: 1,
  limit: 20,
  report_type: '',
  user_name: '',
  date_from: '',
  date_to: '',
})

// 計算プロパティ
const getStatusCount = (status) => {
  return stats.value?.byStatus?.find((item) => item.status === status)?.count || 0
}

// モデル値の変更を監視
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      fetchData()
      fetchStats()
    }
  },
  { immediate: true },
)

// 対話框可見性を監視
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// メソッド
const fetchData = async () => {
  loading.value = true
  debugInfo.value = ''

  try {
    console.log('🔍 印刷履歴データを取得中...', queryParams)

    // APIリクエスト
    const response = await request.get('/api/shipping/print/history', {
      params: queryParams,
    })

    console.log('📋 API応答 (原始):', response)
    debugInfo.value = `API応答:\n${JSON.stringify(response, null, 2)}`

    // レスポンスデータの処理
    let responseData = response

    // response.data が存在する場合
    if (response && response.data) {
      responseData = response.data
    }

    console.log('📊 処理後のデータ:', responseData)

    // 成功チェック
    if (responseData.success === false) {
      throw new Error(responseData.message || 'データ取得に失敗しました')
    }

    // データ抽出
    if (responseData.data && responseData.data.list) {
      // 標準形式: { success: true, data: { list: [], total: 0 } }
      historyData.value = responseData.data.list || []
      total.value = responseData.data.total || 0
      console.log('✅ 標準形式でデータを取得:', historyData.value.length, '件')
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 配列形式: { success: true, data: [] }
      historyData.value = responseData.data
      total.value = responseData.data.length
      console.log('✅ 配列形式でデータを取得:', historyData.value.length, '件')
    } else if (Array.isArray(responseData)) {
      // 直接配列: []
      historyData.value = responseData
      total.value = responseData.length
      console.log('✅ 直接配列でデータを取得:', historyData.value.length, '件')
    } else if (responseData.list) {
      // list プロパティ: { list: [], total: 0 }
      historyData.value = responseData.list || []
      total.value = responseData.total || 0
      console.log('✅ listプロパティでデータを取得:', historyData.value.length, '件')
    } else {
      // データなし
      historyData.value = []
      total.value = 0
      console.log('⚠️ データが見つかりません')
    }

    console.log('📈 最結果:', {
      count: historyData.value.length,
      total: total.value,
      sample: historyData.value.slice(0, 2),
    })

    // デバッグ情報更新
    debugInfo.value = `取得成功:\n件数: ${historyData.value.length}\n総数: ${total.value}\n\nサンプルデータ:\n${JSON.stringify(historyData.value.slice(0, 2), null, 2)}`
  } catch (error) {
    console.error('❌ 印刷履歴の取得に失敗:', error)
    ElMessage.error('印刷履歴の取得に失敗しました: ' + error.message)
    historyData.value = []
    total.value = 0
    debugInfo.value = `エラー:\n${error.message}\n\nスタック:\n${error.stack}`
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await request.get('/api/shipping/print/history/stats', {
      params: {
        date_from: queryParams.date_from,
        date_to: queryParams.date_to,
      },
    })

    let data = response
    if (response.data) {
      data = response.data
    }

    if (data.success !== false) {
      stats.value = data.data || data
    }

    console.log('📈 統計データ:', stats.value)
  } catch (error) {
    console.error('❌ 統計情報の取得に失敗:', error)
  }
}

const testConnection = async () => {
  try {
    ElMessage.info('接続テスト中...')
    const response = await request.get('/api/shipping/print/history?limit=1')
    console.log('接続テスト結果:', response)
    ElMessage.success('接続テストに成功しました')
    debugInfo.value = `接続テスト成功:\n${JSON.stringify(response, null, 2)}`
  } catch (error) {
    console.error('接続テストに失敗:', error)
    ElMessage.error('接続テストに失敗しました: ' + error.message)
    debugInfo.value = `接続テストエラー:\n${error.message}`
  }
}

const handleDateChange = () => {
  if (dateRange.value) {
    queryParams.date_from = dateRange.value[0]
    queryParams.date_to = dateRange.value[1]
  } else {
    queryParams.date_from = ''
    queryParams.date_to = ''
  }
}

const resetFilters = () => {
  queryParams.report_type = ''
  queryParams.user_name = ''
  queryParams.date_from = ''
  queryParams.date_to = ''
  queryParams.page = 1
  dateRange.value = null
  fetchData()
  fetchStats()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('この印刷履歴を削除しますか？', '削除確認', {
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル',
      type: 'warning',
    })

    await request.delete(`/api/shipping/print/history/${row.id}`)
    ElMessage.success('削除しました')
    fetchData()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 削除に失敗:', error)
      ElMessage.error('削除に失敗しました: ' + error.message)
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('削除するレコードを選択してください')
    return
  }

  try {
    await ElMessageBox.confirm(
      `選択中の ${selectedRows.value.length} 件の印刷履歴を削除しますか？`,
      '一括削除確認',
      {
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル',
        type: 'warning',
      },
    )

    const ids = selectedRows.value.map((row) => row.id)
    await request.delete(`/api/shipping/print/history/batch/${ids.join(',')}`)
    ElMessage.success(`${selectedRows.value.length} 件を削除しました`)
    selectedRows.value = []
    fetchData()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 一括削除に失敗:', error)
      ElMessage.error('一括削除に失敗しました: ' + error.message)
    }
  }
}

const handleExport = () => {
  ElMessage.info('データ出力機能は開発中です...')
}

const handleSizeChange = (size) => {
  queryParams.limit = size
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  queryParams.page = page
  fetchData()
}

const handleClose = () => {
  visible.value = false
}

// フォーマット関数
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ja-JP')
}

const getReportTypeName = (type) => {
  const typeMap = {
    shipping_report: '出荷レポート',
    shipping_calendar: '出荷カレンダー',
    other_report: 'その他レポート',
  }
  return typeMap[type] || type
}

const getReportTypeTagType = (type) => {
  const typeMap = {
    shipping_report: 'success',
    shipping_calendar: 'primary',
    other_report: 'info',
  }
  return typeMap[type] || 'default'
}

const getStatusName = (status) => {
  const statusMap = {
    成功: '成功',
    失败: '失敗',
    取消: 'キャンセル',
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const statusMap = {
    成功: 'success',
    失败: 'danger',
    取消: 'warning',
  }
  return statusMap[status] || 'default'
}

const formatFilters = (filters) => {
  if (!filters) return 'フィルターなし'

  try {
    const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return filters || 'フォーマットエラー'
  }
}

const formatFiltersShort = (filters) => {
  if (!filters) return 'フィルターなし'

  try {
    const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters
    const parts = []

    if (parsed.dateRange && parsed.dateRange.length === 2) {
      parts.push(`${parsed.dateRange[0]}~${parsed.dateRange[1]}`)
    }

    if (parsed.destinationCds && parsed.destinationCds.length > 0) {
      parts.push(`${parsed.destinationCds.length}件の納入先`)
    }

    if (parsed.selectedGroup !== undefined && parsed.selectedGroup >= 0) {
      const groupNames = ['オワリ便', '鈴鹿便', '社内便']
      parts.push(groupNames[parsed.selectedGroup] || `グループ${parsed.selectedGroup + 1}`)
    }

    return parts.length > 0 ? parts.join(', ') : 'フィルターなし'
  } catch (error) {
    return 'フォーマットエラー'
  }
}

// コンポーネントマウント
onMounted(() => {
  console.log('🚀 PrintHistoryDialog 初期化')
})
</script>

<style scoped>
.print-history-dialog {
  border-radius: 16px;
}

.print-history-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.print-history-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: white;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions .el-button {
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.print-history-content {
  padding: 24px;
  background: transparent;
  min-height: 70vh;
}

.filter-section,
.stats-section,
.action-section,
.debug-section,
.table-section {
  margin-bottom: 20px;
}

.filter-card,
.stats-card,
.action-card,
.debug-card,
.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.filter-form {
  padding: 10px 0;
}

.filter-form .el-form-item {
  margin-bottom: 16px;
}

.filter-form .el-form-item__label {
  font-weight: 600;
  color: #374151;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-card .card-header {
  color: white;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: white;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.stat-item.success .stat-value {
  color: #10b981;
}

.stat-item.danger .stat-value {
  color: #ef4444;
}

.stat-item.warning .stat-value {
  color: #f59e0b;
}

.action-card {
  padding: 16px 20px;
}

.action-card .el-button {
  border-radius: 8px;
  font-weight: 600;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.action-card .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.debug-card {
  background: rgba(255, 248, 220, 0.9);
  border-left: 4px solid #f59e0b;
}

.debug-card pre {
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.5);
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
}

.table-container {
  min-height: 400px;
}

.table-card :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

.table-card :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.table-card :deep(.el-table__header th) {
  background: transparent;
  color: #374151;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
}

.table-card :deep(.el-table__body tr:hover) {
  background-color: #f8fafc;
}

.table-card :deep(.el-table__body tr:nth-child(even)) {
  background-color: #f9fafb;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.filters-cell {
  max-width: 200px;
}

.filters-text {
  cursor: pointer;
}

.filters-detail {
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
}

.filters-popover {
  max-width: 400px;
}

.pagination-section {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
}

.pagination-section :deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
}

.pagination-section :deep(.el-pagination .el-pager li) {
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.pagination-section :deep(.el-pagination .el-pager li:hover) {
  transform: translateY(-1px);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .print-history-dialog {
    width: 98% !important;
  }

  .print-history-content {
    padding: 16px;
  }

  .filter-form {
    display: block;
  }

  .filter-form .el-form-item {
    display: block;
    margin-bottom: 16px;
  }

  .stats-section :deep(.el-col) {
    margin-bottom: 16px;
  }
}

/* 読み込みアニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-card,
.stats-card,
.action-card,
.debug-card,
.table-card {
  animation: fadeIn 0.6s ease-out;
}

/* テーブル行アニメーション */
.table-card :deep(.el-table__body tr) {
  transition: all 0.3s ease;
}

/* ボタンアニメーション */
.el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* タグアニメーション */
.el-tag {
  transition: all 0.3s ease;
}

.el-tag:hover {
  transform: scale(1.05);
}
</style>
