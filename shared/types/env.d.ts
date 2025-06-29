import type { Composer } from 'vue-i18n'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: Composer['t'] // 全局翻译函数 t 的类型
    $i18n: Composer // 全局 i18n 对象，包含其他辅助方法
  }
}

declare module '*.vue' {
  import { Component } from 'vue'
  const component: Component
  export default component
}
