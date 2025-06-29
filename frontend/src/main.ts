// 导入依赖模块
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import i18n from './locales'
import 'element-plus/dist/index.css'
import './assets/style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueECharts from 'vue-echarts'
import 'echarts'
import ja from 'element-plus/es/locale/lang/ja'
import ElementPlus from 'element-plus'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { vPermission, vPermissionEnabled } from './utils/permission'

const app = createApp(App)

// 创建 Pinia 状态管理实例
const pinia = createPinia()
pinia.use(piniaPersist)

// 全局注册 Element Plus 图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册所有社区模块（必须的！否则出错！）
ModuleRegistry.registerModules([AllCommunityModule])
ModuleRegistry.registerModules([ClientSideRowModelModule])

// 注册插件
app.use(pinia)
app.use(router)
app.use(i18n)
app.component('v-chart', VueECharts)
app.use(ElementPlus, {
  locale: ja,
})
app.directive('permission', vPermission)
app.directive('permission-enabled', vPermissionEnabled)
app.mount('#app')
