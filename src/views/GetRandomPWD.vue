<script setup>
import { onBeforeUnmount, reactive } from 'vue'
import { generatePasswords } from '../api/tools.js'
import { parsePasswordParameters } from '../forms/validation.js'
import { useToolRequest } from '../composables/useToolRequest.js'
import ToolResult from '../components/ToolResult.vue'

// 保留输入字符串，由统一解析函数区分空值、整数及非法写法。位数默认 10，字符类别默认全选。
const form = reactive({ num: '10', quantity: '1', letters: true, symbols: true, digits: true })
const { state, run, reset } = useToolRequest()

function submit() {
  run(signal => generatePasswords(parsePasswordParameters(form), signal))
}

// 恢复默认参数（位数 10、个数 1、三类字符全选），同时清除生成结果并取消尚未完成的请求。
function resetForm() {
  reset()
  form.num = '10'
  form.quantity = '1'
  form.letters = true
  form.symbols = true
  form.digits = true
}

// 离开页面后旧请求不得重新填回密码结果。
onBeforeUnmount(reset)
</script>

<template>
  <section class="page tool-page pwd-page">
    <!-- 紧凑头部：标题与说明同一行，整页内容控制在一屏内。 -->
    <header class="pwd-head">
      <div class="pwd-title">
        <p class="eyebrow">PASSWORD UTILITY / 02</p>
        <h1>随机密码</h1>
      </div>
      <p class="page-description">设置位数与数量，生成一组可直接复制的随机密码。</p>
    </header>
    <div class="pwd-body">
      <!-- text 配合 numeric 键盘，不依赖 number 输入框对指数等写法的隐式转换。 -->
      <form class="tool-form pwd-form" novalidate :aria-busy="state.pending" @submit.prevent="submit" @reset.prevent="resetForm">
        <fieldset :disabled="state.pending" class="form-fields parameter-grid">
          <legend class="visually-hidden">密码生成参数</legend>
          <div class="form-field">
            <label for="password-length">密码位数</label>
            <input id="password-length" v-model="form.num" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="length-hint">
            <p id="length-hint" class="field-hint">默认 10 位，可填 1～128；填 0 或留空时，随机生成 8～10 位密码。</p>
          </div>
          <div class="form-field">
            <label for="password-quantity">密码个数</label>
            <input id="password-quantity" v-model="form.quantity" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="quantity-hint">
            <p id="quantity-hint" class="field-hint">可填 1～100；留空时生成 1 条。</p>
          </div>
          <!-- 字符类别勾选：至少保留一类，全不勾选时由解析函数报错。 -->
          <div class="form-field form-checks">
            <span id="checks-label" class="checks-label">字符类型</span>
            <div class="checks-row" role="group" aria-labelledby="checks-label">
              <label><input v-model="form.letters" type="checkbox"> 英文</label>
              <label><input v-model="form.symbols" type="checkbox"> 特殊字符</label>
              <label><input v-model="form.digits" type="checkbox"> 数字</label>
            </div>
            <p class="field-hint">至少勾选一类，密码只从勾选的字符中生成。</p>
          </div>
        </fieldset>
        <p v-if="state.error" class="error-message" role="alert">{{ state.error }}</p>
        <div class="form-actions">
          <button class="button button-primary" type="submit" :disabled="state.pending">{{ state.pending ? '生成中…' : '生成密码' }}</button>
          <button class="button" type="reset">{{ state.pending ? '取消并重置' : '重置' }}</button>
          <span class="request-status" role="status">{{ state.pending ? '正在生成，请稍候。' : '' }}</span>
        </div>
      </form>
      <!-- 结果栏常驻右侧：无结果时显示占位提示，布局不随结果出现而跳动。 -->
      <aside class="pwd-side">
        <ToolResult :result="state.result" title="生成结果" />
        <p v-if="state.result === null" class="pwd-placeholder">生成后，随机密码会按行显示在这里。</p>
        <p class="privacy-note">每行一条密码。请妥善保存生成结果，重置或离开页面后将清空。</p>
      </aside>
    </div>
  </section>
</template>

