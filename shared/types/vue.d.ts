// src/types/vue.d.ts
import { RouteLocationNormalizedLoaded, Router } from 'vue-router'

declare module 'vue' {
  interface ComponentCustomProperties {
    $route: RouteLocationNormalizedLoaded
    $router: Router
  }
}
