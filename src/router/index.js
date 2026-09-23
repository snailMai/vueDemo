import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach(to => {
  document.title = `${to.meta.title || '首页'} · 常用工具`
})

export default router
