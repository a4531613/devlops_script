<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { displayValue, normalizeOptions } from '../lib/fieldTypes'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  schema: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  readonly: { type: Boolean, default: false },
  mode: { type: String, default: 'edit' },
})

const emit = defineEmits(['update:modelValue', 'submit', 'validate'])
const formRef = ref()

const FIELD_RENDERERS = {
  input: {
    component: 'el-input',
    valueType: 'string',
    options: 'none',
    triggers: ['blur'],
  },
  textarea: {
    component: 'el-input',
    valueType: 'string',
    options: 'none',
    triggers: ['blur'],
    props: { type: 'textarea', rows: 4 },
  },
  number: {
    component: 'el-input-number',
    valueType: 'number',
    options: 'none',
    triggers: ['change'],
  },
  select: {
    component: 'el-select',
    valueType: 'string',
    options: 'array<{label,value}>',
    triggers: ['change'],
  },
  radio: {
    component: 'el-radio-group',
    optionComponent: 'el-radio',
    valueType: 'string',
    options: 'array<{label,value}>',
    triggers: ['change'],
  },
  checkbox: {
    component: 'el-checkbox-group',
    optionComponent: 'el-checkbox',
    valueType: 'array',
    options: 'array<{label,value}>',
    triggers: ['change'],
  },
  date: {
    component: 'el-date-picker',
    valueType: 'string',
    options: 'none',
    triggers: ['change'],
    props: { type: 'date', valueFormat: 'YYYY-MM-DD' },
  },
  datetime: {
    component: 'el-date-picker',
    valueType: 'string',
    options: 'none',
    triggers: ['change'],
    props: { type: 'datetime', valueFormat: 'YYYY-MM-DDTHH:mm:ss' },
  },
  switch: {
    component: 'el-switch',
    valueType: 'boolean',
    options: 'none',
    triggers: ['change'],
  },
  divider: {
    component: 'el-divider',
    valueType: 'none',
    options: 'none',
    triggers: [],
  },
}

const TYPE_TO_RENDERER = {
  input: FIELD_RENDERERS.input,
  text: FIELD_RENDERERS.input,
  textarea: FIELD_RENDERERS.textarea,
  number: FIELD_RENDERERS.number,
  select: FIELD_RENDERERS.select,
  radio: FIELD_RENDERERS.radio,
  checkbox: FIELD_RENDERERS.checkbox,
  date: FIELD_RENDERERS.date,
  datetime: FIELD_RENDERERS.datetime,
  switch: FIELD_RENDERERS.switch,
  divider: FIELD_RENDERERS.divider,
  section: FIELD_RENDERERS.divider,
}

function getRenderer(field) {
  return TYPE_TO_RENDERER[field.type] || FIELD_RENDERERS.input
}

function isVisible(field) {
  return field.config?.visible !== false
}

const readonlyMode = computed(() => props.readonly || props.mode === 'readonly')
const fieldList = computed(() => (props.fields.length ? props.fields : props.schema))

const rules = computed(() => {
  const map = {}
  fieldList.value.forEach((f) => {
    const renderer = getRenderer(f)
    if (renderer.valueType === 'none') return
    const label = labelOf(f)
    const fieldRules = []
    if (f.required) {
      fieldRules.push({ required: true, message: `请输入${label}`, trigger: renderer.triggers })
    }
    if (f.min != null || f.max != null || f.regex) {
      fieldRules.push({
        trigger: renderer.triggers,
        validator: (_rule, value, callback) => {
          const val = value
          if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) return callback()
          if (renderer.valueType === 'number') {
            if (f.min != null && val < f.min) return callback(new Error(`${label}不能小于${f.min}`))
            if (f.max != null && val > f.max) return callback(new Error(`${label}不能大于${f.max}`))
          } else if (Array.isArray(val)) {
            if (f.min != null && val.length < f.min) {
              return callback(new Error(`${label}至少选择${f.min}项`))
            }
            if (f.max != null && val.length > f.max) {
              return callback(new Error(`${label}最多选择${f.max}项`))
            }
          } else {
            const len = String(val).length
            if (f.min != null && len < f.min) return callback(new Error(`${label}长度至少${f.min}`))
            if (f.max != null && len > f.max) return callback(new Error(`${label}长度最多${f.max}`))
            if (f.regex) {
              const re = f.regex instanceof RegExp ? f.regex : new RegExp(f.regex)
              if (!re.test(String(val))) return callback(new Error(`${label}格式不正确`))
            }
          }
          return callback()
        },
      })
    }
    if (fieldRules.length) map[f.id] = fieldRules
  })
  return map
})

const formModel = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    Object.keys(formModel).forEach((k) => delete formModel[k])
    Object.entries(val || {}).forEach(([k, v]) => {
      formModel[k] = v
    })
  },
  { deep: true }
)

function update(fieldId, value) {
  formModel[fieldId] = value
  emit('update:modelValue', { ...formModel })
}

function labelOf(field) {
  return field.config?.label || field.label || field.name || '字段'
}

function placeholderOf(field) {
  return field.config?.placeholder || `请输入${labelOf(field)}`
}

async function validate() {
  if (readonlyMode.value) return true
  const ok = await formRef.value?.validate?.()
  emit('validate', ok)
  return ok
}

async function submit() {
  const ok = await validate()
  if (ok) emit('submit', { ...formModel })
}

defineExpose({ validate, submit })
</script>

<template>
  <el-form ref="formRef" label-width="110px" :model="formModel" :rules="rules">
    <template v-for="field in fieldList" :key="field.id">
      <template v-if="!isVisible(field)"></template>
      <template v-else-if="getRenderer(field).component === 'el-divider'">
        <el-divider>{{ labelOf(field) }}</el-divider>
      </template>
      <el-form-item v-else :label="labelOf(field)" :prop="field.id" :required="!!field.required">
        <template v-if="readonlyMode || field.config?.readonly">
          <span>{{ displayValue(formModel[field.id]) }}</span>
        </template>
        <template v-else>
          <component
            :is="getRenderer(field).component"
            v-bind="getRenderer(field).props || {}"
            :model-value="formModel[field.id]"
            :placeholder="placeholderOf(field)"
            :disabled="readonlyMode || field.config?.readonly"
            style="width: 100%"
            @update:model-value="(v) => update(field.id, v)"
          >
            <template v-if="getRenderer(field).optionComponent">
              <component
                :is="getRenderer(field).optionComponent"
                v-for="o in normalizeOptions(field.options)"
                :key="o.value"
                :label="o.value"
              >
                {{ o.label }}
              </component>
            </template>
          </component>
        </template>
      </el-form-item>
    </template>
  </el-form>
</template>
