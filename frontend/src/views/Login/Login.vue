<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="animated-background">
      <!-- 几何图形背景 -->
      <div class="geometric-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>

      <!-- 粒子效果 -->
      <div class="particles">
        <div v-for="n in 15" :key="n" class="particle" :style="particleStyle(n)"></div>
      </div>

      <!-- 光晕效果 -->
      <div class="glow-effects">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-bg">
            <img src="@/components/icons/logo.svg" alt="Smart-EMAP" class="logo" />
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
            <el-input
              v-model="form.username"
              placeholder="ユーザー名を入力してください"
              :prefix-icon="User"
              clearable
              size="large"
              class="custom-input"
              @keyup.enter="handleLogin"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
            />
          </div>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <div class="input-wrapper">
            <label class="input-label">パスワード</label>
            <el-input
              v-model="form.password"
              placeholder="パスワードを入力してください"
              type="password"
              :prefix-icon="Lock"
              show-password
              clearable
              size="large"
              class="custom-input"
              @keyup.enter="handleLogin"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
            />
          </div>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
            size="large"
          >
            <el-icon v-if="!loading" class="button-icon">
              <Right />
            </el-icon>
            <span class="button-text">{{ loading ? 'ログイン中...' : 'ログイン' }}</span>
            <div class="button-shine"></div>
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

    <!-- 装饰性元素 -->
    <div class="decorative-elements">
      <div class="floating-icon icon-1">
        <el-icon>
          <User />
        </el-icon>
      </div>
      <div class="floating-icon icon-2">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
      <div class="floating-icon icon-3">
        <el-icon>
          <Right />
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
import { User, Lock, Right } from '@element-plus/icons-vue'
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
const particleStyle = (index: number): CSSProperties => ({
  '--delay': `${Math.random() * 20}s`,
  '--duration': `${15 + Math.random() * 10}s`,
  '--x': `${Math.random() * 100}%`,
  '--y': `${Math.random() * 100}%`,
  '--size': `${2 + Math.random() * 4}px`,
})

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
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #e0e7ff;
  --secondary-color: #8b5cf6;
  --accent-color: #06b6d4;
  --success-color: #10b981;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --border-color: #e5e7eb;
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  --radius-lg: 16px;
  --radius-xl: 20px;
}

/* 主容器 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 20px;
  font-family:
    'Inter',
    'Poppins',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* 动态背景 */
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

/* 几何图形背景 */
.geometric-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: float 25s infinite ease-in-out;
}

.shape-1 {
  width: 150px;
  height: 150px;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  top: 60%;
  right: 15%;
  animation-delay: -8s;
}

.shape-3 {
  width: 120px;
  height: 120px;
  border-radius: 20% 80% 80% 20% / 20% 20% 80% 80%;
  bottom: 15%;
  left: 15%;
  animation-delay: -16s;
}

.shape-4 {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  top: 30%;
  right: 10%;
  animation-delay: -24s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg) scale(1);
    opacity: 0.1;
  }

  25% {
    transform: translateY(-30px) rotate(90deg) scale(1.1);
    opacity: 0.2;
  }

  50% {
    transform: translateY(-20px) rotate(180deg) scale(0.9);
    opacity: 0.3;
  }

  75% {
    transform: translateY(-40px) rotate(270deg) scale(1.05);
    opacity: 0.2;
  }
}

/* 粒子效果 */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 100%);
  border-radius: 50%;
  top: var(--y);
  left: var(--x);
  animation: particleFloat var(--duration) var(--delay) infinite linear;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg) scale(0);
    opacity: 0;
  }

  10% {
    opacity: 1;
    transform: scale(1);
  }

  90% {
    opacity: 1;
  }

  100% {
    transform: translateY(-100px) rotate(360deg) scale(0);
    opacity: 0;
  }
}

/* 光晕效果 */
.glow-effects {
  position: absolute;
  width: 100%;
  height: 100%;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: glowPulse 12s infinite ease-in-out;
}

