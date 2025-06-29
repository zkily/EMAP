<template>
  <div class="modern-tab-nav">
    <!-- 标签容器 -->
    <div class="tab-container">
      <!-- 滚动区域 -->
      <div class="tab-scroll-area" ref="tabScrollArea">
        <div class="tab-list">
          <div
            v-for="tab in tabStore.tabs"
            :key="tab.path"
            :class="[
              'modern-tab',
              {
                active: tabStore.activeTab === tab.path,
                home: tab.path === homePath,
                closable: tab.path !== homePath,
              },
            ]"
            @click="handleClick(tab.path)"
          >
            <!-- 标签内容 -->
            <div class="tab-content">
              <!-- 图标 -->
              <div class="tab-icon-wrapper">
                <el-icon v-if="tab.path === homePath" class="tab-icon home-icon">
                  <House />
                </el-icon>
                <div v-else class="tab-icon file-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                    />
                  </svg>
                </div>
              </div>

              <!-- 标题 -->
              <span class="tab-title">{{ tab.title }}</span>

              <!-- 活动指示器 -->
              <div class="tab-indicator" v-if="tabStore.activeTab === tab.path"></div>
            </div>

            <!-- 关闭按钮 -->
            <div v-if="tab.path !== homePath" class="tab-close" @click.stop="handleClose(tab.path)">
              <el-icon>
                <Close />
              </el-icon>
            </div>

            <!-- 标签背景装饰 -->
            <div class="tab-bg-decoration"></div>
          </div>
        </div>
      </div>

      <!-- 滚动控制按钮 -->
      <div class="tab-scroll-controls" v-if="showScrollControls">
        <el-button class="scroll-btn" @click="scrollLeft" text>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button class="scroll-btn" @click="scrollRight" text>
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 标签操作区域 -->
    <div class="tab-actions">
      <!-- 刷新按钮 -->
      <el-tooltip content="ページ更新" placement="bottom">
        <el-button class="action-btn refresh-btn" @click="refreshPage" text>
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>

      <!-- 关闭其他标签 -->
      <el-dropdown trigger="hover">
        <el-button class="action-btn more-btn" text>
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="tab-dropdown-menu">
            <el-dropdown-item @click="closeOthers">
              <el-icon><Close /></el-icon>
              <span>他のタブを閉じる</span>
            </el-dropdown-item>
            <el-dropdown-item @click="closeAll">
              <el-icon><CircleClose /></el-icon>
              <span>すべて閉じる</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="closeLeft">
              <el-icon><ArrowLeft /></el-icon>
              <span>左側を閉じる</span>
            </el-dropdown-item>
            <el-dropdown-item @click="closeRight">
              <el-icon><ArrowRight /></el-icon>
              <span>右側を閉じる</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House,
  Close,
  ArrowLeft,
  ArrowRight,
  Refresh,
  MoreFilled,
  CircleClose,
} from '@element-plus/icons-vue'
import { useTabStore } from '@/store/tabStore'
import { watch } from 'vue'

const router = useRouter()
const route = useRoute()
const tabStore = useTabStore()
const homePath = '/dashboard'

// 滚动相关
const tabScrollArea = ref<HTMLElement>()
const showScrollControls = ref(false)

// 检查是否需要滚动控制
const checkScrollControls = () => {
  if (tabScrollArea.value) {
    const { scrollWidth, clientWidth } = tabScrollArea.value
    showScrollControls.value = scrollWidth > clientWidth
  }
}

