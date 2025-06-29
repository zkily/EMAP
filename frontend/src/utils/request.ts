import axios, { AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

const instance = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? 'http://192.168.1.59:3000' : '', // 修改为后端IP和端口
  timeout: 500000,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从Pinia持久化存储中获取token
    let token = null

    // 首先尝试从Pinia持久化存储中获取
    try {
      const mainStore = localStorage.getItem('main')
      if (mainStore) {
        const parsedStore = JSON.parse(mainStore)
        token = parsedStore.token
        console.log('从Pinia获取到token:', token ? token.substring(0, 10) + '...' : 'null')
      }
    } catch (e) {
      console.error('解析Pinia存储失败:', e)
    }

    // 如果没有找到，尝试从备份中获取
    if (!token) {
      token = localStorage.getItem('token_backup')
      console.log('从备份获取到token:', token ? token.substring(0, 10) + '...' : 'null')
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('请求携带token:', token.substring(0, 10) + '...', '请求路径:', config.url)
    } else {
      console.warn('未找到token或token为空, 请求路径:', config.url)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 如果响应是文件流（Blob），直接返回整个响应对象
    if (response.request.responseType === 'blob') {
      return response
    }

    const res = response.data

    // 如果响应体不是一个对象 (例如，只是一个字符串或数字)，直接返回
    if (typeof res !== 'object' || res === null) {
      return res
    }

    // Case 1: 标准的成功响应，例如 { success: true, data: [...] }
    // 我们提取并返回 data 字段
    if (res.success === true && 'data' in res) {
      return res.data
    }

    // Case 2: 包含成功标志但数据在顶层的响应，例如 { success: true, printers: [...] }
    // 或者 { success: true, message: '操作成功' } 这种没有额外数据的响应
    // 我们直接返回整个响应对象
    if (res.success === true) {
      return res
    }

    // Case 3: 标准的失败响应 { success: false, message: '...' }
    if (res.success === false) {
      ElMessage.error(res.message || 'エラーが発生しました')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    // Case 4: 直接返回的数据对象，不包含 a `success` 标志 (例如 /api/master/options/destination-options)
    // 直接返回这个数据对象
    return res
  },
  (error) => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地token
      localStorage.removeItem('main')
      localStorage.removeItem('token_backup')
      // 显示错误消息
      ElMessage.error('ログインセッションが期限切れになりました。再度ログインしてください。')
      // 跳转到登录页面
      window.location.href = '/login'
    } else if (error.response && error.response.status === 403) {
      // 处理403权限错误
      const errorMsg = error.response.data?.message || ''
      if (errorMsg === 'トークンが無効です') {
        ElMessage.warning('ログインセッションが期限切れになりました。再度ログインしてください。')
        setTimeout(() => {
          localStorage.removeItem('main')
          localStorage.removeItem('token_backup')
          window.location.href = '/login'
        }, 2000)
        error.isTokenError = true
      } else {
        ElMessage.error(errorMsg || 'アクセス権がありません。')
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // 处理超时
      ElMessage.error('リクエストがタイムアウトしました。')
    } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
      // 处理网络错误
      ElMessage.error(
        'サーバーに接続できません。バックエンドサービスが起動していることを確認してください。',
      )
    } else {
      // 其他所有错误
      ElMessage.error(
        error.response?.data?.message || error.message || 'サーバーエラーが発生しました。',
      )
    }

    // 统一返回一个被拒绝的Promise
    return Promise.reject(error)
  },
)

// 正确封装方法
const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config)
  },
}

export { instance }
export default request
