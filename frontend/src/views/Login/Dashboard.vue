<template>
  <div class="dashboard-page">
    <!-- 🎉 顶部欢迎栏 -->
    <el-card class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-text">
          <div class="greeting-section">
            <h2>ようこそ、{{ userDisplayName }}さん 👋</h2>
            <div class="weather-info">
              <el-icon class="weather-icon">
                <Sunny />
              </el-icon>
              <span>今日は {{ today }}（{{ weather }}）です</span>
            </div>
            <p class="last-login">最終ログイン: {{ lastLoginTime }}</p>
          </div>
        </div>
        <div class="welcome-stats">
          <div class="uptime-display">
            <el-statistic title="システム稼働日数" :value="systemUptime" suffix="日" />
            <div class="system-status">
              <el-tag type="success" size="small">
                <el-icon>
                  <CircleCheck />
                </el-icon>
                正常運行中
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 📊 システム統計 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card processing-card">
          <div class="stat-icon">
            <el-icon>
              <Box />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-statistic title="今日の未ピッキング数" :value="todayOverview.pending_today" />
            <div class="stat-badge pending">進行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card users-card">
          <div class="stat-icon">
            <el-icon>
              <User />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-statistic title="アクティブユーザー" :value="activeUsers" />
            <div class="stat-trend positive">
              <el-icon>
                <UserFilled />
              </el-icon>
              <span>オンライン</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card tasks-card">
          <div class="stat-icon">
            <el-icon>
              <Clock />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-statistic title="待機中タスク" :value="pendingTasks" />
            <div class="stat-trend neutral">
              <el-icon>
                <Loading />
              </el-icon>
              <span>処理中</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card load-card">
          <div class="stat-icon">
            <el-icon>
              <Monitor />
            </el-icon>
          </div>
          <div class="stat-content">
            <el-statistic title="システム負荷" :value="systemLoad" suffix="%" />
            <div class="stat-trend" :class="systemLoad > 80 ? 'negative' : 'positive'">
              <el-icon>
                <Cpu />
              </el-icon>
              <span>{{ systemLoad > 80 ? '高負荷' : '正常' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 🌟 推荐功能区域 -->
    <el-card class="recommendations-card">
      <template #header>
        <div class="card-header">
          <span>🌟 おすすめ機能</span>
          <el-button size="small" @click="refreshRecommendations" :loading="recommendationsLoading">
            <el-icon>
              <Refresh />
            </el-icon>
            更新
          </el-button>
        </div>
      </template>

      <div class="recommendations-grid">
        <div
          v-for="item in recommendations"
          :key="item.id"
          class="recommendation-item"
          @click="handleRecommendationClick(item)"
        >
          <div class="recommendation-icon" :style="{ backgroundColor: item.color }">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="recommendation-content">
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
            <div class="recommendation-meta">
              <el-tag size="small" :type="item.priority">{{ item.priorityText }}</el-tag>
              <span class="recommendation-time">{{ item.estimatedTime }}</span>
            </div>
          </div>
          <div class="recommendation-action">
            <el-icon>
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 📈 快速操作面板 -->
    <el-card class="quick-actions-card">
      <template #header>
        <div class="card-header">
          <span>⚡ クイックアクション</span>
        </div>
      </template>

      <div class="quick-actions-grid">
        <div
          v-for="action in quickActions"
          :key="action.id"
          class="quick-action-item"
          @click="handleQuickAction(action)"
        >
          <div class="action-icon" :class="action.iconClass">
            <el-icon>
              <component :is="action.icon" />
            </el-icon>
          </div>
          <span class="action-label">{{ action.label }}</span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <!-- 🖥️ システム運行日志 -->
        <el-card class="system-log-card">
          <template #header>
            <div class="card-header">
              <span>🖥️ システムログ</span>
              <div class="header-actions">
                <el-button size="small" @click="fetchLogs" :loading="logsLoading">
                  <el-icon>
                    <Refresh />
                  </el-icon>
                  更新
                </el-button>
                <el-button size="small" @click="clearLogs" type="danger">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  クリア
                </el-button>
              </div>
            </div>
          </template>

          <el-scrollbar height="320px">
            <div v-if="logs.length === 0" class="no-data">
              <el-icon>
                <DocumentRemove />
              </el-icon>
              <span>ログなし</span>
            </div>
            <div v-else>
              <div
                v-for="log in logs"
                :key="log.id"
                class="log-entry"
                :class="getLogLevelClass(log.level)"
              >
                <div class="log-indicator" :class="getLogLevelClass(log.level)"></div>
                <span class="log-time">{{ formatLogTime(log.log_time) }}</span>
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <!-- 🔔 通知中心 -->
        <el-card class="notification-card">
          <template #header>
            <div class="card-header">
              <span>🔔 通知センター</span>
              <el-badge :value="unreadNotifications" class="notification-badge">
                <el-button size="small" @click="markAllAsRead">
                  <el-icon>
                    <Bell />
                  </el-icon>
                  すべて既読
                </el-button>
              </el-badge>
            </div>
          </template>

          <div v-if="notifications.length === 0" class="no-data">
            <el-icon>
              <Bell />
            </el-icon>
            <span>新しい通知はありません</span>
          </div>
          <div v-else class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
            >
              <div class="notification-avatar">
                <el-icon>
                  <Bell />
                </el-icon>
              </div>
              <div class="notification-content">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <span class="notification-time">{{
                  formatNotificationTime(notification.created_at)
                }}</span>
              </div>
              <el-button
                v-if="!notification.read"
                size="small"
                type="primary"
                @click="markAsRead(notification.id)"
              >
                既読
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 📊 今日の活動サマリー -->
        <el-card class="activity-summary-card">
          <template #header>
            <div class="card-header">
              <span>📊 今日の活動</span>
            </div>
          </template>

          <div class="activity-list">
            <div v-for="activity in todayActivities" :key="activity.id" class="activity-item">
              <div class="activity-time">{{ activity.time }}</div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ja'
import { ElMessage } from 'element-plus'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('ja')

import request from '@/utils/request'
import { useMainStore } from '@/store/main'
import {
  TrendCharts,
  User,
  Clock,
  Monitor,
  Refresh,
  Delete,
  DocumentRemove,
  Bell,
  Sunny,
  CircleCheck,
  ArrowUp,
  UserFilled,
  Loading,
  Cpu,
  ArrowRight,
  Setting,
  DataAnalysis,
  Files,
  Connection,
  Tools,
  Notification,
  Management,
  Download,
  Box,
} from '@element-plus/icons-vue'

defineOptions({
  name: 'ダッシュボード',
})

interface LogEntry {
  id: number
  log_time: string
  message: string
  level: 'info' | 'warning' | 'error' | 'debug'
}

interface Notification {
  id: number
  title: string
  message: string
  read: boolean
  created_at: string
}

interface Recommendation {
  id: number
  title: string
  description: string
  icon: string
  color: string
  priority: 'success' | 'warning' | 'danger' | 'info'
  priorityText: string
  estimatedTime: string
  action: string
}

interface QuickAction {
  id: number
  label: string
  icon: string
  iconClass: string
  action: string
}

interface Activity {
  id: number
  time: string
  title: string
  description: string
}

interface TodayOverview {
  total_today: number
  pending_today: number
  completed_today: number
  today_completion_rate: number
}

const store = useMainStore()
const today = dayjs().format('YYYY年MM月DD日(ddd)')
const weather = '晴れ'
const logs = ref<LogEntry[]>([])
const logsLoading = ref(false)
const notifications = ref<Notification[]>([])
const recommendationsLoading = ref(false)

// 统计数据
const todayProcessed = ref(156)
const activeUsers = ref(23)
const pendingTasks = ref(8)
const systemLoad = ref(45)
const systemUptime = ref(127)

// ピッキング統計データ
const todayOverview = ref<TodayOverview>({
  total_today: 0,
  pending_today: 0,
  completed_today: 0,
  today_completion_rate: 0,
})

// 推荐功能数据
const recommendations = ref<Recommendation[]>([
  {
    id: 1,
    title: 'データバックアップ',
    description: '重要なデータの定期バックアップを実行することをお勧めします',
    icon: 'Download',
    color: '#409eff',
    priority: 'info',
    priorityText: '推奨',
    estimatedTime: '5分',
    action: 'backup',
  },
  {
    id: 2,
    title: 'システム最適化',
    description: 'パフォーマンス向上のためシステム最適化を実行しましょう',
    icon: 'Tools',
    color: '#67c23a',
    priority: 'success',
    priorityText: '効果的',
    estimatedTime: '10分',
    action: 'optimize',
  },
  {
    id: 3,
    title: 'セキュリティスキャン',
    description: 'システムの脆弱性チェックを実行することをお勧めします',
    icon: 'Management',
    color: '#e6a23c',
    priority: 'warning',
    priorityText: '重要',
    estimatedTime: '15分',
    action: 'security',
  },
])

// 快速操作数据
const quickActions = ref<QuickAction[]>([
  { id: 1, label: '設定', icon: 'Setting', iconClass: 'setting-icon', action: 'settings' },
  { id: 2, label: 'レポート', icon: 'DataAnalysis', iconClass: 'report-icon', action: 'reports' },
  { id: 3, label: 'ファイル', icon: 'Files', iconClass: 'files-icon', action: 'files' },
  { id: 4, label: '接続', icon: 'Connection', iconClass: 'connection-icon', action: 'connections' },
  { id: 5, label: 'ツール', icon: 'Tools', iconClass: 'tools-icon', action: 'tools' },
  {
    id: 6,
    label: '通知',
    icon: 'Notification',
    iconClass: 'notification-icon',
    action: 'notifications',
  },
])

// 今日的活动数据
const todayActivities = ref<Activity[]>([
  {
    id: 1,
    time: '09:15',
    title: 'システム起動',
    description: 'Smart-EMAPシステムが正常に起動しました',
  },
  {
    id: 2,
    time: '10:30',
    title: 'データ同期完了',
    description: '外部システムとのデータ同期が完了しました',
  },
  {
    id: 3,
    time: '14:20',
    title: '定期バックアップ',
    description: 'スケジュールされたバックアップが実行されました',
  },
  {
    id: 4,
    time: '16:45',
    title: 'ユーザーログイン',
    description: '新しいユーザーがシステムにログインしました',
  },
])

// 用户信息
const userDisplayName = computed(() => {
  return store.userInfo?.name || store.userInfo?.username || 'ユーザー'
})

const lastLoginTime = computed(() => {
  const lastLogin = localStorage.getItem('lastLoginTime')
  return lastLogin ? dayjs(lastLogin).format('YYYY/MM/DD HH:mm') : '初回ログイン'
})

const unreadNotifications = computed(() => {
  return notifications.value.filter((n) => !n.read).length
})

// 获取日志
const fetchLogs = async () => {
  try {
    logsLoading.value = true
    const response = await request.get<LogEntry[]>('/api/system/logs')
    logs.value = response || []
  } catch (err) {
    console.error('ログ取得エラー:', err)
    // 模拟数据
    logs.value = [
      { id: 1, log_time: new Date().toISOString(), message: 'システム正常起動', level: 'info' },
      {
        id: 2,
        log_time: new Date(Date.now() - 60000).toISOString(),
        message: 'データベース接続確認',
        level: 'info',
      },
      {
        id: 3,
        log_time: new Date(Date.now() - 120000).toISOString(),
        message: 'バックアップ完了',
        level: 'info',
      },
      {
        id: 4,
        log_time: new Date(Date.now() - 180000).toISOString(),
        message: 'パフォーマンス警告',
        level: 'warning',
      },
      {
        id: 5,
        log_time: new Date(Date.now() - 240000).toISOString(),
        message: 'ユーザー認証成功',
        level: 'info',
      },
    ]
  } finally {
    logsLoading.value = false
  }
}

// 清除日志
const clearLogs = () => {
  logs.value = []
  ElMessage.success('ログをクリアしました')
}

// 获取通知
const fetchNotifications = async () => {
  try {
    const response = await request.get<Notification[]>('/api/notifications')
    notifications.value = response || []
  } catch (err) {
    console.error('通知取得エラー:', err)
    // 模拟数据
    notifications.value = [
      {
        id: 1,
        title: 'システムメンテナンス',
        message: '明日の深夜にシステムメンテナンスを実施します',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: '新機能リリース',
        message: '製品管理機能が追加されました',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        title: 'セキュリティアップデート',
        message: 'システムのセキュリティパッチが適用されました',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  }
}

// 刷新推荐
const refreshRecommendations = () => {
  recommendationsLoading.value = true
  setTimeout(() => {
    recommendationsLoading.value = false
    ElMessage.success('推奨機能を更新しました')
  }, 1000)
}

// 处理推荐点击
const handleRecommendationClick = (recommendation: Recommendation) => {
  ElMessage.info(`${recommendation.title}を実行します`)
  // 这里可以添加具体的功能实现
}

// 处理快速操作
const handleQuickAction = (action: QuickAction) => {
  ElMessage.info(`${action.label}を開きます`)
  // 这里可以添加具体的功能实现
}

// 标记为已读
const markAsRead = (id: number) => {
  const notification = notifications.value.find((n) => n.id === id)
  if (notification) {
    notification.read = true
    ElMessage.success('通知を既読にしました')
  }
}

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.read = true))
  ElMessage.success('すべての通知を既読にしました')
}

// 格式化时间
const formatLogTime = (time: string) => {
  return dayjs(time).format('HH:mm:ss')
}

const formatNotificationTime = (time: string) => {
  return dayjs(time).fromNow()
}

// 获取日志级别样式
const getLogLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    error: 'log-error',
    warning: 'log-warning',
    info: 'log-info',
    debug: 'log-debug',
  }
  return classes[level] || 'log-info'
}

