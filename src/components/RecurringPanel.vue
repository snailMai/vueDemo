<script setup>
// todoist 页面「定时任务」弹窗的内容：定时任务的查看、新增、修改、删除。
// 当前为内存演示数据，不接后端、不读写浏览器持久存储，刷新还原。
// 结构复用 .todoist-page 的全局样式，只追加少量前缀样式。
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  describeSchedule,
  fmtDateTime,
  formatCountdown,
  nextRun,
  PRIORITIES,
  SCHEDULE_KINDS,
  validateSchedule,
  WEEKDAYS,
} from '../lib/recurring.js'
import {
  addRecurringTask,
  recurringTasks,
  removeRecurringTasks,
  resetRecurringTasks,
  updateRecurringTask,
} from '../state/recurringDemo.js'

const now = ref(new Date())
let clockTimer = null

const selected = ref(new Set())
const addInput = ref('')
const addKind = ref('daily')
const addWeekdays = ref([1])
const addDay = ref(10)
const addTime = ref('10:00')
const addPriority = ref('P1')
const addNote = ref('')
const deletion = ref(null)
const editingId = ref(null)
const editForm = reactive({
  name: '',
  kind: 'daily',
  weekdays: [1],
  day: 10,
  time: '10:00',
  priority: 'P1',
  note: '',
})

const emit = defineEmits(['notice', 'close'])

const rows = computed(() =>
  recurringTasks
    .map((task) => ({ task, next: nextRun(task.schedule, now.value) }))
    .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity)),
)
const selectedCount = computed(() => selected.value.size)
const selectionInfo = computed(() => (selectedCount.value ? `已选 ${selectedCount.value} 项` : '未勾选任务'))
const allChecked = computed(() => rows.value.length > 0 && rows.value.every(({ task }) => selected.value.has(task.id)))
const partlyChecked = computed(() => !allChecked.value && rows.value.some(({ task }) => selected.value.has(task.id)))

function toggleTask(id, checked) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

function toggleAll(checked) {
  const next = new Set(selected.value)
  for (const { task } of rows.value) {
    if (checked) next.add(task.id)
    else next.delete(task.id)
  }
  selected.value = next
}

function clearSelection() {
  selected.value = new Set()
}

function buildSchedule(source) {
  const schedule = { kind: source.kind, time: source.time }
  if (source.kind === 'weekly') schedule.weekdays = [...source.weekdays].sort()
  if (source.kind === 'monthly-day') schedule.day = source.day
  return schedule
}

function addTask() {
  const name = addInput.value.trim()
  if (!name) return
  const schedule = buildSchedule({ kind: addKind.value, time: addTime.value, weekdays: addWeekdays.value, day: addDay.value })
  if (!validateSchedule(schedule)) {
    emit('notice', { kind: 'error', text: '周期设置无效，请检查执行时间、星期或日期。' })
    return
  }
  if (recurringTasks.some((t) => t.name === name)) {
    emit('notice', { kind: 'error', text: `已有同名定时任务「${name}」，未添加。` })
    return
  }
  addRecurringTask({ name, schedule, priority: addPriority.value, note: addNote.value.trim() || '无' })
  addInput.value = ''
  emit('notice', { kind: 'ok', text: `已新增定时任务「${name}」（${describeSchedule(schedule)}，演示数据，刷新后还原）。` })
}

function startEdit() {
  if (selectedCount.value !== 1) return
  const id = [...selected.value][0]
  const task = recurringTasks.find((item) => item.id === id)
  if (!task) return
  editingId.value = id
  Object.assign(editForm, {
    name: task.name,
    kind: task.schedule.kind,
    weekdays: [...(task.schedule.weekdays ?? [1])],
    day: task.schedule.day ?? 10,
    time: task.schedule.time,
    priority: task.priority,
    note: task.note === '无' ? '' : task.note,
  })
}

