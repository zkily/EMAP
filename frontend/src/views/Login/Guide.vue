<template>
  <div class="guide-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="guide-particles">
        <div v-for="n in 25" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      <div class="gradient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>

    <!-- 引导卡片 -->
    <div class="guide-card">
      <!-- Logo和标题区域 -->
      <div class="header-section">
        <div class="logo-container">
          <div class="logo-wrapper">
            <img src="@/components/icons/logo.svg" alt="Smart-EMAP Logo" class="logo" />
            <div class="logo-glow"></div>
          </div>
        </div>

        <div class="title-section">
          <h1 class="main-title">ようこそ！</h1>
          <h2 class="sub-title">Smart-EMAP</h2>
          <p class="description">
            次世代の企業管理プラットフォームへようこそ<br>
            効率的で美しいワークフローを体験してください
          </p>
        </div>
      </div>

      <!-- 快速功能预览 -->
      <div class="preview-section">
        <h3 class="preview-title">主要機能</h3>
        <div class="features-preview">
          <div class="feature-item" v-for="(feature, index) in features" :key="index">
            <div class="feature-icon">
              <el-icon>
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <span class="feature-name">{{ feature.name }}</span>
          </div>
        </div>
      </div>

      <!-- 开始按钮区域 -->
      <div class="action-section">
        <el-button type="primary" @click="startSystem" size="large" class="start-button custom-start-button">
          <el-icon class="button-icon">
            <Right />
          </el-icon>
          <span class="button-text">開始へ</span>
          <div class="button-shine"></div>
        </el-button>

        <p class="start-note">
          <el-icon>
            <InfoFilled />
          </el-icon>
          クリックしてSmart-EMAPを開始
        </p>
      </div>

      <!-- 底部信息 -->
      <div class="footer-section">
        <div class="version-info">
          <el-icon>
            <Medal />
          </el-icon>
          <span>Version 2.0.0</span>
        </div>
        <div class="company-info">
          <span>© 2025 Smart-EMAP</span>
        </div>
      </div>
    </div>

    <!-- 装饰性元素 -->
    <div class="decorative-elements">
      <div class="floating-icon icon-1">
        <el-icon>
          <Star />
        </el-icon>
      </div>
      <div class="floating-icon icon-2">
        <el-icon>
          <TrendCharts />
        </el-icon>
      </div>
      <div class="floating-icon icon-3">
        <el-icon>
          <Setting />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/store/main'
import {
  Star,
  Right,
  InfoFilled,
  Medal,
  TrendCharts,
  Setting,
  Box,
  Bell,
  Calendar,
  User,
  Lock,
  Connection
} from '@element-plus/icons-vue'
import type { CSSProperties } from 'vue'

const router = useRouter()
const store = useMainStore()

// 简化的功能预览数据
const features = ref([
  {
    icon: markRaw(Box),
    name: '受注管理'
  },
  {
    icon: markRaw(Calendar),
    name: '生産進捗'
  },
  {
    icon: markRaw(Bell),
    name: '通知機能'
  },
  {
    icon: markRaw(User),
    name: '人員管理'
  },
  {
    icon: markRaw(Lock),
    name: 'セキュリティ'
  },
  {
    icon: markRaw(Connection),
    name: 'システム統合'
  }
])

// 粒子样式生成
const particleStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 5}s`,
  '--duration': `${3 + Math.random() * 4}s`,
  '--x': `${Math.random() * 100}%`,
  '--y': `${Math.random() * 100}%`,
  '--size': `${2 + Math.random() * 4}px`,
  '--color': `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
})

const startSystem = () => {
  localStorage.setItem('guideShown', 'true')
  store.hideGuide()
  router.push('/login')
}
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --primary-color: #667eea;
  --primary-dark: #5a67d8;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #48bb78;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --text-muted: #718096;
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --border-color: #e2e8f0;
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* 主容器 */
.guide-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 动态背景 */
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 引导粒子效果 */
.guide-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 50%;
  top: var(--y);
  left: var(--x);
  animation: particleFloat var(--duration) var(--delay) infinite ease-in-out;
  opacity: 0.7;
}

@keyframes particleFloat {

  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }

  50% {
    transform: translateY(-30px) scale(1.2);
    opacity: 1;
  }
}

/* 浮动形状 */
.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  animation: shapeFloat 20s infinite linear;
}

.shape-1 {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.shape-2 {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  top: 20%;
  right: 10%;
  animation-delay: -5s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  bottom: 30%;
  left: 10%;
  animation-delay: -10s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  border-radius: 30px;
  bottom: 10%;
  right: 5%;
  animation-delay: -15s;
}

@keyframes shapeFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.1;
  }

  50% {
    transform: translateY(-40px) rotate(180deg);
    opacity: 0.3;
  }
}

