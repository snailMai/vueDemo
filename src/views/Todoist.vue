<script setup>
// 任务列表和增删改均由本地后端处理；前端不生成目标、完成标准等业务字段。
// 提交即返回、可连续提交：本地立即乐观更新，失败回滚，结果未知不回滚也不重发。
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useTodoistQueue } from '../composables/useTodoistQueue.js'
import { fetchTodoistTasks, TodoistRequestError } from '../api/todoist.js'
import RecurringPanel from '../components/RecurringPanel.vue'

const NOTICE_TIMEOUT = 8000
const todoistPriorities = Object.freeze(['P0', 'P1', 'P2', 'P3'])
// 日志徽标的显示文本与样式类名。
const statusMeta = {
  排队中: { label: '排队中', className: 'queued' },
  执行中: { label: '执行中', className: 'running' },
  成功: { label: '成功', className: 'succeeded' },
  失败: { label: '失败', className: 'failed' },
  结果未知: { label: '结果未知', className: 'unknown' },
  待确认: { label: '待确认', className: 'unknown' },
  已确认: { label: '已确认', className: 'queued' },
  已取消: { label: '已取消', className: 'queued' }
}

const tasks = ref([])
const pendingAdds = ref([])
const activePriority = ref('P2')
// 「定时任务」按钮打开的弹窗：定时任务的查看／新增／修改／删除演示面板，不独立成页。
const showRecurring = ref(false)
const selected = ref(new Set())
const addInput = ref('')
// 新增级别独立于顶部查询分组；连续添加时保留选择。
const addPriority = ref('P2')
const editInput = ref('')
const editPriority = ref('P2')
const editNote = ref('')
const deletion = ref(null)
const editingId = ref(null)
const editInputEl = ref(null)
const loadedOnce = ref(false)
const loading = ref(false)
let loadController = null
let loadPromise = null
let reloadRequested = false
let unmounted = false

const { entries, submit, query, confirm, cancel, dispose } = useTodoistQueue()

// 回复文本只进短暂提示条，不解析进列表。
const notice = ref(null)
let noticeTimer = null
function showNotice(kind, text, sticky = false) {
  clearTimeout(noticeTimer)
  notice.value = { kind, text }
  if (!sticky) noticeTimer = setTimeout(() => { notice.value = null }, NOTICE_TIMEOUT)
}

const counts = computed(() => {
  const result = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const task of tasks.value) result[task.priority]++
  return result
})
const visibleTasks = computed(() => tasks.value.filter(task => task.priority === activePriority.value))
const viewTitle = computed(() => `${activePriority.value} 待办`)
const selectedIds = computed(() => tasks.value.filter(task => selected.value.has(task.key)).map(task => task.id).sort((a, b) => a - b))
const selectedCount = computed(() => selected.value.size)
const selectionInfo = computed(() =>
  selectedCount.value ? `已选 ${selectedCount.value} 项（编号：${selectedIds.value.join('、')}）` : '未勾选任务')
const allChecked = computed(() => visibleTasks.value.length > 0 && visibleTasks.value.every(task => selected.value.has(task.key)))
const partlyChecked = computed(() => !allChecked.value && visibleTasks.value.some(task => selected.value.has(task.key)))
const showEdit = computed(() => editingId.value !== null && selectedCount.value === 1)

// 页面打开与点刷新都调只读接口；切换优先级只是本地过滤，不调接口。
function loadTasks() {
  if (unmounted) return Promise.resolve()
  if (loadPromise) { reloadRequested = true; return loadPromise }
  loadPromise = (async () => {
    let success
    do { reloadRequested = false; success = await readTasks() } while (reloadRequested && !unmounted)
    return success
  })().finally(() => { loadPromise = null })
  return loadPromise
}
async function readTasks() {
  loadController?.abort()
  const controller = new AbortController()
  loadController = controller
  loading.value = true
  try {
    const list = await fetchTodoistTasks(controller.signal)
    tasks.value = list
    const alive = new Set(list.map(task => task.key))
    selected.value = new Set([...selected.value].filter(id => alive.has(id)))
    if (!loadedOnce.value) {
      loadedOnce.value = true
      const first = todoistPriorities.find(priority => list.some(task => task.priority === priority))
      if (first) activePriority.value = first
    }
    return true
  } catch (error) {
    if (error?.name !== 'AbortError') {
      showNotice('error', error instanceof TodoistRequestError ? error.message : '任务列表暂时不可用，请稍后刷新重试。')
    }
    return false
  } finally {
    loading.value = false
  }
}