// 获取ピッキング数据
const fetchPickingData = async () => {
  try {
    const response = await request.get('/api/shipping/picking/new-progress')

    // 检查响应格式 - 处理不同的响应格式
    let responseData
    if (response && response.success !== undefined) {
      if (!response.success) {
        console.error('API请求失败:', response.message)
        return
      }
      responseData = response.data
    } else if (response && typeof response === 'object' && response.todayOverview) {
      responseData = response
    } else {
      console.error('未知的响应格式:', response)
      return
    }

    // 更新ピッキング统计数据
    if (responseData && responseData.todayOverview) {
      todayOverview.value = {
        total_today: responseData.todayOverview.total_today || 0,
        pending_today: responseData.todayOverview.pending_today || 0,
        completed_today: responseData.todayOverview.completed_today || 0,
        today_completion_rate: responseData.todayOverview.today_completion_rate || 0,
      }
    }
  } catch (error) {
    console.error('ピッキングデータ取得エラー:', error)
    // 使用默认数据
    todayOverview.value = {
      total_today: 45,
      pending_today: 12,
      completed_today: 33,
      today_completion_rate: 73,
    }
  }
}

// 更新统计数据
const updateStats = () => {
  // 模拟实时数据更新
  setInterval(() => {
    todayProcessed.value += Math.floor(Math.random() * 3)
    systemLoad.value = Math.max(20, Math.min(95, systemLoad.value + (Math.random() - 0.5) * 10))
  }, 30000) // 30秒更新一次
}

