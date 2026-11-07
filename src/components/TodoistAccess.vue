<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { checkAccess, onAccessRequired, signInAccess, signOutAccess } from '../api/access.js'

const emit = defineEmits(['authenticated', 'locked'])
const allowed = ref(false)
const checking = ref(true)
const busy = ref(false)
const password = ref('')
const error = ref('')
let revision = 0
let disposed = false

function lock() {
  allowed.value = false
  password.value = ''
  emit('locked')
}
async function refresh() {
  const current = ++revision
  checking.value = true
  error.value = ''
  try {
    const authenticated = await checkAccess()
    if (disposed || current !== revision) return
    const wasAllowed = allowed.value
    allowed.value = authenticated
    if (!authenticated) lock()
    else if (!wasAllowed) emit('authenticated')
  } catch (cause) {
    if (disposed || current !== revision) return
    lock()
    error.value = cause.message
  } finally { if (!disposed && current === revision) checking.value = false }
}
async function login() {
  if (busy.value || !password.value) return
  const current = ++revision
  busy.value = true
  error.value = ''
  try {
    await signInAccess(password.value)
    if (disposed || current !== revision) return
    allowed.value = true
    emit('authenticated')
  } catch (cause) { if (!disposed && current === revision) error.value = cause.message }
  finally { password.value = ''; busy.value = false }
}
async function logout() {
  if (busy.value) return
  revision++
  busy.value = true
  error.value = ''
  try { await signOutAccess() }
  catch (cause) { if (!disposed) error.value = cause.message }
  finally { busy.value = false }
}
const unsubscribe = onAccessRequired(() => { if (!disposed) { lock(); refresh() } })
function visible() { if (!document.hidden && !busy.value) refresh() }
onMounted(() => { document.addEventListener('visibilitychange', visible); refresh() })
onBeforeUnmount(() => { disposed = true; revision++; unsubscribe(); document.removeEventListener('visibilitychange', visible) })
</script>

<template>
  <section v-if="!allowed" class="todoist-access" aria-label="todoist 登录">
    <h1>todoist</h1>
    <p v-if="checking" role="status">正在检查登录状态……</p>
    <form v-else @submit.prevent="login">
      <label for="todoist-password">访问密码</label>
      <p class="access-hint">与电脑手机同步使用同一密码，登录状态共用。</p>
      <input id="todoist-password" v-model="password" type="password" autocomplete="current-password" required maxlength="256" :disabled="busy" />
      <div class="access-actions">
        <button class="button" type="submit" :disabled="busy">{{ busy ? '正在登录…' : '登录' }}</button>
        <button class="button secondary" type="button" :disabled="busy" @click="refresh">重新检查</button>
      </div>
    </form>
    <p v-if="error" class="access-error" role="alert">{{ error }}</p>
  </section>
  <template v-else>
    <p v-if="error" class="access-error" role="alert">{{ error }}</p>
    <slot :logout="logout" :logging-out="busy" />
  </template>
</template>

<style scoped>
.todoist-access { width: min(440px, 100%); box-sizing: border-box; margin: 24px auto; padding: 24px; background: #fff; border: 1px solid var(--border); border-radius: 12px; }
.todoist-access h1 { margin: 0 0 20px; font-size: 24px; }
.todoist-access label { display: block; font-weight: 600; }
.access-hint { color: #697466; font-size: 14px; line-height: 1.6; }
.todoist-access input { box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--border); border-radius: 7px; font: inherit; }
.access-actions { display: flex; gap: 10px; margin-top: 18px; }
.access-error { color: #a33333; overflow-wrap: anywhere; }
</style>
