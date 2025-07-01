<template>
  <div class="guide-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="guide-particles">
        <div v-for="n in 30" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
      <div class="gradient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
      </div>
      <div class="mesh-gradient"></div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 上部内容区域 -->
      <div class="upper-content">
        <!-- Logo和标题区域 -->
        <div class="header-section">
          <div class="logo-container">
            <div class="logo-wrapper">
              <div class="logo">
                <div class="logo-inner">
                  <img src="@/components/icons/logo.svg" alt="Smart-EMAP" class="logo-img" />
                </div>
              </div>
              <div class="logo-rings">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
                <div class="ring ring-3"></div>
              </div>
            </div>
          </div>

          <div class="title-section">
            <h1 class="main-title">
              <span class="title-part">ようこそ！</span>
            </h1>
            <h2 class="sub-title">
              <span class="brand-text">Smart-EMAP</span>
            </h2>
            <div class="description-container">
              <p class="description">
                次世代の企業管理プラットフォームへようこそ
              </p>
              <p class="sub-description">
                効率的で美しいワークフローを体験してください
              </p>
            </div>
          </div>
        </div>

        <!-- 功能预览区域 -->
        <div class="preview-section">
          <div class="preview-header">
            <h3 class="preview-title">主要機能</h3>
            <div class="preview-subtitle">Smart-EMAPで実現できること</div>
          </div>

          <div class="features-grid">
            <div class="feature-card" v-for="(feature, index) in features" :key="index"
              :style="{ animationDelay: `${0.1 * index}s` }">
              <div class="feature-icon-wrapper">
                <div class="feature-icon">
                  <el-icon>
                    <component :is="feature.icon" />
                  </el-icon>
                </div>
                <div class="icon-glow"></div>
              </div>
              <div class="feature-content">
                <span class="feature-name">{{ feature.name }}</span>
                <span class="feature-desc">{{ feature.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 下部固定按钮区域 -->
      <div class="bottom-action">
        <div class="action-container">
          <div class="start-info">
            <el-icon class="info-icon">
              <Star />
            </el-icon>
            <span class="info-text">クリックしてSmart-EMAPを開始</span>
          </div>

          <el-button type="primary" @click="startSystem" size="large" class="start-button">
            <div class="button-content">
              <span class="button-text">システム開始</span>
              <el-icon class="button-icon">
                <Right />
              </el-icon>
            </div>
            <div class="button-glow"></div>
            <div class="button-ripple"></div>
          </el-button>

          <div class="version-badge">
            <el-icon>
              <Medal />
            </el-icon>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 装饰性浮动元素 -->
    <div class="floating-decorations">
      <div class="floating-element element-1">
        <el-icon>
          <TrendCharts />
        </el-icon>
      </div>
      <div class="floating-element element-2">
        <el-icon>
          <Setting />
        </el-icon>
      </div>
      <div class="floating-element element-3">
        <el-icon>
          <Connection />
        </el-icon>
      </div>
      <div class="floating-element element-4">
        <el-icon>
          <Bell />
        </el-icon>
      </div>
    </div>

    <!-- 底部版权信息 -->
    <div class="copyright">
      <span>© 2025 Smart-EMAP - All rights reserved</span>
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

// 功能数据
const features = ref([
  {
    icon: markRaw(Box),
    name: '受注管理',
    description: '効率的な注文処理'
  },
  {
    icon: markRaw(Calendar),
    name: '生産進捗',
    description: 'リアルタイム監視'
  },
  {
    icon: markRaw(Bell),
    name: '通知機能',
    description: 'スマート通知システム'
  },
  {
    icon: markRaw(User),
    name: '人員管理',
    description: '包括的な人事管理'
  },
  {
    icon: markRaw(Lock),
    name: 'セキュリティ',
    description: '企業級セキュリティ'
  },
  {
    icon: markRaw(Connection),
    name: 'システム統合',
    description: 'シームレス連携'
  }
])

// 粒子样式生成
const particleStyle = (index: number): CSSProperties => {
  const hue = 200 + (index % 5) * 30
  return {
    '--delay': `${Math.random() * 8}s`,
    '--duration': `${4 + Math.random() * 6}s`,
    '--x': `${Math.random() * 100}%`,
    '--y': `${Math.random() * 100}%`,
    '--size': `${1 + Math.random() * 3}px`,
    '--color': `hsl(${hue}, 70%, 65%)`,
    '--opacity': `${0.3 + Math.random() * 0.4}`,
  }
}

const startSystem = () => {
  localStorage.setItem('guideShown', 'true')
  store.hideGuide()
  router.push('/login')
}
</script>

<style scoped>
/* CSS变量 */
:root {
  --primary-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #533483 100%);
  --secondary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --text-primary: #09ce23;
  --text-secondary: #0d74fa;
  --text-light: #0455ac;
  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 12px 40px rgba(0, 0, 0, 0.4);
  --shadow-strong: 0 20px 60px rgba(0, 0, 0, 0.5);
  --border-radius: 20px;
  --animation-duration: 0.6s;
}

/* 主容器 */
.guide-container {
  min-height: 100vh;
  background: var(--primary-gradient);
  background-color: #000000;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 动态背景系统 */
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 网格渐变背景 */
.mesh-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 75% 25%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 25% 75%, rgba(240, 147, 251, 0.08) 0%, transparent 50%);
  animation: meshFloat 20s ease-in-out infinite;
}

@keyframes meshFloat {

  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }

  33% {
    transform: rotate(120deg) scale(1.1);
  }

  66% {
    transform: rotate(240deg) scale(0.9);
  }
}

