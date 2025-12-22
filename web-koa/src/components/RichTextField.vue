<script setup>
import { computed } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const safeHtml = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
})
</script>

<template>
  <div>
    <QuillEditor
      v-if="!readonly"
      theme="snow"
      content-type="html"
      :content="modelValue"
      :placeholder="placeholder"
      @update:content="(v) => emit('update:modelValue', v)"
    />
    <div v-else class="richtext-preview" v-html="safeHtml"></div>
  </div>
</template>

<style scoped>
.richtext-preview {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  min-height: 80px;
}
</style>

