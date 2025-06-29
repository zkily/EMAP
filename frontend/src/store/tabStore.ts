
import { defineStore } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface TabItem {
  title: string
  path: string
}

export const useTabStore = defineStore('tabStore', {
  state: () => ({
    tabs: [{ title: 'Home', path: '/dashboard' }] as TabItem[],
    activeTab: '',
  }),
  actions: {
    addTab(routeOrRaw: RouteLocationNormalizedLoaded | { title: string; path: string }) {
      const path = routeOrRaw.path
      const title = (routeOrRaw as any).meta?.title || (routeOrRaw as any).title || '未命名'
      if (!this.tabs.find((t) => t.path === path)) {
        this.tabs.push({ title, path })
      }
      this.activeTab = path
    },
    removeTab(path: string) {
      if (path === '/dashboard') return
      this.tabs = this.tabs.filter((tab) => tab.path !== path)
      const index = this.tabs.findIndex((t) => t.path === path)
      if (index !== -1 && this.activeTab === path) {
        const nextTab = this.tabs[index - 1] || this.tabs[0]
        this.activeTab = nextTab?.path || ''
        if (nextTab) {
          window.location.href = nextTab.path
        }
      }
    },
    setActive(path: string) {
      this.activeTab = path
    },
    resetTabs() {
      this.tabs = []
      this.activeTab = ''
    },
  },
  persist: {
    storage: localStorage,
    paths: ['tabs', 'activeTab'],
  } as any, // ✅ 加这句绕过类型检查
})
