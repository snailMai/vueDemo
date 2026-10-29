<script setup>
// 同源嵌入既有传输应用，复用上传、登录和历史，不在 Vue 中复制业务。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const ready = ref(false)
const loading = ref(false)
const error = ref('')
let controller = null
let disposed = false

async function connect() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  ready.value = false
  const timer = setTimeout(() => current.abort(), 5000)
  try {
    const response = await fetch('/transfer/health', { signal: current.signal, cache: 'no-store', redirect: 'error' })
    const data = response.ok ? await response.json() : null
    if (!response.ok || data?.status !== 'ok') throw new Error('unavailable')
    if (!disposed && controller === current) ready.value = true
  } catch {
    if (!disposed && controller === current) error.value = '电脑手机同步服务暂时不可用，请稍后重试。'
  } finally {
    clearTimeout(timer)
    if (!disposed && controller === current) loading.value = false
  }
}

onMounted(() => {
  // 本机生产 HTTP 入口不承载 Secure 登录 Cookie，转到已配置的同一工具站 HTTPS。
  if (['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '8789') {
    location.replace('https://tools.20242233.xyz/Transfer')
    return
  }
  return connect()
})
onBeforeUnmount(() => { disposed = true; controller?.abort() })
</script>

<template>
  <section class="transfer-page" aria-label="电脑手机同步">
    <template v-if="!ready">
      <h1>电脑手机同步</h1>
      <p v-if="loading" role="status">正在连接传输服务……</p>
      <template v-else>
        <p class="error-message" role="alert">{{ error }}</p>
        <button class="button" type="button" @click="connect">重新连接</button>
      </template>
    </template>
    <iframe v-else src="/transfer/?embedded=1" title="电脑手机同步传输空间" allow="clipboard-write" />
  </section>
</template>

<style scoped>
.transfer-page { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.transfer-page > h1, .transfer-page > p, .transfer-page > button { margin: 16px 20px; align-self: flex-start; }
.transfer-page > h1 { font-size: 22px; }
.transfer-page iframe { flex: 1; width: 100%; min-height: 0; border: 0; background: #f6f7f9; }
</style>
