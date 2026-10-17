import assert from 'node:assert/strict'
import { test } from 'node:test'
import { submitTodoist, TodoistRequestError } from '../src/api/todoist.js'
import { useTodoistQueue } from '../src/composables/useTodoistQueue.js'

// 命令队列前端测试，全部使用合成数据与模拟 fetch。

test('提交后经历排队中、执行中到成功，状态回调按序到达', async t => {
  const statuses = ['queued', 'running', 'completed']
  const seen = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const status = statuses.shift()
    if (status === 'completed') return Response.json({ requestId: 'test-id', status, output: '已执行' })
    return Response.json({ requestId: 'test-id', status }, { status: options.method === 'POST' ? 202 : 200 })
  })
  const output = await submitTodoist('完成任务：7', 'test-id', undefined, false, status => seen.push(status))
  assert.equal(output, '已执行')
  assert.deepEqual(seen, ['queued', 'running'])
})

test('结果未知是终态，抛出可识别错误且不重发', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push(options.method)
    return Response.json({ requestId: 'test-id', status: 'unknown', code: 'RESULT_UNKNOWN' })
  })
  await assert.rejects(submitTodoist('删除任务：7', 'test-id'), error => {
    assert.ok(error instanceof TodoistRequestError)
    assert.equal(error.uncertain, true)
    assert.match(error.message, /结果尚未确认/)
    return true
  })
  assert.deepEqual(calls, ['POST'])
})

test('提交即返回：乐观更新先执行，成功后才调用成功回调', async () => {
  const order = []
  const deferred = Promise.withResolvers()
  const queue = useTodoistQueue(() => { order.push('send'); return deferred.promise })
  const entry = queue.submit('添加任务：合成任务', {
    onSubmitted: () => order.push('optimistic'),
    onSuccess: () => order.push('success')
  })
  assert.deepEqual(order, ['optimistic', 'send'])
  assert.equal(entry.status, '排队中')
  deferred.resolve('主人，已完成。')
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
  assert.equal(entry.status, '成功')
  assert.deepEqual(order, ['optimistic', 'send', 'success'])
  queue.dispose()
})

test('失败触发回滚回调，连续提交互不影响', async () => {
  const rolledBack = []
  let calls = 0
  const queue = useTodoistQueue(() => {
    calls++
    if (calls === 1) throw new TodoistRequestError('原会话拒绝了本次命令，未开始执行。')
    return 'done'
  })
  const failed = queue.submit('完成任务：7', { onFailure: entry => rolledBack.push(entry.command) })
  const ok = queue.submit('完成任务：18', { onFailure: entry => rolledBack.push(entry.command) })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(failed.status, '失败')
  assert.equal(ok.status, '成功')
  assert.deepEqual(rolledBack, ['完成任务：7'])
  queue.dispose()
})

test('结果未知不回滚、不重发；人工查询只带 resume 取原请求', async () => {
  const calls = []
  const events = []
  const queue = useTodoistQueue(async (input, id, signal, resume) => {
    calls.push(resume)
    if (!resume) throw new TodoistRequestError('执行结果尚未确认，请到 AI Todoist 会话核对，不要重复添加。', true)
    return '已实际完成'
  })
  const entry = queue.submit('删除任务：7', {
    onFailure: () => events.push('failure'),
    onUnknown: () => events.push('unknown'),
    onSuccess: () => events.push('success')
  })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(entry.status, '结果未知')
  assert.deepEqual(events, ['unknown'])
  assert.deepEqual(calls, [false])
  queue.query(entry)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(entry.status, '成功')
  assert.deepEqual(calls, [false, true])
  assert.deepEqual(events, ['unknown', 'success'])
  queue.dispose()
})

test('查询中的条目不能重复查询，成功后的查询不再发送', async () => {
  const calls = []
  const deferred = Promise.withResolvers()
  const queue = useTodoistQueue(async (input, id, signal, resume) => {
    calls.push(resume)
    if (!resume) throw new TodoistRequestError('未知', true)
    return deferred.promise
  })
  const entry = queue.submit('修改任务：7：合成新内容')
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(entry.status, '结果未知')
  queue.query(entry)
  queue.query(entry)
  assert.deepEqual(calls, [false, true])
  assert.equal(entry.status, '执行中')
  deferred.resolve('已完成')
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(entry.status, '成功')
  queue.query(entry)
  assert.deepEqual(calls, [false, true])
  queue.dispose()
})

test('无效命令不产生条目也不发送', async () => {
  let calls = 0
  const queue = useTodoistQueue(async () => { calls++; return 'done' })
  assert.throws(() => queue.submit('  '), TodoistRequestError)
  assert.equal(queue.entries.length, 0)
  assert.equal(calls, 0)
  queue.dispose()
})
