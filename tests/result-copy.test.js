// 所有剪贴板操作均被模拟，测试不读写用户的真实系统剪贴板。
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { effectScope, ref } from 'vue'
import { useResultCopy } from '../src/composables/useResultCopy.js'

// 独立作用域模拟组件生命周期，延迟 Promise 用于控制复制完成时机。
function setup(t, value = 'old') {
  const pending = Promise.withResolvers()
  const copied = []
  t.mock.getter(globalThis, 'navigator', () => ({ clipboard: {
    writeText: text => { copied.push(text); return pending.promise }
  } }))
  const result = ref(value)
  const scope = effectScope()
  const copy = scope.run(() => useResultCopy(() => result.value))
  t.after(() => scope.stop())
  return { ...copy, pending, copied, result, scope }
}

test('复制保留原始文本，等待时阻止重复点击', async t => {
  const copy = setup(t, '  密码\n')
  const operation = copy.copyResult()
  assert.equal(copy.copying.value, true)
  await copy.copyResult()
  assert.deepEqual(copy.copied, ['  密码\n'])
  copy.pending.resolve()
  await operation
  assert.equal(copy.copyMessage.value, '已复制。')
  assert.equal(copy.copying.value, false)
  copy.result.value = 'new'
  assert.equal(copy.copyMessage.value, '')
})

test('当前复制失败提示手动复制，允许重试', async t => {
  const copy = setup(t)
  const operation = copy.copyResult()
  copy.pending.reject(new Error('permission denied'))
  await operation
  assert.match(copy.copyMessage.value, /手动复制/)
  assert.equal(copy.copying.value, false)
  t.mock.getter(globalThis, 'navigator', () => ({ clipboard: { writeText: async () => {} } }))
  await copy.copyResult()
  assert.equal(copy.copyMessage.value, '已复制。')
})

test('结果变化、重置、恢复相同文本后忽略迟到的成功和失败', async t => {
  for (const change of ['new', null, 'old-again']) {
    for (const failed of [false, true]) {
      const copy = setup(t)
      const operation = copy.copyResult()
      // 同一轮先清空再恢复旧值，确保按版本失效而不是只比较最终文本。
      copy.result.value = change === 'old-again' ? null : change
      if (change === 'old-again') copy.result.value = 'old'
      if (failed) copy.pending.reject(new Error('stale failure'))
      else copy.pending.resolve()
      await operation
      assert.equal(copy.copyMessage.value, '')
      assert.equal(copy.copying.value, false)
      assert.deepEqual(copy.copied, ['old'])
      copy.scope.stop()
    }
  }
})

test('组件销毁后不显示复制反馈', async t => {
  const copy = setup(t)
  const operation = copy.copyResult()
  copy.scope.stop()
  copy.pending.resolve()
  await operation
  assert.equal(copy.copyMessage.value, '')
})

test('尚无结果时不复制，成功的空文本可以复制', async t => {
  const copy = setup(t, null)
  await copy.copyResult()
  assert.deepEqual(copy.copied, [])
  copy.result.value = ''
  const operation = copy.copyResult()
  copy.pending.resolve()
  await operation
  assert.deepEqual(copy.copied, [''])
  assert.equal(copy.copyMessage.value, '已复制。')
})
