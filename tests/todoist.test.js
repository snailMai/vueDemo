import assert from 'node:assert/strict'
import { test } from 'node:test'
import { submitTodoist, validateTodoistInput, composeTodoistTask, todoistTaskCommands, TodoistRequestError } from '../src/api/todoist.js'
import { useTodoistRequest } from '../src/composables/useTodoistRequest.js'
import { routes, toolPages } from '../src/router/routes.js'

test('todoist 是第四个入口，原有工具路径保留', () => {
  assert.deepEqual(toolPages.map(page => page.path), ['/About', '/ToolsCryption', '/GetRandomPWD', '/Todoist', '/Transfer'])
  assert.equal(toolPages[3].label, 'todoist')
  assert.ok(routes.some(route => route.path === '/Todoist'))
})

test('保留自然语言和多行输入，不追加会话提示词', () => {
  for (const value of ['输出全部待办', '添加任务：整理合成提纲\n优先级 P2', '完成任务：合成任务', '修改任务：将合成任务的备注改为测试', '帮我添加一个任务', '删除任务：测试', '  合成内容\n保留末尾空格  \n']) {
    assert.equal(validateTodoistInput(value), value)
  }
  for (const value of ['', ' ', null]) {
    assert.throws(() => validateTodoistInput(value), TodoistRequestError)
  }
  assert.throws(() => validateTodoistInput('添加任务：' + '中'.repeat(6000)), /输入过长/)
})

test('四种单选操作只组合命令和普通文本框内容', () => {
  assert.deepEqual(todoistTaskCommands, ['添加任务', '完成任务', '修改任务', '删除任务'])
  for (const command of todoistTaskCommands) {
    assert.equal(composeTodoistTask(command, '合成任务\n备注：原文'), `${command}：合成任务\n备注：原文`)
    assert.equal(composeTodoistTask(command, '  合成文本  \n'), `${command}：  合成文本  \n`)
    assert.throws(() => composeTodoistTask(command, ' '), /请输入指令/)
  }
  assert.throws(() => composeTodoistTask('输出全部待办', '不应组合'), /请选择任务操作/)
  assert.throws(() => composeTodoistTask('添加任务', 'a'.repeat(16384)), /输入过长/)
})

test('使用同源 JSON 契约，正文不进入 URL，输出按原文本保留', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/todoist/commands')
    assert.equal(options.method, 'POST')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.redirect, 'error')
    assert.deepEqual(JSON.parse(options.body), { input: '输出全部待办', requestId: 'test-id' })
    return Response.json({ requestId: 'test-id', status: 'completed', output: 'P0：0 项\nP2 常规：1 项\n合成任务 -- 测试备注\n' })
  })
  assert.equal(await submitTodoist('输出全部待办', 'test-id'), 'P0：0 项\nP2 常规：1 项\n合成任务 -- 测试备注\n')
})

test('未连接和无效请求使用固定提示，不回显服务端异常', async t => {
  const cases = [
    [413, 'INPUT_TOO_LARGE', /输入过长/], [503, 'NOT_CONNECTED', /未发送指令/], [400, 'INVALID_REQUEST', /输入无效/]
  ]
  for (const [status, code, message] of cases) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ code, message: 'synthetic-private-value' }, { status }))
    await assert.rejects(submitTodoist('输出全部待办', 'test-id'), error => {
      assert.match(error.message, message)
      assert.equal(error.uncertain, false)
      assert.equal(error.message.includes('synthetic-private-value'), false)
      return true
    })
    t.mock.restoreAll()
  }
})

test('登录 HTML、未知错误或不匹配的请求 ID 不能显示为成功', async t => {
  const responses = [
    () => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }),
    () => Response.json({ code: 'constructor' }, { status: 500 }),
    () => Response.json({ requestId: 'another-request', output: 'wrong' }),
    () => Response.json({ requestId: 'test-id', output: { html: 'wrong' } })
  ]
  for (const response of responses) {
    t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(submitTodoist('输出全部待办', 'test-id'), error => error.uncertain === true)
    t.mock.restoreAll()
  }
})

test('超时只说明结果未知，不宣称服务端已取消', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }))
  const pending = submitTodoist('添加任务：合成任务', 'test-id')
  const rejected = assert.rejects(pending, error => error.uncertain && /结果尚未确认/.test(error.message))
  t.mock.timers.tick(20000)
  await rejected
})

test('重复点击只发送一次；未知结果重用原输入和请求 ID', async () => {
  const deferred = Promise.withResolvers()
  const calls = []
  const { state, run } = useTodoistRequest(async (...args) => {
    calls.push(args)
    if (calls.length === 1) return deferred.promise
    return '已处理合成任务'
  })
  const first = run('添加任务：合成任务')
  await run('添加任务：不应发送')
  assert.equal(calls.length, 1)
  deferred.reject(new TodoistRequestError('结果尚未确认', true))
  await first
  assert.equal(state.uncertain, true)
  await run('添加任务：仍不应作为新任务发送')
  assert.equal(calls[1][0], calls[0][0])
  assert.equal(calls[1][1], calls[0][1])
  assert.equal(calls[0][3], false)
  assert.equal(calls[1][3], true)
  assert.equal(state.uncertain, false)
  assert.equal(state.result, '已处理合成任务')
  await run('输出全部待办')
  assert.notEqual(calls[2][1], calls[0][1])
})

test('校验失败不发请求，明确未执行错误允许修改输入', async () => {
  let calls = 0
  const { state, run } = useTodoistRequest(async () => {
    calls++
    throw new TodoistRequestError('尚未连接')
  })
  await run(' ')
  assert.equal(calls, 0)
  await run('输出全部待办')
  assert.equal(calls, 1)
  assert.equal(state.pending, false)
  assert.equal(state.uncertain, false)
})

