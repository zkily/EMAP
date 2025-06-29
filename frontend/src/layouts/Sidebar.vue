<template>
  <!-- 桌面端现代化侧边栏 -->
  <div
    v-if="!isMobile"
    class="sidebar-container modern-sidebar"
    :class="{ collapsed }"
    :style="{ width: collapsed ? '64px' : expandedWidth }"
  >
    <!-- 现代化头部 -->
    <div class="sidebar-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-wrapper">
            <img src="@/components/icons/menulogo.svg" class="logo" />
            <div class="logo-pulse"></div>
          </div>
          <transition name="fade-slide">
            <div v-if="!collapsed" class="brand-info">
              <h3 class="system-name">管理メニュー</h3>
              <span class="system-desc">Navigation</span>
            </div>
          </transition>
        </div>

        <!-- 折叠控制按钮 -->
        <div class="collapse-control" @click="toggleCollapse">
          <el-icon class="collapse-icon">
            <component :is="collapsed ? DArrowRight : DArrowLeft" />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 现代化菜单区域 -->
    <div class="sidebar-body">
      <div class="menu-wrapper">
        <el-menu
          :default-active="activePath"
          class="modern-menu"
          :collapse="collapsed"
          background-color="transparent"
          text-color="var(--menu-text-color)"
          active-text-color="var(--menu-active-color)"
          router
          unique-opened
          @select="handleMenuSelect"
        >
          <template v-for="item in filteredMenu" :key="item.path || item.title">
            <!-- 子菜单 -->
            <el-sub-menu v-if="item.children?.length" :index="item.title" class="modern-submenu">
              <template #title>
                <el-tooltip
                  v-if="collapsed"
                  :content="item.title"
                  placement="right"
                  :show-after="500"
                >
                  <div class="menu-item-content" @click.stop="onMenuTitleClick(item)">
                    <div class="menu-icon">
                      <el-icon>
                        <component :is="item.icon" />
                      </el-icon>
                    </div>
                  </div>
                </el-tooltip>
                <template v-else>
                  <div class="menu-item-content" @click.stop="onMenuTitleClick(item)">
                    <div class="menu-icon">
                      <el-icon>
                        <component :is="item.icon" />
                      </el-icon>
                    </div>
                    <span class="menu-text">{{ item.title }}</span>
                    <div class="menu-indicator"></div>
                  </div>
                </template>
              </template>

              <el-menu-item
                v-for="child in item.children!"
                :key="child.path"
                :index="child.path"
                class="modern-menu-item submenu-item"
              >
                <el-tooltip
                  v-if="collapsed"
                  :content="child.title"
                  placement="right"
                  :show-after="500"
                >
                  <div class="menu-item-content">
                    <div class="menu-icon child-icon">
                      <el-icon>
                        <component :is="child.icon" />
                      </el-icon>
                    </div>
                  </div>
                </el-tooltip>
                <template v-else>
                  <div class="menu-item-content">
                    <div class="menu-icon child-icon">
                      <el-icon>
                        <component :is="child.icon" />
                      </el-icon>
                    </div>
                    <span class="menu-text">{{ child.title }}</span>
                    <div class="menu-indicator"></div>
                  </div>
                </template>
              </el-menu-item>
            </el-sub-menu>

            <!-- 单级菜单 -->
            <el-menu-item v-else :index="item.path" class="modern-menu-item">
              <el-tooltip
                v-if="collapsed"
                :content="item.title"
                placement="right"
                :show-after="500"
              >
                <div class="menu-item-content">
                  <div class="menu-icon">
                    <el-icon>
                      <component :is="item.icon" />
                    </el-icon>
                  </div>
                </div>
              </el-tooltip>
              <template v-else>
                <div class="menu-item-content">
                  <div class="menu-icon">
                    <el-icon>
                      <component :is="item.icon" />
                    </el-icon>
                  </div>
                  <span class="menu-text">{{ item.title }}</span>
                  <div class="menu-indicator"></div>
                </div>
              </template>
            </el-menu-item>
          </template>
        </el-menu>
      </div>

      <!-- 底部装饰 -->
      <div class="sidebar-footer" v-if="!collapsed">
        <div class="footer-decoration">
          <div class="decoration-line"></div>
          <div class="decoration-text">Smart-EMAP</div>
          <div class="decoration-line"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 移动端菜单按钮 -->
  <el-button v-else class="mobile-menu-btn modern-mobile-btn" @click="drawerVisible = true" circle>
    <el-icon>
      <Menu />
    </el-icon>
  </el-button>

  <!-- 移动端现代化抽屉菜单 -->
  <el-drawer
    v-model="drawerVisible"
    append-to-body
    :with-header="false"
    :size="expandedWidth"
    class="modern-mobile-drawer"
  >
    <div class="mobile-sidebar-content">
      <!-- 移动端头部 -->
      <div class="mobile-header">
        <div class="mobile-brand">
          <div class="mobile-logo-wrapper">
            <img src="@/components/icons/menulogo.svg" class="mobile-logo" />
          </div>
          <div class="mobile-brand-text">
            <h3 class="mobile-system-name">管理メニュー</h3>
            <span class="mobile-system-desc">Navigation Menu</span>
          </div>
        </div>
        <el-button class="close-drawer-btn" @click="drawerVisible = false" text>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 移动端菜单 -->
      <div class="mobile-menu-wrapper">
        <el-menu
          :default-active="activePath"
          class="mobile-modern-menu"
          :collapse="false"
          background-color="transparent"
          text-color="var(--menu-text-color)"
          active-text-color="var(--menu-active-color)"
          router
          unique-opened
          @select="onMobileMenuSelect"
        >
          <template v-for="item in filteredMenu" :key="item.path || item.title">
            <el-sub-menu v-if="item.children?.length" :index="item.title" class="mobile-submenu">
              <template #title>
                <div class="mobile-menu-item-content">
                  <div class="mobile-menu-icon">
                    <el-icon>
                      <component :is="item.icon" />
                    </el-icon>
                  </div>
                  <span class="mobile-menu-text">{{ item.title }}</span>
                </div>
              </template>
              <el-menu-item
                v-for="child in item.children"
                :key="child.path"
                :index="child.path"
                class="mobile-menu-item mobile-submenu-item"
              >
                <div class="mobile-menu-item-content">
                  <div class="mobile-menu-icon mobile-child-icon">
                    <el-icon>
                      <component :is="child.icon" />
                    </el-icon>
                  </div>
                  <span class="mobile-menu-text">{{ child.title }}</span>
                </div>
              </el-menu-item>
            </el-sub-menu>

            <el-menu-item v-else :index="item.path" class="mobile-menu-item">
              <div class="mobile-menu-item-content">
                <div class="mobile-menu-icon">
                  <el-icon>
                    <component :is="item.icon" />
                  </el-icon>
                </div>
                <span class="mobile-menu-text">{{ item.title }}</span>
              </div>
            </el-menu-item>
          </template>
        </el-menu>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '@/store/main'
