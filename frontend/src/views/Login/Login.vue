<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <!-- 网格渐变背景 -->
      <div class="mesh-gradient"></div>

      <!-- 增强粒子系统 -->
      <div class="guide-particles">
        <div v-for="n in 30" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>

      <!-- 浮动形状 -->
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>

      <!-- 渐变光球 -->
      <div class="gradient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
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
        <div class="brand-text">
          <h1 class="brand-title">Smart-EMAP</h1>
          <p class="brand-subtitle">ログイン</p>
        </div>
      </div>

      <!-- 登录表单 -->
      <el-form class="login-form" :model="form" :rules="rules" ref="loginForm">
        <!-- 用户名输入框 -->
        <el-form-item prop="username">
          <div class="input-wrapper">
            <label class="input-label">ユーザー名</label>
            <el-input v-model="form.username" placeholder="ユーザー名を入力してください" :prefix-icon="User" clearable size="large"
              class="custom-input" @keyup.enter="handleLogin" @focus="handleInputFocus" @blur="handleInputBlur" />
          </div>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <div class="input-wrapper">
            <label class="input-label">パスワード</label>
            <el-input v-model="form.password" placeholder="パスワードを入力してください" type="password" :prefix-icon="Lock"
              show-password clearable size="large" class="custom-input" @keyup.enter="handleLogin"
              @focus="handleInputFocus" @blur="handleInputBlur" />
          </div>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" class="login-button" size="large">
            <div class="button-content">
              <el-icon v-if="!loading" class="button-icon">
                <Right />
              </el-icon>
              <span class="button-text">{{ loading ? 'ログイン中...' : 'ログイン' }}</span>
            </div>
            <div class="button-glow"></div>
            <div class="button-ripple"></div>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部信息 -->
      <div class="footer-info">
        <div class="version-info">
          <span>Version 2.0.0</span>
        </div>
        <div class="copyright">
          <span>© 2025 Smart-EMAP</span>
        </div>
      </div>
    </div>

    <!-- 装饰性浮动元素 -->
    <div class="floating-decorations">
      <div class="floating-element element-1">
        <el-icon>
          <User />
        </el-icon>
      </div>
      <div class="floating-element element-2">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
      <div class="floating-element element-3">
        <el-icon>
          <Right />
        </el-icon>
      </div>
      <div class="floating-element element-4">
        <el-icon>
          <Setting />
        </el-icon>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">ログイン中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面
 * 简洁的登录界面设计 - 仅包含用户名和密码输入
 */

defineOptions({
  name: 'LoginPage',
})
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Right, Setting } from '@element-plus/icons-vue'
import { useMainStore } from '@/store/main'
import { login } from '@/api/login/login'
import type { CSSProperties } from 'vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const store = useMainStore()
const loading = ref(false)

// 登录表单数据
const form = reactive({
  username: '',
  password: '',
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: 'ユーザー名を入力してください', trigger: 'blur' },
    { min: 2, max: 20, message: 'ユーザー名は2-20文字で入力してください', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'パスワードを入力してください', trigger: 'blur' },
    { min: 6, message: 'パスワードは6文字以上で入力してください', trigger: 'blur' },
  ],
}

const loginForm = ref<FormInstance | null>(null)

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

// 输入框焦点处理
const handleInputFocus = (event: FocusEvent) => {
  const target = event.target as HTMLElement
  const wrapper = target.closest('.input-wrapper')
  if (wrapper) {
    wrapper.classList.add('focused')
  }
}

const handleInputBlur = (event: FocusEvent) => {
  const target = event.target as HTMLElement
  const wrapper = target.closest('.input-wrapper')
  if (wrapper) {
    wrapper.classList.remove('focused')
  }
}

// 表单验证
const validateForm = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (loginForm.value) {
      loginForm.value.validate((valid: boolean) => {
        if (valid) {
          resolve()
        } else {
          reject(new Error('入力内容に誤りがあります'))
        }
      })
    } else {
      reject(new Error('フォームが見つかりません'))
    }
  })
}

// 登录处理
const handleLogin = async () => {
  try {
    await validateForm()
    loading.value = true

    const res = await login(form)
    console.log('登录响应:', res)

    const responseData = res.data || {}
    const tokenData = responseData.token ? responseData : (responseData as any).data || {}

    if (!tokenData || !tokenData.token) {
      throw new Error('ログイン失敗：トークンが見つかりません')
    }

    store.setToken(tokenData.token)
    store.setUserInfo(tokenData.userInfo)
    localStorage.setItem('token_backup', tokenData.token)

    ElMessage.success('ログイン成功！')

    const redirectPath = getRedirectPath(tokenData.userInfo.role)
    router.push(redirectPath)
  } catch (error: unknown) {
    handleLoginError(error)
  } finally {
    loading.value = false
  }
}

// 获取重定向路径
const getRedirectPath = (role: string): string => {
  const roleRoutes: Record<string, string> = {
    admin: '/dashboard',
    manager: '/dashboard',
    user: '/dashboard',
    guest: '/dashboard',
  }
  return roleRoutes[role] || '/dashboard'
}

