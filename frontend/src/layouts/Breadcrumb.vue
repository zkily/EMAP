<!-- src/layouts/PageBreadcrumb.vue -->
<template>
  <div class="modern-breadcrumb">
    <!-- 背景装饰 -->
    <div class="breadcrumb-bg">
      <div class="bg-pattern"></div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- 面包屑内容 -->
    <div class="breadcrumb-content">
      <!-- 首页链接 -->
      <div class="breadcrumb-item home-item" @click="goHome">
        <div class="item-wrapper">
          <div class="item-icon">
            <el-icon>
              <House />
            </el-icon>
          </div>
          <span class="item-text">ホーム</span>
          <div class="ripple-effect"></div>
        </div>
      </div>

      <!-- 分隔符和路径项 -->
      <template v-for="(item, index) in breadcrumbs" :key="index">
        <!-- 分隔符 -->
        <div class="breadcrumb-separator">
          <el-icon>
            <ArrowRight />
          </el-icon>
        </div>

        <!-- 路径项 -->
        <div
          :class="['breadcrumb-item', 'path-item', { active: index === breadcrumbs.length - 1 }]"
          @click="navigateToPath(index)"
        >
          <div class="item-wrapper">
            <div class="item-icon">
              <el-icon>
                <component :is="getItemIcon(item)" />
              </el-icon>
            </div>
            <span class="item-text">{{ item }}</span>
            <!-- 活动指示器 -->
            <div v-if="index === breadcrumbs.length - 1" class="active-indicator"></div>
            <!-- 收藏按钮 -->
            <el-button
              v-if="index === breadcrumbs.length - 1"
              class="favorite-btn"
              @click.stop="toggleFavorite"
              text
            >
              <el-icon>
                <StarFilled v-if="isFavorite" />
                <Star v-else />
              </el-icon>
            </el-button>
            <div class="ripple-effect"></div>
          </div>
        </div>
      </template>
    </div>

    <!-- 推荐功能区域 -->
    <div class="breadcrumb-features">
      <!-- 快速导航 -->
      <el-dropdown class="quick-nav-dropdown" @command="quickNavigate">
        <el-button class="feature-btn quick-nav-btn" text>
          <el-icon>
            <Grid />
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="nav in quickNavItems"
              :key="nav.path"
              :command="nav.path"
              :icon="nav.icon"
            >
              {{ nav.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 历史记录 -->
      <el-dropdown class="history-dropdown" @command="navigateToHistory">
        <el-button class="feature-btn history-btn" text>
          <el-icon>
            <Clock />
          </el-icon>
          <el-badge v-if="recentHistory.length > 0" :value="recentHistory.length" class="history-badge" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>最近访问</el-dropdown-item>
            <el-dropdown-item
              v-for="history in recentHistory"
              :key="history.path"
              :command="history.path"
            >
              <div class="history-item">
                <el-icon>
                  <component :is="history.icon" />
                </el-icon>
                <span>{{ history.label }}</span>
                <span class="history-time">{{ formatTime(history.time) }}</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 收藏夹 -->
      <el-dropdown class="favorites-dropdown" @command="navigateToFavorite">
        <el-button class="feature-btn favorites-btn" text>
          <el-icon>
            <StarFilled />
          </el-icon>
          <el-badge v-if="favorites.length > 0" :value="favorites.length" class="favorites-badge" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>收藏夹</el-dropdown-item>
            <el-dropdown-item
              v-for="favorite in favorites"
              :key="favorite.path"
              :command="favorite.path"
            >
              <div class="favorite-item">
                <el-icon>
                  <component :is="favorite.icon" />
                </el-icon>
                <span>{{ favorite.label }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item v-if="favorites.length === 0" disabled>
              暂无收藏
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 右侧操作区域 -->
    <div class="breadcrumb-actions">
      <!-- 智能推荐 -->
      <el-popover
        placement="bottom"
        :width="280"
        trigger="hover"
        :show-after="500"
        popper-class="smart-recommendations-popover"
      >
        <template #reference>
          <el-button class="action-btn smart-btn" text>
            <el-icon>
              <MagicStick />
            </el-icon>
          </el-button>
        </template>
        <div class="smart-recommendations">
          <h4>智能推荐</h4>
          <div class="recommendation-list">
            <div
              v-for="rec in smartRecommendations"
              :key="rec.path"
              class="recommendation-item"
              @click="navigateTo(rec.path)"
            >
              <div class="rec-icon">
                <el-icon>
                  <component :is="rec.icon" />
                </el-icon>
              </div>
              <div class="rec-content">
                <div class="rec-title">{{ rec.title }}</div>
                <div class="rec-desc">{{ rec.description }}</div>
              </div>
              <div class="rec-score">{{ rec.score }}%</div>
            </div>
          </div>
        </div>
      </el-popover>

      <!-- 返回按钮 -->
      <el-tooltip content="戻る" placement="bottom">
        <el-button class="action-btn back-btn" @click="goBack" text>
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- 刷新按钮 -->
      <el-tooltip content="更新" placement="bottom">
        <el-button class="action-btn refresh-btn" @click="refresh" text>
          <el-icon>
            <Refresh />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- 全屏按钮 -->
      <el-tooltip content="全画面" placement="bottom">
        <el-button class="action-btn fullscreen-btn" @click="toggleFullscreen" text>
          <el-icon>
            <FullScreen />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  House,
  ArrowRight,
  ArrowLeft,
  Refresh,
  Management,
  Box,
  Setting,
  Document,
  DataAnalysis,
  Goods,
  User,
  Tools,
  Monitor,
  Star,
  StarFilled,
  Grid,
  Clock,
  MagicStick,
  FullScreen,
} from '@element-plus/icons-vue'

// 添加显式组件名称定义
defineOptions({
  name: 'PageBreadcrumb',
})

const route = useRoute()
const router = useRouter()

// 响应式数据
const favorites = ref<Array<{ path: string; label: string; icon: any }>>([])
const recentHistory = ref<Array<{ path: string; label: string; icon: any; time: number }>>([])

// 映射路由 segment => 名称（日文）
const nameMap: Record<string, string> = {
  order: '受注管理',
  'production-plan': '生産計画',
  outsourcing: '外注管理',
  material: '材料管理',
  parts: '部品管理',
  'production-schedule': '生産スケジューリング',
  'production-progress': '生産進捗',
  kpi: '生産指標',
  inventory: '在庫管理',
  'process-route': '工程ルート管理',
  cost: '原価管理',
  staff: '人員管理',
  master: 'マスタ管理',
  other: 'その他管理',
  system: 'システム管理',
  shipping: '出荷管理',
  stock: '在庫管理',
  plan: '計画管理',
}

// 映射路由 segment => 图标
const iconMap: Record<string, unknown> = {
  order: Document,
  'production-plan': DataAnalysis,
  outsourcing: Management,
  material: Box,
  parts: Goods,
  'production-schedule': Monitor,
  'production-progress': DataAnalysis,
  kpi: DataAnalysis,
  inventory: Box,
  'process-route': Tools,
  cost: DataAnalysis,
  staff: User,
  master: Setting,
  other: Management,
  system: Setting,
  shipping: Goods,
  stock: Box,
  plan: DataAnalysis,
}

// 快速导航项
const quickNavItems = [
  { path: '/order', label: '受注管理', icon: Document },
  { path: '/production-plan', label: '生産計画', icon: DataAnalysis },
  { path: '/inventory', label: '在庫管理', icon: Box },
  { path: '/staff', label: '人員管理', icon: User },
  { path: '/system', label: 'システム管理', icon: Setting },
]

// 智能推荐
const smartRecommendations = computed(() => {
  const currentPath = route.path
  const recommendations = [
    {
      path: '/production-progress',
      title: '生産進捗',
      description: '現在の生産状況を確認',
      icon: DataAnalysis,
      score: 95,
    },
    {
      path: '/inventory',
      title: '在庫管理',
      description: '在庫レベルの監視',
      icon: Box,
      score: 88,
    },
    {
      path: '/kpi',
      title: '生産指標',
      description: 'KPI分析とレポート',
      icon: DataAnalysis,
      score: 82,
    },
  ]

  // 根据当前路径过滤推荐
  return recommendations.filter(rec => rec.path !== currentPath)
})

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.map((seg) => nameMap[seg] || seg)
})

