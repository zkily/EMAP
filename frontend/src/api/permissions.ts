import request from '../utils/request'

// ========== 基础权限管理 ==========

// 获取所有权限
export function getAllPermissions() {
  return request.get('/api/permissions')
}

// 获取角色权限
export function getRolePermissions(role: string) {
  return request.get(`/api/roles/${role}/permissions`)
}

// 更新角色权限
export function updateRolePermissions(role: string, permissionIds: number[]) {
  return request.post(`/api/roles/${role}/permissions`, { permissionIds })
}

// ========== 页面权限管理 ==========

// 获取所有页面权限配置
export function getPagePermissions() {
  return request.get('/api/page-permissions')
}

// 获取按模块分组的页面权限
export function getGroupedPagePermissions() {
  return request.get('/api/page-permissions/grouped')
}

// 更新单个页面权限配置
export function updatePagePermission(
  id: number,
  data: { required_permission?: string; description?: string },
) {
  return request.put(`/api/page-permissions/${id}`, data)
}

// 批量更新页面权限配置
export function batchUpdatePagePermissions(
  pagePermissions: Array<{ id: number; required_permission?: string; description?: string }>,
) {
  return request.post('/api/page-permissions/batch-update', { pagePermissions })
}

// ========== 用户特殊权限管理 ==========

// 获取所有用户列表
export function getUsers() {
  return request.get('/api/users')
}

// 获取用户的特殊权限
export function getUserPermissions(userId: number) {
  return request.get(`/api/users/${userId}/permissions`)
}

// 为用户添加特殊权限
export function addUserPermissions(
  userId: number,
  data: {
    permissionIds: number[]
    reason?: string
    expiresAt?: string
  },
) {
  return request.post(`/api/users/${userId}/permissions`, data)
}

// 撤销用户特殊权限
export function revokeUserPermission(userId: number, permissionId: number) {
  return request.delete(`/api/users/${userId}/permissions/${permissionId}`)
}

// ========== 权限模板管理 ==========

// 获取所有权限模板
export function getPermissionTemplates() {
  return request.get('/api/templates')
}

// 创建权限模板
export function createPermissionTemplate(data: {
  template_name: string
  template_description?: string
  permission_codes: string[]
}) {
  return request.post('/api/templates', data)
}

// 更新权限模板
export function updatePermissionTemplate(
  id: number,
  data: {
    template_name: string
    template_description?: string
    permission_codes: string[]
  },
) {
  return request.put(`/api/templates/${id}`, data)
}

// 删除权限模板
export function deletePermissionTemplate(id: number) {
  return request.delete(`/api/templates/${id}`)
}

// 应用权限模板到角色
export function applyTemplateToRole(templateId: number, role: string) {
  return request.post(`/api/templates/${templateId}/apply-to-role/${role}`)
}

// ========== 权限统计和分析 ==========

// 获取权限使用统计
export function getPermissionStatistics() {
  return request.get('/api/statistics')
}

// ========== 类型定义 ==========

export interface Permission {
  id: number
  code: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface PagePermission {
  id: number
  page_code: string
  page_name: string
  page_path: string
  module_name: string
  required_permission?: string
  permission_name?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  name?: string
  is_active: boolean
}

export interface UserPermission {
  id: number
  code: string
  name: string
  description: string
  granted_by: number
  granted_by_username: string
  granted_reason?: string
  expires_at?: string
  granted_at: string
}

export interface PermissionTemplate {
  id: number
  template_name: string
  template_description?: string
  template_data: string
  created_by: number
  created_by_username: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PermissionStatistics {
  roleStats: Array<{
    role_id: string
    permission_count: number
  }>
  userStats: {
    total_user_permissions: number
    users_with_special_permissions: number
  }
  permissionStats: Array<{
    code: string
    name: string
    role_usage_count: number
    user_usage_count: number
  }>
}
