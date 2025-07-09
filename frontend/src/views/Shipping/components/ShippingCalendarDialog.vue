<template>
  <el-dialog
    v-model="visible"
    title="営業報告カレンダー"
    width="70%"
    :close-on-click-modal="false"
    class="shipping-calendar-dialog"
    @close="handleClose"
  >
    <div class="calendar-container">
      <!-- 月份导航 -->
      <div class="month-navigation">
        <el-button-group>
          <el-button @click="previousMonth" :icon="ArrowLeft">前月</el-button>
          <el-button @click="goToCurrentMonth">今月</el-button>
          <el-button @click="nextMonth" :icon="ArrowRight">来月</el-button>
        </el-button-group>
        <div class="current-month">
          {{ formatMonth(currentMonth) }}
        </div>
        <el-button type="primary" :icon="Setting" @click="showGroupManager = true">
          グループ管理
        </el-button>
      </div>

      <!-- 日历网格 -->
      <div class="calendar-grid">
        <!-- 星期标题 -->
        <div class="weekday-header">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>

        <!-- 日期网格 -->
        <div class="date-grid">
          <!-- 空白日期(前月) -->
          <div v-for="n in startEmptyDays" :key="`empty-start-${n}`" class="date-cell empty"></div>

          <!-- 本月日期 -->
          <div
            v-for="date in daysInMonth"
            :key="date"
            class="date-cell"
            :class="{
              today: isToday(date),
              weekend: isWeekend(date),
              'has-data': hasShippingData(date),
            }"
          >
            <div class="date-number">{{ date }}</div>

            <!-- 打印按钮组 -->
            <div class="print-buttons" v-if="hasShippingData(date)">
              <div
                v-for="(groupName, groupIndex) in groupNames"
                :key="groupIndex"
                class="group-button-wrapper"
                :class="{
                  'has-data': hasGroupData(date, groupIndex),
                  'is-printed': isPrinted(date, groupIndex),
                  'no-data': !hasGroupData(date, groupIndex),
                }"
              >
                <el-button
                  :type="getButtonType(date, groupIndex)"
                  size="small"
                  @click="handleGroupPrint(date, groupIndex)"
                  :disabled="!hasGroupData(date, groupIndex)"
                  class="group-button"
                  :class="{
                    'is-printed': isPrinted(date, groupIndex),
                    [`group-${groupIndex}`]: true,
                  }"
                >
                  <div class="button-content">
                    <span class="button-text">{{ groupName }}</span>
                    <div v-if="isPrinted(date, groupIndex)" class="print-badge">
                      <el-icon class="print-icon"><Check /></el-icon>
                      <span class="print-text">発行済</span>
                    </div>
                  </div>
                </el-button>
              </div>
            </div>

            <!-- 数据指示器 -->
            <div v-if="hasShippingData(date)" class="data-indicator">
              <el-tag size="small" type="info"> {{ getShippingCount(date) }}件 </el-tag>
            </div>
          </div>

          <!-- 空白日期(下月) -->
          <div v-for="n in endEmptyDays" :key="`empty-end-${n}`" class="date-cell empty"></div>
        </div>
      </div>
    </div>

    <!-- 分组管理弹窗 -->
    <DestinationGroupManager
      v-model="showGroupManager"
      storage-key="destination_groups_calendar"
      @groups-updated="handleGroupsUpdated"
    />

    <!-- 打印对话框 -->
    <el-dialog
      v-model="printDialogVisible"
      width="90%"
      :close-on-click-modal="false"
      class="print-preview-dialog"
    >
      <template #header>
        <div class="print-dialog-header">
          <span class="print-dialog-title">
            印刷プレビュー - {{ formatDate(selectedDate) }} {{ groupNames[selectedGroup] }}
          </span>
          <div class="print-dialog-actions">
            <el-button @click="printDialogVisible = false">キャンセル</el-button>
            <el-button type="primary" @click="executePrint">印刷実行</el-button>
          </div>
        </div>
      </template>
      <div ref="printContent" class="print-content">
        <ShippingReport
          v-if="printData && printData.length > 0"
          :data="printData"
          :filters="printFilters"
        />
        <div v-else class="no-data-message">該当するデータがありません</div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Setting, Check } from '@element-plus/icons-vue'
