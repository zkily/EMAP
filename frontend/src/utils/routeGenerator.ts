/**
 * 路由自动生成器
 * 用于验证和生成路由配置
 */
import { RouteRecordRaw } from 'vue-router'
import { MenuItem } from '@/constants/menuList'

export interface RouteConfig {
  path: string
  name: string
  component: string
  meta: {
    title: string
    group?: string
    icon?: string
    permission?: string
    roles?: string[]
  }
}

/**
 * 从菜单项生成路由配置
 */
export function generateRoutesFromMenu(menuItem: MenuItem): RouteConfig[] {
  const routes: RouteConfig[] = []

  // 处理父级菜单
  if (menuItem.path && !menuItem.children?.length) {
    routes.push({
      path: menuItem.path,
      name: menuItem.title.replace(/\s/g, ''),
      component: `@/views${menuItem.path}.vue`,
      meta: {
        title: menuItem.title,
        icon: menuItem.icon?.name || 'Menu',
        roles: menuItem.roles,
      },
    })
  }

  // 处理子菜单
  if (menuItem.children?.length) {
    menuItem.children.forEach((child) => {
      if (child.path) {
        routes.push({
          path: child.path,
          name: child.title.replace(/\s/g, ''),
          component: `@/views${child.path}.vue`,
          meta: {
            title: child.title,
            icon: child.icon?.name || 'Menu',
            roles: child.roles,
          },
        })
      }
    })
  }

  return routes
}

/**
 * 验证路由配置
 */
export function validateRoutes(routes: RouteRecordRaw[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  routes.forEach((route) => {
    // 检查必要字段
    if (!route.path) {
      errors.push(`路由缺少path: ${String(route.name)}`)
    }
    if (!route.name) {
      errors.push(`路由缺少name: ${route.path}`)
    }
    if (!route.component && !route.children) {
      errors.push(`路由缺少component: ${String(route.name)}`)
    }

    // 检查meta信息
    if (!route.meta?.title) {
      errors.push(`路由缺少meta.title: ${String(route.name)}`)
    }

    // 递归检查子路由
    if (route.children) {
      const childValidation = validateRoutes(route.children)
      errors.push(...childValidation.errors)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 生成路由摘要
 */
export function generateRouteSummary(routes: RouteRecordRaw[]): {
  totalRoutes: number
  routesByGroup: Record<string, number>
  routeList: string[]
} {
  let totalRoutes = 0
  const routesByGroup: Record<string, number> = {}
  const routeList: string[] = []

  function processRoutes(routes: RouteRecordRaw[], prefix = '') {
    routes.forEach((route) => {
      totalRoutes++
      const fullPath = prefix + route.path
      routeList.push(`${String(route.name)} -> ${fullPath}`)

      const group = String(route.meta?.group || 'Default')
      routesByGroup[group] = (routesByGroup[group] || 0) + 1

      if (route.children) {
        processRoutes(route.children, fullPath)
      }
    })
  }

  processRoutes(routes)

  return {
    totalRoutes,
    routesByGroup,
    routeList,
  }
}

/**
 * 打印路由配置摘要
 */
export function printRouteSummary(moduleName: string, routes: RouteRecordRaw[]) {
  const summary = generateRouteSummary(routes)
  const validation = validateRoutes(routes)

  console.group(`📋 ${moduleName} 路由配置摘要`)
  console.log(`✅ 总路由数: ${summary.totalRoutes}`)
  console.log(`📊 按组分类:`, summary.routesByGroup)
  console.log(`🔍 验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`)

  if (!validation.valid) {
    console.warn('⚠️ 验证错误:', validation.errors)
  }

  console.log('📝 路由列表:')
  summary.routeList.forEach((route) => console.log(`  - ${route}`))
  console.groupEnd()
}
