import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes.js'

// 使用无哈希的 history 地址，生产源站需为公开页面提供 index.html 回退。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 浏览器标题只取路由元数据，不能包含密钥、输入或工具结果。
router.afterEach(to => {
  document.title = `${to.meta.title || '首页'} · 常用工具`
})

export default router