import { MenuItem, menuList } from '@/constants/menuList'
import { DArrowLeft, DArrowRight, Menu, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 定义组件名称
defineOptions({
  name: 'NavSidebar',
})

const router = useRouter()
// 响应式状态
const isMobile = ref(false)
const drawerVisible = ref(false)
const collapsed = ref(false)
const expandedWidth = '280px'

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 320
  if (!isMobile.value) drawerVisible.value = false
}

// 初始挂载与卸载监听
onMounted(() => {
  if (!store.userInfo?.role) {
    const local = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (local.role) store.userInfo = local // 写回 Pinia，恢复状态
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

// 同步当前角色
const store = useMainStore()
const currentRole = ref('')

// 从 pinia 或 localStorage 中取出角色
function syncCurrentRole() {
  currentRole.value =
    store.userInfo?.role || JSON.parse(localStorage.getItem('userInfo') || '{}').role || ''
}

function onMenuTitleClick(item: MenuItem) {
  if (item.path) {
    router.push(item.path)
  }
}

watch(
  () => store.userInfo?.role,
  () => {
    syncCurrentRole()
  },
  { immediate: true }, // 立即同步，确保初始就有角色
)

// 权限过滤后的菜单
const filteredMenu = computed(() => {
  return menuList
    .map((item) => {
      if (item.children) {
        const kids = item.children.filter((ch) => ch.roles.includes(currentRole.value))
        return kids.length ? { ...item, children: kids } : null
      }
      return item.roles.includes(currentRole.value) ? item : null
    })
    .filter((i): i is (typeof menuList)[0] => Boolean(i))
})

// 当前高亮路径
const route = useRoute()
const activePath = computed(() => route.path)

// 切换折叠
function toggleCollapse() {
  collapsed.value = !collapsed.value
}

// 桌面/移动端菜单点击后关闭抽屉
function handleMenuSelect() {
  if (isMobile.value) drawerVisible.value = false
}
function onMobileMenuSelect() {
  drawerVisible.value = false
}
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --sidebar-bg: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  --sidebar-header-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --sidebar-header-text: #ffffff;
  --menu-text-color: #2c3e50;
  --menu-active-color: #667eea;
  --menu-hover-bg: rgba(102, 126, 234, 0.1);
  --menu-active-bg: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15) 0%,
    rgba(118, 75, 162, 0.15) 100%
  );
  --border-color: rgba(0, 0, 0, 0.08);
}