import request from '@/utils/request'
import ShippingReport from './ShippingReport.vue'
import DestinationGroupManager from './DestinationGroupManager.vue'
import { recordPrintHistory } from '@/api/shipping/printHistory'
import testPrintHistoryUtils from '@/utils/testPrintHistory'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 获取日本时区的当前日期
const getJapanDate = () => {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const japanTime = new Date(utc + 9 * 3600000) // JST = UTC+9
  return japanTime
}

// 将任意日期转换为日本时区
const toJapanDate = (date) => {
  if (!date) return null
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const japanTime = new Date(utc + 9 * 3600000)
  return japanTime
}

// 创建日本时区的日期对象
const createJapanDate = (year, month, day = 1) => {
  // 在日本时区创建日期，避免时区转换问题
  const date = new Date()
  date.setFullYear(year)
  date.setMonth(month)
  date.setDate(day)
  date.setHours(12, 0, 0, 0) // 设置为正午，避免夏令时问题
  return date
}

const currentMonth = ref(getJapanDate())
const shippingData = ref({}) // 按日期存储出荷数据
const printHistory = ref({}) // 打印历史 {date: {groupIndex: boolean}}
const destinationGroups = ref([{ destinations: [] }, { destinations: [] }, { destinations: [] }])
const showGroupManager = ref(false)
const printDialogVisible = ref(false)
const selectedDate = ref(null)
const selectedGroup = ref(0)
const printData = ref([])
const printContent = ref(null)

const weekdays = ['日', '月', '火', '水', '木', '金', '土']
const groupNames = ['オワリ便', '鈴鹿便', '社内便']

// 计算属性
const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return createJapanDate(year, month + 1, 0).getDate()
})

const startEmptyDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = createJapanDate(year, month, 1)
  return firstDay.getDay()
})

const endEmptyDays = computed(() => {
  const totalCells = 42 // 6周 × 7天
  const filledCells = startEmptyDays.value + daysInMonth.value
  return Math.max(0, totalCells - filledCells)
})

const printFilters = computed(() => {
  if (!selectedDate.value) return {}

  const dateStr = formatDateString(selectedDate.value)
  const group = destinationGroups.value[selectedGroup.value]

  return {
    dateRange: [dateStr, dateStr],
    destinationCds: group?.destinations?.map((dest) => dest.value) || [],
    selectedGroup: selectedGroup.value,
  }
})

// 方法
onMounted(() => {
  // console.log('ShippingCalendarDialog: 初期化中...')
  // console.log('現在の日本時刻:', getJapanDate().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
  // console.log('現在の月:', formatMonth(currentMonth.value))
  loadDestinationGroups()
  fetchMonthData()
  loadPrintHistory()

  // 添加测试功能到全局变量，便于调试
  if (typeof window !== 'undefined') {
    window.shippingCalendarDebug = {
      loadPrintHistory,
      printHistory,
      addTestData: () => {
        // 添加一些本地测试数据
        const testHistory = {
          '2025-01-08': { 1: true }, // 鈴鹿便
          '2025-01-10': { 0: true }, // オワリ便
          '2025-01-15': { 2: true }, // 社内便
        }
        printHistory.value = { ...printHistory.value, ...testHistory }
        console.log('🧪 本地测试数据已添加:', testHistory)
      },
      clearData: () => {
        printHistory.value = {}
        console.log('🧹 打印历史数据已清除')
      },
      addTestDataToAPI: async () => {
        // 通过API添加测试数据
        try {
          await testPrintHistoryUtils.addTestData()
          // 重新加载打印历史
          await loadPrintHistory()
          console.log('🎉 API测试数据添加完成，数据已重新加载')
        } catch (error) {
          console.error('❌ API测试数据添加失败:', error)
        }
      },
      runFullAPITest: async () => {
        try {
          const result = await testPrintHistoryUtils.runFullTest()
          // 重新加载打印历史
          await loadPrintHistory()
          console.log('🎉 完整API测试完成，数据已重新加载')
          return result
        } catch (error) {
          console.error('❌ 完整API测试失败:', error)
        }
      },
    }
    console.log('🔧 调试工具已添加到 window.shippingCalendarDebug')
    console.log('使用方法:')
    console.log('- window.shippingCalendarDebug.addTestData() // 添加本地测试数据')
    console.log('- window.shippingCalendarDebug.addTestDataToAPI() // 通过API添加测试数据')
    console.log('- window.shippingCalendarDebug.runFullAPITest() // 运行完整API测试')
    console.log('- window.shippingCalendarDebug.loadPrintHistory() // 重新加载打印历史')
  }
})

