<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { encryptText, decryptText } from '../api/tools.js'
import { validateCipherInput } from '../forms/validation.js'
import { useToolRequest } from '../composables/useToolRequest.js'
import ToolResult from '../components/ToolResult.vue'

// 敏感输入仅保存在当前页面内存中，不写入日志、URL 或浏览器持久存储。
const form = reactive({ key: '', pwd: '' })
const mode = ref('decrypt')
const keyInput = ref(null)
const autoCopyMessage = ref('')
const { state, run, reset } = useToolRequest()

// 桌面端打开页面即可直接输入密钥；手机端不聚焦，避免自动弹出虚拟键盘。
onMounted(() => {
  if (window.matchMedia('(min-width: 701px)').matches) keyInput.value?.focus()
})

// 在请求状态管理内部校验，校验失败也会恢复按钮并显示安全提示。
async function submit() {
  autoCopyMessage.value = ''
  await run(signal => {
    const input = validateCipherInput(form, mode.value)
    return mode.value === 'encrypt' ? encryptText(input, signal) : decryptText(input, signal)
  })
  // 解密成功自动复制结果，方便直接粘贴；剪贴板不可用时不重试，提示改用手动复制。
  if (mode.value === 'decrypt' && state.result !== null && !state.error) {
    try {
      await navigator.clipboard.writeText(state.result)
      autoCopyMessage.value = '解密结果已复制到剪贴板。'
    } catch {
      autoCopyMessage.value = '自动复制未成功，请使用「复制结果」按钮。'
    }
  }
}

// 先取消请求并失效旧结果，再清空输入；不代表可撤销已发出的网络请求。
function resetForm() {
  reset()
  autoCopyMessage.value = ''
  form.key = ''
  form.pwd = ''
}

// 切换模式保留输入，只清除结果和状态；离开页面同样取消未完成操作。
function changeMode() { reset(); autoCopyMessage.value = '' }
onBeforeUnmount(reset)
</script>

<template>
  <section class="page tool-page cryption-page">
    <!-- 紧凑头部：标题与说明同一行，整页内容控制在一屏内。 -->
    <header class="cryption-head">
      <div class="cryption-title">
        <p class="eyebrow">TEXT UTILITY / 01</p>
        <h1>文本加解密</h1>
      </div>
      <p class="page-description">一把密钥，一段文本。加密新内容，或解密已有内容。</p>
    </header>
    <div class="cryption-body">
      <!-- 使用统一自定义校验；等待时禁用输入，重置按钮保留可用以便取消。 -->
      <form class="tool-form cryption-form" novalidate :aria-busy="state.pending" @submit.prevent="submit" @reset.prevent="resetForm">
        <fieldset :disabled="state.pending" class="form-fields">
          <legend class="visually-hidden">加解密输入</legend>
          <div class="mode-picker" role="group" aria-label="操作方式">
            <label :class="{ selected: mode === 'encrypt' }"><input v-model="mode" type="radio" value="encrypt" name="mode" @change="changeMode">加密文本</label>
            <label :class="{ selected: mode === 'decrypt' }"><input v-model="mode" type="radio" value="decrypt" name="mode" @change="changeMode">解密文本</label>
          </div>
          <div class="form-field">
            <label for="cipher-key">密钥<span class="required-label">必填</span></label>
            <input id="cipher-key" ref="keyInput" v-model="form.key" type="password" autocomplete="off" spellcheck="false" aria-describedby="key-hint" required>
            <p id="key-hint" class="field-hint">使用同一把密钥，空格会原样保留。最多 1 KiB，按 UTF-8 字节计算。</p>
          </div>
          <div class="form-field text-field">
            <label for="cipher-text">{{ mode === 'encrypt' ? '待加密文本' : '待解密密文' }}</label>
            <textarea id="cipher-text" v-model="form.pwd" rows="7" autocomplete="off" spellcheck="false" aria-describedby="text-hint" :placeholder="mode === 'encrypt' ? '输入或粘贴文本…' : '粘贴完整密文…'"></textarea>
            <p id="text-hint" class="field-hint">{{ mode === 'encrypt' ? '支持中文、多行和空文本，最多 64 KiB。' : '请保留完整密文，支持换行，最多 128 KiB。' }}按 UTF-8 字节计算，超限不会截断。</p>
          </div>
        </fieldset>
        <p v-if="state.error" class="error-message" role="alert">{{ state.error }}</p>
        <div class="form-actions">
          <button class="button button-primary" type="submit" :disabled="state.pending">{{ state.pending ? '处理中…' : mode === 'encrypt' ? '加密文本' : '解密文本' }}</button>
          <button class="button" type="reset">{{ state.pending ? '取消并重置' : '重置' }}</button>
          <span class="request-status" role="status">{{ state.pending ? '正在处理，请稍候。' : autoCopyMessage }}</span>
        </div>
      </form>
      <!-- 结果栏常驻右侧：无结果时显示占位提示，布局不随结果出现而跳动。 -->
      <aside class="cryption-side">
        <ToolResult :result="state.result" :title="mode === 'encrypt' ? '加密结果' : '解密结果'" />
        <p v-if="state.result === null" class="cryption-placeholder">提交后，加密或解密的结果会显示在这里。</p>
        <p class="privacy-note">输入会发送给本站服务处理，请在可信的 HTTPS 页面使用。当前工具兼容旧密文，不适合需要验证内容是否被篡改的场景。</p>
      </aside>
    </div>
  </section>
