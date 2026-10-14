// 使用模拟 fetch 验证接口契约，不连接线上服务；测试输入均为合成数据。
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestText, ToolRequestError } from '../src/api/client.js'
import { decryptText, encryptText, generatePasswords } from '../src/api/tools.js'

test('成功响应保留长数字、JSON 形式、空文本、空格和换行', async t => {
  const values = ['12345678901234567890', '"hello"', 'null', 'false', '{"a":1}', 'error', '', '  中文 😀\n下一行\n']
  for (const value of values) {
    t.mock.method(globalThis, 'fetch', async () => new Response(value))
    assert.equal(await requestText('tools/decryption'), value)
    t.mock.restoreAll()
  }
})

test('加解密保持同源地址、JSON 原字段与未 trim 的输入', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    return new Response('plain')
  })
  const input = { key: ' 密钥 ', pwd: '  hello\n' }
  await encryptText(input)
  await decryptText(input)
  assert.deepEqual(calls.map(call => call.url), ['/api/tools/encryption', '/api/tools/decryption'])
  for (const { options } of calls) {
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), input)
    assert.equal(options.cache, 'no-store')
    assert.equal(options.credentials, 'same-origin')
  }
})

test('密码接口保留参数名、GET 和末尾 LF', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/tools/get/randompwd?num=128&quantity=100')
    assert.equal(options.method, undefined)
    return new Response('abc\ndef\n')
  })
  assert.equal(await generatePasswords({ num: 128, quantity: 100 }), 'abc\ndef\n')
})

test('错误只使用约定 code 的固定提示，不回显服务端正文', async t => {
  // 除未知 code 外，还覆盖对象原型属性名，防止白名单判断遗漏继承属性。
  const cases = [
    ['INVALID_REQUEST', '请求参数无效，请检查后重试。'],
    ['DECRYPTION_FAILED', '解密失败，请检查密钥和密文。'],
    ['INTERNAL_ERROR', '服务暂时不可用，请稍后重试。'],
    ['UNKNOWN', '服务暂时不可用，请稍后重试。'],
    ['constructor', '服务暂时不可用，请稍后重试。'],
    ['__proto__', '服务暂时不可用，请稍后重试。']
  ]
  for (const [code, expected] of cases) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ code, message: 'synthetic-sensitive-input' }, { status: 400 }))
    await assert.rejects(requestText('tools/decryption'), error => {
      assert.ok(error instanceof ToolRequestError)
      assert.equal(error.message, expected)
      return true
    })
    t.mock.restoreAll()
  }
})

test('代理 HTML 错误页映射为安全提示', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>upstream failure</html>', { status: 502 }))
  await assert.rejects(requestText('tools/encryption'), { message: '服务暂时不可用，请稍后重试。' })
})

test('后端和代理的 413 都显示超限提示，不回显响应内容', async t => {
  for (const body of ['{"code":"INPUT_TOO_LARGE","message":"private input"}', '<html>private input</html>']) {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, { status: 413 }))
    await assert.rejects(requestText('tools/encryption'), { message: '输入过大，请缩短密钥或文本后重试。' })
    t.mock.restoreAll()
  }
})

test('断网映射为可重试的提示', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(requestText('tools/encryption'), { message: '无法连接服务，请检查网络后重试。' })
})

test('超时中止请求并给出明确提示', async t => {
  // 推进虚拟时钟触发超时，不让测试真实等待 15 秒。
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let requestSignal
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => {
    requestSignal = signal
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    })
  })
  const operation = requestText('tools/encryption')
  const rejected = assert.rejects(operation, { message: '请求超时，请稍后重试。' })
  t.mock.timers.tick(15000)
  await rejected
  assert.equal(requestSignal.aborted, true)
})

test('页面取消信号传递到底层 fetch', async t => {
  const controller = new AbortController()
  let requestSignal
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => {
    requestSignal = signal
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    })
  })
  const operation = requestText('tools/encryption', { signal: controller.signal })
  const rejected = assert.rejects(operation, { name: 'AbortError' })
  controller.abort()
  await rejected
  assert.equal(requestSignal.aborted, true)
})