test('未知结果恢复时遇到明确错误仍保留原请求 ID', async () => {
  const calls = []
  const { state, run } = useTodoistRequest(async (input, id) => {
    calls.push({ input, id })
    if (calls.length === 1) throw new TodoistRequestError('超时', true)
    if (calls.length === 2) throw new TodoistRequestError('暂时锁定')
    return '已恢复'
  })
  await run('添加任务：合成任务')
  await run('添加任务：不应发送')
  assert.equal(state.uncertain, true)
  await run('添加任务：不应发送')
  assert.deepEqual(calls[1], calls[0])
  assert.deepEqual(calls[2], calls[0])
  assert.equal(state.uncertain, false)
})

test('离开页面中止等待，不接收迟到结果或异常正文', async () => {
  const deferred = Promise.withResolvers()
  let signal
  const { state, run, dispose } = useTodoistRequest(async (_, id, s) => {
    signal = s
    return deferred.promise
  })
  const pending = run('输出全部待办')
  dispose()
  assert.equal(signal.aborted, true)
  deferred.resolve('late output')
  await pending
  assert.equal(state.result, null)
  await run('输出全部待办')
  assert.equal(state.result, null)
})

test('查询原请求只用 GET，不重发输入或触发会话', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/todoist/commands?requestId=test-id')
    assert.equal(options.method, 'GET')
    assert.equal(options.body, undefined)
    return Response.json({ requestId: 'test-id', status: 'completed', output: '原会话回复' })
  })
  assert.equal(await submitTodoist('不能再次发送的输入', 'test-id', undefined, true), '原会话回复')
})

test('后台执行时先 POST，随后轮询 GET 取得最终回复', async t => {
  const methods = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    methods.push(options.method)
    if (methods.length === 1) return Response.json({ requestId: 'test-id', status: 'running' }, { status: 202 })
    assert.equal(options.body, undefined)
    assert.match(url, /requestId=test-id$/)
    return Response.json({ requestId: 'test-id', status: 'completed', output: '已实际执行' })
  })
  assert.equal(await submitTodoist('合成输入', 'test-id'), '已实际执行')
  assert.deepEqual(methods, ['POST', 'GET'])
})

test('结果不存在或执行中断不能当作未写入', async t => {
  for (const code of ['RESULT_NOT_FOUND', 'RESULT_UNKNOWN', 'NEEDS_ATTENTION']) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ requestId: 'test-id', status: 'failed', code }))
    await assert.rejects(submitTodoist('合成输入', 'test-id', undefined, true), error => error.uncertain && !error.message.includes('未写入'))
    t.mock.restoreAll()
  }
})

test('用户核对会话后可清除未知状态，不自动重新提交', async () => {
  let calls = 0
  const { state, run, acknowledge } = useTodoistRequest(async () => { calls++; throw new TodoistRequestError('未知', true) })
  await run('合成输入')
  assert.equal(state.uncertain, true)
  acknowledge()
  assert.equal(state.uncertain, false)
  assert.equal(calls, 1)
})

test('轮询得到同一请求的会话占用失败后恢复提交，不要求查询或确认原会话', async t => {
  const methods = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    methods.push(options.method)
    const id = options.body ? JSON.parse(options.body).requestId : new URL(url, 'http://test').searchParams.get('requestId')
    if (methods.length === 1) return Response.json({ requestId: id, status: 'running' }, { status: 202 })
    return Response.json({ requestId: id, status: 'failed', code: 'SESSION_IN_USE', message: 'synthetic-private-value' })
  })
  const { state, run } = useTodoistRequest()
  await run('完成任务：合成任务')
  assert.deepEqual(methods, ['POST', 'GET'])
  assert.equal(state.pending, false)
  assert.equal(state.uncertain, false)
  assert.match(state.error, /写入连接被其他客户端持有/)
  assert.match(state.error, /未发送指令/)
  assert.equal(state.error.includes('synthetic-private-value'), false)
})

test('未知状态查询确认未发送后可解除；不匹配的失败结果不能解除', async t => {
  for (const requestId of ['test-id', 'another-id']) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ requestId, status: 'failed', code: 'NOT_CONNECTED' }))
    await assert.rejects(submitTodoist('合成输入', 'test-id', undefined, true), error => {
      assert.equal(error.uncertain, requestId !== 'test-id')
      assert.equal(error.notSubmitted, requestId === 'test-id')
      return true
    })
    t.mock.restoreAll()
  }
  const { state, run } = useTodoistRequest(async (_, id, signal, resume) => {
    if (!resume) throw new TodoistRequestError('等待超时', true)
    throw new TodoistRequestError('会话占用，未发送', false, true)
  })
  await run('合成输入')
  assert.equal(state.uncertain, true)
  await run()
  assert.equal(state.uncertain, false)
})

test('连接各阶段错误使用安全固定提示，不回显协议内容', async t => {
  for (const code of ['CONNECT_START_FAILED', 'CONNECT_INIT_FAILED', 'SESSION_RESUME_FAILED', 'SESSION_NOT_WRITABLE', 'REQUEST_REJECTED']) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ requestId: 'test-id', status: 'failed', code, message: 'synthetic-private-value' }))
    await assert.rejects(submitTodoist('合成输入', 'test-id'), error => !error.uncertain && error.notSubmitted && !error.message.includes('synthetic-private-value'))
    t.mock.restoreAll()
  }
})