:root.dark {
  --sidebar-bg: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%);
  --sidebar-header-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  --sidebar-header-text: #ecf0f1;
  --menu-text-color: #ecf0f1;
  --menu-active-color: #74b9ff;
  --menu-hover-bg: rgba(116, 185, 255, 0.1);
  --menu-active-bg: linear-gradient(
    135deg,
    rgba(116, 185, 255, 0.15) 0%,
    rgba(162, 155, 254, 0.15) 100%
  );
  --border-color: rgba(255, 255, 255, 0.1);
}

/* 现代化侧边栏容器 */
.sidebar-container.modern-sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  position: relative;
}

.sidebar-container.modern-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(102, 126, 234, 0.02) 0%,
    transparent 50%,
    rgba(118, 75, 162, 0.02) 100%
  );
  pointer-events: none;
}

/* 现代化头部 */
.sidebar-header {
  position: relative;
  z-index: 2;
  background: var(--sidebar-header-bg);
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.logo-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.logo {
  width: 24px;
  height: 24px;
}

.logo-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.system-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--sidebar-header-text);
  margin: 0;
  line-height: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.system-desc {
  font-size: 11px;
  color: var(--sidebar-header-text);
  font-weight: 500;
  opacity: 0.8;
}

.collapse-control {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.collapse-control:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.collapse-icon {
  color: white;
  font-size: 16px;
  transition: transform 0.3s ease;
}

/* 菜单区域 */
.sidebar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.menu-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.modern-menu {
  border: none;
  background: transparent;
}

/* 强制设置菜单项文字颜色 */
.modern-menu :deep(.el-menu-item *),
.modern-menu :deep(.el-sub-menu__title *) {
  color: var(--menu-text-color) !important;
}

.modern-menu :deep(.el-menu-item.is-active *) {
  color: var(--menu-active-color) !important;
}

.modern-menu :deep(.el-sub-menu .el-menu-item.is-active *) {
  color: var(--menu-active-color) !important;
}

/* 菜单项样式 */
.modern-menu :deep(.el-menu-item),
.modern-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 12px;
  background: transparent;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  color: var(--menu-text-color) !important;
}

.modern-menu :deep(.el-menu-item):hover,
.modern-menu :deep(.el-sub-menu__title):hover {
  background: var(--menu-hover-bg);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  color: var(--menu-text-color) !important;
}