function submitCommand(command, hooks) {
  try {
    const entry = submit(command, hooks)
    showNotice('pending', `已提交：${entry.command}，进入队列。`)
    return entry
  } catch (error) {
    showNotice('error', error instanceof TodoistRequestError ? error.message : '输入无效，请检查内容后再提交。')
    return null
  }
}

// 命令成功落定后重新读文件对账；添加的「待同步」条目在对账后移除，由真实编号条目替代。
async function settleEntry(entry) {
  const refreshed = await loadTasks()
  pendingAdds.value = pendingAdds.value.filter(item => item.key !== entry.requestId)
  showNotice(refreshed ? 'ok' : 'error', refreshed ? `✓ ${entry.command} 执行成功，列表已更新。` : '任务已处理，但列表刷新失败，请手动刷新。')
}

function addTask() {
  if (!addInput.value.trim()) return
  const content = addInput.value.trim()
  addInput.value = ''
  submitCommand({ operation: 'add', fields: { name: content, priority: addPriority.value } }, {
    // 待同步条目无编号、不可勾选，对账后换成真实编号。
    onSubmitted: entry => { pendingAdds.value = [...pendingAdds.value, { key: entry.requestId, content }] },
    onSuccess: settleEntry,
    onFailure: entry => {
      pendingAdds.value = pendingAdds.value.filter(item => item.key !== entry.requestId)
      if (!addInput.value) addInput.value = content
      showNotice('error', `添加失败：${entry.detail}`)
    },
    onConfirmation: entry => {
      pendingAdds.value = pendingAdds.value.filter(item => item.key !== entry.requestId)
      showNotice('error', entry.detail, true)
    }
  })
}

function completeSelected() {
  if (!selectedCount.value) return
  const keys = new Set(selected.value)
  const removed = tasks.value.filter(task => keys.has(task.key))
  submitCommand({ operation: 'complete', targets: removed.map(task => ({ key: task.key, version: task.version })) }, {
    onSubmitted: () => {
      tasks.value = tasks.value.filter(task => !keys.has(task.key))
      selected.value = new Set()
      editingId.value = null
    },
    onSuccess: settleEntry,
    onFailure: entry => {
      // 失败回滚：把本地移除的任务按编号放回原位。
      tasks.value = [...tasks.value, ...removed.filter(task => !tasks.value.some(current => current.key === task.key))].sort((a, b) => a.id - b.id)
      showNotice('error', `完成失败：${entry.detail}`)
    }
  })
}

function deleteSelected() {
  if (!selectedCount.value) return
  deletion.value = tasks.value.filter(task => selected.value.has(task.key))
}
function confirmDeletion() {
  const removed = deletion.value
  if (!removed?.length) return
  deletion.value = null
  const keys = new Set(removed.map(task => task.key))
  submitCommand({ operation: 'remove', targets: removed.map(task => ({ key: task.key, version: task.version })) }, {
    onSubmitted: () => {
      tasks.value = tasks.value.filter(task => !keys.has(task.key))
      selected.value = new Set()
      editingId.value = null
    },
    onSuccess: settleEntry,
    onFailure: entry => {
      tasks.value = [...tasks.value, ...removed.filter(task => !tasks.value.some(current => current.key === task.key))].sort((a, b) => a.id - b.id)
      showNotice('error', `删除失败：${entry.detail}`)
    }
  })
}

function startEdit() {
  if (selectedCount.value !== 1) return
  const key = [...selected.value][0]
  const task = tasks.value.find(item => item.key === key)
  editingId.value = key
  editInput.value = task?.content ?? ''
  editPriority.value = task?.priority ?? 'P2'
  editNote.value = task?.note === '无' ? '' : task?.note ?? ''
  nextTick(() => editInputEl.value?.focus())
}

