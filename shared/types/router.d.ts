// 📄 src/types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: string[]
  }
}