.glow-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  top: 15%;
  left: 5%;
  animation-delay: 0s;
}

.glow-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  top: 50%;
  right: 10%;
  animation-delay: -4s;
}

.glow-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
  bottom: 10%;
  left: 40%;
  animation-delay: -8s;
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.3;
  }

  33% {
    transform: scale(1.2) rotate(120deg);
    opacity: 0.5;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border-radius: var(--radius-xl);
  padding: 50px 45px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInUp 1s ease-out;
  position: relative;
  z-index: 10;
}

@keyframes slideInUp {
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
}

.logo-container {
  margin-bottom: 24px;
}

.logo-bg {
  width: 100px;
  height: 100px;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--primary-dark),
    var(--secondary-color)
  );
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow:
    0 15px 35px rgba(99, 102, 241, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: logoFloat 4s ease-in-out infinite;
  position: relative;
}

.logo-bg::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color),
    var(--accent-color)
  );
  border-radius: 50%;
  z-index: -1;
  opacity: 0.3;
  filter: blur(15px);
  animation: logoGlow 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-12px) rotate(5deg);
  }
}

@keyframes logoGlow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.logo {
  width: 50px;
  height: 50px;
}

.brand-text {
  animation: fadeInUp 1s ease-out 0.3s both;
}

.brand-title {
  font-size: 32px;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #06b6d4 60%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow:
    0 2px 4px rgba(99, 102, 241, 0.3),
    0 4px 8px rgba(139, 92, 246, 0.2),
    0 8px 16px rgba(6, 182, 212, 0.1);
  position: relative;
}

.brand-title::before {
  content: 'Smart-EMAP';
  position: absolute;
  top: 2px;
  left: 0;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.3),
    rgba(139, 92, 246, 0.3),
    rgba(6, 182, 212, 0.3)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: -1;
}

.brand-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 50%, #9ca3af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(75, 85, 99, 0.2);
}

/* 登录表单 */
.login-form {
  animation: fadeInUp 1s ease-out 0.5s both;
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
  margin-bottom: 12px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #4b5563 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(75, 85, 99, 0.1);
}

.input-wrapper.focused .input-label {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateY(-2px);
}

:deep(.custom-input) {
  .el-input__wrapper {
    background: rgba(248, 250, 252, 0.8);
    backdrop-filter: blur(10px);
    border: 3px solid transparent;
    border-radius: 20px;
    padding: 18px 22px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 1px rgba(229, 231, 235, 0.5);
    min-height: 60px;
    position: relative;
    background-clip: padding-box;
  }

  .el-input__wrapper::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
    border-radius: 20px;
    z-index: -1;
    opacity: 1;
    transition: all 0.4s ease;
  }

  .el-input__wrapper:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow:
      0 8px 15px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 0 1px rgba(99, 102, 241, 0.3);
  }

  .el-input__wrapper:hover::before {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
    opacity: 0.8;
  }

  .el-input__wrapper.is-focus {
    background: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 0 0 4px rgba(99, 102, 241, 0.1),
      0 10px 20px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 0 1px rgba(99, 102, 241, 0.5);
    transform: translateY(-3px);
  }

  .el-input__wrapper.is-focus::before {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #06b6d4 60%, #10b981 100%);
    opacity: 1;
  }

  .el-input__inner {
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.3px;
  }

  .el-input__inner::placeholder {
    color: var(--text-muted);
    font-weight: 400;
    font-style: italic;
  }

  .el-input__prefix-inner {
    color: var(--text-muted);
    font-size: 18px;
  }

  .el-input__wrapper.is-focus .el-input__prefix-inner {
    color: var(--primary-color);
  }
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #06b6d4 60%, #10b981 100%);
  border: none;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 35px;
  margin-top: 12px;
  box-shadow:
    0 8px 16px rgba(99, 102, 241, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.1);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 30%, #0891b2 60%, #059669 100%);
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.login-button:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 15px 30px rgba(99, 102, 241, 0.4),
    0 8px 16px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.2);
}