/* 增强粒子系统 */
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
  opacity: var(--opacity);
  animation: particleFloat var(--duration) var(--delay) infinite ease-in-out;
  box-shadow: 0 0 10px var(--color);
}

@keyframes particleFloat {

  0%,
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: var(--opacity);
  }

  25% {
    transform: translateY(-20px) scale(1.2) rotate(90deg);
    opacity: calc(var(--opacity) * 1.5);
  }

  50% {
    transform: translateY(-40px) scale(0.8) rotate(180deg);
    opacity: var(--opacity);
  }

  75% {
    transform: translateY(-20px) scale(1.1) rotate(270deg);
    opacity: calc(var(--opacity) * 1.2);
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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: shapeFloat 25s infinite linear;
}

.shape-1 {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.shape-2 {
  width: 100px;
  height: 100px;
  border-radius: 25px;
  top: 15%;
  right: 8%;
  animation-delay: -5s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  bottom: 25%;
  left: 10%;
  animation-delay: -10s;
}

.shape-4 {
  width: 150px;
  height: 150px;
  border-radius: 35px;
  bottom: 15%;
  right: 5%;
  animation-delay: -15s;
}

.shape-5 {
  width: 90px;
  height: 90px;
  border-radius: 45px;
  top: 50%;
  left: 3%;
  animation-delay: -20s;
}

@keyframes shapeFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.3;
  }

  25% {
    transform: translateY(-30px) rotate(90deg) scale(1.1);
    opacity: 0.6;
  }

  50% {
    transform: translateY(-60px) rotate(180deg) scale(0.9);
    opacity: 0.4;
  }

  75% {
    transform: translateY(-30px) rotate(270deg) scale(1.05);
    opacity: 0.5;
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
  filter: blur(80px);
  animation: orbPulse 15s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%);
  top: 5%;
  left: 5%;
  animation-delay: 0s;
}

.orb-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%);
  top: 40%;
  right: 5%;
  animation-delay: -5s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.18) 0%, transparent 70%);
  bottom: 10%;
  left: 20%;
  animation-delay: -10s;
}

.orb-4 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(79, 172, 254, 0.12) 0%, transparent 70%);
  top: 20%;
  left: 50%;
  animation-delay: -7s;
}

@keyframes orbPulse {

  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.3;
  }

  33% {
    transform: scale(1.4) rotate(120deg);
    opacity: 0.6;
  }

  66% {
    transform: scale(0.8) rotate(240deg);
    opacity: 0.4;
  }
}

/* 主内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.upper-content {
  flex: 1;
  padding: 60px 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Logo和标题区域 */
.header-section {
  text-align: center;
  margin-bottom: 80px;
  animation: headerSlideUp 1s ease-out;
}