onMounted(() => {
  fetchLogs()
  fetchNotifications()
  fetchPickingData()
  updateStats()

  // 记录当前登录时间
  localStorage.setItem('lastLoginTime', new Date().toISOString())
})
</script>

<style scoped>
/* 导入现代字体 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');

.dashboard-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 60px);
  font-family:
    'Inter',
    'Noto Sans JP',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

/* 欢迎卡片 */
.welcome-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  overflow: hidden;
  position: relative;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.2"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.greeting-section h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
  font-family: 'Noto Sans JP', sans-serif;
}

.weather-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 16px;
}

.weather-icon {
  font-size: 20px;
  color: #ffd700;
}

.last-login {
  font-size: 13px;
  opacity: 0.8;
  margin: 4px 0 0 0;
}

.uptime-display {
  text-align: right;
}

.system-status {
  margin-top: 12px;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  margin-bottom: 16px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-card .el-card__body {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.processing-card .stat-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.users-card .stat-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.tasks-card .stat-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.load-card .stat-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-content {
  flex: 1;
}

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  gap: 4px;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-trend.negative {
  color: #f56c6c;
}

.stat-trend.neutral {
  color: #909399;
}

.stat-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.stat-badge.pending {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

/* 推荐功能卡片 */
.recommendations-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.recommendation-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.recommendation-content {
  flex: 1;
}

.recommendation-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recommendation-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.recommendation-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recommendation-time {
  font-size: 12px;
  color: #909399;
}

.recommendation-action {
  color: #409eff;
  font-size: 16px;
}

/* 快速操作卡片 */
.quick-actions-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.setting-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.report-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.files-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.connection-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.tools-icon {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.notification-icon {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  text-align: center;
}

/* 系统日志卡片 */
.system-log-card,
.notification-card,
.activity-summary-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.log-entry {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s ease;
}

.log-entry:hover {
  background-color: #f8f9fa;
}

.log-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.log-indicator.log-error {
  background-color: #f56c6c;
}

.log-indicator.log-warning {
  background-color: #e6a23c;
}

.log-indicator.log-info {
  background-color: #409eff;
}

.log-indicator.log-debug {
  background-color: #909399;
}

.log-time {
  color: #909399;
  min-width: 70px;
  font-weight: 500;
}

.log-level {
  min-width: 70px;
  font-weight: bold;
  font-size: 11px;
}

.log-message {
  flex: 1;
  color: #303133;
}

.log-error .log-level {
  color: #f56c6c;
}

.log-warning .log-level {
  color: #e6a23c;
}

.log-info .log-level {
  color: #409eff;
}

.log-debug .log-level {
  color: #909399;
}

/* 通知列表 */
.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #667eea);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.notification-content p {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

/* 活动摘要 */
.activity-list {
  max-height: 280px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  width: 60px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.activity-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

/* 无数据状态 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #c0c4cc;
  gap: 12px;
}

.no-data .el-icon {
  font-size: 48px;
}

.notification-badge {
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .greeting-section h2 {
    font-size: 24px;
  }

  .weather-info {
    justify-content: center;
  }

  .uptime-display {
    text-align: center;
  }

  .stat-card .el-card__body {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stat-content {
    text-align: center;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .recommendation-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .quick-action-item {
    padding: 16px 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }

  .action-label {
    font-size: 12px;
  }

  .log-entry {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .log-time,
  .log-level {
    min-width: auto;
  }

  .notification-item {
    flex-direction: column;
    gap: 8px;
  }

  .notification-avatar {
    align-self: flex-start;
  }

  .activity-item {
    flex-direction: column;
    gap: 8px;
  }

  .activity-time {
    width: auto;
  }
}

@media (max-width: 480px) {
  .dashboard-page {
    padding: 12px;
  }

  .greeting-section h2 {
    font-size: 22px;
  }

  .weather-info {
    font-size: 14px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .quick-action-item {
    padding: 12px 8px;
  }

  .action-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .action-label {
    font-size: 11px;
  }

  .recommendation-item {
    padding: 16px;
  }

  .recommendation-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .dashboard-page {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .stat-card,
  .system-log-card,
  .notification-card,
  .activity-summary-card,
  .recommendations-card,
  .quick-actions-card {
    background: #2d3748;
    color: #e2e8f0;
  }

  .recommendation-item,
  .quick-action-item {
    background: linear-gradient(135deg, #2d3748, #4a5568);
    border-color: #4a5568;
  }

  .log-entry:hover,
  .notification-item:hover,
  .activity-item:hover {
    background-color: #4a5568;
  }

  .notification-item.unread {
    background-color: rgba(66, 153, 225, 0.1);
  }
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

.stat-card,
.recommendations-card,
.quick-actions-card,
.system-log-card,
.notification-card,
.activity-summary-card {
  animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) {
  animation-delay: 0.1s;
}

.stat-card:nth-child(2) {
  animation-delay: 0.2s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.3s;
}

.stat-card:nth-child(4) {
  animation-delay: 0.4s;
}

.recommendations-card {
  animation-delay: 0.5s;
}

.quick-actions-card {
  animation-delay: 0.6s;
}

.system-log-card {
  animation-delay: 0.7s;
}

.notification-card {
  animation-delay: 0.8s;
}

.activity-summary-card {
  animation-delay: 0.9s;
}
</style>
