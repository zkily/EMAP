import axios from 'axios'
import request from '@/utils/request'
import type {
  User,
  Department,
  ApiResponse,
} from '@/types/master'

// 获取部门列表
export const fetchDepartments = () =>
  axios.get<ApiResponse<Department[]>>('/api/master/departments')

// 获取用户列表
export const fetchUsers = () => axios.get<ApiResponse<User[]>>('/api/master/users')

// 新增用户
export const createUser = (user: User) => axios.post<ApiResponse<null>>('/api/master/users', user)

// 更新用户
export const updateUser = (id: number, user: User) =>
  axios.put<ApiResponse<null>>(`/api/master/users/${id}`, user)

// 删除用户
export const deleteUser = (id: number) => axios.delete<ApiResponse<null>>(`/api/master/users/${id}`)
