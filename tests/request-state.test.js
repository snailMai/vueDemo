// 手动控制 Promise 完成顺序，复现重复提交、取消与迟到响应的竞态。
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { useToolRequest } from '../src/composables/useToolRequest.js'
import { parsePasswordParameters } from '../src/forms/validation.js'

test('请求开始进入 loading，重复提交不会再次调用接口', async () => {
  const { state, run } = useToolRequest()
  const pending = Promise.withResolvers()
  let calls = 0
  const operation = () => { calls++; return pending.promise }
  const first = run(operation)
  assert.equal(state.pending, true)
  await run(operation)
  assert.equal(calls, 1)
  pending.resolve('first\n')
  await first
  assert.deepEqual({ ...state }, { pending: false, result: 'first\n', error: '' })
})

test('请求失败恢复按钮状态，重试成功清除错误', async () => {
  const { state, run } = useToolRequest()
  await run(() => Promise.reject(new Error('请求失败，请重试。')))
  assert.deepEqual({ ...state }, { pending: false, result: null, error: '请求失败，请重试。' })
  await run(() => Promise.resolve('ok'))
  assert.deepEqual({ ...state }, { pending: false, result: 'ok', error: '' })
})

test('同步参数校验失败不调用 API 并结束 loading', async () => {
  const { state, run } = useToolRequest()
  let calls = 0
  await run(() => {
    parsePasswordParameters({ num: '-1' })
    calls++
  })
  assert.equal(calls, 0)
  assert.equal(state.pending, false)
  assert.match(state.error, /密码位数/)
})

test('空字符串是成功结果，区别于尚无结果的 null', async () => {
  const { state, run, reset } = useToolRequest()
  await run(() => Promise.resolve(''))
  assert.equal(state.result, '')
  assert.equal(state.error, '')
  reset()
  assert.equal(state.result, null)
})

test('重置取消请求，迟到结果不能覆盖后续请求', async () => {
  const { state, run, reset } = useToolRequest()
  const old = Promise.withResolvers()
  const current = Promise.withResolvers()
  let signal
  const first = run(value => { signal = value; return old.promise })
  reset()
  assert.equal(signal.aborted, true)
  assert.deepEqual({ ...state }, { pending: false, result: null, error: '' })
  const second = run(() => current.promise)
  // 旧请求先结束也不能清除新请求的 pending 或覆盖结果。
  old.resolve('stale')
  await first
  assert.deepEqual({ ...state }, { pending: true, result: null, error: '' })
  current.resolve('current')
  await second
  assert.equal(state.result, 'current')
})

test('重置后迟到错误不会重新显示', async () => {
  const { state, run, reset } = useToolRequest()
  const pending = Promise.withResolvers()
  const operation = run(() => pending.promise)
  reset()
  pending.reject(new Error('stale failure'))
  await operation
  assert.deepEqual({ ...state }, { pending: false, result: null, error: '' })
})
