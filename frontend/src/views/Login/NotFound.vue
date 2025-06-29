<template>
  <div class="not-found-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <div class="error-waves">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
      <div class="floating-elements">
        <div v-for="n in 20" :key="n" class="float-element" :style="floatElementStyle(n)"></div>
      </div>
    </div>

    <!-- 404内容 -->
    <div class="not-found-content">
      <!-- 404动画区域 -->
      <div class="error-display">
        <div class="error-animation">
          <div class="error-number first-4">4</div>
          <div class="error-icon-container">
            <div class="error-icon-bg">
              <div class="error-icon">
                <el-icon><QuestionFilled /></el-icon>
              </div>
              <div class="icon-rings">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
              </div>
            </div>
          </div>
          <div class="error-number second-4">4</div>
        </div>

        <!-- 故障效果文字 -->
        <div class="glitch-text">
          <span class="glitch-main">PAGE NOT FOUND</span>
          <span class="glitch-copy glitch-copy-1">PAGE NOT FOUND</span>
          <span class="glitch-copy glitch-copy-2">PAGE NOT FOUND</span>
        </div>
      </div>

      <!-- 错误信息卡片 -->
      <div class="error-info-card">
        <div class="card-header">
          <h1 class="error-title">ページが見つかりません</h1>
          <p class="error-description">
            お探しのページは存在しないか、移動された可能性があります。
          </p>
        </div>

        <!-- 建议操作 -->
        <div class="suggestions-section">
          <h3 class="suggestions-title">
            <el-icon><HelpFilled /></el-icon>
            以下をお試しください
          </h3>
          <div class="suggestions-grid">
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon><Link /></el-icon>
              </div>
              <div class="suggestion-content">
                <h4>URLを確認</h4>
                <p>URLが正しく入力されているかご確認ください</p>
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon><Back /></el-icon>
              </div>
              <div class="suggestion-content">
                <h4>前のページに戻る</h4>
                <p>ブラウザの戻るボタンで前のページに戻る</p>
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon><HomeFilled /></el-icon>
              </div>
              <div class="suggestion-content">
                <h4>ホームページへ</h4>
                <p>ダッシュボードから目的のページを探す</p>
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-icon">
                <el-icon><Search /></el-icon>
              </div>
              <div class="suggestion-content">
                <h4>検索機能を使用</h4>
                <p>サイト内検索で目的のコンテンツを探す</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="goHome" size="large" class="primary-btn">
            <el-icon><HomeFilled /></el-icon>
            ダッシュボードへ戻る
          </el-button>
          <el-button @click="goBack" size="large" class="secondary-btn">
            <el-icon><ArrowLeft /></el-icon>
            前のページに戻る
          </el-button>
          <el-button @click="refreshPage" size="large" class="tertiary-btn">
            <el-icon><Refresh /></el-icon>
            ページを更新
          </el-button>
        </div>

        <!-- 联系信息 -->
        <div class="contact-section">
          <div class="contact-card">
            <div class="contact-icon">
              <el-icon><Service /></el-icon>
            </div>
            <div class="contact-content">
              <h4>問題が解決しない場合</h4>
              <p>システム管理者にお問い合わせください</p>
              <div class="contact-methods">
                <span class="contact-method">
                  <el-icon><Message /></el-icon>
                  support@smart-emap.com
                </span>
                <span class="contact-method">
                  <el-icon><Phone /></el-icon>
                  03-1234-5678
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 装饰性机器人 -->
    <div class="robot-decoration">
      <div class="robot">
        <div class="robot-head">
          <div class="robot-eye left-eye"></div>
          <div class="robot-eye right-eye"></div>
          <div class="robot-antenna"></div>
        </div>
        <div class="robot-body">
          <div class="robot-panel"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  QuestionFilled,
  HomeFilled,
  ArrowLeft,
  HelpFilled,
  Link,
  Back,
  Search,
  Service,
  Message,
  Phone,
  Refresh,
} from '@element-plus/icons-vue'
import type { CSSProperties } from 'vue'

