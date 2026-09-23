import { reactive } from 'vue'

export function useToolRequest() {
  const state = reactive({ pending: false, result: null, error: '' })
  let activeController = null

  async function run(operation) {
    if (state.pending) return
    const controller = new AbortController()
    activeController = controller
    state.pending = true
    state.result = null
    state.error = ''
    try {
      const result = await operation(controller.signal)
      if (activeController === controller) state.result = result
    } catch (error) {
      if (activeController === controller) state.error = error.message || '请求失败，请重试。'
    } finally {
      if (activeController === controller) {
        state.pending = false
        activeController = null
      }
    }
  }

  function reset() {
    activeController?.abort()
    activeController = null
    state.pending = false
    state.result = null
    state.error = ''
  }

  return { state, run, reset }
}
