import { reactive } from 'vue'
import { submitTodoist, validateTodoistInput, TodoistRequestError } from '../api/todoist.js'

/**
 * 提交记录面板的命令队列状态：每条命令一个条目，提交即返回、可连续提交。
 * 状态：排队中 → 执行中 → 成功／失败／结果未知。
 * 结果未知绝不自动重发，只提供按 requestId 的查询（submitTodoist resume 只发 GET）。
 * 本地乐观更新与回滚由调用方通过 hooks 提供，队列本身不识别任务内容。
 */
export function useTodoistQueue(send = submitTodoist) {
  const entries = reactive([])
  const controllers = new Map()
  let disposed = false

  // hooks: onSubmitted(entry) 乐观更新；onSuccess / onFailure 回滚；onUnknown 不做回滚。
  function submit(command, hooks = {}) {
    const input = validateTodoistInput(command)
    const entry = reactive({
      requestId: crypto.randomUUID(), command: input, time: new Date(),
      status: '排队中', detail: '', hooks
    })
    entries.unshift(entry)
    hooks.onSubmitted?.(entry)
    drive(entry, false)
    return entry
  }

  async function drive(entry, resume) {
    const controller = new AbortController()
    controllers.set(entry.requestId, controller)
    try {
      await send(entry.command, entry.requestId, controller.signal, resume,
        status => { if (!disposed) entry.status = status === 'running' ? '执行中' : '排队中' })
      if (disposed) return
      entry.status = '成功'
      entry.hooks.onSuccess?.(entry)
    } catch (error) {
      if (disposed || error?.name === 'AbortError') return
      if (error instanceof TodoistRequestError && error.uncertain) {
        // 结果未知：乐观更新保持原样，等待用户查询或刷新对账，不自动重发。
        entry.status = '结果未知'
        entry.detail = error.message
        entry.hooks.onUnknown?.(entry)
      } else {
        entry.status = '失败'
        entry.detail = error instanceof TodoistRequestError ? error.message : '执行失败，请稍后重试。'
        entry.hooks.onFailure?.(entry)
      }
    } finally {
      controllers.delete(entry.requestId)
    }
  }

  // 结果未知的人工查询入口：只查原请求，不重新提交正文。
  function query(entry) {
    if (entry.status !== '结果未知' || controllers.has(entry.requestId)) return
    entry.status = '执行中'
    entry.detail = ''
    drive(entry, true)
  }

  function dispose() {
    disposed = true
    for (const controller of controllers.values()) controller.abort()
    controllers.clear()
    // 取消浏览器等待不代表撤销服务端操作；条目状态停留原地，不自动重发。
  }

  return { entries, submit, query, dispose }
}