// 滚动控制
const scrollLeft = () => {
  if (tabScrollArea.value) {
    tabScrollArea.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (tabScrollArea.value) {
    tabScrollArea.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}

// 路由变化时自动添加标签
watch(
  () => route.path,
  () => {
    const title = (route.meta.title as string) || route.name?.toString() || '未命名'
    tabStore.addTab({ title, path: route.path })
    nextTick(() => {
      checkScrollControls()
      scrollToActiveTab()
    })
  },
)

// 滚动到活动标签
const scrollToActiveTab = () => {
  if (tabScrollArea.value) {
    const activeTab = tabScrollArea.value.querySelector('.modern-tab.active') as HTMLElement
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  }
}

// 标签点击切换页面
const handleClick = (path: string) => {
  if (path === route.path) {
    if (path === homePath && tabStore.tabs.length === 1) return
  } else {
    router.push(path)
    tabStore.setActive(path)
  }
}

// 标签关闭逻辑
const handleClose = (path: string) => {
  if (path === homePath) return

  const tabs = tabStore.tabs
  const isActive = path === tabStore.activeTab
  const newTabs = tabs.filter((tab) => tab.path !== path)

  if (isActive && newTabs.length > 0) {
    const lastTab = newTabs[newTabs.length - 1]
    router.push(lastTab.path)
    tabStore.setActive(lastTab.path)
  }

  tabStore.removeTab(path)
  nextTick(() => {
    checkScrollControls()
  })
}

// 页面刷新
const refreshPage = () => {
  window.location.reload()
}

// 关闭其他标签
const closeOthers = () => {
  const currentPath = tabStore.activeTab
  tabStore.tabs.forEach((tab) => {
    if (tab.path !== currentPath && tab.path !== homePath) {
      tabStore.removeTab(tab.path)
    }
  })
  nextTick(() => {
    checkScrollControls()
  })
}

// 关闭全部标签
const closeAll = () => {
  tabStore.tabs.forEach((tab) => {
    if (tab.path !== homePath) {
      tabStore.removeTab(tab.path)
    }
  })
  if (route.path !== homePath) {
    router.push(homePath)
    tabStore.setActive(homePath)
  }
  nextTick(() => {
    checkScrollControls()
  })
}

// 关闭左侧标签
const closeLeft = () => {
  const currentIndex = tabStore.tabs.findIndex((tab) => tab.path === tabStore.activeTab)
  const tabsToClose = tabStore.tabs.slice(0, currentIndex)
  tabsToClose.forEach((tab) => {
    if (tab.path !== homePath) {
      tabStore.removeTab(tab.path)
    }
  })
  nextTick(() => {
    checkScrollControls()
  })
}

// 关闭右侧标签
const closeRight = () => {
  const currentIndex = tabStore.tabs.findIndex((tab) => tab.path === tabStore.activeTab)
  const tabsToClose = tabStore.tabs.slice(currentIndex + 1)
  tabsToClose.forEach((tab) => {
    if (tab.path !== homePath) {
      tabStore.removeTab(tab.path)
    }
  })
  nextTick(() => {
    checkScrollControls()
  })
}

// 监听窗口大小变化
const handleResize = () => {
  checkScrollControls()
}

onMounted(() => {
  checkScrollControls()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --tab-nav-bg: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  --tab-bg: rgba(255, 255, 255, 0.8);
  --tab-active-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --tab-hover-bg: rgba(102, 126, 234, 0.1);
  --tab-text-color: #2c3e50;
  --tab-active-text-color: #ffffff;
  --tab-border-color: rgba(0, 0, 0, 0.08);
  --tab-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --tab-active-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

:root.dark {
  --tab-nav-bg: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%);
  --tab-bg: rgba(40, 40, 40, 0.8);
  --tab-active-bg: linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%);
  --tab-hover-bg: rgba(116, 185, 255, 0.1);
  --tab-text-color: #ecf0f1;
  --tab-active-text-color: #ffffff;
  --tab-border-color: rgba(255, 255, 255, 0.1);
  --tab-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --tab-active-shadow: 0 4px 15px rgba(116, 185, 255, 0.3);
}

/* 现代化标签导航容器 */
.modern-tab-nav {
  display: flex;
  align-items: center;
  height: 56px;
  background: var(--tab-nav-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--tab-border-color);
  border-radius: 0 0 24px 24px;
  padding: 8px 16px;
  position: relative;
  z-index: 10;
  margin: 0 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.modern-tab-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(102, 126, 234, 0.02) 0%,
    transparent 25%,
    transparent 75%,
    rgba(118, 75, 162, 0.02) 100%
  );
  pointer-events: none;
}

/* 标签容器 */
.tab-container {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.tab-scroll-area {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-scroll-area::-webkit-scrollbar {
  display: none;
}

.tab-list {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  min-width: min-content;
}

/* 现代化标签样式 */
.modern-tab {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  height: 36px;
  background: var(--tab-bg);
  border: 1px solid var(--tab-border-color);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  backdrop-filter: blur(10px);
  box-shadow: var(--tab-shadow);
  overflow: hidden;
}

.modern-tab:hover {
  background: var(--tab-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.modern-tab.active {
  background: var(--tab-active-bg);
  color: var(--tab-active-text-color);
  border-color: transparent;
  box-shadow: var(--tab-active-shadow);
  transform: translateY(-1px);
}

.modern-tab.home {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border-color: transparent;
}

.modern-tab.home:hover {
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

/* 标签内容 */
.tab-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  flex: 1;
  position: relative;
  z-index: 2;
}

.tab-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.tab-icon {
  font-size: 14px;
  transition: all 0.3s ease;
}

.home-icon {
  color: currentColor;
  animation: homeSwing 2.5s ease-in-out infinite;
}

@keyframes homeSwing {
  0%,
  100% {
    opacity: 0.8;
    transform: translateX(-1px);
  }
  50% {
    opacity: 1;
    transform: translateX(1px);
  }
}

.file-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
  opacity: 0.8;
}

.tab-title {
  font-size: 12px;
  font-weight: 500;
  color: currentColor;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.tab-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: indicatorSlide 2s ease-in-out infinite;
}

@keyframes indicatorSlide {
  0%,
  100% {
    opacity: 0.6;
    transform: translateX(-2px) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(2px) scale(1.1);
  }
}

/* 关闭按钮 */
.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 4px;
  transition: all 0.3s ease;
  opacity: 0.6;
  position: relative;
  z-index: 3;
}

.tab-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.tab-close .el-icon {
  font-size: 12px;
}

/* 标签背景装饰 */
.tab-bg-decoration {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

.modern-tab:hover .tab-bg-decoration {
  left: 100%;
}

.modern-tab.active .tab-bg-decoration {
  animation: activeSlide 2.5s ease-in-out infinite;
}

@keyframes activeSlide {
  0%,
  100% {
    left: -100%;
    opacity: 0.3;
  }
  25% {
    left: -50%;
    opacity: 0.6;
  }
  50% {
    left: 0%;
    opacity: 0.8;
  }
  75% {
    left: 50%;
    opacity: 0.6;
  }
  100% {
    left: 100%;
    opacity: 0.3;
  }
}

/* 滚动控制按钮 */
.tab-scroll-controls {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.scroll-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.scroll-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.scroll-btn .el-icon {
  font-size: 14px;
  color: var(--tab-text-color);
}

/* 标签操作区域 */
.tab-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--tab-border-color);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn .el-icon {
  font-size: 16px;
  color: var(--tab-text-color);
  transition: all 0.3s ease;
}

.refresh-btn:hover .el-icon {
  animation: refreshSpin 0.6s ease-in-out;
}

@keyframes refreshSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 下拉菜单样式 */
.tab-dropdown-menu {
  border-radius: 18px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--tab-border-color);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.tab-dropdown-menu :deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.tab-dropdown-menu :deep(.el-dropdown-menu__item:hover) {
  background: rgba(102, 126, 234, 0.1);
}

.tab-dropdown-menu :deep(.el-dropdown-menu__item .el-icon) {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-tab-nav {
    padding: 0 12px;
  }

  .modern-tab {
    min-width: 100px;
    max-width: 150px;
  }

  .tab-title {
    font-size: 11px;
  }

  .tab-actions {
    margin-left: 8px;
    padding-left: 8px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
  }

  .action-btn .el-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .modern-tab {
    min-width: 80px;
    max-width: 120px;
  }

  .tab-content {
    padding: 0 8px;
    gap: 6px;
  }

  .tab-title {
    font-size: 11px;
  }
}

/* 进入动画 */
.modern-tab {
  animation: tabSlideIn 0.3s ease-out;
}

@keyframes tabSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 特殊效果：活动标签的光晕 */
.modern-tab.active::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 22px;
  background: linear-gradient(
    90deg,
    rgba(102, 126, 234, 0.4),
    rgba(118, 75, 162, 0.6),
    rgba(102, 126, 234, 0.4)
  );
  z-index: -1;
  animation: glowSlide 3s ease-in-out infinite;
}

@keyframes glowSlide {
  0%,
  100% {
    transform: translateX(-10px);
    opacity: 0.6;
  }
  50% {
    transform: translateX(10px);
    opacity: 1;
  }
}
</style>
