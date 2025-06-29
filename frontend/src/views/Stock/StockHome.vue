<template>
  <div class="stock-home">
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
            <el-icon size="40">
              <Box />
            </el-icon>
          </div>
          <div class="header-text">
            <h1 class="main-title">在庫管理システム</h1>
            <p class="subtitle">各種在庫データの管理・操作を行います</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalMenuItems }}</span>
            <span class="stat-label">メニュー</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ Object.keys(groupedRoutes).length }}</span>
            <span class="stat-label">グループ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <div class="groups-container">
        <template v-if="Object.keys(groupedRoutes).length">
          <div v-for="(routes, group, index) in groupedRoutes" :key="group" class="group-section"
            :class="groupClass(group)" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="group-header">
              <div class="group-title-wrapper">
                <div class="group-icon-wrapper">
                  <el-icon class="group-icon">
                    <component :is="getGroupIcon(group)" />
                  </el-icon>
                </div>
                <h3 class="group-title">{{ group }}</h3>
              </div>
              <div class="group-badge">{{ routes.length }}</div>
            </div>

            <div class="button-grid">
              <div v-for="(route, routeIndex) in routes" :key="route.name" class="button-card"
                :style="{ animationDelay: `${index * 0.1 + routeIndex * 0.05}s` }" @click="goTo(route.name)"
                tabindex="0">
                <div class="card-background"></div>
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon v-if="route.meta?.icon" class="animated-icon">
                      <component :is="route.meta.icon" />
                    </el-icon>
                    <el-icon v-else class="animated-icon">
                      <Box />
                    </el-icon>
                  </div>
                  <div class="card-text">
                    <h4 class="card-title">{{ route.meta?.title || route.name }}</h4>
                    <p class="card-description">{{ getRouteDescription(route.name as string) }}</p>
                  </div>
                </div>
                <div class="card-arrow">
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="empty-menu">
            <el-icon size="48">
              <Box />
            </el-icon>
            <p>暂无可用菜单</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <p>© 2024 Smart Manufacturing System - Stock Management</p>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import {
  Box,
  ArrowRight,
  DataBoard,
  Tools,
  Document,
  Warning,
  Upload,
  Download
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const subRoutes = computed(() => {
  const matchedParent = route.matched.find(r => r.path === '/stock')
  return (matchedParent?.children || []).filter(r => !!r.name) as RouteRecordRaw[]
})

const groupedRoutes = computed(() => {
  const groups: Record<string, RouteRecordRaw[]> = {}
  for (const r of subRoutes.value) {
    const group = (r.meta?.group as string) || 'その他'
    if (group === 'メインメニュー') continue
    if (!groups[group]) groups[group] = []
    groups[group].push(r)
  }
  return groups
})

// 总菜单项数
const totalMenuItems = computed(() => {
  return Object.values(groupedRoutes.value).reduce((total, routes) => total + routes.length, 0)
})

const getGroupIcon = (group: string) => {
  if (group.includes('入出庫手動登録')) return Upload
  if (group.includes('在庫明細')) return Document
  if (group.includes('在庫分析')) return Warning
  if (group.includes('入出庫自動処理')) return Download
  return Box
}

const getRouteDescription = (routeName: string) => {
  // 可根据实际路由名自定义描述
  const descriptions: Record<string, string> = {
    // 'StockList': '在庫一覧の管理',
    // 'StockLog': '在庫明細の履歴',
    // ...
  }
  return descriptions[routeName] || '在庫データの管理・操作'
}

const groupClass = (group: string) => {
  if (group.includes('入出庫手動登録')) return 'group-product'
  if (group.includes('在庫明細')) return 'group-log'
  if (group.includes('在庫分析')) return 'group-alert'
  if (group.includes('入出庫自動処理')) return 'group-input'
  return 'group-default'
}

const goTo = (routeName: RouteRecordName | undefined) => {
  if (routeName) router.replace({ name: routeName })
}
</script>

<style scoped>
.stock-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7b42c 0%, #fc575e 100%);
  position: relative;
  overflow-x: hidden;
  scroll-behavior: smooth;
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
  background: linear-gradient(45deg, rgba(247, 180, 44, 0.1), rgba(252, 87, 94, 0.1));
  animation: floatOrb 20s ease-in-out infinite;
  will-change: transform;
}

.orb-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: -5s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: -10s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -15s;
}

@keyframes floatOrb {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  33% {
    transform: translateY(-30px) rotate(120deg);
  }

  66% {
    transform: translateY(30px) rotate(240deg);
  }
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 0 0 24px 24px;
  margin: 0 20px 30px;
  padding: 30px 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
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
  gap: 20px;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(247, 180, 44, 0.3);
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-3px);
  }
}

.header-text {
  flex: 1;
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 6px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 14px;
  color: #7c8db5;
  margin: 0;
  font-weight: 500;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(247, 180, 44, 0.1), rgba(252, 87, 94, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(247, 180, 44, 0.2);
  min-width: 60px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #f7b42c;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8492a6;
  margin-top: 4px;
  font-weight: 500;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  position: relative;
  z-index: 1;
}

.groups-container {
  display: grid;
  gap: 24px;
}

.group-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.group-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  box-shadow: 0 4px 12px rgba(247, 180, 44, 0.3);
}

