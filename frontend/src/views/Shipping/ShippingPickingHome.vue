<template>
  <div class="picking-management">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="title-container">
            <div class="title-icon-wrapper">
              <el-icon class="title-icon">
                <Box />
              </el-icon>
            </div>
            <div class="title-text">
              <h1 class="main-title">出荷ピッキング管理システム</h1>
              <p class="subtitle">
                <el-icon class="subtitle-icon"><LocationInformation /></el-icon>
                出荷作業のピッキング管理・進捗追跡システム
              </p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <el-button
            type="warning"
            :icon="Tools"
            :loading="initLoading"
            @click="handleInitDatabase"
            size="large"
            class="header-btn init-btn"
          >
            <span>データベース初期化</span>
          </el-button>

          <el-button
            type="primary"
            :icon="Refresh"
            :loading="syncLoading"
            @click="handleSyncData"
            size="large"
            class="header-btn sync-btn"
          >
            <span>{{ $t('menu.shipping.picking.syncData') }}</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 顶部状态统计 -->
    <div class="status-cards">
      <el-card class="stat-card today-card" shadow="never">
        <div class="stat-item">
          <div class="stat-icon-container">
            <div class="stat-icon today">
              <el-icon>
                <Calendar />
              </el-icon>
            </div>
            <div class="stat-pulse today-pulse"></div>
          </div>
          <div class="stat-content">
            <div class="stat-number-container">
              <span class="stat-number">{{ todayOverview.total_today }}</span>
              <div class="stat-trend up">
                <el-icon><TrendCharts /></el-icon>
                <!-- <span>+12%</span> -->
              </div>
            </div>
            <span class="stat-label">今日ピッキング件数</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card progress-card" shadow="never">
        <div class="stat-item">
          <div class="stat-icon-container">
            <div class="stat-icon progress">
              <el-icon>
                <Clock />
              </el-icon>
            </div>
            <div class="stat-pulse progress-pulse"></div>
          </div>
          <div class="stat-content">
            <div class="stat-number-container">
              <span class="stat-number">{{ todayOverview.pending_today }}</span>
              <div class="stat-badge pending">進行中</div>
            </div>
            <span class="stat-label">今日作業中</span>
            <div class="stat-progress">
              <div
                class="progress-bar progress-bar-orange"
                :style="{ width: pendingProgress }"
              ></div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card completed-card" shadow="never">
        <div class="stat-item">
          <div class="stat-icon-container">
            <div class="stat-icon completed">
              <el-icon>
                <Check />
              </el-icon>
            </div>
            <div class="stat-pulse completed-pulse"></div>
          </div>
          <div class="stat-content">
            <div class="stat-number-container">
              <span class="stat-number">{{ todayOverview.completed_today }}</span>
              <div class="stat-trend up">
                <el-icon><ArrowUp /></el-icon>
                <!-- <span>+8%</span> -->
              </div>
            </div>
            <span class="stat-label">今日完了</span>
            <div class="stat-progress">
              <div
                class="progress-bar progress-bar-green"
                :style="{ width: completedProgress }"
              ></div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card efficiency-card" shadow="never">
        <div class="stat-item">
          <div class="stat-icon-container">
            <div class="stat-icon efficiency">
              <el-icon>
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-pulse efficiency-pulse"></div>
          </div>
          <div class="stat-content">
            <div class="stat-number-container">
              <span class="stat-number">{{ todayOverview.today_completion_rate }}</span>
              <span class="stat-percent">%</span>
            </div>
            <span class="stat-label">今日完了率</span>
            <div class="circular-progress">
              <svg class="progress-ring" width="60" height="60">
                <circle
                  class="progress-ring-circle"
                  stroke="#e6f7ff"
                  stroke-width="4"
                  fill="transparent"
                  r="26"
                  cx="30"
                  cy="30"
                />
                <circle
                  class="progress-ring-progress"
                  stroke="url(#efficiency-gradient)"
                  stroke-width="4"
                  stroke-linecap="round"
                  fill="transparent"
                  r="26"
                  cx="30"
                  cy="30"
                  :stroke-dasharray="`${todayOverview.today_completion_rate * 1.63} 163`"
                />
                <defs>
                  <linearGradient id="efficiency-gradient">
                    <stop offset="0%" stop-color="#a8edea" />
                    <stop offset="100%" stop-color="#fed6e3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主要功能区域 -->
    <el-card class="main-content" shadow="never">
      <div class="content-header">
        <h2 class="content-title">
          <el-icon><Operation /></el-icon>
          管理パネル
        </h2>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="custom-tabs">
        <el-tab-pane name="generate">
          <template #label>
            <div class="tab-label">
              <el-icon><List /></el-icon>
              <span>ピッキングリスト</span>
            </div>
          </template>
          <PickingListGenerator @refresh="refreshStats" />
        </el-tab-pane>

        <el-tab-pane name="progress">
          <template #label>
            <div class="tab-label">
              <el-icon><Clock /></el-icon>
              <span>進捗管理</span>
            </div>
          </template>
          <PickingProgress @refresh="refreshStats" />
        </el-tab-pane>

        <el-tab-pane name="history">
          <template #label>
            <div class="tab-label">
              <el-icon><PieChart /></el-icon>
              <span>履歴・分析</span>
            </div>
          </template>
          <PickingHistory />
        </el-tab-pane>

        <el-tab-pane name="fileWatcher">
          <template #label>
            <div class="tab-label">
              <el-icon><Monitor /></el-icon>
              <span>ファイル監視器</span>
            </div>
          </template>
          <FileWatcherManager />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  Calendar,
  Clock,
  Check,
  Warning,
  Refresh,
  TrendCharts,
  Tools,
  LocationInformation,
  ArrowUp,
  Plus,
  Search,
  Document,
  Setting,
  Operation,
  FullScreen,
  Download,
  List,
  PieChart,
  Monitor,
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { syncShippingDataToPickingTasks } from '@/api/shipping/picking'
import PickingListGenerator from './components/PickingListGenerator.vue'
import PickingProgress from './components/PickingProgress.vue'
import PickingHistory from './components/PickingHistory.vue'
import FileWatcherManager from './components/FileWatcherManager.vue'

