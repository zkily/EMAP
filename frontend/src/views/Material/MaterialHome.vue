<template>
  <div class="master-home">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="main-title">
          <el-icon class="title-icon">
            <Document />
          </el-icon>
          生産管理システム
        </h1>
        <p class="subtitle">各種生産計画データの管理・操作を行います</p>
      </div>
      <div class="header-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <transition-group name="fade-slide" tag="div" class="groups-container">
        <div v-for="(routes, group) in groupedRoutes" :key="group" class="group-section" :class="groupClass(group)">
          <div class="group-header">
            <h3 class="group-title">
              <el-icon class="group-icon">
                <component :is="getGroupIcon(group)" />
              </el-icon>
              {{ group }}
            </h3>
            <div class="group-badge">{{ routes.length }}</div>
          </div>

          <div class="button-grid">
            <div v-for="route in routes" :key="route.name" class="button-card" @click="goTo(route.name)">
              <div class="card-content">
                <div class="card-icon">
                  <el-icon v-if="route.meta?.icon" class="animated-icon">
                    <component :is="route.meta.icon" />
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
      </transition-group>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <p>© 2024 Smart Manufacturing System - Plan Management</p>
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
  ArrowRight,
  DataBoard,
  Tools,
  Warning,
  Upload,
  Download
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const subRoutes = computed(() => {
  const matchedParent = route.matched.find(r => r.path === '/plan')
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

const getGroupIcon = (group: string) => {
  if (group.includes('計画')) return DataBoard
  if (group.includes('履歴') || group.includes('ログ')) return Tools
  if (group.includes('警告') || group.includes('異常')) return Warning
  if (group.includes('入力')) return Upload
  return Document
}

const getRouteDescription = (routeName: string) => {
  // 可根据实际路由名自定义描述
  const descriptions: Record<string, string> = {
    // 'PlanList': '生産計画の一覧',
    // 'PlanLog': '計画履歴の確認',
    // ...
  }
  return descriptions[routeName] || '生産データの管理・操作'
}

const groupClass = (group: string) => {
  if (group.includes('計画')) return 'group-product'
  if (group.includes('履歴') || group.includes('ログ')) return 'group-log'
  if (group.includes('警告') || group.includes('異常')) return 'group-alert'
  if (group.includes('入力')) return 'group-input'
  return 'group-default'
}

const goTo = (routeName: RouteRecordName | undefined) => {
  if (routeName) router.replace({ name: routeName })
}
</script>

<style scoped>
.master-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #3a74d8 0%, #6dd5ed 100%);
  position: relative;
  overflow-x: hidden;
}

.page-header {
  position: relative;
  padding: 40px 20px 60px;
  text-align: center;
  color: white;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.title-icon {
  font-size: 2.2rem;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 40%;
  left: 80%;
  animation-delay: 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 40px;
  position: relative;
  z-index: 1;
}

.groups-container {
  display: grid;
  gap: 32px;
}

.group-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.group-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3a74d8, #6dd5ed);
  border-radius: 20px 20px 0 0;
}

.group-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.group-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  font-size: 1.4rem;
  color: #3a74d8;
}

.group-badge {
  background: linear-gradient(135deg, #3a74d8, #6dd5ed);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.button-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.button-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.button-card:hover::before {
  left: 100%;
}

.button-card:hover {
  transform: translateY(-3px);
  border-color: #3a74d8;
  box-shadow: 0 8px 25px rgba(58, 116, 216, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3a74d8, #6dd5ed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.button-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.animated-icon {
  transition: transform 0.3s ease;
}

.card-text {
  flex: 1;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #2c3e50;
}

.card-description {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}

.card-arrow {
  color: #bdc3c7;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.button-card:hover .card-arrow {
  color: #3a74d8;
  transform: translateX(5px);
}

/* 组别颜色主题 */
.group-product .group-icon {
  color: #3a74d8;
}

.group-product .group-badge {
  background: linear-gradient(135deg, #3a74d8, #6dd5ed);
}

.group-product .card-icon {
  background: linear-gradient(135deg, #3a74d8, #6dd5ed);
}

.group-log .group-icon {
  color: #00b8d9;
}

.group-log .group-badge {
  background: linear-gradient(135deg, #00b8d9, #43e97b);
}

.group-log .card-icon {
  background: linear-gradient(135deg, #00b8d9, #43e97b);
}

.group-alert .group-icon {
  color: #ff6b6b;
}

.group-alert .group-badge {
  background: linear-gradient(135deg, #ff6b6b, #ffd166);
}

.group-alert .card-icon {
  background: linear-gradient(135deg, #ff6b6b, #ffd166);
}

.group-input .group-icon {
  color: #69db7c;
}

.group-input .group-badge {
  background: linear-gradient(135deg, #69db7c, #38d9a9);
}

.group-input .card-icon {
  background: linear-gradient(135deg, #69db7c, #38d9a9);
}

.group-default .group-icon {
  color: #bdbdbd;
}

.group-default .group-badge {
  background: linear-gradient(135deg, #bdbdbd, #e0e0e0);
}

.group-default .card-icon {
  background: linear-gradient(135deg, #bdbdbd, #e0e0e0);
}

.footer-info {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.6s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.fade-slide-move {
  transition: transform 0.6s ease;
}

@media (max-width: 1200px) {
  .button-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 30px 15px 40px;
  }

  .main-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }

  .subtitle {
    font-size: 1rem;
  }

  .content-container {
    padding: 0 15px 30px;
  }

  .group-section {
    padding: 24px 20px;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .button-card {
    padding: 20px;
  }

  .card-content {
    gap: 12px;
  }

  .card-icon {
    width: 45px;
    height: 45px;
    font-size: 1.3rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .card-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.8rem;
  }

  .group-section {
    padding: 20px 16px;
  }

  .group-title {
    font-size: 1.3rem;
  }

  .button-card {
    padding: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  .group-section {
    background: rgba(45, 55, 72, 0.95);
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
    border-color: #3a74d8;
  }
}
</style>
