// 只展示本地白名单文案，不直接显示或记录可能夹带敏感输入的服务端错误正文。
const errorMessages = {
  INPUT_TOO_LARGE: '输入过大，请缩短密钥或文本后重试。',
  INVALID_REQUEST: '请求参数无效，请检查后重试。',
  DECRYPTION_FAILED: '解密失败，请检查密钥和密文。',
  INTERNAL_ERROR: '服务暂时不可用，请稍后重试。'
}

// 标记已转换为安全提示的错误，避免在兜底分支丢失具体原因。
export class ToolRequestError extends Error {}

/** 同源文本请求入口，统一超时、取消和错误映射；禁止记录请求正文或响应。 */
export async function requestText(path, { signal, ...options } = {}) {
  const controller = new AbortController()
  let timedOut = false
  // 页面取消和客户端超时共用底层控制器，但保留不同的用户提示。
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
      // 代理可能返回 HTML 而非 JSON，413 必须先按状态码处理。
      if (response.status === 413) throw new ToolRequestError(errorMessages.INPUT_TOO_LARGE)
      const error = await response.json().catch(() => null)
      // 仅接受自有属性，避免 constructor 等继承属性被当成错误文案。
      const message = Object.hasOwn(errorMessages, error?.code)
        ? errorMessages[error.code]
        : errorMessages.INTERNAL_ERROR
      throw new ToolRequestError(message)
    }
    // 工具返回原始文本，禁止 JSON 解析或 trim，避免改变明文和末尾换行。
    return await response.text()
  } catch (error) {
    // 主动取消由页面状态管理消化，不显示为网络故障。
    if (signal?.aborted) throw error
    if (timedOut) throw new ToolRequestError('请求超时，请稍后重试。')
    if (error instanceof ToolRequestError) throw error
    throw new ToolRequestError('无法连接服务，请检查网络后重试。')
  } finally {
    // 无论成功、失败或取消，都释放计时器和外部监听器。
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
