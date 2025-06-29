<template>
  <div class="layout" :class="{ dark: isDark }">
    <!-- 动态背景装饰 -->
    <div class="layout-bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <!-- 现代化顶部栏 -->
    <header class="layout-header">
      <!-- 移动端菜单按钮 -->
      <el-button class="menu-toggle modern-btn" @click="toggleDrawer" text v-if="isMobile">
        <el-icon>
          <Menu />
        </el-icon>
      </el-button>

      <!-- 品牌标识区域 -->
      <div class="header-brand">
        <div class="logo-container">
          <img src="@/components/icons/logo.svg" class="logo" />
          <div class="logo-glow"></div>
        </div>
        <div class="brand-text">
          <h1 class="system-title">Smart-EMAP</h1>
          <span class="system-subtitle">生産管理システム</span>
        </div>
      </div>

      <!-- 头部操作区域 -->
      <div class="header-actions">
        <!-- 主题切换按钮 -->
        <el-tooltip
          :content="theme === 'light' ? 'ダークモード' : 'ライトモード'"
          placement="bottom"
        >
          <el-button class="theme-toggle modern-btn" @click="toggleTheme" text>
            <el-icon v-if="theme === 'light'" class="theme-icon sun-icon">
              <Sunny />
            </el-icon>
            <el-icon v-else class="theme-icon moon-icon">
              <Moon />
            </el-icon>
          </el-button>
        </el-tooltip>

        <!-- 用户菜单 -->
        <el-dropdown class="user-dropdown" trigger="hover">
          <div class="user-avatar-container">
            <div class="avatar-wrapper">
              <img src="@/components/icons/user.svg" class="avatar-img" />
              <div class="avatar-status"></div>
            </div>
            <div class="user-info" v-if="!isMobile">
              <span class="username">{{ store.userInfo?.username || 'ユーザー' }}</span>
              <span class="user-role">{{ store.userInfo?.role || 'ゲスト' }}</span>
            </div>
            <el-icon class="dropdown-arrow">
              <ArrowDown />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="modern-dropdown">
              <el-dropdown-item class="dropdown-item" @click="toggleTheme">
                <el-icon><Sunny /></el-icon>
                <span>モード切替</span>
              </el-dropdown-item>
              <el-dropdown-item class="dropdown-item" @click="toggleLang">
                <el-icon><SwitchButton /></el-icon>
                <span>言語切替</span>
              </el-dropdown-item>
              <el-dropdown-item class="dropdown-item" divided @click="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>ログアウト</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="layout-body">
      <!-- 移动端侧边栏抽屉 -->
      <el-drawer
        v-if="isMobile"
        v-model="drawerVisible"
        direction="ltr"
        size="280px"
        :with-header="false"
        class="mobile-drawer"
      >
        <div class="drawer-content">
          <Sidebar />
        </div>
      </el-drawer>

      <!-- 桌面端侧边栏 -->
      <aside class="sidebar-wrapper" v-else>
        <Sidebar />
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <!-- 标签导航区域 -->
        <div class="tab-nav-container">
          <TabNav />
        </div>
        <!-- 页面内容区域 -->
        <div class="content-area">
          <div class="content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="page-transition" mode="out-in">
                <keep-alive>
                  <component :is="Component" :key="route.fullPath" />
                </keep-alive>
              </transition>
            </router-view>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMainStore } from '@/store/main'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '@/layouts/Sidebar.vue'
import TabNav from '@/layouts/TabNav.vue'
import { Sunny, Moon, Menu, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

// 定义组件名称
defineOptions({
  name: 'MainLayout',
})

const store = useMainStore()
const router = useRouter()
const route = useRoute()
const { locale } = useI18n()

// 暗黑模式
const theme = ref(localStorage.getItem('theme') || 'light')
const isDark = ref(theme.value === 'dark')
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  isDark.value = theme.value === 'dark'
  document.documentElement.classList.toggle('dark', isDark.value)
}

// 移动端菜单开关
const drawerVisible = ref(false)
const isMobile = ref(false)
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (isDark.value) document.documentElement.classList.add('dark')
})