// 检查当前页面是否被收藏
const isFavorite = computed(() => {
  return favorites.value.some(fav => fav.path === route.path)
})

// 获取项目图标
const getItemIcon = (item: string) => {
  const segment = Object.keys(nameMap).find((key) => nameMap[key] === item)
  return iconMap[segment || ''] || Document
}

// 导航方法
const goHome = () => {
  addToHistory('/', 'ホーム', House)
  router.push('/')
}

const goBack = () => {
  router.back()
}

const refresh = () => {
  window.location.reload()
}

const navigateToPath = (index: number) => {
  const segments = route.path.split('/').filter(Boolean)
  const targetPath = '/' + segments.slice(0, index + 1).join('/')
  const targetLabel = breadcrumbs.value[index]
  const targetIcon = getItemIcon(targetLabel)

  addToHistory(targetPath, targetLabel, targetIcon)
  router.push(targetPath)
}

const navigateTo = (path: string) => {
  const segments = path.split('/').filter(Boolean)
  const label = segments.length > 0 ? nameMap[segments[segments.length - 1]] || segments[segments.length - 1] : 'ホーム'
  const icon = segments.length > 0 ? getItemIcon(label) : House

  addToHistory(path, label, icon)
  router.push(path)
}

// 收藏功能
const toggleFavorite = () => {
  const currentPath = route.path
  const currentLabel = breadcrumbs.value[breadcrumbs.value.length - 1]
  const currentIcon = getItemIcon(currentLabel)

  if (isFavorite.value) {
    favorites.value = favorites.value.filter(fav => fav.path !== currentPath)
    ElMessage.success('收藏已取消')
  } else {
    favorites.value.push({
      path: currentPath,
      label: currentLabel,
      icon: currentIcon,
    })
    ElMessage.success('已添加到收藏')
  }

  // 保存到本地存储
  localStorage.setItem('breadcrumb-favorites', JSON.stringify(favorites.value))
}

