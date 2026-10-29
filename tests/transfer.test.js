import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { ref } from 'vue'
import { toolPages, routes } from '../src/router/routes.js'

function page(fetch, location = { hostname: 'test.local', port: '' }) {
  let start, cleanup
  const source = readFileSync(new URL('../src/views/Transfer.vue', import.meta.url), 'utf8')
    .split('<script setup>')[1].split('</script>')[0].replace(/^import .+$/gm, '')
  const context = vm.createContext({ ref, fetch, location, AbortController, setTimeout, clearTimeout,
    onMounted: callback => { start = callback }, onBeforeUnmount: callback => { cleanup = callback } })
  vm.runInContext(source + '\nglobalThis.page = { ready, loading, error, connect };', context)
  return { ...context.page, start: () => start(), cleanup: () => cleanup() }
}

test('电脑手机同步位于 todoist 下方，已有页面和未知地址回退保持不变', () => {
  const index = toolPages.findIndex(item => item.path === '/Todoist')
  assert.equal(toolPages[index + 1].path, '/Transfer')
  assert.equal(toolPages[index + 1].label, '电脑手机同步')
  assert.equal(routes.at(-1).redirect, '/About')
  assert.deepEqual(toolPages.slice(0, index + 1).map(item => item.path), ['/About', '/ToolsCryption', '/GetRandomPWD', '/Todoist'])
})

test('实际服务健康响应后才显示传输界面，不读取 todoist 接口', async t => {
  const calls = []
  const subject = page(async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ status: 'ok' }) }
  })
  t.after(subject.cleanup)
  await subject.start()
  assert.equal(subject.ready.value, true)
  assert.equal(subject.loading.value, false)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/transfer/health')
  assert.equal(calls[0].options.cache, 'no-store')
})

test('服务未运行或代理返回首页时提示错误，重试可连接', async t => {
  let mode = 'offline'
  const subject = page(async () => {
    if (mode === 'offline') throw new Error('offline')
    return { ok: true, json: async () => mode === 'ready' ? { status: 'ok' } : {} }
  })
  t.after(subject.cleanup)
  await subject.start()
  assert.equal(subject.ready.value, false)
  assert.match(subject.error.value, /暂时不可用/)
  mode = 'html'
  await subject.connect()
  assert.equal(subject.ready.value, false)
  mode = 'ready'
  await subject.connect()
  assert.equal(subject.ready.value, true)
  assert.equal(subject.error.value, '')
})

test('离开页面取消健康检查，不再应用延迟返回的结果', async () => {
  let resolve, signal
  const subject = page(async (_url, options) => {
    signal = options.signal
    return new Promise(done => { resolve = done })
  })
  const pending = subject.start()
  subject.cleanup()
  assert.equal(signal.aborted, true)
  resolve({ ok: true, json: async () => ({ status: 'ok' }) })
  await pending
  assert.equal(subject.ready.value, false)
})

test('本机生产 HTTP 页面转向正式 HTTPS，不放宽传输来源或尝试 HTTP 登录', async t => {
  for (const hostname of ['127.0.0.1', 'localhost']) {
    let target = ''
    const subject = page(() => assert.fail('local production must use HTTPS'), {
      hostname, port: '8789', replace: url => { target = url }
    })
    t.after(subject.cleanup)
    await subject.start()
    assert.equal(target, 'https://tools.20242233.xyz/Transfer')
  }
})
