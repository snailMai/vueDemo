import { reactive } from 'vue'

/** 管理工具请求生命周期；null 表示尚无结果，空字符串仍是合法成功结果。 */
export function useToolRequest() {
  const state = reactive({ pending: false, result: null, error: '' })
  let activeController = null

  // operation 接收取消信号；同步参数校验异常也进入统一错误状态。
  async function run(operation) {
    if (state.pending) return
    const controller = new AbortController()
    activeController = controller
    state.pending = true
    state.result = null
    state.error = ''
    try {
      const result = await operation(controller.signal)
      // 重置后可能已有新请求，只有当前控制器拥有写入页面状态的资格。
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

  // 取消只是尽力而为；立即撤销控制器身份，才能同时隔离迟到的成功和失败。
  function reset() {
    activeController?.abort()
    activeController = null
    state.pending = false
    state.result = null
    state.error = ''
  }

  return { state, run, reset }
}
