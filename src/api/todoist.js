// 网页提交明确操作，由本地 Java 执行；不通过会话，不在前端生成任务目标等字段。
const messages = {
  INVALID_REQUEST: '输入无效，请检查内容后再提交。',
  NOT_CONNECTED: '尚未连接 AI Todoist 会话，未发送指令。',
  CONNECT_START_FAILED: '无法启动会话连接，未发送指令。',
  CONNECT_INIT_FAILED: '会话连接初始化失败，未发送指令。',
  SESSION_IN_USE: '原 AI Todoist 会话的写入连接被其他客户端持有，未发送指令；这不代表上一条命令仍在执行。',
  SESSION_RESUME_FAILED: '未找到原 AI Todoist 会话的可用桌面连接，未发送指令。',
  SESSION_NOT_WRITABLE: '原 AI Todoist 会话未获得工作区写入权限，未发送指令。',
  REQUEST_REJECTED: '原 AI Todoist 会话拒绝了本次命令，未开始执行。',
  INPUT_TOO_LARGE: '输入过长，请缩短后再提交。',
  NEEDS_ATTENTION: '原会话需要交互确认，请到 AI Todoist 会话查看；不要直接重复提交。',
  RESULT_NOT_FOUND: '未找到原请求回执，请刷新任务列表核对，不要直接重复提交。',
  RESULT_UNKNOWN: '执行结果尚未确认，请查询原请求并核对任务列表，不要重复提交。',
  REQUEST_MISMATCH: '请求标识与原操作不一致，请先核对提交记录。',
  TASKS_UNAVAILABLE: '任务列表暂时不可用，请稍后刷新重试。',
  CLIENT_UPDATE_REQUIRED: '页面版本已过期，请刷新后重新操作。',
  TASK_CHANGED: '目标任务已变化，请刷新列表后重新选择，未修改任务。',
  DUPLICATE_TASK: '已有相同或规则等价的任务，未添加或改名。',
  SIMILAR_TASK: '发现相似任务，请核对后明确确认；当前未写入。',
  TASK_FORMAT_INVALID: '任务文件格式异常，未修改文件；请先核对原文。',
  FILE_LOCKED: '任务文件正在被其他操作使用，未写入，请稍后重试。',
  ARCHIVE_CONFLICT: '归档中已有该任务记录，未修改文件，请先核对。',
  STORAGE_UNAVAILABLE: '本地任务文件或回执目录不可用，操作未开始。',
  RECOVERY_REQUIRED: '操作结果需恢复核对，请查询原请求，不要重新提交。'
}

export class TodoistRequestError extends Error {
  constructor(message, uncertain = false, notSubmitted = false, details = {}) {
    super(message); this.uncertain = uncertain; this.notSubmitted = notSubmitted
    this.code = details.code
    this.duplicates = Array.isArray(details.duplicates) ? details.duplicates.filter(item => item
      && typeof item.name === 'string' && item.name.length <= 512 && ['P0', 'P1', 'P2', 'P3'].includes(item.priority)
      && ['todo', 'archive'].includes(item.source)) : []
    this.confirmation = typeof details.confirmation === 'string' && /^[a-f0-9]{64}$/.test(details.confirmation) ? details.confirmation : ''
  }
}

const notSubmittedCodes = new Set(['INVALID_REQUEST', 'INPUT_TOO_LARGE', 'NOT_CONNECTED',
  'CONNECT_START_FAILED', 'CONNECT_INIT_FAILED', 'SESSION_IN_USE', 'SESSION_RESUME_FAILED',
  'SESSION_NOT_WRITABLE', 'REQUEST_REJECTED', 'CLIENT_UPDATE_REQUIRED', 'TASK_CHANGED', 'DUPLICATE_TASK',
  'SIMILAR_TASK', 'TASK_FORMAT_INVALID', 'FILE_LOCKED', 'ARCHIVE_CONFLICT', 'STORAGE_UNAVAILABLE'])

export function validateTaskOperation(value) {
  if (!value || typeof value !== 'object' || !['add', 'edit', 'complete', 'remove'].includes(value.operation))
    throw new TodoistRequestError('请选择有效的任务操作。')
  if (value.operation === 'add' && (typeof value.fields?.name !== 'string' || !value.fields.name.trim())) throw new TodoistRequestError('请输入任务名称。')
  if (value.operation !== 'add' && (!Array.isArray(value.targets) || !value.targets.length
    || value.targets.some(target => !target || !/^[a-f0-9]{64}$/.test(target.key) || !/^[a-f0-9]{64}$/.test(target.version))))
    throw new TodoistRequestError('任务信息已过期，请刷新后重新选择。')
  if (new TextEncoder().encode(JSON.stringify(value)).length > 16384) throw new TodoistRequestError(messages.INPUT_TOO_LARGE)
  return value
}

