import { onScopeDispose, ref, watch } from 'vue'

export function useResultCopy(result) {
  const copyMessage = ref('')
  const copying = ref(false)
  let version = 0

  function invalidate() {
    version++
    copyMessage.value = ''
  }

  watch(result, invalidate, { flush: 'sync' })
  onScopeDispose(invalidate)

  async function copyResult() {
    if (copying.value || result() === null) return
    const currentVersion = version
    copying.value = true
    copyMessage.value = ''
    try {
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
