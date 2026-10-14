// 网页只发送文本并获取原会话回复；不在前端识别任务内容或执行任务规则。
const messages = {
  INVALID_REQUEST: '输入无效，请检查内容后再提交。',
  NOT_CONNECTED: '尚未连接 AI Todoist 会话，未发送指令。',
  INPUT_TOO_LARGE: '输入过长，请缩短后再提交。',
  NEEDS_ATTENTION: '原会话需要交互确认，请到 AI Todoist 会话查看；不要直接重复提交。',
  RESULT_NOT_FOUND: '请求结果已过期或服务已重启，请到 AI Todoist 会话核对，不要直接重复提交。',
  RESULT_UNKNOWN: '执行结果尚未确认，请到 AI Todoist 会话核对，不要重复添加。',
  REQUEST_MISMATCH: '请求标识与原输入不一致，请先核对原会话。'
}

export class TodoistRequestError extends Error {
  constructor(message, uncertain = false) { super(message); this.uncertain = uncertain }
}

export const todoistTaskCommands = Object.freeze(['添加任务', '完成任务', '修改任务', '删除任务'])

export function composeTodoistTask(command, value) {
  if (!todoistTaskCommands.includes(command)) throw new TodoistRequestError('请选择任务操作。')
  const content = validateTodoistInput(value)
  return validateTodoistInput(`${command}：${content}`)
}

export function validateTodoistInput(value) {
  const input = typeof value === 'string' ? value.trim() : ''
  if (!input) throw new TodoistRequestError('请输入指令。')
  if (new TextEncoder().encode(input).length > 16384) throw new TodoistRequestError(messages.INPUT_TOO_LARGE)
  // 页面展示常用命令，不以正则阻止自然语言输入。
  return input
}

function pause(signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new Error('Aborted')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 1000)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}

export async function submitTodoist(input, requestId, signal, resume = false) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const totalTimer = setTimeout(abort, 660000)
  let query = resume
  try {
    while (true) {
      const url = query ? `/api/todoist/commands?requestId=${encodeURIComponent(requestId)}` : '/api/todoist/commands'
      const requestTimer = setTimeout(abort, 20000)
      let response, data
      try {
        response = await fetch(url, {
          method: query ? 'GET' : 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin', cache: 'no-store', redirect: 'error',
          ...(query ? {} : { body: JSON.stringify({ input, requestId }) }), signal: controller.signal
        })
        data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => null) : null
      } finally { clearTimeout(requestTimer) }
      if (!response.ok || data?.status === 'failed') {
        const code = data?.code
        const message = Object.hasOwn(messages, code) ? messages[code] : messages.RESULT_UNKNOWN
        const uncertain = query || !['INVALID_REQUEST', 'INPUT_TOO_LARGE', 'NOT_CONNECTED'].includes(code)
        throw new TodoistRequestError(message, uncertain)
      }
      if (data?.requestId !== requestId) throw new TodoistRequestError(messages.RESULT_UNKNOWN, true)
      if (data.status === 'completed' && typeof data.output === 'string') return data.output
      if (data.status !== 'running') throw new TodoistRequestError(messages.RESULT_UNKNOWN, true)
      query = true
      await pause(controller.signal)
    }
  } catch (error) {
    if (error instanceof TodoistRequestError) throw error
    throw new TodoistRequestError('连接中断或等待超时，结果尚未确认。请查询原请求，不要重复添加。', true)
  } finally {
    clearTimeout(totalTimer)
    signal?.removeEventListener('abort', abort)
  }
}