export function describeTaskOperation(operation) {
  const names = { add: '添加任务', edit: '修改任务', complete: '完成任务', remove: '删除任务' }
  return `${names[operation.operation]}：${operation.fields?.name || `${operation.targets?.length || 0} 项`}`
}

export const todoistTaskCommands = Object.freeze(['添加任务', '完成任务', '修改任务', '删除任务'])

export function composeTodoistTask(command, value) {
  if (!todoistTaskCommands.includes(command)) throw new TodoistRequestError('请选择任务操作。')
  const content = validateTodoistInput(value)
  return validateTodoistInput(`${command}：${content}`)
}

export function validateTodoistInput(value) {
  const input = typeof value === 'string' ? value : ''
  if (!input.trim()) throw new TodoistRequestError('请输入指令。')
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

export async function submitTodoist(input, requestId, signal, resume = false, onStatus = null) {
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
          ...(query ? {} : { body: JSON.stringify(typeof input === 'object'
            ? { ...validateTaskOperation(input), requestId } : { input, requestId }) }), signal: controller.signal
        })
        data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => null) : null
      } finally { clearTimeout(requestTimer) }
      if (!response.ok || data?.status === 'failed') {
        if (data?.status === 'failed' && data.requestId !== requestId) throw new TodoistRequestError(messages.RESULT_UNKNOWN, true)
        const code = data?.code
        const message = Object.hasOwn(messages, code) ? messages[code] : messages.RESULT_UNKNOWN
        // 查询返回同一请求的确定拒绝结果，可解除未知状态；普通 HTTP 错误不能证明旧请求未执行。
        const notSubmitted = notSubmittedCodes.has(code) && (!query || data?.status === 'failed')
        throw new TodoistRequestError(message, !notSubmitted, notSubmitted, { code, duplicates: data?.duplicates, confirmation: data?.confirmation })
      }
      if (data?.requestId !== requestId) throw new TodoistRequestError(messages.RESULT_UNKNOWN, true)
      if (data.status === 'completed' && typeof data.output === 'string') return data.output
      // 结果未知是明确的终态：可能已执行，绝不自动重发，只能再按 requestId 查询。
      if (data.status === 'unknown') {
        const message = Object.hasOwn(messages, data.code) ? messages[data.code] : messages.RESULT_UNKNOWN
        throw new TodoistRequestError(message, true, false, { code: data.code })
      }
      // 队列化后提交可能仍在排队，排队中与执行中都继续轮询。
      if (data.status !== 'running' && data.status !== 'queued') throw new TodoistRequestError(messages.RESULT_UNKNOWN, true)
      onStatus?.(data.status)
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

const taskPriorities = new Set(['P0', 'P1', 'P2', 'P3'])

// 只读任务列表接口：后端解析任务文件返回结构化 JSON，不经会话、不携带请求正文。
export async function fetchTodoistTasks(signal) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const timer = setTimeout(abort, 20000)
  let response, data
  try {
    response = await fetch('/api/todoist/tasks', {
      method: 'GET', headers: { Accept: 'application/json' },
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal
    })
    data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => null) : null
  } catch (error) {
    if (controller.signal.aborted && signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    throw new TodoistRequestError(messages.TASKS_UNAVAILABLE)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
  if (!response.ok) {
    const code = data?.code
    throw new TodoistRequestError(Object.hasOwn(messages, code) ? messages[code] : messages.TASKS_UNAVAILABLE)
  }
  if (!data || !Array.isArray(data.tasks)) throw new TodoistRequestError(messages.TASKS_UNAVAILABLE)
  // 结构校验：任何一项不符合契约都不渲染，避免把异常响应当成任务列表。
  for (const task of data.tasks) {
    const valid = task && Number.isSafeInteger(task.id) && typeof task.content === 'string' && task.content
      && taskPriorities.has(task.priority) && typeof task.due === 'string' && typeof task.overdue === 'boolean'
    if (!valid || !/^[a-f0-9]{64}$/.test(task.key) || !/^[a-f0-9]{64}$/.test(task.version)
      || typeof task.note !== 'string') throw new TodoistRequestError(messages.TASKS_UNAVAILABLE)
  }
  return data.tasks
}
