import { defineStore } from 'pinia'

export interface UserInfo {
  id: number
  name: string
  username: string
  role: 'admin' | 'manager' | 'user' | 'guest'
}

export const useMainStore = defineStore('main', {
  state: () => ({
    userInfo: null as UserInfo | null,
    token: '',
    showGuide: true,
    menuList: [] as any[],
  }),
  actions: {
    async setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      this.generateMenu(userInfo.role)
    },
    clearUser() {
      this.userInfo = null
      this.token = ''
      this.menuList = []
      localStorage.removeItem('main')
    },
    setToken(token: string) {
      this.token = token
      console.log('Token已保存到Pinia:', token)
    },
    hideGuide() {
      this.showGuide = false
    },
    hasPermission(permission: string | string[]): boolean {
      if (!this.userInfo) return false

      if (this.userInfo.role === 'admin') return true

      const permissionsToCheck = Array.isArray(permission) ? permission : [permission]

      const rolePermissionMap: Record<string, string[]> = {
        manager: ['view', 'edit', 'dashboard'],
        user: ['view'],
        guest: [],
      }

      const userPermissions = rolePermissionMap[this.userInfo.role] || []

      return Array.isArray(permission)
        ? permissionsToCheck.every((p) => userPermissions.includes(p))
        : userPermissions.includes(permission)
    },
    generateMenu(role: string) {
      const groupedMenus: Record<string, any[]> = {
        admin: [
          {
            title: 'システム管理',
            path: '/system',
            icon: 'Setting',
            roles: ['admin'],
            children: [
              {
                title: 'システム管理ホーム',
                path: '/system',
                icon: 'Setting',
                roles: ['admin'],
              },
              {
                title: '権限管理',
                path: '/system/permission',
                icon: 'Lock',
                roles: ['admin'],
              },
            ],
          },
          {
            title: '受注管理',
            path: '/order',
            icon: 'List',
            roles: ['admin', 'buyer', 'manager'],
            children: [
              { title: '受注入力', path: '/order/create', roles: ['admin', 'buyer'] },
              { title: '受注検索', path: '/order/list', roles: ['admin', 'buyer', 'manager'] },
              { title: '出荷編集', path: '/order/shipment-edit', roles: ['admin', 'buyer'] },
            ],
          },
        ],
        manager: [
          {
            title: '進捗管理',
            path: '/progress',
            icon: 'Calendar',
            children: [{ title: '進捗ダッシュボード', path: '/dashboard', icon: 'DataBoard' }],
          },
        ],
      }
      this.menuList = groupedMenus[role] || []
    },
  },
  persist: true,
})