function confirmEdit() {
  if (editingId.value === null || !editInput.value.trim()) return
  const key = editingId.value
  const target = tasks.value.find(task => task.key === key)
  if (!target) return
  const content = editInput.value
  const fields = {}
  if (content !== target.content) fields.name = content
  if (editPriority.value !== target.priority) fields.priority = editPriority.value
  if ((editNote.value || '无') !== target.note) fields.note = editNote.value
  if (!Object.keys(fields).length) { cancelEdit(); return }
  const previous = { content: target.content, priority: target.priority, note: target.note }
  submitCommand({ operation: 'edit', targets: [{ key, version: target.version }], fields }, {
    onSubmitted: () => {
      const task = tasks.value.find(item => item.key === key)
      if (task) { task.content = content; task.priority = fields.priority ?? task.priority; task.note = fields.note === undefined ? task.note : fields.note || '无' }
      editingId.value = null
      selected.value = new Set()
    },
    onSuccess: settleEntry,
    onFailure: entry => {
      const task = tasks.value.find(item => item.key === key)
      if (task && task.version === target.version) Object.assign(task, previous)
      showNotice('error', `修改失败：${entry.detail}`)
    },
    onConfirmation: entry => {
      const task = tasks.value.find(item => item.key === key)
      if (task && task.version === target.version) Object.assign(task, previous)
      showNotice('error', entry.detail, true)
    }
  })
}

function cancelEdit() {
  editingId.value = null
}

// 切换优先级是纯前端过滤，不调接口；勾选集保留，便于跨视图批量操作。
function switchPriority(priority) {
  activePriority.value = priority
  editingId.value = null
}

function openRecurring() {
  showRecurring.value = true
}

function toggleTask(id, checked) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

function toggleAll(checked) {
  const next = new Set(selected.value)
  for (const task of visibleTasks.value) {
    if (checked) next.add(task.key)
    else next.delete(task.key)
  }
  selected.value = next
}

function clearSelection() {
  selected.value = new Set()
}

function formatTime(date) {
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

onMounted(loadTasks)
onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(noticeTimer)
  loadController?.abort()
  dispose()
})
</script>