// 语言切换
const toggleLang = () => {
  const newLang = locale.value === 'ja' ? 'zh' : 'ja'
  locale.value = newLang
  localStorage.setItem('lang', newLang)
}

// 登出
const logout = () => {
  store.$reset()
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --layout-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --layout-bg-light: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  --header-bg: rgba(255, 255, 255, 0.95);
  --header-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  --sidebar-bg: rgba(255, 255, 255, 0.98);
  --content-bg: rgba(255, 255, 255, 0.95);
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --border-color: rgba(0, 0, 0, 0.08);
  --brand-primary: #667eea;
  --brand-secondary: #764ba2;
}

:root.dark {
  --layout-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  --layout-bg-light: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  --header-bg: rgba(30, 30, 30, 0.95);
  --header-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  --sidebar-bg: rgba(30, 30, 30, 0.98);
  --content-bg: rgba(40, 40, 40, 0.95);
  --text-primary: #ecf0f1;
  --text-secondary: #bdc3c7;
  --border-color: rgba(255, 255, 255, 0.1);
  --brand-primary: #74b9ff;
  --brand-secondary: #a29bfe;
}

/* 主布局容器 */
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--layout-bg);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

/* 动态背景装饰 */
.layout-bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  animation: float 20s ease-in-out infinite;
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 7s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

/* 现代化头部 */
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--header-shadow);
  position: relative;
  z-index: 100;
}

/* 品牌标识区域 */
.header-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.logo {
  width: 28px;
  height: 28px;
  z-index: 2;
}

.logo-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  opacity: 0.6;
  animation: logoGlow 3s ease-in-out infinite alternate;
}

@keyframes logoGlow {
  0% {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
  }
  100% {
    box-shadow:
      0 0 20px rgba(102, 126, 234, 0.8),
      0 0 30px rgba(118, 75, 162, 0.6);
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.system-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.system-subtitle {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  opacity: 0.7;
}

/* 头部操作区域 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modern-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.theme-icon {
  font-size: 18px;
  transition: all 0.3s ease;
}

.sun-icon {
  color: #f39c12;
  animation: sunRotate 10s linear infinite;
}

.moon-icon {
  color: #74b9ff;
  animation: moonGlow 2s ease-in-out infinite alternate;
}

@keyframes sunRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes moonGlow {
  0% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

/* 用户下拉菜单 */
.user-dropdown {
  cursor: pointer;
}

.user-avatar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.user-avatar-container:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.avatar-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--brand-primary);
}

.avatar-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #27ae60;
  border-radius: 50%;
  border: 2px solid var(--header-bg);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.user-role {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.dropdown-arrow {
  font-size: 14px;
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.user-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

/* 现代化下拉菜单 */
.modern-dropdown {
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

/* 主体布局 */
.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.sidebar-wrapper {
  width: 280px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-nav-container {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}

.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  border-radius: 12px 0 0 0;
  margin: 8px 12px 12px 0;
  background: var(--content-bg);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  border-radius: 12px 0 0 0;
}

/* 移动端抽屉 */
.mobile-drawer :deep(.el-drawer) {
  border-radius: 0 20px 20px 0;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
}

.drawer-content {
  height: 100%;
  overflow-y: auto;
}

/* 页面过渡动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-wrapper {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .layout-header {
    padding: 0 16px;
    height: 56px;
  }

  .header-brand {
    gap: 12px;
  }

  .logo-container {
    width: 40px;
    height: 40px;
  }

  .logo {
    width: 24px;
    height: 24px;
  }

  .system-title {
    font-size: 20px;
  }

  .system-subtitle {
    font-size: 11px;
  }

  .content-wrapper {
    padding: 16px;
  }

  .content-area {
    margin: 8px 8px 8px 0;
  }

  .user-info {
    display: none;
  }
}

@media (max-width: 480px) {
  .layout-header {
    padding: 0 12px;
  }

  .header-actions {
    gap: 8px;
  }

  .content-wrapper {
    padding: 12px;
  }

  .content-area {
    margin: 6px 6px 6px 0;
  }
}

/* 滚动条美化 */
.content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}
</style>
