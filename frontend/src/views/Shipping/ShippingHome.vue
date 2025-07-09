<template>
  <div class="shipping-home">
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
              <Van />
            </el-icon>
          </div>
          <div class="header-text">
            <h1 class="main-title">出荷管理システム</h1>
            <p class="subtitle">出荷・ピッキング・履歴などの管理メニュー</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalMenus }}</span>
            <span class="stat-label">出荷メニュー</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ Object.keys(groupedRoutes).length }}</span>
            <span class="stat-label">カテゴリ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <div class="groups-container">
        <template v-if="Object.keys(groupedRoutes).length">
          <div
            v-for="(routes, group, index) in groupedRoutes"
            :key="group"
            class="group-section"
            :class="groupClass(group)"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
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
              <div
                v-for="(route, routeIndex) in routes"
                :key="route.name"
                class="button-card"
                :style="{ animationDelay: `${index * 0.1 + routeIndex * 0.05}s` }"
                @click="goTo(route.name as RouteRecordName)"
                tabindex="0"
              >
                <div class="card-background"></div>
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon v-if="route.meta?.icon" class="animated-icon">
                      <component :is="getElIconFromLucide(route.meta.icon)" />
                    </el-icon>
                    <el-icon v-else class="animated-icon">
                      <Document />
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
              <Van />
            </el-icon>
            <p>暂无可用的出荷菜单</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <p>© 2025 Smart Manufacturing System - Shipping Management</p>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import {
  Document,
  Calendar,
  Warning,
  Edit,
  List,
  ArrowRight,
  Box,
  User,
  DataBoard,
  Van,
  Histogram,
  PieChart,
  TrendCharts,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 子ルート取得
const subRoutes = computed(() => {
  const matchedParent = route.matched.find((r) => r.path === '/shipping')
  return (matchedParent?.children || []).filter((r) => !!r.name) as RouteRecordRaw[]
})

// グループ毎に分類
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

// 总菜单数计算
const totalMenus = computed(() => {
  return Object.values(groupedRoutes.value).reduce((total, routes) => total + routes.length, 0)
})

// Lucide图标转换为Element Plus图标
const getElIconFromLucide = (icon: any) => {
  // 图标名称映射
  const iconMap: Record<string, any> = {
    Menu: Document,
    ClipboardList: Document,
    Package: Box,
    FileText: Document,
    Truck: Van,
    History: List,
    PieChart: PieChart,
    Activity: TrendCharts,
  }

  // 根据icon的名称返回对应的Element Plus图标
  if (icon && typeof icon === 'object' && icon.name) {
    return iconMap[icon.name] || Document
  }

  return Document
}

// グループアイコン取得
const getGroupIcon = (group: string) => {
  if (group.includes('月') || group.includes('日')) return Calendar
  if (group.includes('履歴') || group.includes('ログ')) return List
  if (group.includes('警告') || group.includes('異常')) return Warning
  if (group.includes('入力')) return Edit
  if (group.includes('ユーザー')) return User
  if (group.includes('製品')) return Box
  if (group.includes('工程')) return DataBoard
  if (group.includes('出荷')) return Van
  if (group.includes('ダッシュボード')) return PieChart
  return Document
}

// ルート説明取得
const getRouteDescription = (routeName: string) => {
  const descriptions: Record<string, string> = {
    ShippingList: '出荷構成表の管理',
    ShippingOverview: '出荷予定表の管理',
    ShippingReportPage: '出荷報告書の管理',
    WeldingShippingManager: 'スライディング溶接出荷予定の管理',
    ShippingPickingHome: '出荷ピッキング履歴の確認・進捗・履歴の管理',
    ShippingDashboard: '出荷データの可視化',
    ShippingKpi: '出荷KPI指標の確認',
  }
  return descriptions[routeName] || '出荷関連の管理・操作'
}

// グループスタイル
const groupClass = (group: string) => {
  if (group.includes('月') || group.includes('日')) return 'group-product'
  if (group.includes('履歴') || group.includes('ログ')) return 'group-log'
  if (group.includes('警告') || group.includes('異常')) return 'group-alert'
  if (group.includes('入力')) return 'group-input'
  return 'group-default'
}

// ルート遷移
const goTo = (routeName: RouteRecordName | undefined) => {
  if (routeName) router.replace({ name: routeName })
}
</script>

<style scoped>
.shipping-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow-x: hidden;
  scroll-behavior: smooth;
  animation: backgroundShift 20s ease-in-out infinite;
}

@keyframes backgroundShift {
  0%,
  100% {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  }
  33% {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #667eea 100%);
  }
  66% {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #4facfe 100%);
  }
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
  background: linear-gradient(
    45deg,
    rgba(102, 126, 234, 0.15),
    rgba(118, 75, 162, 0.15),
    rgba(240, 147, 251, 0.1)
  );
  animation: floatOrb 20s ease-in-out infinite;
  will-change: transform;
  filter: blur(1px);
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.2);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(25px);
  border-radius: 0 0 32px 32px;
  margin: 0 20px 30px;
  padding: 35px 45px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(102, 126, 234, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  animation: headerGlow 4s ease-in-out infinite alternate;
}

