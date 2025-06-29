// 用于连接后端登录接口
import axios from 'axios'
import request from '@/utils/request'
import type { UserInfo } from '@/types/master'

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}
/** 登录响应结构 */
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}
/** 登录请求 - 注意登录请求不能使用request实例，因为登录时还没有token */
export const login = (data: LoginParams) => axios.post<LoginResponse>('/api/user/login', data)