watch(
  () => currentMonth.value,
  () => {
    console.log('月が変更されました:', formatMonth(currentMonth.value))
    fetchMonthData()
    loadPrintHistory()
  },
)

// 加载分组配置
function loadDestinationGroups() {
  try {
    const savedGroups = localStorage.getItem('destination_groups_calendar')
    if (savedGroups) {
      destinationGroups.value = JSON.parse(savedGroups)
    }
  } catch (error) {
    console.error('グループ設定の読み込みに失敗しました:', error)
  }
}

// 获取月份数据
async function fetchMonthData() {
  try {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth()
    // 使用日本时区创建日期
    const startDate = createJapanDate(year, month, 1)
    const endDate = createJapanDate(year, month + 1, 0)

    const params = {
      date_from: formatDateString(startDate),
      date_to: formatDateString(endDate),
    }

    const response = await request.get('/api/shipping/overview', { params })

    // 处理响应数据
    let data = null
    if (Array.isArray(response)) {
      data = response
    } else if (response && Array.isArray(response.data)) {
      data = response.data
    }

    // 按日期分组数据
    const dateGroupedData = {}
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        const date = item.shipping_date
        if (!dateGroupedData[date]) {
          dateGroupedData[date] = []
        }
        dateGroupedData[date].push(item)
      })
    }

    shippingData.value = dateGroupedData
    console.log('月間データを取得しました:', dateGroupedData)
  } catch (error) {
    console.error('月間データの取得に失敗しました:', error)
    ElMessage.error('月間データの取得に失敗しました')
  }
}