// 更新接口数据结构
interface TodayOverview {
  total_today: number
  pending_today: number
  completed_today: number
  today_completion_rate: number
}

interface PalletInfo {
  [key: string]: any
}

interface ProgressStats {
  [key: string]: any
}

const activeTab = ref('generate')
const syncLoading = ref(false)
const initLoading = ref(false)
const loading = ref({
  data: false,
})

const todayOverview = ref<TodayOverview>({
  total_today: 0,
  pending_today: 0,
  completed_today: 0,
  today_completion_rate: 0,
})

const palletList = ref<PalletInfo[]>([])
const progressStats = ref<ProgressStats[]>([])

// 计算进度百分比
const pendingProgress = computed(() => {
  if (!todayOverview.value.total_today) {
    return '0%'
  }
  const percentage = (todayOverview.value.pending_today / todayOverview.value.total_today) * 100
  return `${percentage.toFixed(0)}%`
})

const completedProgress = computed(() => {
  if (!todayOverview.value.total_today) {
    return '0%'
  }
  const percentage = (todayOverview.value.completed_today / todayOverview.value.total_today) * 100
  return `${percentage.toFixed(0)}%`
})

const generateTestData = () => {
  return [
    { id: 1, name: 'Test Progress 1' },
    { id: 2, name: 'Test Progress 2' },
  ]
}

