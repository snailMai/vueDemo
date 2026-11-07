<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { checkAccess, onAccessRequired, signInAccess, signOutAccess } from '../api/access.js'

const emit = defineEmits(['authenticated', 'locked'])
// 与电脑手机同步同一品牌图标，由传输服务同源提供；运行时绑定避免构建期解析绝对路径。
const ACCESS_ICON = '/transfer/static/icon.svg'
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
  <div v-if="!allowed" class="access-screen">
    <section class="todoist-access" aria-label="todoist 登录">
      <div class="access-head">
        <img :src="ACCESS_ICON" width="40" height="40" alt="蜗牛传送">
        <div class="access-titles">
          <span class="access-eyebrow">SHARED ACCESS</span>
          <h1>todoist 任务</h1>
        </div>
      </div>
      <p v-if="checking" class="access-desc" role="status">正在检查登录状态……</p>
      <form v-else @submit.prevent="login">
        <p class="access-desc">输入密码，查看和管理你的待办任务。</p>
        <label for="todoist-password">访问密码</label>
        <input id="todoist-password" v-model="password" type="password" autocomplete="current-password" required maxlength="256" placeholder="输入你的访问密码" :disabled="busy" />
        <button class="access-submit" type="submit" :disabled="busy">{{ busy ? '正在登录…' : '进入 todoist ↗' }}</button>
      </form>
      <p v-if="error" class="access-error" role="alert">{{ error }}</p>
      <p class="access-foot">待办 · 优先级 · 期限，留在自己的清单里</p>
    </section>
  </div>
  <template v-else>
    <p v-if="error" class="access-error" role="alert">{{ error }}</p>
    <slot :logout="logout" :logging-out="busy" />
  </template>
</template>

<style scoped>
/* 与电脑手机同步登录卡同一套结构（图标＋眉标＋标题＋说明＋密码＋全宽主按钮＋脚注），
   且与传输全屏登录卡一致在可视区域垂直居中；字体规格与传输卡逐项对齐。 */
.access-screen { min-height: 100dvh; display: grid; padding: 28px; box-sizing: border-box; }
.todoist-access { width: min(440px, 100%); box-sizing: border-box; margin: auto; padding: 44px; background: #fff; border: 1px solid var(--border); border-radius: 14px; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: #24342e; }
.access-head { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.access-head img { width: 40px; height: 40px; display: block; flex-shrink: 0; }
.access-titles { display: flex; flex-direction: column; gap: 4px; }
.access-eyebrow { font-size: 10px; letter-spacing: 1.8px; color: #8a9790; font-weight: 600; }
.todoist-access h1 { margin: 0; font-size: 24px; font-weight: 650; letter-spacing: -1px; line-height: normal; }
.access-desc { margin: 0 0 16px; color: #7b8681; font-size: 13px; line-height: 1.8; }
.todoist-access label { display: block; font-size: 13px; font-weight: 400; margin: 26px 0 10px; }
.todoist-access input { box-sizing: border-box; width: 100%; min-height: 44px; padding: 13px 14px; border: 1px solid #e4e9e6; border-radius: 9px; font: inherit; }
.todoist-access input:focus { border-color: #24745b; }
.access-submit { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 17px; padding: 11px 19px; border: 1px solid transparent; border-radius: 9px; background: #24745b; color: #fff; font-size: 13px; font-weight: 550; box-shadow: 0 3px 8px #24745b15; }
.access-submit:hover { background: #1b614b; }
.access-submit:disabled { cursor: wait; opacity: .65; }
.access-error { color: #ad453f; overflow-wrap: anywhere; }
.access-foot { margin: 28px 0 0; padding-top: 22px; border-top: 1px solid #eef1ef; color: #9aa59f; font-size: 11px; text-align: left; }
@media (max-width: 700px) { .todoist-access { padding: 30px 25px; } }
</style>
