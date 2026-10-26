import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { ref, computed, nextTick } from 'vue'
import { useTodoistQueue } from '../src/composables/useTodoistQueue.js'
import { TodoistRequestError } from '../src/api/todoist.js'

// 直接运行页面的 setup 逻辑；只替换网络与生命周期，不调用真实任务服务。
function createPage(t, send) {
  const source = readFileSync(new URL('../src/views/Todoist.vue', import.meta.url), 'utf8')
    .split('<script setup>')[1].split('</script>')[0].replace(/^import .+$/gm, '')
  let queue
  const cleanup = []
  const context = vm.createContext({
    ref, computed, nextTick, AbortController, TodoistRequestError,
    onMounted: () => {}, onBeforeUnmount: callback => cleanup.push(callback),
    setTimeout: () => 0, clearTimeout: () => {},
    fetchTodoistTasks: async () => [],
    useTodoistQueue: () => (queue = useTodoistQueue(send))
  })
  vm.runInContext(source + '\nglobalThis.subject = { addInput, addPriority, activePriority, addTask, switchPriority };', context)
  t.after(() => cleanup.forEach(callback => callback()))
  return { page: context.subject, queue }
}

test('新增级别初始 P2，顶部列表筛选与新增级别互不影响', t => {
  const { page } = createPage(t, async () => '合成成功')
  assert.equal(page.addPriority.value, 'P2')
  page.switchPriority('P1')
  assert.equal(page.addPriority.value, 'P2')
  page.addPriority.value = 'P0'
  page.switchPriority('P3')
  assert.equal(page.addPriority.value, 'P0')
  assert.equal(page.activePriority.value, 'P3')
})

for (const priority of ['P0', 'P1', 'P2', 'P3']) {
  test(`新增 ${priority} 随名称提交，后续选择不改变已提交请求`, t => {
    const calls = []
    const { page } = createPage(t, async command => { calls.push(command); return '合成成功' })
    page.addPriority.value = priority
    page.addInput.value = '  合成优先级任务  '
    page.addTask()
    assert.deepEqual(calls[0], { operation: 'add', fields: { name: '合成优先级任务', priority } })
    assert.equal(page.addInput.value, '')
    assert.equal(page.addPriority.value, priority)
    page.addPriority.value = priority === 'P0' ? 'P3' : 'P0'
    assert.equal(calls[0].fields.priority, priority)
  })
}

test('空名称不提交，名称中的 P1 不覆盖明确选择的级别', t => {
  const calls = []
  const { page } = createPage(t, async command => { calls.push(command); return '合成成功' })
  page.addInput.value = '   '
  page.addTask()
  assert.equal(calls.length, 0)
  page.addInput.value = '说明 P1 的使用方法'
  page.addTask()
  assert.equal(calls[0].fields.name, '说明 P1 的使用方法')
  assert.equal(calls[0].fields.priority, 'P2')
})

test('疑似重复确认保留原 P1，不使用确认时新增区的 P3', async t => {
  const calls = []
  const { page, queue } = createPage(t, async command => {
    calls.push(command)
    if (!command.confirmation) throw new TodoistRequestError('合成相似任务', false, true,
      { code: 'SIMILAR_TASK', confirmation: 'c'.repeat(64) })
    return '合成成功'
  })
  page.addPriority.value = 'P1'
  page.addInput.value = '合成相似任务'
  page.addTask()
  await new Promise(resolve => setTimeout(resolve, 0))
  const original = queue.entries[0]
  assert.equal(original.status, '待确认')
  page.addPriority.value = 'P3'
  queue.confirm(original)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(calls.length, 2)
  assert.equal(calls[1].fields.priority, 'P1')
  assert.equal(calls[1].confirmation, 'c'.repeat(64))
})

test('明确失败恢复名称，不重置用户选择的新增级别', async t => {
  const { page } = createPage(t, async () => { throw new TodoistRequestError('合成失败') })
  page.addPriority.value = 'P1'
  page.addInput.value = '合成失败任务'
  page.addTask()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(page.addInput.value, '合成失败任务')
  assert.equal(page.addPriority.value, 'P1')
})