@keyframes headerSlideUp {
  from {
    opacity: 0;
    transform: translateY(60px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 40px;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  animation: logoFloat 6s ease-in-out infinite;
}

@keyframes logoFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-15px) rotate(180deg);
  }
}

.logo {
  width: 140px;
  height: 140px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-strong);
  position: relative;
  overflow: hidden;
}

.logo::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: logoShine 3s ease-in-out infinite;
}

@keyframes logoShine {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.logo-inner {
  width: 100px;
  height: 100px;
  background: rgba(252, 252, 252, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.logo-text {
  font-size: 36px;
  font-weight: 900;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 160px;
  height: 160px;
  animation: ringRotate 10s linear infinite;
}

.ring-2 {
  width: 180px;
  height: 180px;
  animation: ringRotate 15s linear infinite reverse;
}

.ring-3 {
  width: 200px;
  height: 200px;
  animation: ringRotate 20s linear infinite;
}

@keyframes ringRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 标题区域 */
.title-section {
  margin-bottom: 40px;
}

.main-title {
  font-size: 64px;
  font-weight: 900;
  margin: 0 0 20px 0;
  line-height: 1.1;
  animation: titleSlideIn 0.8s ease-out 0.3s both;
}

.title-part {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-accent {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: accentPulse 2s ease-in-out infinite;
}

@keyframes accentPulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

@keyframes titleSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.sub-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 30px 0;
  animation: titleSlideIn 0.8s ease-out 0.5s both;
}

.brand-text {
  color: rgba(84, 252, 18, 0.95);
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.brand-separator {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 8px;
}

.description-container {
  animation: titleSlideIn 0.8s ease-out 0.7s both;
}

.description {
  font-size: 20px;
  color: rgba(252, 249, 249, 0.9);
  margin: 0 0 10px 0;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.6;
}

.sub-description {
  font-size: 16px;
  color: rgba(255, 253, 253, 0.75);
  margin: 0;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
  line-height: 1.5;
}

/* 功能预览区域 */
.preview-section {
  animation: previewSlideUp 1s ease-out 0.9s both;
}

@keyframes previewSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-header {
  text-align: center;
  margin-bottom: 50px;
}

.preview-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(253, 250, 250, 0.95);
  margin: 0 0 10px 0;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
}

.preview-subtitle {
  font-size: 16px;
  color: rgba(252, 249, 249, 0.7);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: rgb(189, 194, 185);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--border-radius);
  border-radius: 10px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all var(--animation-duration) ease;
  cursor: pointer;
  animation: cardSlideIn 0.6s ease-out both;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  transition: left 0.6s ease;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-strong);
  background: rgb(227, 250, 100);
  border-color: rgba(255, 255, 255, 0.2);
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.feature-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: var(--secondary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgb(10, 10, 10);
  animation: iconRotate 8s linear infinite;
  position: relative;
  z-index: 2;
}

@keyframes iconRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.icon-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: var(--secondary-gradient);
  border-radius: 50%;
  filter: blur(15px);
  opacity: 0.5;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(3, 3, 3, 0.95);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

.feature-desc {
  font-size: 14px;
  color: rgba(43, 8, 243, 0.7);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  line-height: 1.4;
}

/* 底部操作区域 */
.bottom-action {
  position: sticky;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(30px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 30px 40px;
  z-index: 10;
}

.action-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.start-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

.info-icon {
  font-size: 20px;
  color: #f093fb;
  animation: iconTwinkle 2s ease-in-out infinite;
}

@keyframes iconTwinkle {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.start-button {
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb) !important;
  border: none !important;
  border-radius: 50px !important;
  padding: 18px 60px !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  color: white !important;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6) !important;
  position: relative;
  overflow: hidden;
  transition: all var(--animation-duration) ease !important;
  cursor: pointer;
}

.start-button:hover {
  transform: translateY(-5px) scale(1.05) !important;
  box-shadow: 0 15px 50px rgba(102, 126, 234, 0.8) !important;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.button-text {
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.button-icon {
  font-size: 24px;
  animation: arrowBounce 1.5s ease-in-out infinite;
}

@keyframes arrowBounce {

  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(5px);
  }
}

.button-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: buttonGlow 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes buttonGlow {

  0%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 2s ease-out infinite;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }

  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--shadow-medium);
  animation: badgeFloat 3s ease-in-out infinite;
}

@keyframes badgeFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

/* 浮动装饰元素 */
.floating-decorations {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.7);
  animation: elementFloat 12s ease-in-out infinite;
  box-shadow: var(--shadow-soft);
}

