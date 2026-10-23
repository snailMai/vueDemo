import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchTodoistTasks, TodoistRequestError } from '../src/api/todoist.js'

// 只读任务列表接口测试，全部使用合成数据。

function jsonResponse(body, init) {
  return Response.json(body, init)
}
const reference = { key: 'a'.repeat(64), version: 'b'.repeat(64), note: '无' }

test('只读接口使用同源 GET，无请求正文，返回结构化任务', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/todoist/tasks')
    assert.equal(options.method, 'GET')
    assert.equal(options.body, undefined)
    assert.equal(options.cache, 'no-store')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.redirect, 'error')
    return jsonResponse({ tasks: [
      { ...reference, id: 7, content: '合成任务甲', priority: 'P2', due: '无期限', overdue: false },
      { ...reference, key: 'c'.repeat(64), id: 18, content: '合成任务乙', priority: 'P3', due: '2026-10-01', overdue: true }
    ] })
  })
  const tasks = await fetchTodoistTasks()
  assert.equal(tasks.length, 2)
  assert.deepEqual(tasks[0], { ...reference, id: 7, content: '合成任务甲', priority: 'P2', due: '无期限', overdue: false })
  assert.equal(tasks[1].overdue, true)
})

test('空列表是正常结果', async t => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ tasks: [] }))
  assert.deepEqual(await fetchTodoistTasks(), [])
})

test('服务不可用使用固定提示，不回显错误正文', async t => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ code: 'TASKS_UNAVAILABLE', message: 'synthetic-private-value' }, { status: 503 }))
  await assert.rejects(fetchTodoistTasks(), error => {
    assert.ok(error instanceof TodoistRequestError)
    assert.match(error.message, /任务列表暂时不可用/)
    assert.equal(error.message.includes('synthetic-private-value'), false)
    return true
  })
})

test('登录页、异常响应和不合契约的任务项都不能渲染为列表', async t => {
  const responses = [
    () => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }),
    () => jsonResponse({ tasks: 'not-an-array' }),
    () => jsonResponse({ tasks: [{ id: '7', content: '合成', priority: 'P2', due: '无期限', overdue: false }] }),
    () => jsonResponse({ tasks: [{ id: 7, content: '合成', priority: 'P9', due: '无期限', overdue: false }] }),
    () => jsonResponse({ tasks: [{ id: 7, content: '', priority: 'P2', due: '无期限', overdue: false }] }),
    () => jsonResponse({ tasks: [{ id: 7, content: '合成', priority: 'P2', due: '无期限' }] }),
    () => jsonResponse({ unexpected: true })
  ]
  for (const response of responses) {
    t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(fetchTodoistTasks(), TodoistRequestError)
    t.mock.restoreAll()
  }
})

test('外部中止传透 AbortError，不按失败提示处理', async t => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }))
  const controller = new AbortController()
  const pending = fetchTodoistTasks(controller.signal)
  controller.abort()
  await assert.rejects(pending, error => error.name === 'AbortError')
})
