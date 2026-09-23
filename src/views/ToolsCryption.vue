<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { encryptText, decryptText } from '../api/tools.js'
import { validateCipherInput } from '../forms/validation.js'
import { useToolRequest } from '../composables/useToolRequest.js'
import ToolResult from '../components/ToolResult.vue'

const form = reactive({ key: '', pwd: '' })
const mode = ref('encrypt')
const { state, run, reset } = useToolRequest()

function submit() {
  run(signal => {
    const input = validateCipherInput(form, mode.value)
    return mode.value === 'encrypt' ? encryptText(input, signal) : decryptText(input, signal)
  })
}

function resetForm() {
  reset()
  form.key = ''
  form.pwd = ''
}

function changeMode() { reset() }
onBeforeUnmount(reset)
</script>

<template>
  <section class="page tool-page">
    <p class="eyebrow">TEXT UTILITY / 01</p>
    <h1>文本加解密</h1>
    <p class="page-description">一把密钥，一段文本。加密新内容，或解密已有内容。</p>
    <form class="tool-form" novalidate :aria-busy="state.pending" @submit.prevent="submit" @reset.prevent="resetForm">
      <fieldset :disabled="state.pending" class="form-fields">
        <legend class="visually-hidden">加解密输入</legend>
        <div class="mode-picker" role="group" aria-label="操作方式">
          <label :class="{ selected: mode === 'encrypt' }"><input v-model="mode" type="radio" value="encrypt" name="mode" @change="changeMode">加密文本</label>
          <label :class="{ selected: mode === 'decrypt' }"><input v-model="mode" type="radio" value="decrypt" name="mode" @change="changeMode">解密文本</label>
        </div>
        <div class="form-field">
          <label for="cipher-key">密钥<span class="required-label">必填</span></label>
          <input id="cipher-key" v-model="form.key" type="password" autocomplete="off" spellcheck="false" aria-describedby="key-hint" required>
          <p id="key-hint" class="field-hint">使用同一把密钥，空格会原样保留。最多 1 KiB，按 UTF-8 字节计算。</p>
        </div>
        <div class="form-field">
          <label for="cipher-text">{{ mode === 'encrypt' ? '待加密文本' : '待解密密文' }}</label>
          <textarea id="cipher-text" v-model="form.pwd" rows="7" autocomplete="off" spellcheck="false" aria-describedby="text-hint" :placeholder="mode === 'encrypt' ? '输入或粘贴文本…' : '粘贴完整密文…'"></textarea>
          <p id="text-hint" class="field-hint">{{ mode === 'encrypt' ? '支持中文、多行和空文本，最多 64 KiB。' : '请保留完整密文，支持换行，最多 128 KiB。' }}按 UTF-8 字节计算，超限不会截断。</p>
        </div>
      </fieldset>
      <p v-if="state.error" class="error-message" role="alert">{{ state.error }}</p>
      <div class="form-actions">
        <button class="button button-primary" type="submit" :disabled="state.pending">{{ state.pending ? '处理中…' : mode === 'encrypt' ? '加密文本' : '解密文本' }}</button>
        <button class="button" type="reset">{{ state.pending ? '取消并重置' : '重置' }}</button>
        <span class="request-status" role="status">{{ state.pending ? '正在处理，请稍候。' : '' }}</span>
      </div>
    </form>
    <ToolResult :result="state.result" :title="mode === 'encrypt' ? '加密结果' : '解密结果'" />
    <p class="privacy-note">输入会发送给本站服务处理，请在可信的 HTTPS 页面使用。当前工具兼容旧密文，不适合需要验证内容是否被篡改的场景。</p>
  </section>
</template>