// 历史记录功能
const addToHistory = (path: string, label: string, icon: any) => {
  const existingIndex = recentHistory.value.findIndex(item => item.path === path)

  if (existingIndex !== -1) {
    recentHistory.value.splice(existingIndex, 1)
  }

  recentHistory.value.unshift({
    path,
    label,
    icon,
    time: Date.now(),
  })

  // 保持最多10条历史记录
  if (recentHistory.value.length > 10) {
    recentHistory.value = recentHistory.value.slice(0, 10)
  }

  // 保存到本地存储
  localStorage.setItem('breadcrumb-history', JSON.stringify(recentHistory.value))
}

// 快速导航
const quickNavigate = (path: string) => {
  navigateTo(path)
}

// 历史记录导航
const navigateToHistory = (path: string) => {
  navigateTo(path)
}

// 收藏夹导航
const navigateToFavorite = (path: string) => {
  navigateTo(path)
}

// 全屏切换
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 初始化数据
onMounted(() => {
  // 从本地存储加载收藏和历史记录
  const savedFavorites = localStorage.getItem('breadcrumb-favorites')
  if (savedFavorites) {
    favorites.value = JSON.parse(savedFavorites)
  }

  const savedHistory = localStorage.getItem('breadcrumb-history')
  if (savedHistory) {
    recentHistory.value = JSON.parse(savedHistory)
  }
})

// 监听路由变化，添加到历史记录
watch(route, (newRoute) => {
  const segments = newRoute.path.split('/').filter(Boolean)
  const label = segments.length > 0 ? nameMap[segments[segments.length - 1]] || segments[segments.length - 1] : 'ホーム'
  const icon = segments.length > 0 ? getItemIcon(label) : House

  addToHistory(newRoute.path, label, icon)
}, { immediate: true })
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --breadcrumb-bg: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.95) 50%,
    rgba(240, 245, 251, 0.95) 100%
  );
  --breadcrumb-text-color: #2c3e50;
  --breadcrumb-active-color: #667eea;
  --breadcrumb-separator-color: #bdc3c7;
  --breadcrumb-hover-bg: rgba(102, 126, 234, 0.1);
  --breadcrumb-border-color: rgba(0, 0, 0, 0.08);
  --breadcrumb-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  --feature-btn-bg: rgba(102, 126, 234, 0.08);
  --feature-btn-hover: rgba(102, 126, 234, 0.15);
}

:root.dark {
  --breadcrumb-bg: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 50%, rgba(35, 35, 35, 0.95) 100%);
  --breadcrumb-text-color: #ecf0f1;
  --breadcrumb-active-color: #74b9ff;
  --breadcrumb-separator-color: #7f8c8d;
  --breadcrumb-hover-bg: rgba(116, 185, 255, 0.1);
  --breadcrumb-border-color: rgba(255, 255, 255, 0.1);
  --breadcrumb-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --feature-btn-bg: rgba(116, 185, 255, 0.08);
  --feature-btn-hover: rgba(116, 185, 255, 0.15);
}

