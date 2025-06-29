<template>
  <div class="no-permission-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="permission-waves">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
      <div class="floating-particles">
        <div v-for="n in 25" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>
      <div class="security-grid">
        <div v-for="n in 12" :key="n" class="grid-line" :style="gridLineStyle(n)"></div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="permission-content">
      <!-- 403错误显示 -->
      <div class="error-section">
        <div class="error-code">
          <span class="code-number">4</span>
          <div class="security-icon">
            <div class="shield-container">
              <el-icon class="shield-icon">
                <Lock />
              </el-icon>
              <div class="shield-rings">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
                <div class="ring ring-3"></div>
              </div>
            </div>
          </div>
          <span class="code-number">3</span>
        </div>

        <!-- 错误标题 -->
        <div class="error-title-section">
          <h1 class="error-title">アクセス拒否</h1>
          <div class="access-denied-badge">
            <el-icon>
              <Warning />
            </el-icon>
            <span>ACCESS DENIED</span>
          </div>
        </div>
      </div>

      <!-- 权限信息卡片 -->
      <div class="permission-info-card">
        <!-- 主要信息 -->
        <div class="main-info">
          <div class="info-icon">
            <el-icon>
              <UserFilled />
            </el-icon>
          </div>
          <div class="info-content">
            <h2 class="info-title">このページにアクセスする権限がありません</h2>
            <p class="info-description">
              現在のユーザーアカウントには、このリソースへのアクセス権限が付与されていません。
              管理者にお問い合わせいただくか、適切な権限を持つアカウントでログインしてください。
            </p>
          </div>
        </div>

        <!-- 权限详情 -->
        <div class="permission-details">
          <h3 class="details-title">
            <el-icon>
              <Key />
            </el-icon>
            アクセス情報
          </h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">必要な権限レベル</div>
              <div class="detail-value">管理者権限</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">現在の権限レベル</div>
              <div class="detail-value">一般ユーザー</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">アクセス試行時刻</div>
              <div class="detail-value">{{ accessTime }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">セッションID</div>
              <div class="detail-value">{{ sessionId }}</div>
            </div>
          </div>
        </div>

        <!-- 建议操作 -->
        <div class="suggestions-section">
          <h3 class="suggestions-title">
            <el-icon>
              <HelpFilled />
            </el-icon>
            推奨アクション
          </h3>
          <div class="suggestions-list">
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon>
                  <User />
                </el-icon>
              </div>
              <div class="suggestion-text">
                <strong>管理者に連絡</strong>
                <p>システム管理者に権限の追加を依頼してください</p>
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon>
                  <SwitchButton />
                </el-icon>
              </div>
              <div class="suggestion-text">
                <strong>アカウント切り替え</strong>
                <p>適切な権限を持つアカウントでログインし直してください</p>
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon>
                  <HomeFilled />
                </el-icon>
              </div>
              <div class="suggestion-text">
                <strong>ダッシュボードに戻る</strong>
                <p>アクセス可能なページから操作を続行してください</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="goHome" size="large" class="primary-btn">
            <el-icon>
              <HomeFilled />
            </el-icon>
            ダッシュボードへ戻る
          </el-button>
          <el-button @click="requestAccess" size="large" class="secondary-btn">
            <el-icon>
              <Message />
            </el-icon>
            アクセス権限を要求
          </el-button>
          <el-button @click="contactSupport" size="large" class="tertiary-btn">
            <el-icon>
              <Service />
            </el-icon>
            サポートに連絡
          </el-button>
        </div>
      </div>
    </div>

    <!-- 装饰性安全元素 -->
    <div class="security-decorations">
      <div class="security-badge badge-1">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
      <div class="security-badge badge-2">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
      <div class="security-badge badge-3">
        <el-icon>
          <Key />
        </el-icon>
      </div>
      <div class="security-badge badge-4">
        <el-icon>
          <Warning />
        </el-icon>
      </div>
    </div>

    <!-- 宇航员插图 -->
    <div class="astronaut-container">
      <div class="astronaut">
        <img
          src="https://cdn.jsdelivr.net/gh/mobalti/open-props@1.6.13/illustrations/astronaut.svg"
          alt="403 Astronaut"
          class="astronaut-image"
        />
        <div class="astronaut-glow"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Lock,
  Warning,
  UserFilled,
  Key,
  HelpFilled,
  User,
  SwitchButton,
  HomeFilled,
  Message,
  Service,
} from '@element-plus/icons-vue'
import type { CSSProperties } from 'vue'

const router = useRouter()
const accessTime = ref('')
const sessionId = ref('')