const router = useRouter()

// 浮动元素样式生成
const floatElementStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 5}s`,
  '--duration': `${8 + Math.random() * 4}s`,
  '--x': `${Math.random() * 100}%`,
  '--y': `${Math.random() * 100}%`,
  '--size': `${4 + Math.random() * 8}px`,
})

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}

const refreshPage = () => {
  window.location.reload()
}
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --error-primary: #f56565;
  --error-secondary: #e53e3e;
  --warning-color: #ed8936;
  --info-color: #4299e1;
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
.not-found-container {
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

/* 错误波浪 */
.error-waves {
  position: absolute;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(245, 101, 101, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: waveFloat 20s infinite linear;
}

.wave-1 {
  top: -50%;
  left: -50%;
  animation-delay: 0s;
}

.wave-2 {
  top: -30%;
  right: -50%;
  animation-delay: -7s;
}

.wave-3 {
  bottom: -50%;
  left: -30%;
  animation-delay: -14s;
}

@keyframes waveFloat {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 浮动元素 */
.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
}

.float-element {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  top: var(--y);
  left: var(--x);
  animation: elementFloat var(--duration) var(--delay) infinite ease-in-out;
}

@keyframes elementFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.8;
  }
}

/* 404内容 */
.not-found-content {
  max-width: 900px;
  width: 100%;
  position: relative;
  z-index: 10;
}

/* 错误显示区域 */
.error-display {
  text-align: center;
  margin-bottom: 40px;
  animation: errorAppear 1s ease-out;
}

@keyframes errorAppear {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 404动画 */
.error-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 20px;
}

.error-number {
  font-size: 120px;
  font-weight: 900;
  color: var(--error-primary);
  text-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
  animation: numberBounce 2s ease-in-out infinite;
}

.first-4 {
  animation-delay: 0s;
}

.second-4 {
  animation-delay: 0.5s;
}

@keyframes numberBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
}

/* 错误图标容器 */
.error-icon-container {
  position: relative;
}

.error-icon-bg {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--error-primary), var(--error-secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: iconSpin 4s linear infinite;
}

@keyframes iconSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 48px;
  color: white;
  animation: iconWobble 2s ease-in-out infinite;
}

@keyframes iconWobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

/* 图标环形装饰 */
.icon-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid rgba(245, 101, 101, 0.3);
  border-radius: 50%;
  animation: ringPulse 2s ease-out infinite;
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

@keyframes ringPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* 故障效果文字 */
.glitch-text {
  position: relative;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.glitch-main {
  position: relative;
  z-index: 3;
}

.glitch-copy {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch-copy-1 {
  color: #ff0080;
  animation: glitch1 2s infinite;
  z-index: 2;
}

.glitch-copy-2 {
  color: #00ffff;
  animation: glitch2 2s infinite;
  z-index: 1;
}

@keyframes glitch1 {
  0%,
  100% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
}

@keyframes glitch2 {
  0%,
  100% {
    transform: translate(0);
  }
  20% {
    transform: translate(2px, -2px);
  }
  40% {
    transform: translate(2px, 2px);
  }
  60% {
    transform: translate(-2px, -2px);
  }
  80% {
    transform: translate(-2px, 2px);
  }
}

/* 错误信息卡片 */
.error-info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
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

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.error-title {
  font-size: 32px;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-weight: 700;
}

.error-description {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 建议区域 */
.suggestions-section {
  margin-bottom: 40px;
}

.suggestions-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 24px;
  font-weight: 600;
}

.suggestions-title .el-icon {
  color: var(--warning-color);
  font-size: 24px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.suggestion-item:hover {
  background: white;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.suggestion-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--info-color), #3182ce);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.suggestion-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.suggestion-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.primary-btn {
  background: linear-gradient(135deg, var(--error-primary), var(--error-secondary));
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
  box-shadow: 0 8px 20px rgba(245, 101, 101, 0.4);
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

/* 联系区域 */
.contact-section {
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.contact-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, var(--bg-secondary), white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.contact-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--info-color), #3182ce);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.contact-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.contact-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-muted);
}

.contact-method .el-icon {
  color: var(--info-color);
}

/* 装饰性机器人 */
.robot-decoration {
  position: absolute;
  bottom: 20px;
  right: 20px;
  animation: robotFloat 6s ease-in-out infinite;
}

@keyframes robotFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.robot {
  width: 80px;
  height: 100px;
  position: relative;
}

.robot-head {
  width: 50px;
  height: 40px;
  background: linear-gradient(135deg, #4a5568, #2d3748);
  border-radius: 12px;
  position: relative;
  margin: 0 auto 10px;
}

.robot-eye {
  width: 8px;
  height: 8px;
  background: var(--error-primary);
  border-radius: 50%;
  position: absolute;
  top: 12px;
  animation: robotBlink 3s infinite;
}

.left-eye {
  left: 12px;
}

.right-eye {
  right: 12px;
  animation-delay: 0.1s;
}

@keyframes robotBlink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

.robot-antenna {
  width: 2px;
  height: 15px;
  background: var(--text-muted);
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
}

.robot-antenna::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--error-primary);
  border-radius: 50%;
  position: absolute;
  top: -3px;
  left: -2px;
  animation: antennaGlow 2s ease-in-out infinite;
}

@keyframes antennaGlow {
  0%,
  100% {
    box-shadow: 0 0 5px var(--error-primary);
  }
  50% {
    box-shadow: 0 0 15px var(--error-primary);
  }
}

.robot-body {
  width: 60px;
  height: 50px;
  background: linear-gradient(135deg, #4a5568, #2d3748);
  border-radius: 8px;
  margin: 0 auto;
  position: relative;
}

.robot-panel {
  width: 30px;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: 4px;
  position: absolute;
  top: 15px;
  left: 15px;
}

.robot-panel::before,
.robot-panel::after {
  content: '';
  width: 8px;
  height: 2px;
  background: var(--info-color);
  position: absolute;
  left: 3px;
  animation: panelBlink 2s infinite;
}

.robot-panel::before {
  top: 5px;
}

.robot-panel::after {
  bottom: 5px;
  animation-delay: 1s;
}

@keyframes panelBlink {
  0%,
  80%,
  100% {
    opacity: 1;
  }
  90% {
    opacity: 0.3;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-info-card {
    padding: 24px;
  }

  .error-number {
    font-size: 80px;
  }

  .error-icon-bg {
    width: 80px;
    height: 80px;
  }

  .error-icon {
    font-size: 36px;
  }

  .error-title {
    font-size: 28px;
  }

  .error-description {
    font-size: 16px;
  }

  .suggestions-grid {
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

  .contact-card {
    flex-direction: column;
    text-align: center;
  }

  .robot-decoration {
    display: none;
  }
}

@media (max-width: 480px) {
  .not-found-container {
    padding: 16px;
  }

  .error-info-card {
    padding: 20px;
  }

  .error-number {
    font-size: 60px;
  }

  .error-animation {
    gap: 10px;
  }

  .glitch-text {
    font-size: 18px;
  }

  .error-title {
    font-size: 24px;
  }

  .suggestions-title {
    font-size: 18px;
  }

  .suggestion-item {
    padding: 16px;
  }

  .contact-methods {
    align-items: center;
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

  .error-info-card {
    background: rgba(45, 55, 72, 0.95);
  }

  .suggestion-item {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }

  .suggestion-item:hover {
    background: var(--bg-primary);
  }

  .secondary-btn,
  .tertiary-btn {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .contact-card {
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
    border-color: var(--border-color);
  }
}
</style>