function confirmEdit() {
  if (editingId.value === null || !editForm.name.trim()) return
  const schedule = buildSchedule(editForm)
  if (!validateSchedule(schedule)) {
    emit('notice', { kind: 'error', text: '周期设置无效，请检查执行时间、星期或日期。' })
    return
  }
  const name = editForm.name.trim()
  if (recurringTasks.some((t) => t.name === name && t.id !== editingId.value)) {
    emit('notice', { kind: 'error', text: `已有同名定时任务「${name}」，未修改。` })
    return
  }
  updateRecurringTask(editingId.value, { name, schedule, priority: editForm.priority, note: editForm.note.trim() || '无' })
  editingId.value = null
  selected.value = new Set()
  emit('notice', { kind: 'ok', text: `已修改定时任务「${name}」（演示数据，刷新后还原）。` })
}

function cancelEdit() {
  editingId.value = null
}

function deleteSelected() {
  if (!selectedCount.value) return
  deletion.value = recurringTasks.filter((task) => selected.value.has(task.id))
}

function confirmDeletion() {
  const removed = deletion.value
  if (!removed?.length) return
  deletion.value = null
  removeRecurringTasks(new Set(selected.value))
  selected.value = new Set()
  emit('notice', { kind: 'ok', text: `已删除 ${removed.length} 个定时任务（演示数据，刷新后还原）。` })
}

function resetDemo() {
  resetRecurringTasks()
  selected.value = new Set()
  editingId.value = null
  emit('notice', { kind: 'pending', text: '已还原为内置演示数据。' })
}

onMounted(() => {
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
})
onBeforeUnmount(() => clearInterval(clockTimer))
</script>