// 粒子样式生成
const particleStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 4}s`,
  '--duration': `${6 + Math.random() * 4}s`,
  '--x': `${Math.random() * 100}%`,
  '--y': `${Math.random() * 100}%`,
  '--size': `${2 + Math.random() * 3}px`,
})

// 网格线样式生成
const gridLineStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 3}s`,
  '--duration': `${4 + Math.random() * 2}s`,
  '--rotation': `${Math.random() * 360}deg`,
})

const goHome = () => {
  router.push('/dashboard')
}

const requestAccess = () => {
  ElMessage.info('アクセス権限要求が送信されました。管理者の承認をお待ちください。')
}

const contactSupport = () => {
  ElMessage.info('サポートチームに連絡しました。まもなく対応いたします。')
}

const generateSessionInfo = () => {
  const now = new Date()
  accessTime.value = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // 生成模拟的会话ID
  sessionId.value = 'SES-' + Math.random().toString(36).substr(2, 8).toUpperCase()
}

onMounted(() => {
  generateSessionInfo()
})
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --error-primary: #f56565;
  --error-secondary: #e53e3e;
  --warning-color: #ed8936;
  --info-color: #4299e1;
  --security-color: #805ad5;
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
.no-permission-container {
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

/* 权限波浪 */
.permission-waves {
  position: absolute;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  width: 300%;
  height: 300%;
  background: radial-gradient(circle, rgba(128, 90, 213, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: waveRotate 25s infinite linear;
}

.wave-1 {
  top: -100%;
  left: -100%;
  animation-delay: 0s;
}

.wave-2 {
  top: -50%;
  right: -100%;
  animation-delay: -8s;
}

.wave-3 {
  bottom: -100%;
  left: -50%;
  animation-delay: -16s;
}

@keyframes waveRotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 浮动粒子 */
.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: rgba(128, 90, 213, 0.6);
  border-radius: 50%;
  top: var(--y);
  left: var(--x);
  animation: particleDrift var(--duration) var(--delay) infinite ease-in-out;
}

@keyframes particleDrift {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }

  50% {
    transform: translateY(-40px) scale(1.3);
    opacity: 1;
  }
}

/* 安全网格 */
.security-grid {
  position: absolute;
  width: 100%;
  height: 100%;
}

.grid-line {
  position: absolute;
  width: 1px;
  height: 100px;
  background: linear-gradient(to bottom, transparent, rgba(128, 90, 213, 0.3), transparent);
  transform-origin: center;
  animation: gridRotate var(--duration) var(--delay) infinite linear;
}

@keyframes gridRotate {
  0% {
    transform: rotate(var(--rotation)) translateY(-50px);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: rotate(calc(var(--rotation) + 180deg)) translateY(50px);
    opacity: 0;
  }
}

/* 主要内容 */
.permission-content {
  max-width: 800px;
  width: 100%;
  position: relative;
  z-index: 10;
}

/* 错误区域 */
.error-section {
  text-align: center;
  margin-bottom: 40px;
  animation: errorSlideDown 1s ease-out;
}

@keyframes errorSlideDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 错误代码 */
.error-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 24px;
}

.code-number {
  font-size: 120px;
  font-weight: 900;
  color: var(--error-primary);
  text-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
  animation: numberGlow 3s ease-in-out infinite;
}

@keyframes numberGlow {
  0%,
  100% {
    text-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
  }

  50% {
    text-shadow: 0 8px 20px rgba(245, 101, 101, 0.6);
  }
}

/* 安全图标 */
.security-icon {
  position: relative;
}

.shield-container {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--security-color), #6b46c1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: shieldPulse 2s ease-in-out infinite;
}

@keyframes shieldPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(128, 90, 213, 0.3);
  }

  50% {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(128, 90, 213, 0.6);
  }
}

.shield-icon {
  font-size: 48px;
  color: white;
  animation: iconSpin 8s linear infinite;
}

@keyframes iconSpin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 盾牌环形装饰 */
.shield-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid rgba(128, 90, 213, 0.4);
  border-radius: 50%;
  animation: ringExpand 3s ease-out infinite;
}

.ring-1 {
  width: 120px;
  height: 120px;
  top: -60px;
  left: -60px;
  animation-delay: 0s;
}

.ring-2 {
  width: 140px;
  height: 140px;
  top: -70px;
  left: -70px;
  animation-delay: 1s;
}

.ring-3 {
  width: 160px;
  height: 160px;
  top: -80px;
  left: -80px;
  animation-delay: 2s;
}

@keyframes ringExpand {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }

  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* 错误标题区域 */