.modern-menu :deep(.el-menu-item.is-active) {
  background: var(--menu-active-bg);
  color: var(--menu-active-color) !important;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  border-left: 4px solid var(--menu-active-color);
}

.modern-menu :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  animation: activeShine 3s ease-in-out infinite;
}

@keyframes activeShine {
  0%,
  100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 0 16px;
  position: relative;
}

.menu-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.menu-icon .el-icon {
  font-size: 16px;
  color: var(--menu-active-color);
}

.child-icon {
  background: rgba(118, 75, 162, 0.1);
}

.menu-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--menu-text-color) !important;
  transition: all 0.3s ease;
}

.menu-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--menu-active-color);
  opacity: 0;
  transition: all 0.3s ease;
}

.modern-menu :deep(.el-menu-item.is-active) .menu-indicator {
  opacity: 1;
  animation: indicatorPulse 2s ease-in-out infinite;
}

@keyframes indicatorPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5);
  }
}

/* 子菜单样式 */
.modern-menu :deep(.el-sub-menu .el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin-left: 16px;
  border-radius: 8px;
  color: var(--menu-text-color) !important;
}

.modern-menu :deep(.el-sub-menu .el-menu-item):hover {
  color: var(--menu-text-color) !important;
}

.modern-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  color: var(--menu-active-color) !important;
}

.submenu-item .menu-item-content {
  padding: 0 12px;
}

/* 底部装饰 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.footer-decoration {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.6;
}

.decoration-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--menu-active-color), transparent);
}

.decoration-text {
  font-size: 11px;
  color: var(--menu-text-color);
  font-weight: 600;
}

/* 移动端样式 */
.mobile-menu-btn.modern-mobile-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.mobile-menu-btn.modern-mobile-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.modern-mobile-drawer :deep(.el-drawer) {
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
}

.mobile-sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--sidebar-header-bg);
  border-bottom: 1px solid var(--border-color);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-logo-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-logo {
  width: 24px;
  height: 24px;
}

.mobile-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-system-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--sidebar-header-text);
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.mobile-system-desc {
  font-size: 11px;
  color: var(--sidebar-header-text);
  opacity: 0.8;
}

.close-drawer-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.mobile-menu-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.mobile-modern-menu {
  border: none;
  background: transparent;
}

/* 强制设置移动端菜单项文字颜色 */
.mobile-modern-menu :deep(.el-menu-item *),
.mobile-modern-menu :deep(.el-sub-menu__title *) {
  color: var(--menu-text-color) !important;
}

.mobile-modern-menu :deep(.el-menu-item.is-active *) {
  color: var(--menu-active-color) !important;
}

.mobile-modern-menu :deep(.el-menu-item),
.mobile-modern-menu :deep(.el-sub-menu__title) {
  height: 48px;
  margin: 4px 0;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: var(--menu-text-color) !important;
}

.mobile-modern-menu :deep(.el-menu-item):hover,
.mobile-modern-menu :deep(.el-sub-menu__title):hover {
  color: var(--menu-text-color) !important;
}

.mobile-modern-menu :deep(.el-menu-item.is-active) {
  color: var(--menu-active-color) !important;
}

.mobile-menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.mobile-menu-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
}

.mobile-child-icon {
  background: rgba(118, 75, 162, 0.1);
}

.mobile-menu-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--menu-text-color) !important;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 折叠状态 */
.sidebar-container.collapsed {
  .menu-item-content {
    justify-content: center;
  }

  .menu-icon {
    margin: 0;
  }
}

/* 滚动条美化 */
.menu-wrapper::-webkit-scrollbar,
.mobile-menu-wrapper::-webkit-scrollbar {
  width: 4px;
}

.menu-wrapper::-webkit-scrollbar-track,
.mobile-menu-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.menu-wrapper::-webkit-scrollbar-thumb,
.mobile-menu-wrapper::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
}

.menu-wrapper::-webkit-scrollbar-thumb:hover,
.mobile-menu-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}
</style>