.element-1 {
  top: 12%;
  left: 8%;
  animation-delay: 0s;
}

.element-2 {
  top: 20%;
  right: 10%;
  animation-delay: -3s;
}

.element-3 {
  bottom: 30%;
  left: 5%;
  animation-delay: -6s;
}

.element-4 {
  bottom: 40%;
  right: 8%;
  animation-delay: -9s;
}

@keyframes elementFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.6;
  }

  25% {
    transform: translateY(-25px) rotate(90deg) scale(1.1);
    opacity: 0.8;
  }

  50% {
    transform: translateY(-50px) rotate(180deg) scale(0.9);
    opacity: 0.7;
  }

  75% {
    transform: translateY(-25px) rotate(270deg) scale(1.05);
    opacity: 0.9;
  }
}

/* 版权信息 */
.copyright {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 5;
  animation: copyrightFade 1s ease-out 2s both;
}

@keyframes copyrightFade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .upper-content {
    padding: 40px 30px 30px;
  }

  .main-title {
    font-size: 48px;
  }

  .sub-title {
    font-size: 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .feature-card {
    padding: 24px;
  }

  .floating-decorations {
    display: none;
  }
}

@media (max-width: 768px) {
  .upper-content {
    padding: 30px 20px 20px;
  }

  .header-section {
    margin-bottom: 60px;
  }

  .logo {
    width: 100px;
    height: 100px;
  }

  .logo-inner {
    width: 70px;
    height: 70px;
  }

  .logo-text {
    font-size: 28px;
  }

  .main-title {
    font-size: 36px;
  }

  .sub-title {
    font-size: 20px;
  }

  .description {
    font-size: 16px;
  }

  .sub-description {
    font-size: 14px;
  }

  .preview-title {
    font-size: 22px;
  }

  .feature-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .feature-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .feature-name {
    font-size: 16px;
  }

  .feature-desc {
    font-size: 13px;
  }

  .bottom-action {
    padding: 25px 20px;
  }

  .start-button {
    width: 100% !important;
    max-width: 300px !important;
    padding: 16px 40px !important;
    font-size: 18px !important;
  }

  .start-info {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .upper-content {
    padding: 20px 15px 15px;
  }

  .header-section {
    margin-bottom: 40px;
  }

  .logo {
    width: 80px;
    height: 80px;
  }

  .logo-inner {
    width: 60px;
    height: 60px;
  }

  .logo-text {
    font-size: 22px;
  }

  .main-title {
    font-size: 28px;
  }

  .sub-title {
    font-size: 18px;
  }

  .description {
    font-size: 14px;
  }

  .sub-description {
    font-size: 12px;
  }

  .preview-header {
    margin-bottom: 30px;
  }

  .preview-title {
    font-size: 18px;
  }

  .preview-subtitle {
    font-size: 14px;
  }

  .features-grid {
    gap: 16px;
  }

  .feature-card {
    padding: 16px;
    gap: 12px;
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .feature-name {
    font-size: 14px;
  }

  .feature-desc {
    font-size: 12px;
  }

  .bottom-action {
    padding: 20px 15px;
  }

  .action-container {
    gap: 15px;
  }

  .start-button {
    padding: 14px 30px !important;
    font-size: 16px !important;
  }

  .button-icon {
    font-size: 20px;
  }

  .version-badge {
    padding: 8px 16px;
    font-size: 12px;
  }

  .copyright {
    font-size: 10px;
    bottom: 10px;
  }
}

/* 高对比度和可访问性 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  .feature-card {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .bottom-action {
    background: rgba(0, 0, 0, 0.3);
    border-top-color: rgba(255, 255, 255, 0.3);
  }

  .start-button {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5) !important;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #f7fafc;
    --text-light: #e2e8f0;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .bottom-action {
    background: rgba(0, 0, 0, 0.4);
  }
}

.logo-img {
  width: 50px;
  height: 50px;
}
</style>