/* 现代化面包屑容器 */
.modern-breadcrumb {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  background: var(--breadcrumb-bg);
  backdrop-filter: blur(25px);
  border: 1px solid var(--breadcrumb-border-color);
  border-radius: 16px;
  padding: 0 20px;
  margin: 20px 0;
  box-shadow: var(--breadcrumb-shadow);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.breadcrumb-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(102, 126, 234, 0.04) 25%,
    transparent 25%,
    transparent 75%,
    rgba(102, 126, 234, 0.04) 75%
  );
  background-size: 24px 24px;
  animation: patternMove 25s linear infinite;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(102, 126, 234, 0.02) 0%,
    transparent 50%,
    rgba(116, 185, 255, 0.02) 100%
  );
  animation: gradientShift 8s ease-in-out infinite alternate;
}

@keyframes patternMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 24px 24px;
  }
}

@keyframes gradientShift {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 面包屑内容 */
.breadcrumb-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  position: relative;
  z-index: 2;
}

/* 面包屑项 */
.breadcrumb-item {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.home-item .item-wrapper {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.home-item .item-wrapper:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
}

.path-item .item-wrapper {
  color: var(--breadcrumb-text-color);
}

.path-item.active .item-wrapper {
  background: linear-gradient(
    135deg,
    var(--breadcrumb-active-color) 0%,
    rgba(102, 126, 234, 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.path-item:not(.active) .item-wrapper:hover {
  background: var(--breadcrumb-hover-bg);
  transform: translateY(-2px);
}

/* 波纹效果 */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.item-wrapper:active .ripple-effect {
  animation: ripple 0.6s linear;
}

/* 图标样式 */
.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-item .item-icon {
  animation: homeIconGlow 4s ease-in-out infinite alternate;
}

@keyframes homeIconGlow {
  0% {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1);
  }
  100% {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.08);
  }
}

.path-item:not(.active) .item-icon {
  background: rgba(102, 126, 234, 0.12);
}

.path-item.active .item-icon {
  background: rgba(255, 255, 255, 0.25);
  animation: activeIconPulse 2.5s ease-in-out infinite;
}

@keyframes activeIconPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
  }
}

.item-icon .el-icon {
  font-size: 16px;
}

/* 文本样式 */
.item-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.home-item .item-text {
  font-weight: 600;
}

.path-item.active .item-text {
  font-weight: 600;
}

/* 收藏按钮 */
.favorite-btn {
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
  margin-left: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.favorite-btn .el-icon {
  font-size: 12px;
  color: #ffd700;
}

/* 活动指示器 */
.active-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: indicatorPulse 2s ease-in-out infinite;
}

@keyframes indicatorPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* 分隔符 */
.breadcrumb-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--breadcrumb-separator-color);
  transition: all 0.3s ease;
}

.breadcrumb-separator .el-icon {
  font-size: 14px;
  animation: separatorFloat 4s ease-in-out infinite alternate;
}

@keyframes separatorFloat {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  100% {
    transform: translateX(3px) rotate(5deg);
  }
}

/* 推荐功能区域 */
.breadcrumb-features {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 2;
  margin-right: 12px;
}

.feature-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 12px;
  background: var(--feature-btn-bg);
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-btn:hover {
  background: var(--feature-btn-hover);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
}

.feature-btn .el-icon {
  font-size: 18px;
  color: var(--breadcrumb-active-color);
  transition: all 0.3s ease;
}

/* 徽章样式 */
.history-badge,
.favorites-badge {
  transform: scale(0.8);
}

/* 操作按钮区域 */
.breadcrumb-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.action-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.25);
}

.action-btn .el-icon {
  font-size: 18px;
  color: var(--breadcrumb-text-color);
  transition: all 0.3s ease;
}

.smart-btn:hover .el-icon {
  animation: magicSparkle 0.8s ease-in-out;
}

@keyframes magicSparkle {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-10deg) scale(1.1);
  }
  75% {
    transform: rotate(10deg) scale(1.1);
  }
}

.back-btn:hover .el-icon {
  animation: backArrowMove 0.6s ease-in-out;
}

@keyframes backArrowMove {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-4px);
  }
}