<template>
  <!-- 弹窗头部：标题、演示标识、还原与关闭 -->
  <div class="recurring-head">
    <strong>定时任务</strong>
    <span class="demo-badge">演示数据</span>
    <span class="head-spacer"></span>
    <button class="head-btn" type="button" title="还原为内置演示数据" @click="resetDemo">还原</button>
    <button class="head-btn close" type="button" aria-label="关闭定时任务" @click="emit('close')">×</button>
  </div>

  <!-- 查看：定时任务列表（按下次执行时间排序，每秒刷新倒计时） -->
  <section class="list-panel recurring-panel" aria-label="定时任务列表">
    <div class="list-head">
      <input type="checkbox" aria-label="全选定时任务" :checked="allChecked" :indeterminate="partlyChecked"
        :disabled="!rows.length" @change="toggleAll($event.target.checked)">
      <span class="head-title">{{ rows.length }} 个任务</span>
      <span class="head-spacer"></span>
      <button v-if="selectedCount" class="clear-selection" type="button" @click="clearSelection">清除勾选</button>
    </div>
    <ul class="task-list">
      <li v-if="!rows.length" class="empty-state">
        暂无定时任务。<br>在下方添加，新增后按周期自动生成待办。
      </li>
      <li v-for="{ task, next } in rows" :key="task.id" class="task" :class="{ checked: selected.has(task.id) }">
        <input type="checkbox" :checked="selected.has(task.id)" :aria-label="`勾选定时任务 ${task.name}`"
          @change="toggleTask(task.id, $event.target.checked)">
        <span class="task-content">
          {{ task.name }}<template v-if="task.note && task.note !== '无'"> -- {{ task.note }}</template>
        </span>
        <span v-if="task.builtin" class="badge builtin">内置</span>
        <span class="task-schedule">{{ describeSchedule(task.schedule) }}</span>
        <span class="task-due" :class="{ overdue: next && next - now < 3600 * 1000 }">
          <template v-if="next">{{ fmtDateTime(next) }} · {{ formatCountdown(next, now) }}后</template>
          <template v-else>—</template>
        </span>
        <span class="badge" :class="task.priority.toLowerCase()">{{ task.priority }}</span>
      </li>
    </ul>
  </section>

  <!-- 新增 / 修改 / 删除 -->
  <div class="action-bar recurring-actions">
    <div v-if="deletion" class="notice show error" role="alert">
      <span>将删除 {{ deletion.length }} 个定时任务（演示数据，刷新后还原）。</span>
      <button class="btn btn-danger" type="button" @click="confirmDeletion">确认删除</button>
      <button class="btn" type="button" @click="deletion = null">取消</button>
    </div>

    <!-- 内联修改：单选后出现，字段预填 -->
    <template v-if="editingId !== null">
      <div v-if="editForm.kind === 'weekly'" class="edit-row recurring-weekdays">
        <span class="weekday-label">每周</span>
        <button v-for="(label, w) in WEEKDAYS" :key="w" type="button"
          :class="{ active: editForm.weekdays.includes(w) }" @click="
            editForm.weekdays.includes(w)
              ? editForm.weekdays = editForm.weekdays.filter(x => x !== w)
              : editForm.weekdays = [...editForm.weekdays, w]">
          {{ label }}
        </button>
      </div>
      <div class="edit-row">
        <input v-model="editForm.name" type="text" aria-label="修改任务名称" placeholder="任务名称…" autocomplete="off">
        <fieldset class="add-kind">
          <legend>周期类型</legend>
          <select v-model="editForm.kind" aria-label="修改周期类型">
            <option v-for="k in SCHEDULE_KINDS" :key="k.kind" :value="k.kind">{{ k.label }}</option>
          </select>
        </fieldset>
        <fieldset class="add-kind narrow">
          <legend>{{ editForm.kind === 'monthly-day' ? '每月第几日' : '执行时间' }}</legend>
          <input v-if="editForm.kind === 'monthly-day'" v-model.number="editForm.day" type="number" min="1" max="28" aria-label="每月第几日">
          <input v-model="editForm.time" type="time" aria-label="执行时间（北京时间）">
        </fieldset>
        <label v-for="priority in PRIORITIES" :key="priority">
          <input v-model="editForm.priority" type="radio" name="recurring-edit-priority" :value="priority">{{ priority }}
        </label>
        <input v-model="editForm.note" type="text" aria-label="修改备注" placeholder="备注，不填为无" autocomplete="off">
        <button class="btn btn-primary" type="button" :disabled="!editForm.name.trim()" @click="confirmEdit">确认修改</button>
        <button class="btn" type="button" @click="cancelEdit">取消</button>
      </div>
    </template>

    <!-- 新增 -->
    <div v-if="addKind === 'weekly'" class="edit-row recurring-weekdays">
      <span class="weekday-label">每周</span>
      <button v-for="(label, w) in WEEKDAYS" :key="w" type="button"
        :class="{ active: addWeekdays.includes(w) }" @click="
          addWeekdays.includes(w)
            ? addWeekdays = addWeekdays.filter(x => x !== w)
            : addWeekdays = [...addWeekdays, w]">
        {{ label }}
      </button>
    </div>

    <div class="add-row">
      <fieldset class="add-kind">
        <legend>周期类型</legend>
        <select v-model="addKind" aria-label="周期类型">
          <option v-for="k in SCHEDULE_KINDS" :key="k.kind" :value="k.kind">{{ k.label }}</option>
        </select>
      </fieldset>
      <fieldset class="add-kind narrow">
        <legend>{{ addKind === 'monthly-day' ? '每月第几日' : '执行时间' }}</legend>
        <input v-if="addKind === 'monthly-day'" v-model.number="addDay" type="number" min="1" max="28" aria-label="每月第几日">
        <input v-model="addTime" type="time" aria-label="执行时间（北京时间）">
      </fieldset>
      <fieldset class="add-priority">
        <legend>新增级别</legend>
        <label v-for="priority in PRIORITIES" :key="priority">
          <input v-model="addPriority" type="radio" name="recurring-add-priority" :value="priority">{{ priority }}
        </label>
      </fieldset>
      <input v-model="addInput" type="text" aria-label="新定时任务名称" placeholder="输入新定时任务名称，回车或点按钮添加…" autocomplete="off"
        @keydown.enter="!$event.isComposing && addTask()">
      <button class="btn btn-primary" type="button" :disabled="!addInput.trim()" @click="addTask">添加任务</button>
    </div>
    <div class="add-row note-row">
      <input v-model="addNote" type="text" aria-label="备注" placeholder="备注，不填为无" autocomplete="off">
    </div>

    <div class="batch-row">
      <span class="selection-info">{{ selectionInfo }}</span>
      <button class="btn btn-primary" type="button" :disabled="selectedCount !== 1" @click="startEdit">修改选中</button>
      <button class="btn btn-danger" type="button" :disabled="!selectedCount" @click="deleteSelected">删除选中</button>
    </div>
  </div>
