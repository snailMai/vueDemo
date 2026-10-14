// 导航和路由共用一个页面清单，组件按需加载，避免两处菜单定义漂移。
export const toolPages = [
  { path: '/About', label: '首页', number: '01', component: () => import('../views/About.vue') },
  { path: '/ToolsCryption', label: '文本加解密', number: '02', component: () => import('../views/ToolsCryption.vue') },
  { path: '/GetRandomPWD', label: '随机密码', number: '03', component: () => import('../views/GetRandomPWD.vue') },
  { path: '/Todoist', label: 'todoist', number: '04', component: () => import('../views/Todoist.vue') }
]

export const routes = [
  { path: '/', redirect: '/About' },
  ...toolPages.map(page => ({
    path: page.path,
    component: page.component,
    meta: { title: page.label }
  })),
  // 应用内未知路径（包括退役页面）回首页；源站的公开路径白名单另行约束。
  { path: '/:pathMatch(.*)*', redirect: '/About' }
]
