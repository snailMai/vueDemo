<script setup>
import { onBeforeUnmount, reactive } from 'vue'
import { generatePasswords } from '../api/tools.js'
import { parsePasswordParameters } from '../forms/validation.js'
import { useToolRequest } from '../composables/useToolRequest.js'
import ToolResult from '../components/ToolResult.vue'

const form = reactive({ num: '0', quantity: '1' })
const { state, run, reset } = useToolRequest()

function submit() {
  run(signal => generatePasswords(parsePasswordParameters(form), signal))
}

function resetForm() {
  reset()
  form.num = '0'
  form.quantity = '1'
}

onBeforeUnmount(reset)
</script>

<template>
  <section class="page tool-page">
    <p class="eyebrow">PASSWORD UTILITY / 02</p>
    <h1>随机密码</h1>
    <p class="page-description">设置位数与数量，生成一组可直接复制的随机密码。</p>
    <form class="tool-form" novalidate :aria-busy="state.pending" @submit.prevent="submit" @reset.prevent="resetForm">
      <fieldset :disabled="state.pending" class="form-fields parameter-grid">
        <legend class="visually-hidden">密码生成参数</legend>
        <div class="form-field">
          <label for="password-length">密码位数</label>
          <input id="password-length" v-model="form.num" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="length-hint">
          <p id="length-hint" class="field-hint">可填 1～128；填 0 或留空时，随机生成 8～10 位密码。</p>
        </div>
        <div class="form-field">
          <label for="password-quantity">密码个数</label>
          <input id="password-quantity" v-model="form.quantity" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="quantity-hint">
          <p id="quantity-hint" class="field-hint">可填 1～100；留空时生成 1 条。</p>
        </div>
      </fieldset>
      <p v-if="state.error" class="error-message" role="alert">{{ state.error }}</p>
      <div class="form-actions">
        <button class="button button-primary" type="submit" :disabled="state.pending">{{ state.pending ? '生成中…' : '生成密码' }}</button>
        <button class="button" type="reset">{{ state.pending ? '取消并重置' : '重置' }}</button>
        <span class="request-status" role="status">{{ state.pending ? '正在生成，请稍候。' : '' }}</span>
      </div>
    </form>
    <ToolResult :result="state.result" title="生成结果" />
    <p class="privacy-note">每行一条密码。请妥善保存生成结果，重置或离开页面后将清空。</p>
  </section>
</template>