.error-title-section {
  margin-bottom: 32px;
}

.error-title {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: titleFlicker 4s ease-in-out infinite;
}

@keyframes titleFlicker {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
  }
}

.access-denied-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--error-primary), var(--error-secondary));
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  animation: badgeBlink 2s ease-in-out infinite;
}

@keyframes badgeBlink {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

/* 权限信息卡片 */
.permission-info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: cardSlideUp 0.8s ease-out 0.3s both;
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主要信息 */
.main-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.info-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--security-color), #6b46c1);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
  animation: iconBounce 3s ease-in-out infinite;
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.info-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.info-description {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 权限详情 */
.permission-details {
  margin-bottom: 32px;
}

.details-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.details-title .el-icon {
  color: var(--security-color);
  font-size: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: white;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

/* 建议区域 */
.suggestions-section {
  margin-bottom: 32px;
}

.suggestions-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.suggestions-title .el-icon {
  color: var(--warning-color);
  font-size: 20px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  background: white;
  box-shadow: var(--shadow-lg);
  transform: translateX(4px);
}

.suggestion-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--info-color), #3182ce);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.suggestion-text strong {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.suggestion-text p {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-btn {
  background: linear-gradient(135deg, var(--security-color), #6b46c1);
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
  box-shadow: 0 8px 20px rgba(128, 90, 213, 0.4);
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
  border-color: var(--info-color);
  color: var(--info-color);
  transform: translateY(-2px);
}

.tertiary-btn {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
}

.tertiary-btn:hover {
  background: white;
  border-color: var(--warning-color);
  color: var(--warning-color);
  transform: translateY(-2px);
}

/* 装饰性安全元素 */
.security-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.security-badge {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--security-color);
  font-size: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: badgeFloat 6s ease-in-out infinite;
}

.badge-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.badge-2 {
  top: 30%;
  right: 15%;
  animation-delay: -1.5s;
}

.badge-3 {
  bottom: 30%;
  left: 15%;
  animation-delay: -3s;
}

.badge-4 {
  bottom: 20%;
  right: 10%;
  animation-delay: -4.5s;
}

@keyframes badgeFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }

  25% {
    transform: translateY(-15px) rotate(90deg);
    opacity: 1;
  }

  50% {
    transform: translateY(-5px) rotate(180deg);
    opacity: 0.8;
  }

  75% {
    transform: translateY(-20px) rotate(270deg);
    opacity: 1;
  }
}

/* 宇航员插图 */
.astronaut-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  animation: astronautFloat 8s ease-in-out infinite;
}

@keyframes astronautFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-20px) rotate(2deg);
  }

  50% {
    transform: translateY(-10px) rotate(0deg);
  }

  75% {
    transform: translateY(-25px) rotate(-2deg);
  }
}

.astronaut {
  position: relative;
  width: 120px;
  height: 120px;
}

.astronaut-image {
  width: 100%;
  height: 100%;
  opacity: 0.8;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.astronaut-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(circle, rgba(128, 90, 213, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.4;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-info-card {
    padding: 24px;
    margin: 16px;
  }

  .error-code {
    gap: 20px;
  }

  .code-number {
    font-size: 80px;
  }

  .shield-container {
    width: 80px;
    height: 80px;
  }

  .shield-icon {
    font-size: 36px;
  }

  .error-title {
    font-size: 28px;
  }

  .main-info {
    flex-direction: column;
    text-align: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .el-button {
    width: 100%;
    max-width: 300px;
  }

  .security-decorations {
    display: none;
  }

  .astronaut-container {
    display: none;
  }
}

@media (max-width: 480px) {
  .no-permission-container {
    padding: 16px;
  }

  .permission-info-card {
    padding: 20px 16px;
  }

  .error-code {
    gap: 15px;
  }

  .code-number {
    font-size: 60px;
  }

  .shield-container {
    width: 70px;
    height: 70px;
  }

  .shield-icon {
    font-size: 30px;
  }

  .error-title {
    font-size: 24px;
  }

  .info-title {
    font-size: 20px;
  }

  .info-description {
    font-size: 14px;
  }

  .suggestion-item {
    padding: 12px;
  }

  .suggestions-list {
    gap: 8px;
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

  .permission-info-card {
    background: rgba(45, 55, 72, 0.95);
  }

  .detail-item,
  .suggestion-item {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }

  .detail-item:hover,
  .suggestion-item:hover {
    background: var(--bg-primary);
  }

  .secondary-btn,
  .tertiary-btn {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .security-badge {
    background: rgba(45, 55, 72, 0.9);
    color: var(--security-color);
  }
}
</style>