// 加载打印历史
async function loadPrintHistory() {
  try {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth()
    // 使用日本时区创建日期
    const startDate = createJapanDate(year, month, 1)
    const endDate = createJapanDate(year, month + 1, 0)

    const params = {
      date_from: formatDateString(startDate),
      date_to: formatDateString(endDate),
      report_type: 'shipping_calendar',
    }

    // console.log('🔍 打印履歴を検索中...', params)
    const response = await request.get('/api/shipping/print/history', { params })
    // console.log('📋 API応答 (原始):', response)
    // console.log('📋 API応答 (类型):', typeof response)
    // console.log('📋 API応答 (键值):', Object.keys(response || {}))

    // 处理打印历史数据
    const history = {}

    // 尝试从不同的响应格式中提取数据
    let printRecords = null
    if (response?.data?.list && Array.isArray(response.data.list)) {
      printRecords = response.data.list
    } else if (response?.list && Array.isArray(response.list)) {
      printRecords = response.list
    } else if (Array.isArray(response)) {
      printRecords = response
    } else if (response?.data && Array.isArray(response.data)) {
      printRecords = response.data
    }

    console.log('🔍 提取到的打印记录:', printRecords)

    if (printRecords && Array.isArray(printRecords)) {
      console.log(`📊 ${printRecords.length}件の打印履歴を処理中...`)

      printRecords.forEach((record, index) => {
        console.log(`🔍 処理中 ${index + 1}/${printRecords.length}:`, record)

        if (record.report_title && record.status === '成功') {
          // 解析 report_title 格式: '出荷報告書カレンダー - 2025-1-8 鈴鹿便'
          const titleMatch = record.report_title.match(
            /出荷報告書カレンダー\s*-\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\s+(.+)/,
          )

          if (titleMatch) {
            const dateStr = titleMatch[1].trim() // 例如: "2025-1-8"
            const groupName = titleMatch[2].trim() // 例如: "鈴鹿便"

            console.log(`📅 解析した日付: "${dateStr}", グループ名: "${groupName}"`)

            // 将日期格式标准化为 YYYY-MM-DD
            const dateParts = dateStr.split(/[-\/]/)
            if (dateParts.length === 3) {
              const standardDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`

              // 根据组名映射到组索引
              let groupIndex = -1
              const groupNameMap = {
                オワリ便: 0,
                鈴鹿便: 1,
                社内便: 2,
              }

              groupIndex = groupNameMap[groupName] ?? -1

              if (groupIndex >= 0) {
                if (!history[standardDate]) {
                  history[standardDate] = {}
                }
                history[standardDate][groupIndex] = true
                console.log(
                  `✅ 打印履歴を登録: ${standardDate} ${groupName} (インデックス${groupIndex})`,
                )
              } else {
                console.warn(`⚠️ 未知のグループ名: "${groupName}"`)
              }
            } else {
              console.warn(`⚠️ 日付解析に失敗: "${dateStr}"`)
            }
          } else {
            console.warn(`⚠️ タイトル解析に失敗: "${record.report_title}"`)
          }
        }
      })
    } else {
      console.log('📭 打印履歴データが見つかりません')
    }

    printHistory.value = history
    console.log('🎯 最終的な打印履歴:', history)
    console.log(`📈 登録された日付数: ${Object.keys(history).length}`)
  } catch (error) {
    console.error('❌ 打印履歴の読み込みに失敗しました:', error)
    ElMessage.error('打印履歴の読み込みに失敗しました')
  }
}

// 月份导航
function previousMonth() {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() - 1)
  currentMonth.value = toJapanDate(newMonth)
}

function nextMonth() {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() + 1)
  currentMonth.value = toJapanDate(newMonth)
}

function goToCurrentMonth() {
  currentMonth.value = getJapanDate()
}

// 日期相关方法
function isToday(date) {
  const today = getJapanDate()
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === date
}

function isWeekend(date) {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const dayOfWeek = createJapanDate(year, month, date).getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function hasShippingData(date) {
  const dateStr = formatDateString(
    createJapanDate(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), date),
  )
  return !!shippingData.value[dateStr]
}

function hasGroupData(date, groupIndex) {
  const dateStr = formatDateString(
    createJapanDate(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), date),
  )
  const dayData = shippingData.value[dateStr]
  if (!dayData || !Array.isArray(dayData)) return false

  const group = destinationGroups.value[groupIndex]
  if (!group?.destinations || group.destinations.length === 0) return false

  const groupDestinations = group.destinations.map((dest) => dest.value)
  return dayData.some((item) => groupDestinations.includes(item.destination_cd))
}

function getShippingCount(date) {
  const dateStr = formatDateString(
    createJapanDate(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), date),
  )
  const dayData = shippingData.value[dateStr]
  return dayData ? dayData.length : 0
}

function isPrinted(date, groupIndex) {
  const dateStr = formatDateString(
    createJapanDate(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), date),
  )
  const isAlreadyPrinted = printHistory.value[dateStr]?.[groupIndex] || false

  // 详细的调试信息
  const debugInfo = {
    date,
    groupIndex,
    groupName: groupNames[groupIndex],
    dateStr,
    historyForDate: printHistory.value[dateStr],
    isAlreadyPrinted,
  }

  if (isAlreadyPrinted) {
    console.log(`✅ 発行済み確認:`, debugInfo)
  } else {
    // 只在有数据的情况下显示未打印的调试信息
    if (hasShippingData(date) && hasGroupData(date, groupIndex)) {
      console.log(`⭕ 未発行:`, debugInfo)
    }
  }

  return isAlreadyPrinted
}

function getButtonType(date, groupIndex) {
  if (isPrinted(date, groupIndex)) {
    return 'success'
  }
  return hasGroupData(date, groupIndex) ? 'primary' : 'info'
}

// 打印处理
async function handleGroupPrint(date, groupIndex) {
  if (!hasGroupData(date, groupIndex)) {
    ElMessage.warning('該当するデータがありません')
    return
  }

  selectedDate.value = createJapanDate(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    date,
  )
  selectedGroup.value = groupIndex

  // 获取打印数据
  await fetchPrintData(selectedDate.value, groupIndex)

  printDialogVisible.value = true
}

async function fetchPrintData(date, groupIndex) {
  try {
    const dateStr = formatDateString(date)
    const group = destinationGroups.value[groupIndex]

    if (!group?.destinations || group.destinations.length === 0) {
      printData.value = []
      return
    }

    const destinationCds = group.destinations.map((dest) => dest.value)

    const params = {
      date_from: dateStr,
      date_to: dateStr,
      destination_cds: destinationCds.join(','),
    }

    const response = await request.get('/api/shipping/overview', { params })

    // 处理响应数据
    let data = null
    if (Array.isArray(response)) {
      data = response
    } else if (response && Array.isArray(response.data)) {
      data = response.data
    }

    printData.value = data || []
    console.log('印刷データを取得しました:', printData.value)
  } catch (error) {
    console.error('印刷データの取得に失敗しました:', error)
    ElMessage.error('印刷データの取得に失敗しました')
    printData.value = []
  }
}

async function executePrint() {
  if (!printContent.value || !printData.value || printData.value.length === 0) {
    ElMessage.error('印刷内容の取得に失敗しました')
    await recordPrintFailure('印刷内容の取得に失敗しました')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('ポップアップがブロックされました')
    await recordPrintFailure('ポップアップがブロックされました')
    return
  }

  const printHtml = printContent.value.innerHTML
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>出荷報告書印刷 - ${formatDate(selectedDate.value)} ${groupNames[selectedGroup.value]}</title>
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

  printWindow.onload = async () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()

    // 记录打印成功
    await recordPrintSuccess()

    // 更新打印状态
    updatePrintStatus()
  }

  printDialogVisible.value = false
}

async function recordPrintSuccess() {
  try {
    // 使用标准化的日期格式：YYYY-M-D（不带前导零）
    const year = selectedDate.value.getFullYear()
    const month = selectedDate.value.getMonth() + 1
    const day = selectedDate.value.getDate()
    const dateForTitle = `${year}-${month}-${day}`

    const reportTitle = `出荷報告書カレンダー - ${dateForTitle} ${groupNames[selectedGroup.value]}`

    console.log('記録打印履歴:', {
      report_type: 'shipping_calendar',
      report_title: reportTitle,
      filters: printFilters.value,
      record_count: printData.value?.length || 0,
      status: '成功',
    })

    const response = await recordPrintHistory({
      report_type: 'shipping_calendar',
      report_title: reportTitle,
      filters: printFilters.value,
      record_count: printData.value?.length || 0,
      status: '成功',
    })

    console.log('打印履歴の記録に成功しました:', response)
    ElMessage.success('打印履歴を記録しました')
  } catch (error) {
    console.error('打印履歴の記録に失敗しました:', error)
    ElMessage.error('打印履歴の記録に失敗しました')
  }
}

async function recordPrintFailure(errorMessage) {
  try {
    // 使用标准化的日期格式：YYYY-M-D（不带前导零）
    const year = selectedDate.value.getFullYear()
    const month = selectedDate.value.getMonth() + 1
    const day = selectedDate.value.getDate()
    const dateForTitle = `${year}-${month}-${day}`

    const reportTitle = `出荷報告書カレンダー - ${dateForTitle} ${groupNames[selectedGroup.value]}`

    console.log('記録打印失敗履歴:', {
      report_type: 'shipping_calendar',
      report_title: reportTitle,
      filters: printFilters.value,
      record_count: printData.value?.length || 0,
      status: '失敗',
      error_message: errorMessage,
    })

    const response = await recordPrintHistory({
      report_type: 'shipping_calendar',
      report_title: reportTitle,
      filters: printFilters.value,
      record_count: printData.value?.length || 0,
      status: '失敗',
      error_message: errorMessage,
    })

    console.log('打印失敗履歴の記録に成功しました:', response)
  } catch (error) {
    console.error('打印失敗履歴の記録に失敗しました:', error)
  }
}

function updatePrintStatus() {
  const dateStr = formatDateString(selectedDate.value)
  if (!printHistory.value[dateStr]) {
    printHistory.value[dateStr] = {}
  }
  printHistory.value[dateStr][selectedGroup.value] = true
}

// 分组更新处理
function handleGroupsUpdated(groups) {
  if (Array.isArray(groups)) {
    destinationGroups.value = groups
  }
}

// 工具方法
function formatMonth(date) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Tokyo',
  })
}

function formatDate(date) {
  return date
    .toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
    })
    .replace(/\//g, '-')
}

function formatDateString(date) {
  // 确保使用日本时区格式化日期字符串
  const japanDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000 + 9 * 3600000)
  return japanDate.toISOString().slice(0, 10)
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.shipping-calendar-dialog {
  border-radius: 16px;
}

.shipping-calendar-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.shipping-calendar-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 20px 24px;
}

.shipping-calendar-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 700;
  font-size: 18px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.calendar-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 600px;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.current-month {
  font-size: 20px;
  font-weight: 700;
  color: #374151;
}

.calendar-grid {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
}

.weekday {
  padding: 16px;
  text-align: center;
  font-weight: 700;
  color: #374151;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
}

.date-cell {
  background: white;
  min-height: 140px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.date-cell.empty {
  background: #f8fafc;
  opacity: 0.3;
}

.date-cell.today {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border: 3px solid #f59e0b;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
  position: relative;
  overflow: hidden;
}

.date-cell.today::before {
  content: '今日';
  position: absolute;
  top: 2px;
  right: 2px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.date-cell.weekend:not(.today) {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border-left: 3px solid #ef4444;
}

.date-cell.has-data:not(.today) {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-left: 4px solid #22c55e;
  box-shadow: 0 3px 12px rgba(34, 197, 94, 0.15);
}

.date-cell.has-data.weekend:not(.today) {
  background: linear-gradient(135deg, #fef7f2 0%, #fed7aa 100%);
  border-left: 4px solid #f97316;
}

.date-cell:hover:not(.empty) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.date-number {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 10px;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.date-cell.today .date-number {
  color: #d97706;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);
}

.date-cell.weekend .date-number {
  color: #dc2626;
}

.date-cell.has-data .date-number {
  color: #059669;
}

.date-cell.has-data.weekend .date-number {
  color: #ea580c;
}

.print-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.group-button-wrapper {
  position: relative;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group-button-wrapper.is-printed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.group-button-wrapper.has-data:not(.is-printed) {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border: 2px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.group-button-wrapper.no-data {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
  opacity: 0.7;
}

.group-button {
  width: 100%;
  padding: 8px 12px;
  font-size: 11px;
  border-radius: 8px;
  position: relative;
  min-height: 36px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.group-button:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.group-button:disabled {
  cursor: not-allowed;
  transform: none !important;
  filter: none !important;
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
}

.button-text {
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.group-button.is-printed .button-text {
  color: #047857;
}

.print-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
  animation: printBadgeGlow 2s infinite alternate;
}

.print-icon {
  font-size: 10px;
  animation: checkmark 0.6s ease-in-out;
}

.print-text {
  line-height: 1;
}

/* 不同组的特定颜色 */
.group-button-wrapper.has-data:not(.is-printed):nth-child(1) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.group-button-wrapper.has-data:not(.is-printed):nth-child(1) .button-text {
  color: #1d4ed8;
}

.group-button-wrapper.has-data:not(.is-printed):nth-child(2) {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.group-button-wrapper.has-data:not(.is-printed):nth-child(2) .button-text {
  color: #d97706;
}

.group-button-wrapper.has-data:not(.is-printed):nth-child(3) {
  background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.group-button-wrapper.has-data:not(.is-printed):nth-child(3) .button-text {
  color: #7c3aed;
}

/* 不同按钮的特定样式 */
.group-button:nth-child(1):not(.is-printed) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #2563eb;
  color: white;
}

.group-button:nth-child(1):not(.is-printed):hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.group-button:nth-child(2):not(.is-printed) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #d97706;
  color: white;
}

.group-button:nth-child(2):not(.is-printed):hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.group-button:nth-child(3):not(.is-printed) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: #7c3aed;
  color: white;
}

.group-button:nth-child(3):not(.is-printed):hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
}

.group-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
}

.data-indicator {
  text-align: center;
  margin-top: 4px;
}

.data-indicator .el-tag {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  border: 1px solid #6366f1;
  font-weight: 600;
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
  animation: dataIndicatorPulse 2s infinite ease-in-out;
}

@keyframes dataIndicatorPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.print-preview-dialog {
  border-radius: 16px;
}

.print-preview-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.print-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.print-dialog-title {
  color: white;
  font-weight: 700;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.print-dialog-actions .el-button {
  border-radius: 8px;
  font-weight: 600;
  margin-left: 8px;
}

.print-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
}

.no-data-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 16px;
  }

  .month-navigation {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .date-cell {
    min-height: 80px;
    padding: 4px;
  }

  .date-number {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .group-button {
    padding: 4px 6px;
    font-size: 9px;
    min-height: 22px;
  }

  .print-status {
    font-size: 8px;
  }
}

/* 滚动条美化 */
.print-content::-webkit-scrollbar {
  width: 8px;
}

.print-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.print-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 4px;
}

.print-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #218838 0%, #1ea97c 100%);
}

/* 动画效果 */
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.calendar-grid {
  animation: fadeInUp 0.6s ease-out;
}

.date-cell {
  animation: fadeInUp 0.3s ease-out;
}

.group-button-wrapper {
  animation: slideInLeft 0.4s ease-out;
}

.group-button-wrapper:nth-child(1) {
  animation-delay: 0.1s;
}

.group-button-wrapper:nth-child(2) {
  animation-delay: 0.2s;
}

.group-button-wrapper:nth-child(3) {
  animation-delay: 0.3s;
}

/* 打印徽章动画 */
@keyframes printBadgeGlow {
  0% {
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
  }
  100% {
    box-shadow:
      0 4px 12px rgba(16, 185, 129, 0.6),
      0 0 20px rgba(16, 185, 129, 0.3);
  }
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-45deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes buttonPrintSuccess {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.group-button-wrapper.is-printed {
  animation: buttonPrintSuccess 0.8s ease-out;
}

/* 悬停效果 */
.group-button-wrapper:hover:not(.no-data) {
  transform: translateY(-3px);
  filter: brightness(1.05);
}

.group-button-wrapper.is-printed:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.group-button-wrapper.has-data:not(.is-printed):hover {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

/* 脉动效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.group-button-wrapper.is-printed .print-badge {
  animation: pulse 2s infinite ease-in-out;
}
</style>
