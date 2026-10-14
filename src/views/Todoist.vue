<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useTodoistRequest } from '../composables/useTodoistRequest.js'
import { composeTodoistTask, todoistTaskCommands } from '../api/todoist.js'

const input = ref('')
const command = ref(todoistTaskCommands[0])
const { state, run, dispose, acknowledge } = useTodoistRequest()
function submitTask() {
  // 未知结果时仍只查询原请求，不因当前选择或内容改变而重发操作。
  if (state.uncertain) return run()
  try { run(composeTodoistTask(command.value, input.value)) }
  catch (error) { state.error = error.message }
}
onBeforeUnmount(dispose)
</script>

<template>
  <section class="page tool-page todoist-page">
    <h1 class="visually-hidden">todoist</h1>
    <form class="tool-form" :aria-busy="state.pending" @submit.prevent="submitTask">
      <fieldset class="form-fields" :disabled="state.pending || state.uncertain">
        <legend class="visually-hidden">任务操作，单选</legend>
        <div class="mode-picker todoist-command-picker" role="radiogroup" aria-label="任务操作">
          <label v-for="option in todoistTaskCommands" :key="option" :class="{ selected: command === option }">
            <input v-model="command" type="radio" name="todoist-command" :value="option">{{ option }}
          </label>
        </div>
      </fieldset>
      <div class="form-field">
        <label id="todoist-input-label" for="todoist-input">任务内容</label>
        <textarea id="todoist-input" v-model="input" class="todoist-input" rows="3"
          :disabled="state.pending || state.uncertain" aria-describedby="todoist-hint"
          autocomplete="off" spellcheck="false" placeholder="输入任务名称、编号或需要修改的内容…"></textarea>
        <p id="todoist-hint" class="visually-hidden">填写任务名称、编号或需要修改的内容。</p>
      </div>
      <div class="form-actions">
        <button class="button button-primary" type="submit" :disabled="state.pending">{{ state.pending ? '处理中…' : state.uncertain ? '查询原请求结果' : '提交' }}</button>
        <button v-if="state.uncertain" class="button button-secondary" type="button" :disabled="state.pending" @click="acknowledge">已核对原会话，开始新请求</button>
        <span v-if="state.pending" class="request-status" role="status">正在等待处理结果，请勿重复提交。</span>
      </div>
      <div class="todoist-list-actions">
        <button class="button button-secondary" type="button" :disabled="state.pending || state.uncertain" @click="run('输出全部待办')">输出全部待办</button>
      </div>
    </form>
    <section class="result-panel" aria-labelledby="todoist-output-label" :aria-busy="state.pending">
      <div class="result-heading"><h2 id="todoist-output-label">输出</h2></div>
      <p v-if="state.error" class="error-message" role="alert">{{ state.error }}</p>
      <pre class="result-text todoist-output" aria-live="polite">{{ state.result ?? (state.pending ? '等待回复…' : '处理结果会显示在这里。') }}</pre>
    </section>
  </section>
</template>

<style>
/* 紧凑模式只对当前 todoist 路由生效，长内容在输入／输出框内滚动。 */
.app-shell.todoist-shell { height: 100dvh; min-height: 0; }
.todoist-shell .workspace, .todoist-shell main { min-height: 0; }
.todoist-shell .sidebar { min-height: 0; overflow: auto; }
.todoist-shell .topbar, .todoist-shell .footer { display: none; }
.todoist-page { height: 100%; display: flex; flex-direction: column; padding: 16px 24px; overflow: auto; }
.todoist-page .tool-form { flex: none; padding: 12px; border-radius: 6px; }
.todoist-page .form-field > label { margin-bottom: 6px; }
.todoist-page .form-actions { margin-top: 8px; gap: 8px; }
.todoist-page .result-panel { display: flex; flex-direction: column; flex: 1; min-height: 96px; margin-top: 10px; padding: 12px; border-radius: 6px; }
.todoist-command-picker { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; margin-bottom: 8px; }
.todoist-command-picker label { justify-content: center; min-height: 36px; padding: 6px 8px; }
.todoist-list-actions { margin-top: 8px; }
.todoist-page .todoist-input { height: 96px; min-height: 0; overflow: auto; resize: none; padding: 10px; line-height: 1.6; font-size: 16px; }
.todoist-page .todoist-output { flex: 1; min-height: 0; max-height: none; overflow: auto; margin: 8px 0 0; font-family: inherit; }
@media (max-width: 700px) {
  .app-shell.todoist-shell { display: flex; flex-direction: column; }
  .todoist-shell .sidebar { flex: none; padding: 8px 12px; }
  .todoist-shell .brand { display: none; }
  .todoist-shell .sidebar nav { margin-top: 0; gap: 4px; }
  .todoist-shell .nav-link { padding: 9px 8px; font-size: 12px; }
  .todoist-shell .workspace { flex: 1; }
  .todoist-page { padding: 10px 12px; }
  .todoist-command-picker { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .todoist-page .todoist-input { height: 72px; }
}
</style>
