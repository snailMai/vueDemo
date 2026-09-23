import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const proxy = {
  '/api/': {
    target: 'http://127.0.0.1:8081',
    rewrite: path => path.replace(/^\/api/, '')
  }
}

export default defineConfig({
  plugins: [vue()],
  build: { outDir: 'dist-refactor', assetsDir: 'static', sourcemap: false },
  server: { host: '127.0.0.1', port: 8080, strictPort: true, proxy },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy }
})