<style>
/* 随机密码页专用紧凑布局：选择器均限定在本页类名下，不影响其他工具页。 */
/* 字符类型勾选组：标签对齐输入框标签样式，选项行与输入框同高。 */
.pwd-page .checks-label { display: block; margin-bottom: 10px; font-size: 13px; font-weight: 600; }
.pwd-page .checks-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; min-height: 46px; }
.pwd-page .checks-row label { display: inline-flex; align-items: center; gap: 7px; margin: 0; font-size: 14px; font-weight: 400; white-space: nowrap; cursor: pointer; }
.pwd-page .checks-row input { width: 16px; height: 16px; margin: 0; accent-color: var(--accent); }

/* 桌面端占满一屏：配合 ToolLayout 的 fit-shell，输入与结果左右分栏、随高度伸缩。 */
@media (min-width: 701px) {
  .pwd-page { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 28px 48px 24px; }
  .pwd-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
  .pwd-head .eyebrow { margin: 0 0 8px; }
  .pwd-head h1 { font-size: 26px; letter-spacing: -.02em; }
  .pwd-head .page-description { margin: 0 0 4px; max-width: 300px; text-align: right; font-size: 12px; line-height: 1.8; }
  /* 参数只有两个输入框：表单做成顶部横条，整片剩余高度留给全宽结果区，避免左列大片留空。 */
  .pwd-body { flex: 1; min-height: 0; margin-top: 18px; display: flex; flex-direction: column; gap: 16px; }
  .pwd-form { flex: none; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 24px; padding: 18px 24px; }
  .pwd-form .form-fields { flex: 1; min-width: 0; display: flex; gap: 24px; }
  .pwd-form .form-field { flex: none; width: 240px; margin: 0; }
  .pwd-form .form-field.form-checks { flex: 1; width: auto; min-width: 260px; }
  .pwd-form .form-field > label, .pwd-form .checks-label { margin-bottom: 7px; }
  .pwd-form .field-hint { margin-top: 7px; }
  .pwd-form .error-message { flex-basis: 100%; order: 3; margin: 0; }
  .pwd-form .form-actions { flex: none; margin-top: 0; }
  .pwd-side { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
  .pwd-page .result-panel { flex: 1; min-height: 0; margin-top: 0; display: flex; flex-direction: column; padding: 18px 22px; }
  .pwd-page .result-heading { flex: none; }
  /* 结果单列纵向排布、超高内部滚动（与加解密页一致）；多列曾导致内容多时横向溢出。 */
  .pwd-page .result-text { flex: 1; min-height: 0; max-height: none; margin: 12px 0 0; overflow: auto; }
  .pwd-page .copy-message { margin-top: 8px; }
  .pwd-placeholder { flex: 1; min-height: 0; margin: 0; display: grid; place-items: center; padding: 22px; border: 1px dashed var(--border); border-radius: 14px; background: #f2f4ee; color: var(--muted); font-size: 13px; }
  .pwd-page .privacy-note { margin: 0; font-size: 11px; line-height: 1.7; }
}

/* 手机端占满一屏：表单固定在上，结果区占据剩余高度并内部滚动。 */
@media (max-width: 700px) {
  .pwd-page { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 16px 16px 14px; }
  .pwd-head .eyebrow { margin: 0 0 5px; }
  .pwd-head h1 { font-size: 22px; }
  .pwd-head .page-description { margin: 6px 0 0; font-size: 12px; line-height: 1.6; }
  .pwd-body { flex: 1; min-height: 0; margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
  .pwd-form { flex: none; padding: 14px 16px; }
  .pwd-form .parameter-grid { gap: 10px; }
  .pwd-form .form-field > label, .pwd-form .checks-label { margin-bottom: 6px; }
  .pwd-form .form-field > input { padding: 10px 12px; }
  .pwd-form .checks-row { min-height: 0; padding: 4px 0; gap: 8px 16px; }
  .pwd-form .field-hint { margin-top: 6px; font-size: 11px; }
  .pwd-form .error-message { margin: 10px 0 0; }
  .pwd-form .form-actions { margin-top: 12px; }
  .pwd-side { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
  .pwd-page .result-panel { flex: 1; min-height: 0; margin-top: 0; padding: 14px 16px; display: flex; flex-direction: column; }
  .pwd-page .result-text { flex: 1; min-height: 0; max-height: none; margin: 10px 0 0; overflow: auto; }
  .pwd-placeholder { display: none; }
  .pwd-page .privacy-note { margin: 0; font-size: 11px; line-height: 1.6; }
  /* 手机端空间紧张：出现结果时收起底部提示，清空结果后恢复。 */
  .pwd-page .result-panel ~ .privacy-note { display: none; }
}
</style>