<template>
  <section class="todoist-page">
    <h1 class="visually-hidden">todoist</h1>

    <!-- 查询区：P0–P3 分段控件（带计数角标）与刷新 -->
    <div class="query-bar" role="tablist" aria-label="查询范围">
      <div class="query-tabs">
        <button v-for="priority in todoistPriorities" :key="priority" type="button" role="tab"
          :class="{ active: activePriority === priority }" :aria-selected="activePriority === priority"
          @click="switchPriority(priority)">
          {{ priority }}<span class="count">{{ counts[priority] }}</span>
        </button>
      </div>
      <button class="refresh-btn" type="button" title="管理定时自动任务（演示数据）" @click="openRecurring">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5" />
          <path d="M8 4.5V8l2.5 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        定时任务
      </button>
      <button class="refresh-btn" type="button" :class="{ spinning: loading }" :disabled="loading"
        title="重新读取任务列表" @click="loadTasks">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 2.5v2.8h-2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        刷新
      </button>
    </div>

    <!-- 提示条：提交回执、错误与状态 -->
    <div v-if="notice" class="notice show" :class="notice.kind" :role="notice.kind === 'error' ? 'alert' : 'status'">
      <span class="notice-text">{{ notice.text }}</span>
    </div>

    <!-- 任务列表 -->
    <section class="list-panel" aria-label="待办列表" :aria-busy="loading">
      <div class="list-head">
        <input type="checkbox" aria-label="全选当前列表" :checked="allChecked" :indeterminate="partlyChecked"
          :disabled="!visibleTasks.length" @change="toggleAll($event.target.checked)">
        <span class="head-title">{{ viewTitle }}</span>
        <span class="head-spacer"></span>
        <button v-if="selectedCount" class="clear-selection" type="button" @click="clearSelection">清除勾选</button>
      </div>
      <ul class="task-list">
        <!-- 待同步条目：无编号、不可勾选，刷新对账后换成真实编号 -->
        <li v-for="item in pendingAdds" :key="item.key" class="task syncing">
          <span class="task-id" aria-hidden="true">…</span>
          <span class="task-content">{{ item.content }}</span>
          <span class="badge syncing-badge">待同步</span>
        </li>
        <li v-if="!visibleTasks.length && !pendingAdds.length" class="empty-state">
          「{{ viewTitle }}」暂无待办 🎉<br>换个优先级看看，或在下方添加新任务。
        </li>
        <li v-for="task in visibleTasks" :key="task.key" class="task" :class="{ checked: selected.has(task.key) }">
          <input type="checkbox" :checked="selected.has(task.key)" :aria-label="`勾选任务 ${task.id}`"
            @change="toggleTask(task.key, $event.target.checked)">
          <span class="task-id">{{ task.id }}</span>
          <span class="task-content">{{ task.content }}{{ task.note && task.note !== '无' ? ` -- ${task.note}` : '' }}</span>
          <span class="badge" :class="task.priority.toLowerCase()">{{ task.priority }}</span>
          <span class="task-due" :class="{ overdue: task.overdue }">
            {{ task.overdue ? '已逾期 · ' : '' }}{{ task.due }}
          </span>
        </li>
      </ul>
    </section>

    <!-- 底部操作区：添加、内联修改、勾选驱动的批量操作 -->
    <div class="action-bar">
      <div v-if="deletion" class="notice show error" role="alert">
        <span>将删除 {{ deletion.length }} 项并归档为「已移除」。</span>
        <button class="btn btn-danger" type="button" @click="confirmDeletion">确认删除</button>
        <button class="btn" type="button" @click="deletion = null">取消</button>
      </div>
      <div class="add-row">
        <fieldset class="add-priority">
          <legend>新增级别</legend>
          <label v-for="priority in todoistPriorities" :key="priority">
            <input v-model="addPriority" type="radio" name="add-priority" :value="priority">{{ priority }}
          </label>
        </fieldset>
        <input v-model="addInput" type="text" aria-label="新任务内容" placeholder="输入新任务内容，回车或点按钮添加…" autocomplete="off"
          @keydown.enter="!$event.isComposing && addTask()">
        <button class="btn btn-primary" type="button" :disabled="!addInput.trim()"
          @click="addTask">添加任务</button>
      </div>
      <div v-if="showEdit" class="edit-row">
        <input ref="editInputEl" v-model="editInput" type="text" placeholder="输入修改后的任务内容…" autocomplete="off"
          @keydown.enter="!$event.isComposing && confirmEdit()" @keydown.esc="cancelEdit">
        <button class="btn btn-primary" type="button" :disabled="!editInput.trim()"
          @click="confirmEdit">确认修改</button>
        <button class="btn" type="button" @click="cancelEdit">取消</button>
      </div>
      <div v-if="showEdit" class="edit-row">
        <label v-for="priority in todoistPriorities" :key="priority">
          <input v-model="editPriority" type="radio" name="edit-priority" :value="priority">{{ priority }}
        </label>
        <input v-model="editNote" type="text" aria-label="修改备注" placeholder="备注，不填为无">
      </div>
      <div class="batch-row">
        <span class="selection-info">{{ selectionInfo }}</span>
        <button class="btn btn-primary" type="button" :disabled="!selectedCount"
          @click="completeSelected">完成选中</button>
        <button class="btn" type="button" :disabled="selectedCount !== 1"
          @click="startEdit">修改选中</button>
        <button class="btn btn-danger" type="button" :disabled="!selectedCount"
          @click="deleteSelected">删除选中</button>
      </div>

      <!-- 提交记录：每条命令一行，状态徽标 + 命令原文 + 时间；结果未知可按 requestId 查询 -->
      <div v-if="entries.length" class="cmd-log">
        <div class="cmd-log-head">提交记录（{{ entries.length }}）</div>
        <ul class="cmd-log-list">
          <li v-for="entry in entries" :key="entry.requestId" :title="entry.detail || entry.command">
            <span class="log-badge" :class="statusMeta[entry.status].className">{{ statusMeta[entry.status].label }}</span>
            <span class="log-cmd">{{ entry.command }}</span>
            <button v-if="entry.status === '待确认'" class="log-query" type="button" @click="confirm(entry)">不是重复，继续</button>
            <button v-if="entry.status === '待确认'" class="log-query" type="button" @click="cancel(entry)">取消</button>
            <button v-if="entry.status === '结果未知'" class="log-query" type="button"
              @click="query(entry)">查询结果</button>
            <span class="log-time">{{ formatTime(entry.time) }}</span>
            <div v-if="entry.duplicates.length" class="duplicate-candidates">
              <span v-for="(candidate, index) in entry.duplicates" :key="index">{{ candidate.source === 'archive' ? '归档' : '待办' }} · {{ candidate.priority }} · {{ candidate.name }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 定时任务弹窗：查看／新增／修改／删除（演示数据），复用页面提示条。 -->
    <div v-if="showRecurring" class="recurring-mask" @click.self="showRecurring = false">
      <div class="recurring-dialog" role="dialog" aria-modal="true" aria-label="定时任务管理">
        <RecurringPanel @notice="notice => showNotice(notice.kind, notice.text)" @close="showRecurring = false" />
      </div>
    </div>
  </section>
</template>

<style>
/* 紧凑单屏布局只对当前 todoist 路由生效，结构与样式沿用确认过的高保真 demo。 */
.app-shell.todoist-shell { height: 100dvh; min-height: 0; }
.todoist-shell .workspace, .todoist-shell main { min-height: 0; }
.todoist-shell .sidebar { min-height: 0; overflow: auto; }
.todoist-shell .topbar, .todoist-shell .footer { display: none; }

.todoist-page {
  --accent-soft: #edf2e8;
  --danger: #9b3d2d;
  --danger-soft: #fff3ef;
  --amber: #946c37;
  --amber-soft: #f6f0e4;
  height: 100%; width: 100%; max-width: 860px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 10px; padding: 14px 20px 12px; overflow: auto;
}
.todoist-page button:disabled { cursor: not-allowed; opacity: .45; }

/* ── 查询区 ── */
.todoist-page .query-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: none; }
.todoist-page .query-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 9px; background: #eef1e9; flex: 1; min-width: 0; }
.todoist-page .query-tabs button {
  flex: 1; min-width: 0; padding: 9px 10px; border: 0; border-radius: 6px;
  background: transparent; color: #697466; font-size: 13px; white-space: nowrap;
}
.todoist-page .query-tabs button.active { background: #fff; color: #2f543a; font-weight: 600; box-shadow: 0 1px 3px #20301912; }
.todoist-page .query-tabs .count { margin-left: 6px; font-size: 11px; opacity: .65; font-variant-numeric: tabular-nums; }
.todoist-page .refresh-btn {
  display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 8px 14px;
  border: 1px solid var(--border); border-radius: 7px; background: #fff; color: #425345; font-size: 13px;
}
.todoist-page .refresh-btn:hover:not(:disabled) { background: #eef2e9; }
.todoist-page .refresh-btn.spinning svg { animation: todoist-spin .8s linear infinite; }
@keyframes todoist-spin { to { transform: rotate(360deg); } }

/* ── 提示条 ── */
.todoist-page .notice {
  flex: none; padding: 10px 13px; border-radius: 7px; font-size: 13px; line-height: 1.7;
  max-height: 120px; overflow: auto; overflow-wrap: anywhere;
}
.todoist-page .notice.ok { border: 1px solid #cddfcb; background: var(--accent-soft); color: #2f543a; }
.todoist-page .notice.error { border: 1px solid #efc8bf; background: var(--danger-soft); color: var(--danger); }
.todoist-page .notice.pending { border: 1px solid var(--border); background: #eff3eb; color: var(--muted); }
.todoist-page .notice-text { white-space: pre-wrap; }

/* ── 列表区 ── */
.todoist-page .list-panel {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  border: 1px solid var(--border); border-radius: 12px; background: #fff; overflow: hidden;
}
.todoist-page .list-head {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border-bottom: 1px solid var(--border); background: #fafbf8; font-size: 12px; color: var(--muted);
}
.todoist-page .list-head input { accent-color: var(--accent); width: 15px; height: 15px; margin: 0; }
.todoist-page .list-head .head-title { font-weight: 600; color: #425345; }
.todoist-page .list-head .head-spacer { flex: 1; }
.todoist-page .clear-selection { border: 0; background: none; color: var(--accent); font-size: 12px; padding: 4px 6px; border-radius: 5px; }
.todoist-page .clear-selection:hover { background: var(--accent-soft); }

.todoist-page .task-list { flex: 1; min-height: 0; overflow: auto; margin: 0; padding: 0; list-style: none; }
.todoist-page .task {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-bottom: 1px solid #eef1ea; font-size: 14px;
}
.todoist-page .task:last-child { border-bottom: 0; }
.todoist-page .task:hover { background: #f8faf5; }
.todoist-page .task.checked { background: #f2f6ee; }
.todoist-page .task input[type="checkbox"] { accent-color: var(--accent); width: 17px; height: 17px; margin: 0; flex: none; }
.todoist-page .task-id { flex: none; width: 26px; color: #9da698; font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; }
.todoist-page .task-content { flex: 1; min-width: 0; line-height: 1.5; overflow-wrap: anywhere; }
.todoist-page .task.checked .task-content { color: #6b736c; }
.todoist-page .task-due { flex: none; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.todoist-page .task-due.overdue { color: var(--danger); font-weight: 600; }
.todoist-page .badge {
  flex: none; min-width: 34px; padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 600; text-align: center; letter-spacing: .04em;
}
.todoist-page .badge.p0 { color: var(--danger); background: var(--danger-soft); border: 1px solid #efc8bf; }
.todoist-page .badge.p1 { color: var(--amber); background: var(--amber-soft); border: 1px solid #e8d9bd; }
.todoist-page .badge.p2 { color: #5a655c; background: #eef1e9; border: 1px solid var(--border); }
.todoist-page .badge.p3 { color: #6b6f77; background: #eef0f2; border: 1px solid #dfe2e6; }
/* 待同步条目：无编号、不可勾选，样式弱化以区别于已对账任务。 */
.todoist-page .task.syncing { color: #9da698; background: #fafbf8; }
.todoist-page .syncing-badge { color: var(--amber); background: var(--amber-soft); border: 1px solid #e8d9bd; min-width: 46px; }

.todoist-page .empty-state { padding: 48px 20px; text-align: center; color: var(--muted); font-size: 13px; line-height: 2; }

/* ── 底部操作区 ── */
.todoist-page .action-bar { display: flex; flex-direction: column; gap: 8px; flex: none; }
.todoist-page .add-row { display: flex; align-items: center; gap: 8px; }
.todoist-page .add-priority { display: flex; gap: 2px; flex: none; min-width: 0; margin: 0; padding: 0 4px 4px; border: 1px solid var(--border); border-radius: 7px; background: #fff; }
.todoist-page .add-priority legend { padding: 0 4px; font-size: 11px; color: var(--muted); }
.todoist-page .add-priority label { display: inline-flex; align-items: center; gap: 4px; padding: 5px 6px; border-radius: 5px; font-size: 12px; cursor: pointer; }
.todoist-page .add-priority label:has(input:checked) { background: var(--accent-soft); color: var(--accent); }
.todoist-page .add-priority input { margin: 0; accent-color: var(--accent); }
.todoist-page .add-row > input[type="text"] {
  flex: 1; min-width: 0; padding: 11px 13px; border: 1px solid #cdd6cb; border-radius: 7px;
  background: #fff; color: #202a22; font-size: 16px; line-height: 1.5;
}
.todoist-page .add-row > input[type="text"]:focus { border-color: #6d9b7b; outline: none; }
.todoist-page .batch-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.todoist-page .selection-info { font-size: 12px; color: var(--muted); margin-right: auto; font-variant-numeric: tabular-nums; }
.todoist-page .btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 40px; padding: 9px 16px; border: 1px solid var(--border); border-radius: 7px;
  background: #fff; color: #425345; font-size: 13px; font-weight: 500;
}
.todoist-page .btn:hover:not(:disabled) { background: #eef2e9; }
.todoist-page .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.todoist-page .btn-primary:hover:not(:disabled) { background: #244c33; }
.todoist-page .btn-danger { color: var(--danger); border-color: #efc8bf; }
.todoist-page .btn-danger:hover:not(:disabled) { background: var(--danger-soft); }

/* ── 内联修改编辑 ── */
.todoist-page .edit-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding: 8px; border: 1px dashed #cdd6cb; border-radius: 7px; background: #fafbf8; }
.todoist-page .edit-row label { display: inline-flex; align-items: center; gap: 3px; }
.todoist-page .edit-row input[type="text"] { flex: 1; min-width: 120px; padding: 9px 11px; border: 1px solid #cdd6cb; border-radius: 6px; font-size: 14px; background: #fff; }
.todoist-page .edit-row input[type="text"]:focus { border-color: #6d9b7b; outline: none; }

/* ── 提交记录：每条命令的归宿 ── */
.todoist-page .cmd-log { border: 1px solid var(--border); border-radius: 7px; background: #fafbf8; }
.todoist-page .cmd-log-head { padding: 7px 12px; font-size: 12px; font-weight: 600; color: var(--muted); border-bottom: 1px solid #eef1ea; }
.todoist-page .cmd-log-list { margin: 0; padding: 4px 0; list-style: none; max-height: 132px; overflow: auto; }
.todoist-page .cmd-log-list li { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 5px 12px; font-size: 12px; }
.todoist-page .duplicate-candidates { flex-basis: 100%; display: grid; gap: 3px; overflow-wrap: anywhere; color: var(--muted); }
.todoist-page .log-badge { flex: none; min-width: 44px; padding: 1px 7px; border-radius: 999px; text-align: center; font-size: 11px; font-weight: 600; }
.todoist-page .log-badge.queued { color: #5a655c; background: #eef1e9; }
.todoist-page .log-badge.running { color: var(--amber); background: var(--amber-soft); }
.todoist-page .log-badge.succeeded { color: var(--accent); background: var(--accent-soft); }
.todoist-page .log-badge.failed, .todoist-page .log-badge.unknown { color: var(--danger); background: var(--danger-soft); }
.todoist-page .log-cmd { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #425345; }
.todoist-page .log-query {
  flex: none; padding: 2px 9px; border: 1px solid #efc8bf; border-radius: 5px;
  background: #fff; color: var(--danger); font-size: 11px;
}
.todoist-page .log-query:hover { background: var(--danger-soft); }
.todoist-page .log-time { flex: none; color: #9da698; font-variant-numeric: tabular-nums; }

@media (max-width: 700px) {
  .app-shell.todoist-shell { display: flex; flex-direction: column; }
  .todoist-shell .sidebar { flex: none; padding: 8px 12px; }
  .todoist-shell .brand { display: none; }
  .todoist-shell .sidebar nav { margin-top: 0; gap: 4px; }
  .todoist-shell .nav-link { padding: 9px 8px; font-size: 12px; }
  .todoist-shell .workspace { flex: 1; }
  .todoist-page { padding: 10px 12px 8px; }
  .todoist-page .query-tabs button { font-size: 12px; padding: 9px 6px; }
  .todoist-page .badge.p0, .todoist-page .badge.p1, .todoist-page .badge.p2, .todoist-page .badge.p3 { display: none; } /* 窄屏隐藏优先级徽标，保内容 + 期限 */
  .todoist-page .selection-info { width: 100%; }
  .todoist-page .add-row { flex-wrap: wrap; }
  .todoist-page .add-priority { flex-basis: 100%; }
  .todoist-page .add-priority label { flex: 1; justify-content: center; min-height: 44px; }
  .todoist-page .add-row .btn { flex: none; }
  .todoist-page .task { gap: 8px; padding: 12px 10px; }
  .todoist-page .task-due { font-size: 11px; }
}
</style>
