<template>
  <div class="success-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="success-particles">
        <div v-for="n in 50" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>

    <!-- 成功卡片 -->
    <div class="success-card">
      <!-- 成功图标区域 -->
      <div class="success-icon-container">
        <div class="success-icon-bg">
          <div class="success-icon">
            <el-icon>
              <SuccessFilled />
            </el-icon>
          </div>
          <div class="success-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>
      </div>

      <!-- 成功信息 -->
      <div class="success-content">
        <h1 class="success-title">ログイン成功！</h1>
        <h2 class="welcome-message">ようこそ Smart-EMAP へ</h2>
        <p class="success-description">
          システムへの認証が完了しました。<br />
          まもなくダッシュボードにリダイレクトします。
        </p>
      </div>

      <!-- 倒计时显示 -->
      <div class="countdown-section">
        <div class="countdown-display">
          <div class="countdown-number">{{ countdown }}</div>
          <div class="countdown-label">秒後にリダイレクト</div>
        </div>

        <!-- 圆形进度条 -->
        <div class="circular-progress">
          <svg class="progress-ring" width="120" height="120">
            <circle
              class="progress-ring-background"
              stroke="#e2e8f0"
              stroke-width="4"
              fill="transparent"
              r="56"
              cx="60"
              cy="60"
            />
            <circle
              class="progress-ring-progress"
              stroke="#48bb78"
              stroke-width="4"
              fill="transparent"
              r="56"
              cx="60"
              cy="60"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
            />
          </svg>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="goToDashboard" size="large" class="primary-btn">
          <el-icon>
            <DataBoard />
          </el-icon>
          今すぐダッシュボードへ
        </el-button>
        <el-button @click="cancelRedirect" size="large" class="secondary-btn">
          <el-icon>
            <Close />
          </el-icon>
          キャンセル
        </el-button>
      </div>

      <!-- 额外信息 -->
      <div class="additional-info">
        <div class="info-item">
          <el-icon>
            <Clock />
          </el-icon>
          <span>ログイン時刻: {{ loginTime }}</span>
        </div>
        <div class="info-item">
          <el-icon>
            <Location />
          </el-icon>
          <span>アクセス元: {{ userLocation }}</span>
        </div>
      </div>
    </div>

    <!-- 浮动装饰元素 -->
    <div class="floating-decorations">
      <div class="decoration decoration-1">
        <el-icon>
          <Star />
        </el-icon>
      </div>
      <div class="decoration decoration-2">
        <el-icon>
          <Trophy />
        </el-icon>
      </div>
      <div class="decoration decoration-3">
        <el-icon>
          <Medal />
        </el-icon>
      </div>
      <div class="decoration decoration-4">
        <el-icon>
          <Trophy />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  SuccessFilled,
  DataBoard,
  Close,
  Clock,
  Location,
  Star,
  Trophy,
  Medal,
} from '@element-plus/icons-vue'
import type { CSSProperties } from 'vue'

const router = useRouter()
const countdown = ref(5)
const loginTime = ref('')
const userLocation = ref('東京, 日本')
let timer: NodeJS.Timeout | null = null

// 圆形进度条计算
const circumference = 2 * Math.PI * 56
const dashOffset = computed(() => {
  const progress = ((5 - countdown.value) / 5) * 100
  return circumference - (progress / 100) * circumference
})

