<template>
  <div class="inventory-home">
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
              <DataBoard />
            </el-icon>
          </div>
          <div class="header-text">
            <h1 class="main-title">棚卸管理システム</h1>
            <p class="subtitle">在庫棚卸・管理・統計などの管理メニュー</p>
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
                :style="{ animationDelay: `${index * 0.1 + routeIndex * 0.05}s` }"
                @click="goTo(route.name as RouteRecordName)" tabindex="0">
                <div class="card-background"></div>
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon v-if="route.meta?.icon">
                      <component :is="route.meta.icon" />
                    </el-icon>
                    <el-icon v-else>
                      <DataBoard />
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
              <DataBoard />
            </el-icon>
            <p>利用可能なメニューがありません</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <p>© 2024 Smart Manufacturing System - Inventory Count Management</p>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import {
  DataBoard,
  Box,
  TrendCharts,
  Edit,
  List,
  ArrowRight,
  Setting,
  User,
  Calendar,
  WarningFilled,
  Operation,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 子ルート取得
const subRoutes = computed(() => {
  const matchedParent = route.matched.find((r) => r.path === '/inventorycount')
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

// 总菜单项数
const totalMenuItems = computed(() => {
  return Object.values(groupedRoutes.value).reduce((total, routes) => total + routes.length, 0)
})

// グループアイコン取得
const getGroupIcon = (group: string) => {
  if (group.includes('棚卸単') || group.includes('管理')) return DataBoard
  if (group.includes('製品') || group.includes('商品')) return Box
  if (group.includes('統計') || group.includes('分析')) return TrendCharts
  if (group.includes('履歴') || group.includes('ログ')) return List
  if (group.includes('設定') || group.includes('管理')) return Setting
  if (group.includes('入力') || group.includes('作成')) return Edit
  if (group.includes('ユーザー')) return User
  if (group.includes('日付') || group.includes('期間')) return Calendar
  if (group.includes('警告') || group.includes('異常')) return WarningFilled
  if (group.includes('工程') || group.includes('操作')) return Operation
  return DataBoard
}

// ルート説明取得
const getRouteDescription = (routeName: string) => {
  const descriptions: Record<string, string> = {
    'InventoryCountHome': '棚卸単の一覧・管理',
    'InventoryCountCreate': '新規棚卸単の作成',
    'InventoryCountList': '棚卸単一覧の確認',
    'InventoryCountStats': '棚卸統計・分析',
    'InventoryCountStatistics': '棚卸統計・分析',
    'InventoryCountAnalytics': '棚卸分析・レポート',
    'InventoryCountReport': '棚卸レポート作成',
    'InventoryCountSettings': '棚卸設定・管理',
    'InventoryCountConfig': 'システム設定・管理',
    'InventoryUserManagement': 'ユーザー管理・権限設定',
    'ProductInventory': '製品棚卸の管理',
    'ProductInventoryCreate': '製品棚卸の作成',
    'ProductInventoryList': '製品棚卸一覧の確認',
    'WipInventory': '仕掛品棚卸の管理',
    'WipInventoryCreate': '仕掛品棚卸の作成',
    'WipInventoryList': '仕掛品棚卸一覧の確認',
    'MaterialInventory': '材料棚卸の管理',
    'MaterialInventoryCreate': '材料棚卸の作成',
    'MaterialInventoryList': '材料棚卸一覧の確認',
    'ComponentInventory': '部品棚卸の管理',
    'ComponentInventoryCreate': '部品棚卸の作成',
    'ComponentInventoryList': '部品棚卸一覧の確認',
    'InventoryHistory': '棚卸履歴の確認',
    'InventoryAudit': '監査ログの確認',
    'InventoryLog': '操作ログの確認',
  }
  return descriptions[routeName] || '棚卸関連の管理・操作'
}

// グループスタイル
const groupClass = (group: string) => {
  if (group.includes('製品') || group.includes('商品')) return 'group-product'
  if (group.includes('仕掛品') || group.includes('工程')) return 'group-wip'
  if (group.includes('材料') || group.includes('原料')) return 'group-material'
  if (group.includes('部品') || group.includes('コンポーネント')) return 'group-component'
  if (group.includes('統計') || group.includes('分析')) return 'group-stats'
  if (group.includes('履歴') || group.includes('ログ')) return 'group-log'
  if (group.includes('設定') || group.includes('管理')) return 'group-settings'
  if (group.includes('警告') || group.includes('異常')) return 'group-alert'
  return 'group-default'
}

// ルート遷移
const goTo = (routeName: RouteRecordName | undefined) => {
  if (routeName) router.replace({ name: routeName })
}
</script>

<style scoped>
.inventory-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
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
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  min-width: 60px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
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
  transform: translateY(-3px);
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.button-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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
  color: #667eea;
  transform: translateX(4px);
}

/* 组别颜色主题 */
.group-product .group-icon-wrapper {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.group-product .group-badge {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.group-product .card-icon {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3);
}

.group-wip .group-icon-wrapper {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.group-wip .group-badge {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.group-wip .card-icon {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.3);
}

.group-material .group-icon-wrapper {
  background: linear-gradient(135deg, #17a2b8, #007bff);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.group-material .group-badge {
  background: linear-gradient(135deg, #17a2b8, #007bff);
  box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
}

.group-material .card-icon {
  background: linear-gradient(135deg, #17a2b8, #007bff);
  box-shadow: 0 8px 20px rgba(23, 162, 184, 0.3);
}

.group-component .group-icon-wrapper {
  background: linear-gradient(135deg, #6610f2, #6f42c1);
  box-shadow: 0 4px 12px rgba(102, 16, 242, 0.3);
}

.group-component .group-badge {
  background: linear-gradient(135deg, #6610f2, #6f42c1);
  box-shadow: 0 4px 15px rgba(102, 16, 242, 0.3);
}

.group-component .card-icon {
  background: linear-gradient(135deg, #6610f2, #6f42c1);
  box-shadow: 0 8px 20px rgba(102, 16, 242, 0.3);
}

.group-stats .group-icon-wrapper {
  background: linear-gradient(135deg, #e83e8c, #dc3545);
  box-shadow: 0 4px 12px rgba(232, 62, 140, 0.3);
}

.group-stats .group-badge {
  background: linear-gradient(135deg, #e83e8c, #dc3545);
  box-shadow: 0 4px 15px rgba(232, 62, 140, 0.3);
}

.group-stats .card-icon {
  background: linear-gradient(135deg, #e83e8c, #dc3545);
  box-shadow: 0 8px 20px rgba(232, 62, 140, 0.3);
}

.group-log .group-icon-wrapper {
  background: linear-gradient(135deg, #4dabf7, #667eea);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.group-log .group-badge {
  background: linear-gradient(135deg, #4dabf7, #667eea);
  box-shadow: 0 4px 15px rgba(77, 171, 247, 0.3);
}

.group-log .card-icon {
  background: linear-gradient(135deg, #4dabf7, #667eea);
  box-shadow: 0 8px 20px rgba(77, 171, 247, 0.3);
}

.group-settings .group-icon-wrapper {
  background: linear-gradient(135deg, #6c757d, #495057);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.group-settings .group-badge {
  background: linear-gradient(135deg, #6c757d, #495057);
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.group-settings .card-icon {
  background: linear-gradient(135deg, #6c757d, #495057);
  box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
}

.group-alert .group-icon-wrapper {
  background: linear-gradient(135deg, #ff6b6b, #dc3545);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.group-alert .group-badge {
  background: linear-gradient(135deg, #ff6b6b, #dc3545);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.group-alert .card-icon {
  background: linear-gradient(135deg, #ff6b6b, #dc3545);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.group-default .group-icon-wrapper {
  background: linear-gradient(135deg, #a78bfa, #667eea);
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
}

.group-default .group-badge {
  background: linear-gradient(135deg, #a78bfa, #667eea);
  box-shadow: 0 4px 15px rgba(167, 139, 250, 0.3);
}

.group-default .card-icon {
  background: linear-gradient(135deg, #a78bfa, #667eea);
  box-shadow: 0 8px 20px rgba(167, 139, 250, 0.3);
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
    padding: 40px 15px 50px;
  }

  .main-title {
    font-size: 2.2rem;
  }

  .subtitle {
    font-size: 1.05rem;
  }

  .content-container {
    padding: 0 15px 40px;
  }

  .group-section {
    padding: 28px 20px;
    border-radius: 20px;
  }

  .group-title {
    font-size: 1.4rem;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .button-card {
    padding: 24px;
    border-radius: 18px;
  }

  .card-content {
    gap: 14px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 1.4rem;
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 30px 15px 40px;
  }

  .main-title {
    font-size: 1.9rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .group-section {
    padding: 24px 18px;
    border-radius: 18px;
  }

  .group-title {
    font-size: 1.3rem;
  }

  .button-card {
    padding: 20px;
    border-radius: 16px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    font-size: 1.3rem;
    border-radius: 12px;
  }

  .footer-info {
    padding: 25px 15px;
    font-size: 0.9rem;
  }
}

/* 按钮卡片点击和焦点效果 */
.button-card:active {
  transform: translateY(-2px) scale(0.98);
  transition: all 0.1s ease;
}

.button-card:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* 滚动条美化 */
.inventory-home::-webkit-scrollbar {
  width: 8px;
}

.inventory-home::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.inventory-home::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
}

.inventory-home::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
}

/* 优化滚动性能 */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .inventory-home {
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
    border-color: #667eea;
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
  }

  .main-title {
    background: linear-gradient(45deg, #ffffff, #e2e8f0);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