.group-icon {
  font-size: 18px;
}

.group-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.group-badge {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.button-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  animation: slideInCard 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  will-change: transform;
}

.card-background {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(247, 180, 44, 0.1), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.button-card:hover .card-background {
  left: 100%;
}

@keyframes slideInCard {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button-card:hover {
  transform: translateY(-3px);
  border-color: #f7b42c;
  box-shadow: 0 8px 24px rgba(247, 180, 44, 0.2);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(247, 180, 44, 0.3);
  flex-shrink: 0;
}

.button-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 16px rgba(247, 180, 44, 0.4);
}

.animated-icon {
  transition: transform 0.3s ease;
}

.card-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 12px;
  color: #8492a6;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-arrow {
  color: #bdc3c7;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.button-card:hover .card-arrow {
  color: #fc575e;
  transform: translateX(4px);
}

/* 组别颜色主题 */
.group-product .group-icon {
  color: #f7b42c;
  animation: iconPulse 3s ease-in-out infinite;
}

.group-product .group-badge {
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  box-shadow: 0 4px 15px rgba(247, 180, 44, 0.3);
}

.group-product .card-icon {
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  box-shadow: 0 8px 20px rgba(247, 180, 44, 0.3);
}

.group-log .group-icon {
  color: #00b8d9;
  animation: iconPulse 3s ease-in-out infinite;
}

.group-log .group-badge {
  background: linear-gradient(135deg, #00b8d9, #43e97b);
  box-shadow: 0 4px 15px rgba(0, 184, 217, 0.3);
}

.group-log .card-icon {
  background: linear-gradient(135deg, #00b8d9, #43e97b);
  box-shadow: 0 8px 20px rgba(0, 184, 217, 0.3);
}

.group-alert .group-icon {
  color: #ff6b6b;
  animation: iconPulse 3s ease-in-out infinite;
}

.group-alert .group-badge {
  background: linear-gradient(135deg, #ff6b6b, #ffd166);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.group-alert .card-icon {
  background: linear-gradient(135deg, #ff6b6b, #ffd166);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.group-input .group-icon {
  color: #69db7c;
  animation: iconPulse 3s ease-in-out infinite;
}

.group-input .group-badge {
  background: linear-gradient(135deg, #69db7c, #38d9a9);
  box-shadow: 0 4px 15px rgba(105, 219, 124, 0.3);
}

.group-input .card-icon {
  background: linear-gradient(135deg, #69db7c, #38d9a9);
  box-shadow: 0 8px 20px rgba(105, 219, 124, 0.3);
}

.group-default .group-icon {
  color: #a78bfa;
  animation: iconPulse 3s ease-in-out infinite;
}

.group-default .group-badge {
  background: linear-gradient(135deg, #a78bfa, #f7b42c);
  box-shadow: 0 4px 15px rgba(167, 139, 250, 0.3);
}

.group-default .card-icon {
  background: linear-gradient(135deg, #a78bfa, #f7b42c);
  box-shadow: 0 8px 20px rgba(167, 139, 250, 0.3);
}

@keyframes iconPulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.footer-info {
  text-align: center;
  padding: 30px 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 400;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 优化滚动性能 */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f7b42c, #fc575e);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #fc575e, #f7b42c);
}

/* 空菜单提示样式 */
.empty-menu {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 60px 40px;
  margin: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-menu .el-icon {
  color: #8492a6;
}

.empty-menu p {
  color: #8492a6;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 按钮卡片点击效果 */
.button-card:active {
  transform: translateY(-2px) scale(0.98);
  transition: all 0.1s ease;
}

/* 焦点状态 */
.button-card:focus {
  outline: none;
  border-color: #f7b42c;
  box-shadow: 0 0 0 3px rgba(247, 180, 44, 0.2);
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .button-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .header-stats {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 20px 15px;
    margin: 0 15px 20px;
  }

  .main-title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 13px;
  }

  .content-container {
    padding: 0 15px 30px;
  }

  .group-section {
    padding: 20px;
  }

  .group-title {
    font-size: 16px;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .button-card {
    padding: 18px;
  }

  .card-content {
    gap: 10px;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .card-title {
    font-size: 13px;
  }

  .card-description {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 15px 10px;
    margin: 0 10px 15px;
  }

  .main-title {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .group-section {
    padding: 16px;
  }

  .group-title {
    font-size: 15px;
  }

  .button-card {
    padding: 16px;
  }

  .card-icon {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }

  .footer-info {
    padding: 20px 10px;
    font-size: 12px;
  }
}

@media (prefers-color-scheme: dark) {
  .stock-home {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .group-section {
    background: rgba(45, 55, 72, 0.98);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .group-title {
    color: #e2e8f0;
  }

  .card-title {
    color: #e2e8f0;
  }

  .card-description {
    color: #a0aec0;
  }

  .button-card {
    background: linear-gradient(145deg, rgba(26, 32, 44, 0.9), rgba(45, 55, 72, 0.8));
    border-color: rgba(255, 255, 255, 0.1);
  }

  .button-card:hover {
    border-color: #f7b42c;
    box-shadow: 0 15px 40px rgba(247, 180, 44, 0.3);
  }

  .main-title {
    background: linear-gradient(45deg, #ffffff, #e2e8f0);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