/* 渐变光球 */
.gradient-orbs {
  position: absolute;
  width: 100%;
  height: 100%;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: orbPulse 10s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%);
  top: 50%;
  right: 10%;
  animation-delay: -3s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.3) 0%, transparent 70%);
  bottom: 20%;
  left: 30%;
  animation-delay: -6s;
}

@keyframes orbPulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.6;
  }
}

/* 引导卡片 */
.guide-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  border-radius: var(--radius-xl);
  padding: 48px;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 600px;
  width: 100%;
  position: relative;
  animation: cardSlideIn 1s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 头部区域 */
.header-section {
  text-align: center;
  margin-bottom: 40px;
  animation: headerFadeIn 0.8s ease-out 0.2s both;
}

@keyframes headerFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo容器 */
.logo-container {
  margin-bottom: 24px;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.logo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  padding: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.logo-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  opacity: 0.3;
  filter: blur(20px);
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

/* 标题区域 */
.title-section {
  margin-bottom: 32px;
}

.main-title {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  animation: titlePulse 3s ease-in-out infinite;
}

@keyframes titlePulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }
}

.sub-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.description {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 功能预览区域 */
.preview-section {
  margin-bottom: 40px;
  animation: previewSlideIn 0.8s ease-out 0.4s both;
}

@keyframes previewSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 24px;
}

.features-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-item:hover {
  background: white;
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  animation: iconBounce 2s ease-in-out infinite;
}

/* 保持图标原色 */
.feature-icon .el-icon {
  color: inherit;
}

@keyframes iconBounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.feature-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
}

/* 操作区域 */
.action-section {
  text-align: center;
  margin-bottom: 32px;
  animation: actionSlideIn 0.8s ease-out 0.6s both;
}

@keyframes actionSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.start-button {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border: none;
  border-radius: var(--radius-xl);
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

/* 自定义开始按钮样式 */
.custom-start-button {
  background: linear-gradient(135deg, #1e40af, #3b82f6, #06b6d4) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
}

.custom-start-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 30px rgba(30, 64, 175, 0.5) !important;
  background: linear-gradient(135deg, #1d4ed8, #2563eb, #0891b2) !important;
}

.custom-start-button .button-text {
  color: white !important;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-start-button .button-icon {
  color: white !important;
}

.start-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.start-button .button-icon {
  margin-right: 8px;
  font-size: 20px;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.start-button:hover .button-shine {
  left: 100%;
}

.start-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.start-note .el-icon {
  color: var(--primary-color);
}

/* 底部区域 */
.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
  animation: footerFadeIn 0.8s ease-out 0.8s both;
}

@keyframes footerFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--success-color), #38a169);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.company-info {
  font-size: 12px;
  color: var(--text-muted);
}

/* 装饰性元素 */
.decorative-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-icon {
  position: absolute;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  animation: iconFloat 8s ease-in-out infinite;
}

/* 保持装饰图标原色 */
.floating-icon .el-icon {
  color: inherit;
}

.icon-1 {
  top: 15%;
  left: 8%;
  animation-delay: 0s;
}

.icon-2 {
  top: 25%;
  right: 12%;
  animation-delay: -3s;
}

.icon-3 {
  bottom: 25%;
  left: 10%;
  animation-delay: -6s;
}

@keyframes iconFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-card {
    padding: 32px 24px;
    margin: 16px;
  }

  .main-title {
    font-size: 32px;
  }

  .sub-title {
    font-size: 20px;
  }

  .description {
    font-size: 14px;
  }

  .features-preview {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .feature-item {
    padding: 16px 8px;
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .start-button {
    padding: 14px 32px;
    font-size: 16px;
  }

  .footer-section {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .decorative-elements {
    display: none;
  }
}

@media (max-width: 480px) {
  .guide-container {
    padding: 16px;
  }

  .guide-card {
    padding: 24px 16px;
  }

  .logo {
    width: 80px;
    height: 80px;
  }

  .main-title {
    font-size: 28px;
  }

  .sub-title {
    font-size: 18px;
  }

  .features-preview {
    grid-template-columns: repeat(2, 1fr);
  }

  .start-button {
    width: 100%;
    max-width: 280px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f7fafc;
    --text-secondary: #e2e8f0;
    --text-muted: #a0aec0;
    --bg-primary: #2d3748;
    --bg-secondary: #4a5568;
    --border-color: #4a5568;
  }

  .guide-card {
    background: rgba(45, 55, 72, 0.95);
  }

  .feature-item {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }

  .feature-item:hover {
    background: var(--bg-primary);
  }

  .floating-icon {
    background: rgba(45, 55, 72, 0.9);
  }
}
</style>
