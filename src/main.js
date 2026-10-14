import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './styles.css'

// 统一注册路由与全局样式，页面只维护内存状态，不在入口持久化工具输入。
createApp(App).use(router).mount('#app')
