// 与电脑手机同步共用服务端会话；密码和 CSRF 不进入持久存储。
let csrf = ''
let revision = 0
const listeners = new Set()

export function accessCsrf() { return csrf }
export function onAccessRequired(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}
export function requireAccess() {
  revision++
  csrf = ''
  for (const callback of listeners) callback()
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('/transfer/api/' + path, {
      ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal
    })
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
    if (!response.ok) throw new Error(data?.error || '登录服务暂时不可用，请稍后重试。')
    if (!data) throw new Error('登录服务响应异常，请稍后重试。')
    return data
  } catch (error) {
    if (error?.name === 'AbortError' || error instanceof TypeError) throw new Error('登录服务连接中断或超时，请重试。')
    throw error
  } finally { clearTimeout(timer) }
}

function saveCsrf(data, current) {
  if (typeof data.csrf !== 'string' || !/^[a-f0-9]{64}$/.test(data.csrf)) throw new Error('登录服务响应异常，请刷新后重试。')
  if (revision === current) csrf = data.csrf
}
export async function checkAccess() {
  const current = ++revision
  const data = await request('session')
  if (typeof data.authenticated !== 'boolean') throw new Error('登录服务响应异常，请稍后重试。')
  saveCsrf(data, current)
  return data.authenticated
}
export async function signInAccess(password) {
  const current = ++revision
  const data = await request('login', { method: 'POST', body: JSON.stringify({ password }) })
  if (data.ok !== true) throw new Error('登录未成功，请重试。')
  saveCsrf(data, current)
}
export async function signOutAccess() {
  const data = await request('logout', { method: 'POST', body: '{}' })
  if (data.ok !== true) throw new Error('退出登录未确认，请重试。')
  requireAccess()
}
