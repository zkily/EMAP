import axios from 'axios'
import type { Department, DepartmentPayload } from '@/types/master'

// 获取所有有效部门
export const fetchAllDepartments = () => {
  return axios.get<{ success: boolean; data: Department[] }>('/api/master/departments')
}

// 获取分页部门列表
export const fetchDepartmentList = (page = 1, pageSize = 10) => {
  return axios.get<{ success: boolean; data: Department[]; total: number }>(
    '/api/master/departments/list',
    {
      params: { page, pageSize },
    },
  )
}

// 添加新部门
export const createDepartment = (dept: DepartmentPayload) => {
  return axios.post('/api/master/departments', dept)
}

// 更新部门信息
export const updateDepartment = (id: number, dept: DepartmentPayload) => {
  return axios.put(`/api/master/departments/${id}`, dept)
}

// 删除部门
export const deleteDepartment = (id: number) => {
  return axios.delete(`/api/master/departments/${id}`)
}
