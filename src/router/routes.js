export const toolPages = [
  { path: '/About', label: '首页', number: '01', component: () => import('../views/About.vue') },
  { path: '/ToolsCryption', label: '文本加解密', number: '02', component: () => import('../views/ToolsCryption.vue') },
  { path: '/GetRandomPWD', label: '随机密码', number: '03', component: () => import('../views/GetRandomPWD.vue') }
]

export const routes = [
  { path: '/', redirect: '/About' },
  ...toolPages.map(page => ({
    path: page.path,
    component: page.component,
    meta: { title: page.label }
  })),
  { path: '/:pathMatch(.*)*', redirect: '/About' }
]
