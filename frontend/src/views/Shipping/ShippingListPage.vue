<template>
  <div class="shipping-list-page">
    <el-card shadow="never" class="list-card">
      <!-- 页面标题 -->
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon">
              <Document />
            </el-icon>
            <span class="header-title">出荷便リスト</span>
          </div>
          <div class="header-actions">
            <el-button
              type="success"
              :icon="Document"
              @click="handleReport"
              :disabled="loading || !listData || listData.length === 0"
            >
              リスト印刷
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filters" size="default">
          <el-form-item label="出荷日期範囲:">
            <div class="date-filter-container">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                start-placeholder="開始日"
                end-placeholder="終了日"
                value-format="YYYY-MM-DD"
                style="width: 280px"
                @change="handleDateChange"
              />
              <el-button-group style="margin-left: 10px">
                <el-button @click="adjustDate(-1)">前日</el-button>
                <el-button @click="goToToday">本日</el-button>
                <el-button @click="adjustDate(1)">翌日</el-button>
              </el-button-group>
            </div>
          </el-form-item>
          <el-form-item label="納入先:">
            <div class="destination-filter-container">
              <el-select
                v-model="filters.destinationCds"
                multiple
                placeholder="納入先を選択"
                style="width: 300px"
                collapse-tags
                collapse-tags-tooltip
                @change="handleDestinationChange"
              >
                <el-option
                  v-for="dest in destinationOptions"
                  :key="dest.value"
                  :label="dest.label"
                  :value="dest.value"
                />
              </el-select>
              <el-button
                type="primary"
                :icon="Setting"
                @click="showGroupManager = true"
                style="margin-left: 8px"
                title="納入先グループ管理"
              >
                グループ管理
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="グループ選択:" v-if="hasGroups">
            <el-radio-group v-model="filters.selectedGroup" @change="handleGroupChange">
              <el-radio :value="-1">全て</el-radio>
              <el-radio
                v-for="(group, index) in destinationGroups"
                :key="index"
                :value="index"
                :disabled="!group?.destinations || group.destinations.length === 0"
              >
                グループ {{ index + 1 }} ({{ group?.destinations?.length || 0 }})
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="fetchListData"> 検索 </el-button>
            <el-button :icon="Refresh" @click="resetFilters"> リセット </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计信息 -->
      <div v-if="!loading && listData && listData.length > 0" class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="総納入先数" :value="totalDestinations" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="総出荷日数" :value="totalDates" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="総製品種類" :value="totalProducts" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="総箱数" :value="totalBoxes" />
          </el-col>
        </el-row>
      </div>

      <!-- 数据表格 -->
      <div class="table-section" v-loading="loading">
        <el-empty
          v-if="!loading && (!listData || listData.length === 0)"
          description="条件に合うデータがありません"
          :image-size="100"
        />

        <div v-else class="list-table-container">
          <el-table
            :data="listData"
            border
            stripe
            style="width: 100%"
            show-summary
            :summary-method="getSummaries"
            size="small"
          >
            <el-table-column label="No" prop="no" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="small">
                  {{ row.no }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="出荷日" prop="shipping_date" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="primary" size="small">
                  {{ formatDate(row.shipping_date) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="納入先"
              prop="destination_name"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <div class="destination-cell">
                  <el-icon class="destination-icon"><Location /></el-icon>
                  {{ row.destination_name }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="出荷No" prop="shipping_no" min-width="180">
              <template #default="{ row }">
                <el-tag type="info" class="shipping-tag">
                  {{ row.shipping_no }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="製品名" prop="product_name" min-width="250" />

            <el-table-column label="箱数" prop="quantity" width="100" align="center">
              <template #default="{ row }">
                <el-text type="success" size="large" class="total-boxes">
                  {{ row.quantity }}
                </el-text>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 报告对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      width="90%"
      :close-on-click-modal="false"
      class="report-dialog"
    >
      <template #header>
        <div class="dialog-header-container">
          <span class="el-dialog__title">出荷便リストプレビュー</span>
          <div class="dialog-header-actions">
            <el-button @click="reportDialogVisible = false">キャンセル</el-button>
            <el-button type="primary" @click="executeFrontendPrint(reportContent)"
              >印刷実行</el-button
            >
          </div>
        </div>
      </template>
      <div ref="reportContent" class="report-content">
        <ShippingListReport :data="listData" :filters="filters" />
      </div>
    </el-dialog>

    <!-- 分组管理弹窗 -->
    <DestinationGroupManager
      v-model="showGroupManager"
      storage-key="destination_groups_list"
      @groups-updated="handleGroupsUpdated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Search, Refresh, Location, Setting } from '@element-plus/icons-vue'
import request from '@/utils/request'
import ShippingListReport from './components/ShippingListReport.vue'
import DestinationGroupManager from './components/DestinationGroupManager.vue'

// 响应式数据
const loading = ref(false)
const reportDialogVisible = ref(false)
const reportContent = ref(null)
const showGroupManager = ref(false)

// 筛选条件
const today = new Date().toISOString().slice(0, 10)
const filters = reactive({
  dateRange: [today, today],
  destinationCds: [],
  selectedGroup: -1, // -1表示全部，0,1,2表示对应的组
})

// 选项数据
const destinationOptions = ref([])
const listData = ref([])
const destinationGroups = ref([{ destinations: [] }, { destinations: [] }, { destinations: [] }])

// 计算属性
const totalDestinations = computed(() => {
  if (!Array.isArray(listData.value)) return 0
  return new Set(listData.value.map((item) => item?.destination_name).filter(Boolean)).size
})

const totalDates = computed(() => {
  if (!Array.isArray(listData.value)) return 0
  return new Set(listData.value.map((item) => item?.shipping_date).filter(Boolean)).size
})

const totalProducts = computed(() => {
  if (!Array.isArray(listData.value)) return 0
  return new Set(listData.value.map((item) => item?.product_name).filter(Boolean)).size
})

const totalBoxes = computed(() => {
  if (!Array.isArray(listData.value)) return 0
  return listData.value.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
})

const hasGroups = computed(() => {
  if (!Array.isArray(destinationGroups.value)) return false
  return destinationGroups.value.some((group) => group?.destinations?.length > 0)
})

// 方法
onMounted(() => {
  fetchDestinationOptions()
  loadDestinationGroups()
  fetchListData()
})

// 获取納入先选项
async function fetchDestinationOptions() {
  try {
    const response = await request.get('/api/master/options/destination-options')
    console.log('ShippingListPage API响应:', response)

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
      destinationOptions.value = data.map((item) => ({
        value: item.cd,
        label: `${item.cd} - ${item.name}`,
      }))
      console.log('ShippingListPage 处理后的destinationOptions:', destinationOptions.value)
    } else {
      console.error('納入先データ格式不正确:', response)
      ElMessage.error('納入先データの取得に失敗しました')
    }
  } catch (error) {
    console.error('获取納入先选项失败:', error)
    ElMessage.error('納入先データの取得に失敗しました')
  }
}

// 获取出荷便リスト数据
async function fetchListData() {
  if (!filters.dateRange || filters.dateRange.length !== 2) {
    ElMessage.warning('出荷日期範囲を選択してください')
    return
  }

  loading.value = true
  try {
    const params = {
      date_from: filters.dateRange[0],
      date_to: filters.dateRange[1],
      destination_cds: filters.destinationCds.join(','),
    }

    const response = await request.get('/api/shipping/list', { params })

    console.log('完整响应:', response)
    console.log('response.data:', response.data)
    console.log('response 本身是否为数组:', Array.isArray(response))

    // 处理不同的响应格式
    let data = null
    if (Array.isArray(response)) {
      // 格式1: 直接返回数组
      data = response
    } else if (response && Array.isArray(response.data)) {
      // 格式2: { data: [...] }
      data = response.data
    } else if (response && response.success === true && Array.isArray(response.data)) {
      // 格式3: { success: true, data: [...] }
      data = response.data
    }

    // 按出荷No排序并添加No字段（取出荷No后两位）
    if (data && Array.isArray(data)) {
      data.sort((a, b) => a.shipping_no.localeCompare(b.shipping_no))
      data.forEach((item) => {
        // 添加No字段，取出荷No的后两位
        const shippingNo = item.shipping_no || ''
        item.no = shippingNo.slice(-2) || '00'
      })
    }

    listData.value = data || []

    console.log('最终赋值的数据:', listData.value)
    console.log('listData.value 是否为数组:', Array.isArray(listData.value))
    console.log('listData.value 长度:', listData.value?.length)
  } catch (error) {
    console.error('获取出荷便リスト数据失败:', error)
    ElMessage.error('データの取得に失敗しました')
    listData.value = []
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  const today = new Date().toISOString().slice(0, 10)
  filters.dateRange = [today, today]
  filters.destinationCds = []
  filters.selectedGroup = -1
  fetchListData()
}

// 日期变化处理
function handleDateChange() {
  if (filters.dateRange && filters.dateRange.length === 2) {
    fetchListData()
  }
}

// 调整日期
function adjustDate(days) {
  if (filters.dateRange && filters.dateRange.length === 2) {
    const startDate = new Date(filters.dateRange[0])
    const endDate = new Date(filters.dateRange[1])

    startDate.setDate(startDate.getDate() + days)
    endDate.setDate(endDate.getDate() + days)

    filters.dateRange = [startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]
    fetchListData()
  }
}

// 回到今天
function goToToday() {
  const today = new Date().toISOString().slice(0, 10)
  filters.dateRange = [today, today]
  fetchListData()
}

// 納入先变化处理
function handleDestinationChange() {
  fetchListData()
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ja-JP').replace(/\//g, '-')
}

// 合计行
function getSummaries(param) {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合計'
      return
    }
    if (column.property === 'quantity') {
      const values = data.map((item) => Number(item.quantity || 0))
      if (!values.every((value) => isNaN(value))) {
        sums[index] = values.reduce((prev, curr) => prev + curr, 0)
      } else {
        sums[index] = ''
      }
    } else {
      sums[index] = ''
    }
  })
  return sums
}

// 报告处理
function handleReport() {
  reportDialogVisible.value = true
}

// 执行前端打印
function executeFrontendPrint(contentRef) {
  if (!contentRef || !contentRef.innerHTML) {
    ElMessage.error('印刷内容の取得に失敗しました。')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('ポップアップがブロックされました。ブラウザの設定を確認してください。')
    return
  }

  const printHtml = contentRef.innerHTML
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>出荷便リスト印刷</title>
        ${styles}
      </head>
      <body>
        <div class="print-container">
          ${printHtml}
        </div>
      </body>
    </html>
  `)

  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

// 加载保存的分组
function loadDestinationGroups() {
  try {
    const savedGroups = localStorage.getItem('destination_groups_list')
    if (savedGroups) {
      const groups = JSON.parse(savedGroups)
      destinationGroups.value = groups
    }
  } catch (error) {
    console.error('加载分组失败:', error)
  }
}

// 分组更新处理
function handleGroupsUpdated(groups) {
  if (Array.isArray(groups)) {
    destinationGroups.value = groups
    // 如果当前选中的分组被清空了，重置为全部
    if (filters.selectedGroup >= 0 && groups[filters.selectedGroup]?.destinations?.length === 0) {
      filters.selectedGroup = -1
      handleGroupChange()
    }
  }
}

// 分组选择变化处理
function handleGroupChange() {
  if (filters.selectedGroup === -1) {
    // 选择全部，清空筛选条件
    filters.destinationCds = []
  } else {
    // 选择特定分组，设置筛选条件为该分组的纳入先
    const selectedGroup = destinationGroups.value?.[filters.selectedGroup]
    if (
      selectedGroup?.destinations &&
      Array.isArray(selectedGroup.destinations) &&
      selectedGroup.destinations.length > 0
    ) {
      filters.destinationCds = selectedGroup.destinations.map((dest) => dest?.value).filter(Boolean)
    } else {
      filters.destinationCds = []
    }
  }
  fetchListData()
}
</script>

<style scoped>
.shipping-list-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.list-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: none;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #ffffff;
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.header-actions .el-button {
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.filter-section {
  margin: 32px;
  padding: 28px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-section .el-form-item {
  margin-bottom: 20px;
}

.filter-section .el-form-item__label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.date-filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-filter-container .el-button-group .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.destination-filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.destination-filter-container .el-button {
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.stats-section {
  margin: 32px;
  padding: 28px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 123, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.stats-section :deep(.el-statistic) {
  position: relative;
  z-index: 1;
}

.stats-section :deep(.el-statistic__content) {
  color: white;
  font-weight: 700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stats-section :deep(.el-statistic__head) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.table-section {
  margin: 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.list-table-container {
  border-radius: 16px;
  overflow: hidden;
  background: white;
}

.list-table-container :deep(.el-table) {
  border-radius: 16px;
}

.list-table-container :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.list-table-container :deep(.el-table__header th) {
  background: transparent;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}

.list-table-container :deep(.el-table__body tr:hover) {
  background-color: #f8fafc;
}

.list-table-container :deep(.el-table__footer) {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  font-weight: 700;
}

.destination-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.destination-icon {
  color: #007bff;
  font-size: 16px;
}

.shipping-tag {
  font-weight: 600;
  border-radius: 8px;
  padding: 4px 8px;
}

.total-boxes {
  font-weight: 700;
  font-size: 16px;
}

.report-dialog {
  border-radius: 16px;
}

.dialog-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-header-actions {
  display: flex;
  gap: 12px;
}

.report-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

@media print {
  .shipping-list-page {
    background: white;
    padding: 0;
  }

  .list-card {
    box-shadow: none;
    border: none;
  }

  .filter-section,
  .stats-section {
    display: none;
  }

  .table-section {
    margin: 0;
  }
}
</style>