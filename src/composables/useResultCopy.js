import { onScopeDispose, ref, watch } from 'vue'

/** 复制当前结果并管理反馈；只在用户主动点击时写剪贴板，不记录结果内容。 */
export function useResultCopy(result) {
  const copyMessage = ref('')
  const copying = ref(false)
  let version = 0

  // 版本递增而非比较文本，能识别“旧文本 → 清空 → 相同文本”的状态变化。
  function invalidate() {
    version++
    copyMessage.value = ''
  }

  // 同步失效避免同一批更新被合并，销毁作用域后也不显示迟到反馈。
  watch(result, invalidate, { flush: 'sync' })
  onScopeDispose(invalidate)

  async function copyResult() {
    if (copying.value || result() === null) return
    const currentVersion = version
    copying.value = true
    copyMessage.value = ''
    try {
      // 已发起的系统写入无法撤回；版本检查只能抑制旧操作的成功／失败提示。
      await navigator.clipboard.writeText(result())
      if (currentVersion === version) copyMessage.value = '已复制。'
    } catch {
      if (currentVersion === version) copyMessage.value = '复制未成功，请选中结果手动复制。'
    } finally {
      copying.value = false
    }
  }

  return { copyMessage, copying, copyResult }
}