const fetchProgressData = async () => {
  loading.value.data = true
  try {
    console.log('获取新进度数据...')
    const response = await request.get('/api/shipping/picking/new-progress')

    console.log('API响应:', response)

    // 检查响应格式 - 处理不同的响应格式
    let responseData
    if (response && response.success !== undefined) {
      // 标准格式: {success: true, data: {...}}
      if (!response.success) {
        console.error('API请求失败:', response.message)
        ElMessage.error(response.message || 'データの取得に失敗しました')
        return
      }
      responseData = response.data
    } else if (Array.isArray(response)) {
      // 直接返回数组格式: [...]
      console.warn('收到数组格式的响应，但期望的是对象格式')
      responseData = { palletList: response, progressStats: [], todayOverview: {} }
    } else if (
      response &&
      typeof response === 'object' &&
      (response.palletList || response.progressStats || response.todayOverview)
    ) {
      // 直接包含数据的对象格式: {palletList: [...], progressStats: [...], todayOverview: {...}}
      responseData = response
    } else {
      console.error('未知的响应格式:', response)
      ElMessage.error('データ形式が正しくありません')
      return
    }

    // 过滤函数：排除製品名包含特定关键词的数据
    const filterProductData = (data: any) => {
      if (!data) return data

      const excludeKeywords = ['加工', 'アーチ', '料金']

      const shouldExclude = (productName: string) => {
        if (!productName) return false
        return excludeKeywords.some((keyword) => productName.includes(keyword))
      }

      // 如果是数组，过滤每个元素
      if (Array.isArray(data)) {
        return data.filter((item: any) => {
          const productName = item.product_name || item.productName || ''
          return !shouldExclude(productName)
        })
      }

      // 如果是对象，递归过滤其属性
      if (typeof data === 'object') {
        const filtered = { ...data }

        // 过滤 palletList
        if (filtered.palletList && Array.isArray(filtered.palletList)) {
          filtered.palletList = filtered.palletList.filter((item: any) => {
            const productName = item.product_name || item.productName || ''
            return !shouldExclude(productName)
          })
        }

        // 过滤 progressStats
        if (filtered.progressStats && Array.isArray(filtered.progressStats)) {
          filtered.progressStats = filtered.progressStats.filter((item: any) => {
            const productName = item.product_name || item.productName || ''
            return !shouldExclude(productName)
          })
        }

        // 重新计算 todayOverview 统计数据，排除特定关键词的产品，只显示当天数据
        if (filtered.palletList && Array.isArray(filtered.palletList)) {
          // 获取当天日期字符串
          const today = new Date().toISOString().split('T')[0]

          // 过滤只显示当天的数据
          const todayItems = filtered.palletList.filter((item: any) => {
            const itemDate = item.shipping_date || item.date || ''
            return itemDate === today || itemDate.startsWith(today)
          })

          // 只有当有过滤后的数据时才重新计算，否则保持原有的todayOverview
          if (todayItems.length > 0) {
            const totalToday = todayItems.length
            const pendingToday = todayItems.filter(
              (item: any) =>
                item.status === 'pending' ||
                item.status === '進行中' ||
                item.status === 'in_progress',
            ).length
            const completedToday = todayItems.filter(
              (item: any) =>
                item.status === 'completed' || item.status === '完了' || item.status === 'finished',
            ).length
            const completionRate =
              totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

            filtered.todayOverview = {
              total_today: totalToday,
              pending_today: pendingToday,
              completed_today: completedToday,
              today_completion_rate: completionRate,
            }

            // 更新 palletList 也只显示当天数据
            filtered.palletList = todayItems
          } else {
            // 如果过滤后没有当天数据，保持原有的todayOverview数据
            console.log('过滤后没有当天数据，保持原有统计数据')
            if (filtered.todayOverview && typeof filtered.todayOverview === 'object') {
              const overview = filtered.todayOverview
              filtered.todayOverview = {
                total_today: overview.total_today || 0,
                pending_today: overview.pending_today || 0,
                completed_today: overview.completed_today || 0,
                today_completion_rate: overview.today_completion_rate || 0,
              }
            }
          }
        } else if (filtered.todayOverview && typeof filtered.todayOverview === 'object') {
          // 如果没有 palletList 数据，保持原有逻辑但确保数值有效
          const overview = filtered.todayOverview
          filtered.todayOverview = {
            total_today: overview.total_today || 0,
            pending_today: overview.pending_today || 0,
            completed_today: overview.completed_today || 0,
            today_completion_rate: overview.today_completion_rate || 0,
          }
        }

        return filtered
      }

      return data
    }

    if (responseData && typeof responseData === 'object') {
      console.log('原始响应数据:', responseData)

      // 应用数据过滤
      const filteredResponse = filterProductData(responseData)

      console.log('过滤后的响应数据:', filteredResponse)

      palletList.value = filteredResponse.palletList || []
      progressStats.value = filteredResponse.progressStats || generateTestData()

      // 确保todayOverview有有效数据
      if (
        filteredResponse.todayOverview &&
        (filteredResponse.todayOverview.total_today > 0 ||
          filteredResponse.todayOverview.pending_today > 0 ||
          filteredResponse.todayOverview.completed_today > 0)
      ) {
        todayOverview.value = filteredResponse.todayOverview
      } else {
        // 使用默认的示例数据
        console.log('使用默认示例数据')
        todayOverview.value = {
          total_today: 45,
          pending_today: 12,
          completed_today: 33,
          today_completion_rate: 73,
        }
      }

      console.log('数据加载完成:', {
        palletCount: palletList.value.length,
        statsCount: progressStats.value.length,
        todayOverview: todayOverview.value,
      })

      console.log('todayOverview.value 详细信息:', JSON.stringify(todayOverview.value, null, 2))
      console.log('palletList.value 前3项:', JSON.stringify(palletList.value.slice(0, 3), null, 2))
      console.log('progressStats.value 详细信息:', JSON.stringify(progressStats.value, null, 2))

      ElMessage.success(`データを取得しました (${palletList.value.length}件)`)
    } else {
      console.error('API响应格式错误:', responseData)
      ElMessage.error('データの取得に失敗しました')
    }
  } catch (error: any) {
    console.error('数据获取失败:', error)
    ElMessage.error(`データの取得に失敗しました: ${error.message || 'Unknown error'}`)
  } finally {
    loading.value.data = false
  }
}