.login-button:hover::before {
  opacity: 1;
}

.login-button:active {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 8px 16px rgba(99, 102, 241, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

.login-button .button-text {
  position: relative;
  z-index: 2;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-button .button-icon {
  margin-right: 12px;
  font-size: 20px;
  position: relative;
  z-index: 2;
  color: #ffffff;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transition: left 0.8s ease;
  z-index: 1;
}

.login-button:hover .button-shine {
  left: 100%;
}

/* 底部信息 */
.footer-info {
  text-align: center;
  padding-top: 28px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  animation: fadeInUp 1s ease-out 0.7s both;
}

.version-info {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
}

.copyright {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.3px;
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
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: iconFloat 10s ease-in-out infinite;
}

.floating-icon .el-icon {
  color: inherit;
}

.icon-1 {
  top: 15%;
  left: 8%;
  animation-delay: 0s;
}

.icon-2 {
  top: 60%;
  right: 12%;
  animation-delay: -3.3s;
}

.icon-3 {
  bottom: 20%;
  left: 12%;
  animation-delay: -6.6s;
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.7;
  }

  33% {
    transform: translateY(-30px) rotate(120deg) scale(1.1);
    opacity: 1;
  }

  66% {
    transform: translateY(-15px) rotate(240deg) scale(0.9);
    opacity: 0.8;
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
}

/* 响应式设计 */
/* 超大屏幕 (1440px+) */
@media (min-width: 1440px) {
  .login-card {
    max-width: 480px;
    padding: 60px 55px;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-subtitle {
    font-size: 20px;
  }

  .logo-bg {
    width: 110px;
    height: 110px;
  }

  .logo {
    width: 55px;
    height: 55px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 65px;
      padding: 20px 24px;
    }

    .el-input__inner {
      font-size: 17px;
    }
  }

  .login-button {
    height: 65px;
    font-size: 19px;
  }

  .floating-icon {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }
}

/* 大屏幕 (1200px-1439px) */
@media (min-width: 1200px) and (max-width: 1439px) {
  .login-card {
    max-width: 450px;
    padding: 55px 50px;
  }

  .brand-title {
    font-size: 34px;
  }

  .brand-subtitle {
    font-size: 19px;
  }

  .logo-bg {
    width: 105px;
    height: 105px;
  }

  .logo {
    width: 52px;
    height: 52px;
  }
}

/* 中等屏幕 (992px-1199px) */
@media (min-width: 992px) and (max-width: 1199px) {
  .login-card {
    max-width: 420px;
    padding: 50px 45px;
  }

  .brand-title {
    font-size: 32px;
  }

  .brand-subtitle {
    font-size: 18px;
  }

  .logo-bg {
    width: 100px;
    height: 100px;
  }

  .logo {
    width: 50px;
    height: 50px;
  }
}

/* 平板屏幕 (768px-991px) */
@media (min-width: 768px) and (max-width: 991px) {
  .login-container {
    padding: 20px;
  }

  .login-card {
    max-width: 400px;
    padding: 45px 40px;
    margin: 20px;
  }

  .brand-title {
    font-size: 30px;
    margin-bottom: 10px;
  }

  .brand-subtitle {
    font-size: 17px;
  }

  .logo-bg {
    width: 95px;
    height: 95px;
  }

  .logo {
    width: 47px;
    height: 47px;
  }

  .input-wrapper {
    margin-bottom: 28px;
  }

  .input-label {
    font-size: 14px;
    margin-bottom: 10px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 58px;
      padding: 16px 20px;
      border-radius: 18px;
    }

    .el-input__wrapper::before {
      border-radius: 18px;
    }

    .el-input__inner {
      font-size: 15px;
    }
  }

  .login-button {
    height: 58px;
    font-size: 17px;
    border-radius: 18px;
    margin-bottom: 30px;
    margin-top: 10px;
  }

  .login-button::before {
    border-radius: 18px;
  }

  .floating-icon {
    width: 55px;
    height: 55px;
    font-size: 22px;
  }

  .decorative-elements {
    opacity: 0.7;
  }
}

/* 小屏幕 (576px-767px) */
@media (min-width: 576px) and (max-width: 767px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 380px;
    padding: 40px 35px;
    margin: 16px;
  }

  .logo-section {
    margin-bottom: 35px;
  }

  .logo-container {
    margin-bottom: 20px;
  }

  .brand-title {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .brand-subtitle {
    font-size: 16px;
  }

  .logo-bg {
    width: 90px;
    height: 90px;
  }

  .logo {
    width: 45px;
    height: 45px;
  }

  .input-wrapper {
    margin-bottom: 26px;
  }

  .input-label {
    font-size: 14px;
    margin-bottom: 8px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 56px;
      padding: 15px 18px;
      border-radius: 16px;
    }

    .el-input__wrapper::before {
      border-radius: 16px;
    }

    .el-input__inner {
      font-size: 15px;
    }

    .el-input__prefix-inner {
      font-size: 16px;
    }
  }

  .login-button {
    height: 56px;
    font-size: 16px;
    border-radius: 16px;
    margin-bottom: 28px;
    margin-top: 8px;
  }

  .login-button::before {
    border-radius: 16px;
  }

  .login-button .button-icon {
    margin-right: 10px;
    font-size: 18px;
  }

  .footer-info {
    padding-top: 24px;
  }

  .version-info {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .copyright {
    font-size: 11px;
  }

  .decorative-elements {
    display: none;
  }
}

/* 超小屏幕 (480px-575px) */
@media (min-width: 480px) and (max-width: 575px) {
  .login-container {
    padding: 12px;
  }

  .login-card {
    max-width: 360px;
    padding: 35px 30px;
    margin: 12px;
  }

  .logo-section {
    margin-bottom: 30px;
  }

  .logo-container {
    margin-bottom: 18px;
  }

  .brand-title {
    font-size: 26px;
    margin-bottom: 6px;
  }

  .brand-subtitle {
    font-size: 15px;
  }

  .logo-bg {
    width: 85px;
    height: 85px;
  }

  .logo {
    width: 42px;
    height: 42px;
  }

  .input-wrapper {
    margin-bottom: 24px;
  }

  .input-label {
    font-size: 13px;
    margin-bottom: 8px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 54px;
      padding: 14px 16px;
      border-radius: 14px;
    }

    .el-input__wrapper::before {
      border-radius: 14px;
    }

    .el-input__inner {
      font-size: 14px;
    }

    .el-input__prefix-inner {
      font-size: 16px;
    }
  }

  .login-button {
    height: 54px;
    font-size: 16px;
    border-radius: 14px;
    margin-bottom: 26px;
    margin-top: 6px;
  }

  .login-button::before {
    border-radius: 14px;
  }

  .login-button .button-icon {
    margin-right: 8px;
    font-size: 16px;
  }

  .footer-info {
    padding-top: 20px;
  }

  .version-info {
    font-size: 11px;
    margin-bottom: 6px;
  }

  .copyright {
    font-size: 10px;
  }
}

/* 极小屏幕 (320px-479px) */
@media (max-width: 479px) {
  .login-container {
    padding: 8px;
    font-size: 14px;
  }

  .login-card {
    max-width: 340px;
    padding: 30px 25px;
    margin: 8px;
    border-radius: 16px;
  }

  .logo-section {
    margin-bottom: 25px;
  }

  .logo-container {
    margin-bottom: 16px;
  }

  .brand-title {
    font-size: 24px;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .logo-bg {
    width: 80px;
    height: 80px;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  .input-wrapper {
    margin-bottom: 22px;
  }

  .input-label {
    font-size: 12px;
    margin-bottom: 6px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 52px;
      padding: 12px 14px;
      border-radius: 12px;
      border-width: 2px;
    }

    .el-input__wrapper::before {
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 12px;
    }

    .el-input__inner {
      font-size: 14px;
    }

    .el-input__prefix-inner {
      font-size: 14px;
    }
  }

  .login-button {
    height: 52px;
    font-size: 15px;
    border-radius: 12px;
    margin-bottom: 24px;
    margin-top: 4px;
  }

  .login-button::before {
    border-radius: 12px;
  }

  .login-button .button-icon {
    margin-right: 6px;
    font-size: 16px;
  }

  .footer-info {
    padding-top: 18px;
  }

  .version-info {
    font-size: 10px;
    margin-bottom: 4px;
  }

  .copyright {
    font-size: 9px;
  }

  /* 背景效果在小屏幕上简化 */
  .particles {
    display: none;
  }

  .glow-effects .glow {
    opacity: 0.2;
  }

  .geometric-shapes .shape {
    opacity: 0.05;
  }
}

/* 极小屏幕优化 (小于320px) */
@media (max-width: 319px) {
  .login-container {
    padding: 4px;
  }

  .login-card {
    max-width: 300px;
    padding: 25px 20px;
    margin: 4px;
  }

  .brand-title {
    font-size: 22px;
  }

  .brand-subtitle {
    font-size: 13px;
  }

  .logo-bg {
    width: 75px;
    height: 75px;
  }

  .logo {
    width: 37px;
    height: 37px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 48px;
      padding: 10px 12px;
    }

    .el-input__inner {
      font-size: 13px;
    }
  }

  .login-button {
    height: 48px;
    font-size: 14px;
  }

  .input-label {
    font-size: 11px;
  }

  /* 完全隐藏背景效果 */
  .animated-background {
    opacity: 0.3;
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .login-container {
    padding: 10px;
  }

  .login-card {
    padding: 30px 40px;
    margin: 10px;
  }

  .logo-section {
    margin-bottom: 20px;
  }

  .logo-bg {
    width: 70px;
    height: 70px;
  }

  .logo {
    width: 35px;
    height: 35px;
  }

  .brand-title {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .input-wrapper {
    margin-bottom: 16px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      min-height: 48px;
      padding: 12px 16px;
    }
  }

  .login-button {
    height: 48px;
    font-size: 16px;
    margin-bottom: 20px;
    margin-top: 4px;
  }

  .footer-info {
    padding-top: 16px;
  }

  .decorative-elements {
    display: none;
  }

  /* 背景效果简化 */
  .particles {
    display: none;
  }

  .glow-effects {
    opacity: 0.5;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-card {
    border-width: 0.5px;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      border-width: 1.5px;
    }
  }

  .brand-title,
  .brand-subtitle,
  .input-label {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* 暗色主题响应式 */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f9fafb;
    --text-secondary: #e5e7eb;
    --text-muted: #9ca3af;
    --bg-primary: #1f2937;
    --bg-secondary: #374151;
    --border-color: #4b5563;
  }

  .login-card {
    background: rgba(31, 41, 55, 0.95);
    box-shadow:
      0 25px 50px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .floating-icon {
    background: rgba(31, 41, 55, 0.9);
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      background: rgba(55, 65, 81, 0.8);
      border-color: var(--border-color);
    }

    .el-input__wrapper:hover {
      background: rgba(75, 85, 99, 0.9);
    }

    .el-input__wrapper.is-focus {
      background: rgba(75, 85, 99, 0.95);
    }
  }

  /* 暗色主题下的小屏幕优化 */
  @media (max-width: 479px) {
    .login-card {
      background: rgba(31, 41, 55, 0.98);
    }

    .animated-background {
      opacity: 0.2;
    }
  }
}

/* 减少动画效果 (用户偏好) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .particles,
  .glow-effects,
  .floating-icon {
    display: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .login-card {
    border: 2px solid #000;
    background: #fff;
  }

  .brand-title {
    background: #000;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  :deep(.custom-input) {
    .el-input__wrapper {
      border: 2px solid #000;
      background: #fff;
    }
  }

  .login-button {
    background: #000;
    color: #fff;
    border: 2px solid #000;
  }
}

/* 动画延迟 */
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

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
