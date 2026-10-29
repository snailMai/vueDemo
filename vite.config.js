import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 开发和生产预览复用同源 /api 前缀，转发时去掉前缀以匹配后端路径。
const proxy = {
  '/transfer/': { target: 'http://127.0.0.1:8765' },
  '/api/todoist/': {
    target: 'http://127.0.0.1:8091',
    rewrite: path => path.replace(/^\/api/, '')
  },
  '/api/': {
    target: 'http://127.0.0.1:8081',
    rewrite: path => path.replace(/^\/api/, '')
  }
}

// 预览服务器不是生产服务；仅监听回环地址，端口冲突时失败而非自动换端口。
export default defineConfig({
  plugins: [vue()],
  // 不覆盖历史 dist，且不发布 source map。
  build: { outDir: 'dist-refactor', assetsDir: 'static', sourcemap: false },
  server: { host: '127.0.0.1', port: 8080, strictPort: true, proxy },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy }
})
