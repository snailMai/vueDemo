<script setup>
// 菜单直接复用路由清单，不单独维护页面地址或名称。
import { toolPages } from '../router/routes.js'
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="app-shell" :class="{ 'todoist-shell': route.path === '/Todoist' }">
    <!-- 跳过重复导航，主要内容可接收键盘焦点。 -->
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <aside class="sidebar">
      <RouterLink class="brand" to="/About" aria-label="常用工具首页">
        <span class="brand-symbol" aria-hidden="true">＋</span>
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
      <header class="topbar"><span>日常所需，随手可用</span><span class="topbar-mark">TOOLS / 03</span></header>
      <!-- 不使用 KeepAlive 缓存工具页，离开时执行页面的请求取消逻辑。 -->
      <main id="main-content" tabindex="-1"><RouterView /></main>
      <footer class="footer">常用工具<span>文本加解密 · 随机密码 · todoist</span></footer>
    </div>
  </div>
</template>
