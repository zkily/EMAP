<template>
  <div class="system-home">
    <!-- 背景装饰元素 -->
    <div class="background-decoration">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-container">
          <h1 class="main-title">
            <div class="title-icon-wrapper">
              <el-icon class="title-icon">
                <Setting />
              </el-icon>
              <div class="icon-glow"></div>
            </div>
            <span class="title-text">システム管理</span>
          </h1>
          <p class="subtitle">ユーザー・ロール・権限などの管理メニュー</p>
          <div class="title-underline"></div>
        </div>

        <!-- 统计信息卡片 -->
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ systemMenus.length }}</div>
              <div class="stat-label">管理機能</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">1</div>
              <div class="stat-label">アクティブ</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 装饰性波浪 -->
      <div class="wave-decoration">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="shape-fill"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="shape-fill"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill"></path>
        </svg>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <transition-group name="fade-slide" tag="div" class="groups-container" :appear="true">
        <template v-if="systemMenus.length">
          <div key="system-group" class="group-section group-default">
            <div class="group-header">
              <div class="group-title-section">
                <h3 class="group-title">
                  <div class="group-icon-wrapper">
                    <el-icon class="group-icon">
                      <Setting />
                    </el-icon>
                    <div class="icon-pulse"></div>
                  </div>
                  システム管理
                </h3>
                <p class="group-description">システムの基本設定と管理機能</p>
              </div>
              <div class="group-badge">
                <span class="badge-number">{{ systemMenus.length }}</span>
                <span class="badge-text">機能</span>
              </div>
            </div>

            <div class="button-grid">
              <div
                v-for="(menu, index) in systemMenus"
                :key="menu.path"
                class="button-card"
                @click="goTo(menu.path)"
                :style="{ animationDelay: `${index * 0.1}s` }"
                tabindex="0"
                @keydown.enter="goTo(menu.path)"
                @keydown.space.prevent="goTo(menu.path)"
              >
                <div class="card-background"></div>
                <div class="card-content">
                  <div class="card-icon">
                    <el-icon v-if="menu.icon" class="animated-icon">
                      <component :is="menu.icon" />
                    </el-icon>
                    <el-icon v-else class="animated-icon">
                      <Setting />
                    </el-icon>
                    <div class="icon-shadow"></div>
                  </div>
                  <div class="card-text">
                    <h4 class="card-title">{{ menu.title }}</h4>
                    <p class="card-description">{{ menu.description || 'システム管理機能' }}</p>
                    <div class="card-tags">
                      <span class="tag">管理</span>
                      <span class="tag">システム</span>
                    </div>
                  </div>
                </div>
                <div class="card-arrow">
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                  <div class="arrow-trail"></div>
                </div>
                <div class="card-shine"></div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div key="empty" class="empty-menu">
            <div class="empty-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <h3>利用可能なメニューがありません</h3>
            <p>システム管理機能は現在設定されていません</p>
          </div>
        </template>
      </transition-group>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <div class="footer-content">
        <div class="footer-logo">
          <el-icon><Setting /></el-icon>
          <span>Smart Manufacturing System</span>
        </div>
        <p class="footer-text">© 2024 Smart Manufacturing System - System Management</p>
        <div class="footer-links">
          <span class="link">ヘルプ</span>
          <span class="link">サポート</span>
          <span class="link">ドキュメント</span>
        </div>
      </div>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Setting, ArrowRight, Lock } from '@element-plus/icons-vue'

const router = useRouter()

// 系统管理菜单（可根据实际需求扩展）
const systemMenus = [
  {
    title: '権限管理',
    path: '/system/permission',
    icon: Lock,
    description: 'ロールごとの権限を管理します',
  },
  // 其他系统管理菜单项可继续添加
]

const goTo = (path: string) => {
  if (path) router.push(path)
}
</script>

<style scoped>
.system-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float-shapes 20s ease-in-out infinite;
}

.shape-1 {
  width: 120px;
  height: 120px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent);
}

.shape-2 {
  width: 80px;
  height: 80px;
  top: 20%;
  right: 10%;
  animation-delay: 3s;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent);
}

.shape-3 {
  width: 200px;
  height: 200px;
  top: 60%;
  left: 15%;
  animation-delay: 6s;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.2), transparent);
}

.shape-4 {
  width: 60px;
  height: 60px;
  top: 70%;
  right: 20%;
  animation-delay: 9s;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent);
}

.shape-5 {
  width: 150px;
  height: 150px;
  top: 30%;
  left: 70%;
  animation-delay: 12s;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.25), transparent);
}

@keyframes float-shapes {
  0%, 100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.7;
  }
  25% {
    transform: translateY(-30px) translateX(20px) rotate(90deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-60px) translateX(-10px) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-30px) translateX(-30px) rotate(270deg);
    opacity: 0.9;
  }
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(240, 147, 251, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(118, 75, 162, 0.2) 0%, transparent 60%);
}

/* 页面头部 */
.page-header {
  position: relative;
  padding: 60px 20px 120px;
  text-align: center;
  color: white;
  overflow: hidden;
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
  margin: 0 auto;
}

.title-container {
  margin-bottom: 40px;
}

