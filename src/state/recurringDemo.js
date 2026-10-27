// 定时任务的内存演示数据：模块级单例，供 todoist 页签（计数）与任务面板（增删查）共享。
// 当前不接后端，不读写浏览器持久存储；刷新页面还原为内置数据。
import { reactive } from 'vue'
import { seedRecurringTasks } from '../lib/recurring.js'

export const recurringTasks = reactive(seedRecurringTasks())

export function addRecurringTask(payload) {
  recurringTasks.unshift({
    id: `task-${Math.random().toString(36).slice(2, 10)}`,
    builtin: false,
    createdAt: new Date().toISOString(),
    ...payload,
  })
}

export function removeRecurringTasks(ids) {
  for (let i = recurringTasks.length - 1; i >= 0; i -= 1) {
    if (ids.has(recurringTasks[i].id)) recurringTasks.splice(i, 1)
  }
}

export function updateRecurringTask(id, payload) {
  const task = recurringTasks.find((item) => item.id === id)
  if (task) Object.assign(task, payload)
}

export function resetRecurringTasks() {
  recurringTasks.splice(0, recurringTasks.length, ...seedRecurringTasks())
}
