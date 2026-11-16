<script setup>
// 菜单直接复用路由清单，不单独维护页面地址或名称。
import { toolPages } from '../router/routes.js'
import { RouterLink, useRoute } from 'vue-router'
import wrenchIcon from '../assets/wrench.png'
const route = useRoute()

// 首页与两个工具页占满一屏；todoist 与传输页沿用各自外壳。
const fitShellPaths = ['/About', '/ToolsCryption', '/GetRandomPWD']
</script>

<template>
  <div class="app-shell" :class="{ 'todoist-shell': route.path === '/Todoist', 'transfer-shell': route.path === '/Transfer', 'fit-shell': fitShellPaths.includes(route.path) }">
    <!-- 跳过重复导航，主要内容可接收键盘焦点。 -->
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <aside class="sidebar">
      <RouterLink class="brand" to="/About" aria-label="常用工具首页">
        <span class="brand-symbol" aria-hidden="true"><img :src="wrenchIcon" alt=""></span>
        <span>常用工具<span class="brand-caption">PERSONAL TOOLKIT</span></span>
      </RouterLink>
      <p class="nav-heading">工具导航</p>
      <nav aria-label="主导航">
        <RouterLink v-for="page in toolPages" :key="page.path" :to="page.path" class="nav-link">
          <span class="nav-number" aria-hidden="true">{{ page.number }}</span>
          {{ page.label }}
        </RouterLink>
      </nav>
      <p class="sidebar-note">把重复的小事，<br>变得简单一点。</p>
    </aside>
    <div class="workspace">
      <header class="topbar"><span>日常所需，随手可用</span><span class="topbar-mark">TOOLS / {{ toolPages.length - 1 }}</span></header>
      <!-- 不使用 KeepAlive 缓存工具页，离开时执行页面的请求取消逻辑。 -->
      <main id="main-content" tabindex="-1"><RouterView /></main>
      <footer class="footer">常用工具<span>文本加解密 · 随机密码 · Todoist · 电脑手机同步</span></footer>
    </div>
  </div>
</template>

<style>
/* 传输页保留站内导航，内容在框架中滚动，不影响其他工具页。 */
.app-shell.transfer-shell { height: 100dvh; min-height: 0; }
.transfer-shell > .workspace, .transfer-shell main { min-height: 0; }
.transfer-shell > .sidebar { min-height: 0; overflow: auto; }
.transfer-shell .topbar, .transfer-shell .footer { display: none; }
/* 首页、加解密、随机密码页占满一屏：外壳固定高度、内容列自适应伸缩，仅作用于这三页。 */
@media (min-width: 701px) {
  .app-shell.fit-shell { height: 100dvh; min-height: 0; }
  .fit-shell > .workspace, .fit-shell main { min-height: 0; }
  .fit-shell > .sidebar { min-height: 0; overflow: auto; }
  .fit-shell main { display: flex; flex-direction: column; overflow: auto; }
  /* flex 居中布局下 margin:auto 会让页面收缩到内容宽度，显式拉满再受 max-width 约束。 */
  .fit-shell main > .page { width: 100%; }
}
@media (max-width: 700px) {
  .app-shell.transfer-shell { display: flex; flex-direction: column; }
  .transfer-shell > .sidebar { flex: none; padding: 8px 12px; }
  .transfer-shell .brand, .transfer-shell .nav-heading, .transfer-shell .sidebar-note { display: none; }
  .transfer-shell .sidebar nav { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; }
  .transfer-shell .nav-link { padding: 8px; font-size: 12px; }
  .transfer-shell > .workspace { flex: 1; }
  /* 一屏页面手机端同样占满：收起页脚，压缩导航，内容区随剩余高度伸缩，超高才滚动。 */
  .app-shell.fit-shell { display: flex; flex-direction: column; height: 100dvh; min-height: 0; }
  .fit-shell > .sidebar { flex: none; padding: 12px 16px 10px; }
  .fit-shell .brand { font-size: 15px; }
  .fit-shell .brand-symbol { width: 28px; height: 28px; font-size: 21px; border-radius: 8px; }
  .fit-shell .sidebar nav { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
  .fit-shell .nav-link { padding: 7px 9px; font-size: 12px; }
  .fit-shell > .workspace { flex: 1; min-height: 0; }
  .fit-shell main { min-height: 0; display: flex; flex-direction: column; overflow: auto; }
  .fit-shell main > .page { width: 100%; }
  .fit-shell .footer { display: none; }
}
</style>