@keyframes headerGlow {
  0% {
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(102, 126, 234, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  100% {
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.2),
      0 8px 24px rgba(102, 126, 234, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
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
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.4),
    0 4px 12px rgba(118, 75, 162, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  animation: iconFloat 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.header-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: iconShine 4s ease-in-out infinite;
}

@keyframes iconShine {
  0%,
  100% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  50% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
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
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #2c3e50 0%, #667eea 50%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
  animation: titleGlow 3s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  0% {
    filter: brightness(1);
    transform: scale(1);
  }
  100% {
    filter: brightness(1.1);
    transform: scale(1.02);
  }
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
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15),
    rgba(118, 75, 162, 0.15),
    rgba(240, 147, 251, 0.1)
  );
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  min-width: 80px;
  box-shadow:
    0 4px 16px rgba(102, 126, 234, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.stat-item:hover::before {
  left: 100%;
}

.stat-item:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: statPulse 2s ease-in-out infinite;
}

@keyframes statPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(25px);
  border-radius: 20px;
  padding: 28px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(102, 126, 234, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.group-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.05), transparent);
  transition: left 0.8s ease;
}

.group-section:hover::before {
  left: 100%;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group-section:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.4);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(102, 126, 234, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
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
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
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
  transform: translateY(-6px) scale(1.02);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 6px 16px rgba(102, 126, 234, 0.4),
    0 2px 8px rgba(118, 75, 162, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.card-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: transform 0.6s ease;
  transform: translateX(-100%) translateY(-100%) rotate(45deg);
}

.button-card:hover .card-icon::before {
  transform: translateX(100%) translateY(100%) rotate(45deg);
}

.animated-icon {
  transition: transform 0.2s ease;
}

.button-card:hover .card-icon {
  transform: scale(1.15) rotate(8deg);
  box-shadow:
    0 10px 24px rgba(102, 126, 234, 0.5),
    0 4px 12px rgba(118, 75, 162, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.card-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #2c3e50 0%, #667eea 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.button-card:hover .card-title {
  transform: translateX(2px);
}

.card-description {
  font-size: 13px;
  color: #7c8db5;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.button-card:hover .card-description {
  color: #667eea;
  transform: translateX(2px);
}

.card-arrow {
  color: #bdc3c7;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.button-card:hover .card-arrow {
  color: #667eea;
  transform: translateX(6px) scale(1.2);
}

/* 组别颜色主题 - 产品相关 */
.group-product {
  border-color: rgba(78, 205, 196, 0.3);
}

.group-product:hover {
  border-color: rgba(78, 205, 196, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(78, 205, 196, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.group-product .group-icon-wrapper {
  background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 50%, #4ecdc4 100%);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
}

.group-product .group-badge {
  background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 50%, #4ecdc4 100%);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.group-product .card-icon {
  background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 50%, #4ecdc4 100%);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
}

/* 日志履歴相关 */
.group-log {
  border-color: rgba(102, 126, 234, 0.3);
}

.group-log:hover {
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.group-log .group-icon-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.group-log .group-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.group-log .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 警告异常相关 */
.group-alert {
  border-color: rgba(255, 107, 107, 0.3);
}

.group-alert:hover {
  border-color: rgba(255, 107, 107, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(255, 107, 107, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.group-alert .group-icon-wrapper {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ff5722 100%);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.group-alert .group-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ff5722 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.group-alert .card-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ff5722 100%);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

/* 输入编辑相关 */
.group-input {
  border-color: rgba(67, 233, 123, 0.3);
}

.group-input:hover {
  border-color: rgba(67, 233, 123, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(67, 233, 123, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.group-input .group-icon-wrapper {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #4facfe 100%);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.4);
}

.group-input .group-badge {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #4facfe 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.group-input .card-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #4facfe 100%);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.4);
}

/* 默认分组 */
.group-default .group-icon-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.group-default .group-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.group-default .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.footer-info {
  text-align: center;
  padding: 30px 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 400;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
}

/* 焦点状态 */
.button-card:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* 按钮卡片点击效果 */
.button-card:active {
  transform: translateY(-2px) scale(0.98);
  transition: all 0.1s ease;
}

/* 响应式设计 */
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

  .header-left {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-icon {
    width: 50px;
    height: 50px;
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
    padding: 20px 16px;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .button-card {
    padding: 16px;
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

  .group-section {
    padding: 16px 12px;
  }

  .group-title {
    font-size: 16px;
  }

  .button-card {
    padding: 14px;
  }

  .footer-info {
    padding: 20px 15px;
    font-size: 12px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .shipping-home {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .page-header {
    background: rgba(45, 55, 72, 0.95);
    color: #e2e8f0;
  }

  .main-title {
    color: #e2e8f0;
  }

  .subtitle {
    color: #a0aec0;
  }

  .group-section {
    background: rgba(45, 55, 72, 0.95);
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
    background: rgba(26, 32, 44, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .button-card:hover {
    border-color: #667eea;
  }

  .empty-menu {
    background: rgba(45, 55, 72, 0.95);
    color: #e2e8f0;
  }
}
</style>
