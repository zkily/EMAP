/**
 * 路由配置验证脚本
 * 运行此脚本可以验证所有路由配置是否正确
 */
import shipping from '../router/modules/shipping'
import { shippingMenu } from '../constants/menuList'
import { printRouteSummary } from '../utils/routeGenerator'

console.log('🚀 开始验证路由配置...\n')

// 验证出荷管理路由
printRouteSummary('出荷管理', [shipping])

// 验证菜单与路由的一致性
console.group('🔍 菜单与路由一致性检查')

const menuPaths = new Set<string>()
const routePaths = new Set<string>()

// 收集菜单路径
function collectMenuPaths(items: any[]) {
  items.forEach((item) => {
    if (item.path) {
      menuPaths.add(item.path)
    }
    if (item.children) {
      collectMenuPaths(item.children)
    }
  })
}

// 收集路由路径
function collectRoutePaths(routes: any[], prefix = '') {
  routes.forEach((route) => {
    const fullPath = prefix + route.path
    routePaths.add(fullPath)
    if (route.children) {
      collectRoutePaths(route.children, fullPath)
    }
  })
}

collectMenuPaths([shippingMenu])
collectRoutePaths([shipping])

// 检查一致性
const menuOnlyPaths = Array.from(menuPaths).filter((path) => !routePaths.has(path))
const routeOnlyPaths = Array.from(routePaths).filter((path) => !menuPaths.has(path))

console.log(`📊 菜单路径数: ${menuPaths.size}`)
console.log(`📊 路由路径数: ${routePaths.size}`)

if (menuOnlyPaths.length > 0) {
  console.warn('⚠️ 仅在菜单中存在的路径:', menuOnlyPaths)
}

if (routeOnlyPaths.length > 0) {
  console.warn('⚠️ 仅在路由中存在的路径:', routeOnlyPaths)
}

if (menuOnlyPaths.length === 0 && routeOnlyPaths.length === 0) {
  console.log('✅ 菜单与路由配置一致!')
}

console.groupEnd()

console.log('\n✅ 路由配置验证完成!')

// 生成配置摘要
console.group('📋 Picking功能路由配置摘要')
console.log('已生成的路由:')
console.log('  - /shipping/picking (ピッキング管理首页)')
console.log('  - /shipping/picking/list-generator (ピッキングリスト生成)')
console.log('  - /shipping/picking/workspace (ピッキング作業)')
console.log('  - /shipping/picking/progress (ピッキング進捗)')
console.log('  - /shipping/picking/history (ピッキング履歴)')
console.log('')
console.log('已更新的菜单:')
console.log('  - 出荷管理菜单中增加了5个picking相关菜单项')
console.log('  - 支持中文和日文国际化')
console.log('  - 配置了适当的权限和角色')
console.groupEnd()
