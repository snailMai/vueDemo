import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateTaskOperation, submitTodoist, TodoistRequestError, describeTaskOperation } from '../src/api/todoist.js'
import { useTodoistQueue } from '../src/composables/useTodoistQueue.js'

const target = { key: 'a'.repeat(64), version: 'b'.repeat(64) }
const add = { operation: 'add', fields: { name: '测试任务 1234' } }
const duplicates = [{ name: '测试 1234', priority: 'P2', source: 'todo' }]
const token = 'c'.repeat(64)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

test('新增只发送名称，不在前端要求或编造目标和完成标准', async t => {
  assert.equal(validateTaskOperation(add), add)
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/todoist/commands')
    assert.deepEqual(JSON.parse(options.body), { ...add, requestId: 'test-id' })
    return Response.json({ requestId: 'test-id', status: 'completed', output: '已添加并验证。' })
  })
  assert.equal(await submitTodoist(add, 'test-id'), '已添加并验证。')
})

test('修改和批量操作使用身份与版本，不以当前显示编号定位', () => {
  for (const operation of ['edit', 'complete', 'remove']) {
    const command = { operation, targets: [target], ...(operation === 'edit' ? { fields: { note: '合成备注' } } : {}) }
    assert.equal(validateTaskOperation(command), command)
    assert.match(describeTaskOperation(command), /任务：/)
    assert.throws(() => validateTaskOperation({ operation, targets: [{ id: 7 }] }), TodoistRequestError)
  }
})

test('完全重复只显示候选和明确失败，绝不提供确认绕过', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ requestId: 'test-id', status: 'failed', code: 'DUPLICATE_TASK', duplicates }))
  await assert.rejects(submitTodoist(add, 'test-id'), error => {
    assert.equal(error.uncertain, false)
    assert.equal(error.code, 'DUPLICATE_TASK')
    assert.deepEqual(error.duplicates, duplicates)
    assert.equal(error.confirmation, '')
    return true
  })
})

test('疑似重复等待明确确认，确认使用新 requestId 且携带原操作和令牌', async () => {
  const calls = [], hooks = []
  const queue = useTodoistQueue(async (input, id) => {
    calls.push({ input: JSON.parse(JSON.stringify(input)), id })
    if (!input.confirmation) throw new TodoistRequestError('待核对', false, true, { code: 'SIMILAR_TASK', duplicates, confirmation: token })
    return '已验证'
  })
  const first = queue.submit(add, { onConfirmation: () => hooks.push('confirm'), onSuccess: () => hooks.push('success') })
  await flush()
  assert.equal(first.status, '待确认'); assert.equal(calls.length, 1)
  assert.deepEqual(hooks, ['confirm'])
  const second = queue.confirm(first)
  await flush()
  assert.equal(first.status, '已确认'); assert.equal(second.status, '成功')
  assert.notEqual(first.requestId, second.requestId)
  assert.deepEqual(calls[1].input, { ...add, confirmation: token })
  queue.confirm(first); assert.equal(calls.length, 2)
  queue.dispose()
})

test('取消疑似重复不会产生第二次请求或成功状态', async () => {
  let calls = 0
  const queue = useTodoistQueue(async () => { calls++; throw new TodoistRequestError('待确认', false, true, { code: 'SIMILAR_TASK', duplicates, confirmation: token }) })
  const entry = queue.submit(add)
  await flush(); queue.cancel(entry); queue.confirm(entry)
  assert.equal(entry.status, '已取消'); assert.equal(calls, 1)
  queue.dispose()
})

test('恢复中断只查询原 requestId，不重新提交操作', async t => {
  const methods = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    methods.push(options.method)
    assert.equal(options.method, 'GET'); assert.equal(options.body, undefined)
    return Response.json({ requestId: 'test-id', status: 'completed', output: '已恢复并验证' })
  })
  assert.equal(await submitTodoist(add, 'test-id', undefined, true), '已恢复并验证')
  assert.deepEqual(methods, ['GET'])
})

test('旧页面、目标已变化和锁冲突都是明确失败，恢复未完成仍为未知', async t => {
  for (const code of ['CLIENT_UPDATE_REQUIRED', 'TASK_CHANGED', 'FILE_LOCKED', 'RECOVERY_REQUIRED']) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ requestId: 'test-id', status: code === 'RECOVERY_REQUIRED' ? 'unknown' : 'failed', code }))
    await assert.rejects(submitTodoist(add, 'test-id'), error => error.uncertain === (code === 'RECOVERY_REQUIRED'))
    t.mock.restoreAll()
  }
})
