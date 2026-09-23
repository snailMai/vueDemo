const errorMessages = {
  INPUT_TOO_LARGE: '输入过大，请缩短密钥或文本后重试。',
  INVALID_REQUEST: '请求参数无效，请检查后重试。',
  DECRYPTION_FAILED: '解密失败，请检查密钥和密文。',
  INTERNAL_ERROR: '服务暂时不可用，请稍后重试。'
}

export class ToolRequestError extends Error {}

export async function requestText(path, { signal, ...options } = {}) {
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) cancel()
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 15000)

  try {
    const response = await fetch(`/api/${path}`, {
      ...options,
      headers: { Accept: 'text/plain, application/json', ...options.headers },
      signal: controller.signal,
      credentials: 'same-origin',
      cache: 'no-store'
    })
    if (!response.ok) {
      if (response.status === 413) throw new ToolRequestError(errorMessages.INPUT_TOO_LARGE)
      const error = await response.json().catch(() => null)
      const message = Object.hasOwn(errorMessages, error?.code)
        ? errorMessages[error.code]
        : errorMessages.INTERNAL_ERROR
      throw new ToolRequestError(message)
    }
    // 工具返回原始文本，禁止 JSON 解析或 trim，避免改变明文和末尾换行。
    return await response.text()
  } catch (error) {
    if (signal?.aborted) throw error
    if (timedOut) throw new ToolRequestError('请求超时，请稍后重试。')
    if (error instanceof ToolRequestError) throw error
    throw new ToolRequestError('无法连接服务，请检查网络后重试。')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