// 错误处理
const handleLoginError = (error: unknown) => {
  if (error instanceof Error) {
    ElMessage.warning(error.message)
  } else if (typeof error === 'object' && error !== null) {
    const apiError = error as { response?: { data?: { message?: string } }; message?: string }
    const message = apiError.response?.data?.message || apiError.message || '不明なエラー'
    ElMessage.error(`ログイン失敗：${message}`)
  } else {
    ElMessage.error('ログイン失敗：不明なエラー')
  }
}

onMounted(() => {
  // 页面加载完成
})
</script>

<style scoped>
/* 导入现代字体 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

/* CSS变量定义 */
:root {
  --primary-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #533483 100%);
  --secondary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --text-primary: #ffffff;
  --text-secondary: #f7fafc;
  --text-light: #e2e8f0;
  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 12px 40px rgba(0, 0, 0, 0.4);
  --shadow-strong: 0 20px 60px rgba(0, 0, 0, 0.5);
  --border-radius: 20px;
  --animation-duration: 0.6s;
}

/* 主容器 */
.login-container {
  min-height: 100vh;
  background: var(--primary-gradient);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 动态背景系统 */
.animated-background {
  background-color: #000000;
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

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--border-radius);
  padding: 50px 45px;
  box-shadow: var(--shadow-strong);
  animation: cardSlideUp 1s ease-out;
  position: relative;
  z-index: 10;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  transition: left 0.6s ease;
}

.login-card:hover::before {
  left: 100%;
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 45px;
  animation: logoSlideIn 1s ease-out 0.3s both;
}

@keyframes logoSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 24px;
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
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-strong);
  position: relative;
  overflow: hidden;
  margin: 0 auto;
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
  width: 70px;
  height: 70px;
  background: rgba(250, 249, 249, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.logo-img {
  width: 35px;
  height: 35px;
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
  width: 120px;
  height: 120px;
  animation: ringRotate 10s linear infinite;
}

.ring-2 {
  width: 140px;
  height: 140px;
  animation: ringRotate 15s linear infinite reverse;
}

.ring-3 {
  width: 160px;
  height: 160px;
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

.brand-text {
  animation: fadeInUp 1s ease-out 0.5s both;
}

.brand-title {
  font-size: 32px;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 20px rgba(102, 126, 234, 0.3);
}

.brand-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  color: #ebfa1c;
  margin: 0;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 10px rgba(253, 252, 252, 0.2);
}

/* 登录表单 */
.login-form {
  animation: fadeInUp 1s ease-out 0.7s both;
}

.input-wrapper {
  position: relative;
  margin-bottom: 32px;
}

.input-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: var(--text-secondary);
  color: #fdfbfb;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

.input-wrapper.focused .input-label {
  color: #667eea;
  transform: translateY(-2px);
}

:deep(.custom-input) {
  .el-input__wrapper {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 18px 22px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-soft);
    min-height: 60px;
  }

  .el-input__wrapper:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }

  .el-input__wrapper.is-focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), var(--shadow-medium);
    transform: translateY(-3px);
  }

  .el-input__inner {
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.3px;
  }

  .el-input__inner::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
    font-style: italic;
  }

  .el-input__prefix-inner {
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
  }

  .el-input__wrapper.is-focus .el-input__prefix-inner {
    color: #667eea;
  }
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb) !important;
  border: none !important;
  border-radius: 50px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  font-family: 'Poppins', sans-serif !important;
  letter-spacing: 0.5px !important;
  position: relative;
  overflow: hidden;
  transition: all var(--animation-duration) ease !important;
  margin-bottom: 35px;
  margin-top: 12px;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6) !important;
  color: white !important;
}

.login-button:hover {
  transform: translateY(-4px) scale(1.02) !important;
  box-shadow: 0 15px 50px rgba(102, 126, 234, 0.8) !important;
}

.login-button:active {
  transform: translateY(-2px) scale(1.01) !important;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.button-text {
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.button-icon {
  font-size: 20px;
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

/* 底部信息 */
.footer-info {
  text-align: center;
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeInUp 1s ease-out 0.9s both;
}

.version-info {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
}

.copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.3px;
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

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  position: relative;
  width: 70px;
  height: 70px;
  margin: 0 auto 25px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  animation-delay: -0.4s;
  border-top-color: rgba(255, 255, 255, 0.8);
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  animation-delay: -0.8s;
  border-top-color: rgba(255, 255, 255, 0.6);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .floating-decorations {
    display: none;
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 400px;
    padding: 40px 35px;
    margin: 16px;
  }

  .logo {
    width: 90px;
    height: 90px;
  }

  .logo-inner {
    width: 60px;
    height: 60px;
  }

  .logo-img {
    width: 30px;
    height: 30px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 16px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 56px;
      padding: 15px 18px;
    }
  }

  .login-button {
    height: 56px !important;
    font-size: 16px !important;
  }
}

@media (max-width: 480px) {
  .login-card {
    max-width: 360px;
    padding: 35px 30px;
    margin: 12px;
  }

  .logo {
    width: 80px;
    height: 80px;
  }

  .logo-inner {
    width: 55px;
    height: 55px;
  }

  .logo-img {
    width: 28px;
    height: 28px;
  }

  .brand-title {
    font-size: 26px;
  }

  .brand-subtitle {
    font-size: 15px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 54px;
      padding: 14px 16px;
    }
  }

  .login-button {
    height: 54px !important;
    font-size: 16px !important;
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
  .login-card {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}
</style>