</template>

<style>
/* 定时弹窗的少量补充样式，全部挂在既有 todoist 页面类下，避免外溢。 */
.todoist-page .recurring-head { display: flex; align-items: center; gap: 8px; padding: 2px 2px 0; flex: none; }
.todoist-page .recurring-head strong { font-size: 15px; color: #2f543a; }
.todoist-page .recurring-head .head-spacer { flex: 1; }
.todoist-page .head-btn { border: 1px solid var(--border); border-radius: 7px; background: #fff; color: #425345; font-size: 12px; padding: 4px 10px; }
.todoist-page .head-btn:hover { background: #eef2e9; }
.todoist-page .head-btn.close { font-size: 15px; line-height: 1; padding: 3px 9px; }
.todoist-page .demo-badge {
  flex: none; padding: 2px 9px; border-radius: 999px; font-size: 11px;
  color: var(--amber); background: var(--amber-soft); border: 1px solid #e8d9bd;
}
.todoist-page .badge.builtin { min-width: 0; color: #5a655c; background: #eef1e9; border: 1px solid var(--border); }
.todoist-page .task-schedule { flex: none; color: var(--muted); font-size: 12px; white-space: nowrap; }
.todoist-page .add-kind { display: flex; gap: 4px; flex: none; margin: 0; padding: 0 6px 4px; border: 1px solid var(--border); border-radius: 7px; background: #fff; }
.todoist-page .add-kind legend { padding: 0 4px; font-size: 11px; color: var(--muted); }
.todoist-page .add-kind select, .todoist-page .add-kind input {
  border: 0; background: transparent; padding: 6px 2px; font-size: 13px; color: #202a22; min-width: 0;
}
.todoist-page .add-kind.narrow input[type="number"] { width: 54px; }
.todoist-page .add-row.note-row input { flex: 1; padding: 9px 13px; border: 1px solid #cdd6cb; border-radius: 7px; background: #fff; font-size: 14px; }
.todoist-page .recurring-weekdays button { padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; font-size: 12px; color: #425345; }
.todoist-page .recurring-weekdays button.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 600; }
.todoist-page .weekday-label { color: var(--muted); font-size: 12px; }

/* 弹窗外罩与对话框尺寸：复用 todoist 单屏的紧凑密度。 */
.recurring-mask { position: fixed; inset: 0; background: rgba(32, 42, 34, .45); display: grid; place-items: center; padding: 16px; z-index: 50; }
.recurring-dialog {
  display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 12px;
  width: min(780px, 96vw); height: min(780px, 92dvh);
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(32, 42, 34, .28);
}
.recurring-dialog .list-panel { flex: 1; min-height: 0; }

@media (max-width: 700px) {
  .todoist-page .task-schedule { display: none; } /* 窄屏隐藏周期规则，保内容 + 下次执行 */
  .todoist-page .add-kind { flex-basis: 100%; }
  .recurring-mask { padding: 0; }
  .recurring-dialog { width: 100vw; height: 100dvh; border-radius: 0; }
}
</style>