.refresh-btn:hover .el-icon {
  animation: refreshSpin 0.8s ease-in-out;
}

@keyframes refreshSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fullscreen-btn:hover .el-icon {
  animation: fullscreenExpand 0.6s ease-in-out;
}

@keyframes fullscreenExpand {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 智能推荐弹出框内容 */
.smart-recommendations h4 {
  margin: 0 0 12px 0;
  color: var(--breadcrumb-text-color);
  font-size: 16px;
  font-weight: 600;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

.rec-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--breadcrumb-active-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.rec-content {
  flex: 1;
}

.rec-title {
  font-weight: 600;
  color: var(--breadcrumb-text-color);
  font-size: 14px;
}

.rec-desc {
  font-size: 12px;
  color: var(--breadcrumb-separator-color);
  margin-top: 2px;
}

.rec-score {
  font-size: 12px;
  font-weight: 600;
  color: var(--breadcrumb-active-color);
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 历史记录和收藏项样式 */
.history-item,
.favorite-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.history-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--breadcrumb-separator-color);
}

/* 光扫过效果 */
.item-wrapper::before,
.action-btn::before,
.feature-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.8s ease;
  pointer-events: none;
}

.item-wrapper:hover::before,
.action-btn:hover::before,
.feature-btn:hover::before {
  left: 100%;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .modern-breadcrumb {
    height: 48px;
    padding: 0 16px;
  }

  .breadcrumb-features {
    gap: 6px;
    margin-right: 8px;
  }

  .feature-btn,
  .action-btn {
    width: 32px !important;
    height: 32px !important;
  }
}

@media (max-width: 768px) {
  .modern-breadcrumb {
    height: 44px;
    padding: 0 12px;
    margin: 16px 0;
  }

  .item-wrapper {
    padding: 6px 10px;
    gap: 6px;
  }

  .item-text {
    font-size: 13px;
  }

  .item-icon {
    width: 20px;
    height: 20px;
  }

  .item-icon .el-icon {
    font-size: 14px;
  }

  .feature-btn,
  .action-btn {
    width: 28px !important;
    height: 28px !important;
  }

  .feature-btn .el-icon,
  .action-btn .el-icon {
    font-size: 16px;
  }

  /* 在中等屏幕上隐藏部分功能按钮 */
  .fullscreen-btn {
    display: none;
  }
}

@media (max-width: 480px) {
  .modern-breadcrumb {
    height: 40px;
    padding: 0 8px;
  }

  .breadcrumb-content {
    gap: 6px;
  }

  .item-wrapper {
    padding: 4px 8px;
  }

  .item-text {
    font-size: 12px;
  }

  /* 在小屏幕上隐藏部分面包屑项和功能 */
  .breadcrumb-item:not(.home-item):not(.active):not(:last-child) {
    display: none;
  }

  .breadcrumb-features {
    display: none;
  }

  .smart-btn,
  .fullscreen-btn {
    display: none;
  }
}

/* 进入动画 */
.modern-breadcrumb {
  animation: breadcrumbSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes breadcrumbSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 面包屑项进入动画 */
.breadcrumb-item {
  animation: itemFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.breadcrumb-item:nth-child(1) { animation-delay: 0.1s; }
.breadcrumb-item:nth-child(3) { animation-delay: 0.2s; }
.breadcrumb-item:nth-child(5) { animation-delay: 0.3s; }
.breadcrumb-item:nth-child(7) { animation-delay: 0.4s; }

@keyframes itemFadeIn {
  0% {
    opacity: 0;
    transform: translateX(-30px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 功能按钮进入动画 */
.feature-btn,
.action-btn {
  animation: buttonSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.feature-btn:nth-child(1) { animation-delay: 0.3s; }
.feature-btn:nth-child(2) { animation-delay: 0.4s; }
.feature-btn:nth-child(3) { animation-delay: 0.5s; }
.action-btn:nth-child(1) { animation-delay: 0.6s; }
.action-btn:nth-child(2) { animation-delay: 0.7s; }
.action-btn:nth-child(3) { animation-delay: 0.8s; }
.action-btn:nth-child(4) { animation-delay: 0.9s; }

@keyframes buttonSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 自定义弹出框样式 */
:deep(.smart-recommendations-popover) {
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid var(--breadcrumb-border-color) !important;
  backdrop-filter: blur(20px);
}
</style>