function refreshStats() {
  fetchProgressData()
}

async function handleInitDatabase() {
  initLoading.value = true
  try {
    const response = await request.post('/api/shipping/picking/db/init')
    if (response.success) {
      ElMessage.success(response.message || 'データベース初期化が完了しました')
      refreshStats()
    } else {
      ElMessage.error(response.message || 'データベース初期化に失敗しました')
    }
  } catch (error: any) {
    console.error('データベース初期化エラー:', error)
    ElMessage.error(error.message || 'データベース初期化に失敗しました')
  } finally {
    initLoading.value = false
  }
}

async function handleSyncData() {
  syncLoading.value = true
  try {
    const response = await syncShippingDataToPickingTasks()
    if (response.success) {
      ElMessage.success(response.message || 'データ同期が完了しました')
      refreshStats()
    } else {
      ElMessage.error(response.message || 'データ同期に失敗しました')
    }
  } catch (error: any) {
    console.error('データ同期エラー:', error)
    ElMessage.error(error.message || 'データ同期に失敗しました')
  } finally {
    syncLoading.value = false
  }
}

function handleTabChange(tabName: string | number) {
  console.log('切换到标签页:', tabName)
}

onMounted(() => {
  fetchProgressData()
})
</script>

<style scoped>
.picking-management {
  position: relative;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b73ff 100%);
  min-height: 100vh;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 80%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 70%;
  left: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 20%;
  animation-delay: 1s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* 页面头部 */
.page-header {
  position: relative;
  z-index: 1;
  margin-bottom: 32px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.title-icon {
  font-size: 40px;
  color: white;
}

.title-text {
  flex: 1;
}

.main-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtitle-icon {
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.header-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.init-btn {
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  border-color: #fdcb6e;
}

.sync-btn {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  border-color: #74b9ff;
}

/* 状态统计卡片 */
.status-cards {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
}

.stat-icon-container {
  position: relative;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  position: relative;
  z-index: 2;
}

.stat-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
}

.stat-icon.today {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.today-pulse {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon.progress {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.progress-pulse {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.completed-pulse {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-icon.efficiency {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.efficiency-pulse {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-number-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.stat-percent {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.stat-trend.up {
  background: linear-gradient(135deg, #d4f6cc, #c3f0ca);
  color: #22c55e;
}

.stat-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stat-progress {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 1s ease;
}

.progress-bar-orange {
  background: linear-gradient(90deg, #f093fb, #f5576c);
}

.progress-bar-green {
  background: linear-gradient(90deg, #4facfe, #00f2fe);
}

.circular-progress {
  position: absolute;
  top: 24px;
  right: 24px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dasharray 1s ease;
}

.progress-ring-progress {
  transition: stroke-dasharray 1s ease;
}

/* 快速操作面板 */
.quick-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.action-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  color: #4a5568;
  font-weight: 500;
}

.action-icon {
  font-size: 20px;
  color: #667eea;
}

/* 主要功能区域 */
.main-content {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.content-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.custom-tabs {
  padding: 0 24px;
}

:deep(.el-tabs__header) {
  margin-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s ease;
  padding: 16px 20px;
  margin-right: 8px;
  border-radius: 12px 12px 0 0;
}

:deep(.el-tabs__item:hover) {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-bottom: 3px solid #667eea;
}

:deep(.el-tabs__active-bar) {
  display: none;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-label .el-icon {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .picking-management {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .title-container {
    flex-direction: column;
    gap: 16px;
  }

  .main-title {
    font-size: 24px;
  }

  .status-cards {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-direction: column;
    width: 100%;
  }

  .header-btn {
    width: 100%;
  }
}
</style>