</template>

<style>
/* 加解密页专用紧凑布局：选择器均限定在本页类名下，不影响其他工具页。 */
/* 桌面端占满一屏：配合 ToolLayout 的 cryption-shell，输入与结果左右分栏、随高度伸缩。 */
@media (min-width: 701px) {
  .cryption-page { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 28px 48px 24px; }
  .cryption-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
  .cryption-head .eyebrow { margin: 0 0 8px; }
  .cryption-head h1 { font-size: 26px; letter-spacing: -.02em; }
  .cryption-head .page-description { margin: 0 0 4px; max-width: 300px; text-align: right; font-size: 12px; line-height: 1.8; }
  .cryption-body { flex: 1; min-height: 0; margin-top: 18px; display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 20px; }
  .cryption-form { display: flex; flex-direction: column; min-height: 0; padding: 20px 24px; }
  .cryption-form .form-fields { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .cryption-form .mode-picker { margin-bottom: 16px; }
  .cryption-form .form-field + .form-field { margin-top: 14px; }
  .cryption-form .form-field > label { margin-bottom: 7px; }
  .cryption-form .text-field { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .cryption-form .text-field textarea { flex: 1; min-height: 96px; resize: none; }
  .cryption-form .field-hint { margin-top: 7px; }
  .cryption-form .error-message { margin: 14px 0 0; }
  .cryption-form .form-actions { margin-top: 16px; }
  .cryption-side { display: flex; flex-direction: column; gap: 14px; min-height: 0; }
  .cryption-page .result-panel { flex: 1; min-height: 0; margin-top: 0; display: flex; flex-direction: column; padding: 18px 22px; }
  .cryption-page .result-heading { flex: none; }
  .cryption-page .result-text { flex: 1; min-height: 0; max-height: none; margin: 12px 0 0; overflow: auto; }
  .cryption-page .copy-message { margin-top: 8px; }
  .cryption-placeholder { flex: 1; min-height: 0; margin: 0; display: grid; place-items: center; padding: 22px; border: 1px dashed var(--border); border-radius: 14px; background: #f2f4ee; color: var(--muted); font-size: 13px; }
  .cryption-page .privacy-note { margin: 0; font-size: 11px; line-height: 1.7; }
}

/* 手机端占满一屏：配合 cryption-shell，表单随剩余高度伸缩，结果区限高内部滚动。 */
@media (max-width: 700px) {
  .cryption-page { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 16px 16px 14px; }
  .cryption-head .eyebrow { margin: 0 0 5px; }
  .cryption-head h1 { font-size: 22px; }
  .cryption-head .page-description { margin: 6px 0 0; font-size: 12px; line-height: 1.6; }
  .cryption-body { flex: 1; min-height: 0; margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
  .cryption-form { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 14px 16px; }
  .cryption-form .form-fields { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .cryption-form .mode-picker { margin-bottom: 12px; }
  .cryption-form .form-field + .form-field { margin-top: 10px; }
  .cryption-form .form-field > label { margin-bottom: 6px; }
  .cryption-form .form-field > input, .cryption-form .form-field > textarea { padding: 10px 12px; }
  .cryption-form .text-field { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .cryption-form .text-field textarea { flex: 1; min-height: 64px; resize: none; }
  .cryption-form .field-hint { margin-top: 6px; font-size: 11px; }
  .cryption-form .error-message { margin: 10px 0 0; }
  .cryption-form .form-actions { margin-top: 12px; }
  .cryption-side { flex: none; display: grid; gap: 10px; min-height: 0; }
  .cryption-page .result-panel { margin-top: 0; padding: 14px 16px; }
  .cryption-page .result-text { max-height: 120px; margin: 10px 0 0; }
  .cryption-placeholder { display: none; }
  .cryption-page .privacy-note { margin: 0; font-size: 11px; line-height: 1.6; }
  /* 手机端空间紧张：出现结果时收起底部提示，清空结果后恢复。 */
  .cryption-page .result-panel ~ .privacy-note { display: none; }
}
</style>
