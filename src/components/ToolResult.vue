<script setup>
import { useResultCopy } from '../composables/useResultCopy.js'

// 使用 getter 追踪 props 更新，让复制反馈随结果变化失效。
const props = defineProps({ result: { type: String, default: null }, title: { type: String, required: true } })
const { copyMessage, copying, copyResult } = useResultCopy(() => props.result)
</script>

<template>
  <!-- null 隐藏结果区，空字符串显示成功提示；插值按文本转义，不执行结果中的 HTML。 -->
  <section v-if="result !== null" class="result-panel" aria-label="工具结果">
    <div class="result-heading">
      <h2>{{ title }}</h2>
      <button type="button" class="button button-small" :disabled="copying" @click="copyResult">{{ copying ? '复制中…' : '复制结果' }}</button>
    </div>
    <p v-if="result === ''" class="field-hint">操作成功，结果为空文本。</p>
    <!-- pre 保留换行与空白，键盘用户也能聚焦并选取结果。 -->
    <pre class="result-text" tabindex="0" aria-label="结果文本">{{ result }}</pre>
    <p class="copy-message" role="status">{{ copyMessage }}</p>
  </section>
</template>