.main-title {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.title-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon {
  font-size: 3rem;
  animation: rotate-pulse 4s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes rotate-pulse {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  50% {
    transform: rotate(180deg) scale(1);
  }
  75% {
    transform: rotate(270deg) scale(1.1);
  }
}

@keyframes glow-pulse {
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.title-text {
  background: linear-gradient(135deg, #ffffff, #f0f9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
  margin: 0 0 16px;
  font-weight: 400;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.title-underline {
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
  margin: 0 auto;
  border-radius: 2px;
  animation: underline-glow 3s ease-in-out infinite;
}

@keyframes underline-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scaleX(1);
  }
  50% {
    opacity: 1;
    transform: scaleX(1.2);
  }
}

/* 统计卡片 */
.stats-container {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.active-icon {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  animation: icon-bounce 2s ease-in-out infinite;
}

@keyframes icon-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.stat-info {
  text-align: left;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

/* 波浪装饰 */
.wave-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
  transform: rotate(180deg);
}

.wave-decoration svg {
  position: relative;
  display: block;
  width: calc(100% + 1.3px);
  height: 60px;
}

.wave-decoration .shape-fill {
  fill: rgba(255, 255, 255, 0.1);
}

/* 主要内容区域 */
.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
  position: relative;
  z-index: 1;
}

.groups-container {
  display: grid;
  gap: 40px;
}

.group-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.group-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  border-radius: 24px 24px 0 0;
}

.group-section:hover {
  transform: translateY(-8px);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.15),
    0 12px 32px rgba(0, 0, 0, 0.08);
}

.group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.group-title-section {
  flex: 1;
}

.group-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-icon {
  font-size: 1.6rem;
  color: #667eea;
  position: relative;
  z-index: 2;
}

.icon-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1.3);
  }
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
}

.group-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

.group-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 12px 20px;
  border-radius: 16px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.badge-number {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.badge-text {
  font-size: 0.8rem;
  opacity: 0.9;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
}

.button-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  animation: card-appear 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes card-appear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent, rgba(102, 126, 234, 0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.button-card:hover .card-background {
  opacity: 1;
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.button-card:hover .card-shine {
  left: 100%;
}

.button-card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: #667eea;
  box-shadow:
    0 16px 40px rgba(102, 126, 234, 0.2),
    0 8px 16px rgba(102, 126, 234, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  position: relative;
  z-index: 2;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  transition: all 0.4s ease;
  position: relative;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.3),
    inset 0 2px 8px rgba(255, 255, 255, 0.2);
}

.icon-shadow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.button-card:hover .icon-shadow {
  opacity: 1;
}

.button-card:hover .card-icon {
  transform: scale(1.15) rotate(5deg);
  box-shadow:
    0 12px 32px rgba(102, 126, 234, 0.4),
    inset 0 2px 8px rgba(255, 255, 255, 0.3);
}

.animated-icon {
  transition: transform 0.3s ease;
  position: relative;
  z-index: 2;
}

.card-text {
  flex: 1;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1f2937;
  transition: color 0.3s ease;
}

.button-card:hover .card-title {
  color: #667eea;
}

.card-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 12px;
  line-height: 1.5;
}

.card-tags {
  display: flex;
  gap: 8px;
}

.tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.button-card:hover .tag {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.card-arrow {
  color: #cbd5e1;
  font-size: 1.4rem;
  transition: all 0.4s ease;
  position: relative;
  z-index: 2;
}

.arrow-trail {
  position: absolute;
  top: 50%;
  left: -10px;
  width: 20px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
  transform: translateY(-50%) scaleX(0);
  transition: transform 0.3s ease;
}

.button-card:hover .card-arrow {
  color: #667eea;
  transform: translateX(8px);
}

.button-card:hover .arrow-trail {
  transform: translateY(-50%) scaleX(1);
}

/* 空状态 */
.empty-menu {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-menu h3 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-menu p {
  margin: 0;
  opacity: 0.8;
  font-size: 1rem;
}

/* 底部信息 */
.footer-info {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-logo .el-icon {
  font-size: 1.5rem;
}

.footer-text {
  margin: 0 0 20px;
  font-size: 0.95rem;
  opacity: 0.8;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.95);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(0.95);
}

.fade-slide-move {
  transition: transform 0.8s ease;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .button-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 1200px) {
  .button-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }

  .main-title {
    font-size: 2.8rem;
  }

  .stats-container {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 40px 15px 80px;
  }

  .main-title {
    font-size: 2.2rem;
    flex-direction: column;
    gap: 16px;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .stats-container {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .content-container {
    padding: 0 15px 40px;
  }

  .group-section {
    padding: 28px 20px;
  }

  .group-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .button-card {
    padding: 24px;
  }

  .card-content {
    gap: 16px;
  }

  .card-icon {
    width: 56px;
    height: 56px;
    font-size: 1.6rem;
  }

  .card-title {
    font-size: 1.2rem;
  }

  .card-description {
    font-size: 0.95rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 2rem;
  }

  .group-section {
    padding: 24px 16px;
  }

  .group-title {
    font-size: 1.5rem;
  }

  .button-card {
    padding: 20px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 1.4rem;
  }

  .stat-card {
    padding: 16px 20px;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}

/* 键盘导航支持 */
.button-card:focus {
  outline: none;
  border-color: #667eea;
  box-shadow:
    0 0 0 3px rgba(102, 126, 234, 0.2),
    0 8px 24px rgba(102, 126, 234, 0.15);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .group-section {
    background: rgba(30, 41, 59, 0.95);
    color: #e2e8f0;
  }

  .card-title {
    color: #e2e8f0;
  }

  .card-description {
    color: #94a3b8;
  }

  .group-description {
    color: #94a3b8;
  }

  .button-card {
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .button-card:hover {
    border-color: #667eea;
    background: rgba(15, 23, 42, 0.9);
  }

  .tag {
    background: rgba(102, 126, 234, 0.2);
    color: #a5b4fc;
  }
}

/* 减少动画效果 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
