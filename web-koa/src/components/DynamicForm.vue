<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { displayValue, normalizeOptions, parseOptionsJson } from '../lib/fieldTypes'
import RichTextField from './RichTextField.vue'
import DynamicTableField from './DynamicTableField.vue'

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
    optionComponent: 'el-option',
    triggers: ['change'],
  },
  multiselect: {
    component: 'el-select',
    valueType: 'array',
    options: 'array<{label,value}>',
    optionComponent: 'el-option',
    triggers: ['change'],
    props: { multiple: true },
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
  collapse: {
    component: 'el-collapse',
    valueType: 'none',
    options: 'none',
    triggers: [],
  },
  richtext: {
    component: 'RichTextField',
    valueType: 'string',
    options: 'none',
    triggers: ['change'],
  },
  table: {
    component: 'DynamicTableField',
    valueType: 'array',
    options: 'object',
    triggers: ['change'],
  },
}

const TYPE_TO_RENDERER = {
  input: FIELD_RENDERERS.input,
  text: FIELD_RENDERERS.input,
  textarea: FIELD_RENDERERS.textarea,
  number: FIELD_RENDERERS.number,
  select: FIELD_RENDERERS.select,
  select_multi: FIELD_RENDERERS.multiselect,
  multiselect: FIELD_RENDERERS.multiselect,
  radio: FIELD_RENDERERS.radio,
  checkbox: FIELD_RENDERERS.checkbox,
  date: FIELD_RENDERERS.date,
  datetime: FIELD_RENDERERS.datetime,
  switch: FIELD_RENDERERS.switch,
  divider: FIELD_RENDERERS.divider,
  section: FIELD_RENDERERS.divider,
  collapse: FIELD_RENDERERS.collapse,
  richtext: FIELD_RENDERERS.richtext,
  table: FIELD_RENDERERS.table,
}

function getRenderer(field) {
  return TYPE_TO_RENDERER[field.type] || FIELD_RENDERERS.input
}

function optionProps(renderer, option) {
  if (renderer.optionComponent === 'el-option') {
    return { label: option.label, value: option.value }
  }
  return { label: option.value }
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
    if (f.min != null || f.max != null || f.regex || f.type === 'richtext' || f.type === 'table') {
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
            if (f.type === 'table') {
              const opt = parseOptionsJson(f.options) || {}
              const minRows = opt.minRows ?? 0
              const maxRows = opt.maxRows ?? 200
              if (val.length < minRows) return callback(new Error(`${label}至少${minRows}行`))
              if (val.length > maxRows) return callback(new Error(`${label}最多${maxRows}行`))
              const cols = Array.isArray(opt.columns) ? opt.columns : []
              for (const row of val) {
                for (const col of cols) {
                  if (col.required && (row?.[col.code] == null || row?.[col.code] === '')) {
                    return callback(new Error(`${label}中列【${col.name}】必填`))
                  }
                }
              }
            }
          } else {
            const len = String(val).length
            if (f.min != null && len < f.min) return callback(new Error(`${label}长度至少${f.min}`))
            if (f.max != null && len > f.max) return callback(new Error(`${label}长度最多${f.max}`))
            if (f.regex) {
              const re = f.regex instanceof RegExp ? f.regex : new RegExp(f.regex)
              if (!re.test(String(val))) return callback(new Error(`${label}格式不正确`))
            }
            if (f.type === 'richtext') {
              const text = String(val).replace(/<[^>]+>/g, '').trim()
              if (!text) return callback(new Error(`${label}不能为空`))
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
      <template v-else-if="getRenderer(field).component === 'el-collapse'">
        <el-collapse :accordion="parseOptionsJson(field.options)?.accordion" :model-value="parseOptionsJson(field.options)?.defaultOpen ? ['panel'] : []">
          <el-collapse-item :title="labelOf(field)" name="panel">
            <div class="muted">{{ field.helpText || '' }}</div>
          </el-collapse-item>
        </el-collapse>
      </template>
      <el-form-item v-else :label="labelOf(field)" :prop="field.id" :required="!!field.required">
        <template v-if="readonlyMode || field.config?.readonly">
          <RichTextField
            v-if="getRenderer(field).component === 'RichTextField'"
            :model-value="formModel[field.id]"
            :readonly="true"
          />
          <DynamicTableField
            v-else-if="getRenderer(field).component === 'DynamicTableField'"
            :model-value="formModel[field.id]"
            :columns="parseOptionsJson(field.options)?.columns || []"
            :min-rows="parseOptionsJson(field.options)?.minRows ?? 0"
            :max-rows="parseOptionsJson(field.options)?.maxRows ?? 200"
            :readonly="true"
          />
          <span v-else>{{ displayValue(formModel[field.id]) }}</span>
        </template>
        <template v-else>
          <component
            v-if="getRenderer(field).component === 'RichTextField'"
            :is="RichTextField"
            :model-value="formModel[field.id]"
            :placeholder="placeholderOf(field)"
            :readonly="readonlyMode || field.config?.readonly"
            @update:model-value="(v) => update(field.id, v)"
          />
          <component
            v-else-if="getRenderer(field).component === 'DynamicTableField'"
            :is="DynamicTableField"
            :model-value="formModel[field.id]"
            :columns="parseOptionsJson(field.options)?.columns || []"
            :min-rows="parseOptionsJson(field.options)?.minRows ?? 0"
            :max-rows="parseOptionsJson(field.options)?.maxRows ?? 200"
            :readonly="readonlyMode || field.config?.readonly"
            @update:model-value="(v) => update(field.id, v)"
          />
          <component
            v-else
            :is="getRenderer(field).component"
            v-bind="getRenderer(field).props || {}"
            :model-value="formModel[field.id]"
            :placeholder="placeholderOf(field)"
            :disabled="readonlyMode || field.config?.readonly"
            class="w-100"
            @update:model-value="(v) => update(field.id, v)"
          >
            <template v-if="getRenderer(field).optionComponent">
              <component
                :is="getRenderer(field).optionComponent"
                v-for="o in normalizeOptions(field.options)"
                :key="o.value"
                v-bind="optionProps(getRenderer(field), o)"
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