// 粒子样式生成
const particleStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 3}s`,
  '--duration': `${2 + Math.random() * 3}s`,
  '--x': `${Math.random() * 100}%`,
  '--y': `${Math.random() * 100}%`,
  '--size': `${2 + Math.random() * 3}px`,
  '--color': `hsl(${120 + Math.random() * 60}, 70%, 60%)`,
})

const goToDashboard = () => {
  clearTimer()
  router.push('/dashboard')
}

const cancelRedirect = () => {
  clearTimer()
  router.push('/login')
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startCountdown = () => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      goToDashboard()
    }
  }, 1000)
}

const formatLoginTime = () => {
  const now = new Date()
  loginTime.value = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

onMounted(() => {
  formatLoginTime()
  startCountdown()
})

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --success-primary: #48bb78;
  --success-secondary: #38a169;
  --success-light: #c6f6d5;
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
.success-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 50%, #2f855a 100%);
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

/* 成功粒子效果 */
.success-particles {
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
  opacity: 0.8;
}

@keyframes particleFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }

  50% {
    transform: translateY(-20px) scale(1.2);
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
  border-radius: 50%;
  animation: shapeFloat 15s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 20%;
  right: 20%;
  animation-delay: -5s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 15%;
  animation-delay: -10s;
}

.shape-4 {
  width: 40px;
  height: 40px;
  bottom: 30%;
  right: 10%;
  animation-delay: -7s;
}

@keyframes shapeFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.1;
  }

  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.3;
  }
}

/* 成功卡片 */
.success-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: 48px;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 600px;
  width: 100%;
  text-align: center;
  position: relative;
  animation: cardSlideIn 0.8s ease-out;
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

/* 成功图标区域 */
.success-icon-container {
  margin-bottom: 32px;
  position: relative;
  display: flex;
  justify-content: center;
  animation: iconAppear 1s ease-out 0.3s both;
}

@keyframes iconAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-icon-bg {
  position: relative;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--success-primary), var(--success-secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(72, 187, 120, 0.3);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(72, 187, 120, 0.3);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(72, 187, 120, 0.5);
  }
}

.success-icon {
  font-size: 48px;
  color: white;
  animation: iconBounce 0.6s ease-out 0.8s both;
}

@keyframes iconBounce {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

/* 成功环形装饰 */
.success-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: ringExpand 2s ease-out infinite;
}

.ring-1 {
  width: 140px;
  height: 140px;
  top: -70px;
  left: -70px;
  animation-delay: 0s;
}

.ring-2 {
  width: 160px;
  height: 160px;
  top: -80px;
  left: -80px;
  animation-delay: 0.5s;
}

.ring-3 {
  width: 180px;
  height: 180px;
  top: -90px;
  left: -90px;
  animation-delay: 1s;
}

@keyframes ringExpand {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 成功内容 */
.success-content {
  margin-bottom: 40px;
  animation: contentSlideUp 0.8s ease-out 0.5s both;
}

@keyframes contentSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--success-primary);
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--success-primary), var(--success-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-message {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.success-description {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 倒计时区域 */
.countdown-section {
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: countdownAppear 0.8s ease-out 0.7s both;
}

@keyframes countdownAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.countdown-display {
  position: absolute;
  z-index: 2;
  text-align: center;
}

.countdown-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--success-primary);
  line-height: 1;
  margin-bottom: 4px;
  animation: numberPulse 1s ease-in-out infinite;
}

@keyframes numberPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.countdown-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 圆形进度条 */
.circular-progress {
  position: relative;
}

.progress-ring {
  transform: rotate(-90deg);
  filter: drop-shadow(0 4px 8px rgba(72, 187, 120, 0.2));
}

.progress-ring-progress {
  transition: stroke-dashoffset 1s ease-in-out;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(72, 187, 120, 0.5));
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  animation: buttonsSlideUp 0.8s ease-out 0.9s both;
}

@keyframes buttonsSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.primary-btn {
  background: linear-gradient(135deg, var(--success-primary), var(--success-secondary));
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(72, 187, 120, 0.4);
}

.primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.primary-btn:hover::before {
  left: 100%;
}

.secondary-btn {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--success-primary);
  color: var(--success-primary);
  transform: translateY(-2px);
}

/* 额外信息 */
.additional-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
  animation: infoFadeIn 0.8s ease-out 1.1s both;
}

@keyframes infoFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-muted);
}

.info-item .el-icon {
  color: var(--success-primary);
}

/* 浮动装饰元素 */
.floating-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decoration {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--success-primary);
  font-size: 20px;
  animation: decorationFloat 8s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.decoration-1 {
  top: 15%;
  left: 10%;
  animation-delay: 0s;
}

.decoration-2 {
  top: 25%;
  right: 15%;
  animation-delay: -2s;
}

.decoration-3 {
  bottom: 25%;
  left: 15%;
  animation-delay: -4s;
}

.decoration-4 {
  bottom: 15%;
  right: 10%;
  animation-delay: -6s;
}

@keyframes decorationFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-15px) rotate(90deg);
  }

  50% {
    transform: translateY(-5px) rotate(180deg);
  }

  75% {
    transform: translateY(-20px) rotate(270deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .success-card {
    padding: 32px 24px;
    margin: 16px;
  }

  .success-title {
    font-size: 28px;
  }

  .welcome-message {
    font-size: 20px;
  }

  .success-description {
    font-size: 14px;
  }

  .countdown-number {
    font-size: 32px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .el-button {
    width: 100%;
    max-width: 280px;
  }

  .additional-info {
    gap: 8px;
  }

  .floating-decorations {
    display: none;
  }
}

@media (max-width: 480px) {
  .success-card {
    padding: 24px 16px;
  }

  .success-icon-bg {
    width: 100px;
    height: 100px;
  }

  .success-icon {
    font-size: 40px;
  }

  .success-title {
    font-size: 24px;
  }

  .welcome-message {
    font-size: 18px;
  }

  .countdown-number {
    font-size: 28px;
  }

  .circular-progress svg {
    width: 100px;
    height: 100px;
  }

  .progress-ring-background,
  .progress-ring-progress {
    r: 46;
    cx: 50;
    cy: 50;
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

  .success-card {
    background: rgba(45, 55, 72, 0.95);
  }

  .secondary-btn {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .decoration {
    background: rgba(45, 55, 72, 0.9);
    color: var(--success-primary);
  }
}
</style>
