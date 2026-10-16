import { reactive } from 'vue'
import { submitTodoist, validateTodoistInput, TodoistRequestError } from '../api/todoist.js'

/** 未知结果重用请求 ID，不能沿用普通工具“失败后创建新请求”的逻辑。 */
export function useTodoistRequest(send = submitTodoist) {
  const state = reactive({ pending: false, uncertain: false, result: null, error: '' })
  let request = null
  let active = null
  let disposed = false

  async function run(value) {
    if (state.pending || disposed) return
    state.error = ''
    try {
      if (!state.uncertain) request = { input: validateTodoistInput(value), id: crypto.randomUUID() }
    } catch (error) {
      state.error = error.message
      return
    }
    state.pending = true
    state.result = null
    const controller = new AbortController()
    active = controller
    try {
      const output = await send(request.input, request.id, controller.signal, state.uncertain)
      if (!disposed) {
        state.result = output
        state.uncertain = false
        request = null
      }
    } catch (error) {
      if (!disposed) {
        // 再次点击只取回复，不重发指令；结果状态不持久化到浏览器。
        state.uncertain = !(error instanceof TodoistRequestError) || error.uncertain
          || (state.uncertain && !error.notSubmitted)
        state.error = error instanceof TodoistRequestError ? error.message : '结果尚未确认，请查询原请求。'
      }
    } finally {
      if (!disposed) state.pending = false
      if (active === controller) active = null
    }
  }

  function dispose() {
    disposed = true
    active?.abort()
    // 取消浏览器等待不表示撤销服务端操作；不清空未知结果后自动重发。
  }
  function acknowledge() {
    if (state.pending) return
    request = null
    state.uncertain = false
    state.error = ''
  }
  return { state, run, dispose, acknowledge }
}
