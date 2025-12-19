<script setup>
import { computed } from 'vue'
import { normalizeOptions } from '../lib/fieldTypes'

const props = defineProps({
  fieldDef: { type: Object, required: true },
  config: { type: Object, default: () => ({}) },
  modelValue: { required: false },
})

const emit = defineEmits(['update:modelValue'])

const effectiveLabel = computed(() => props.config?.label || props.fieldDef?.label)
const placeholder = computed(() => props.config?.placeholder || `请输入${effectiveLabel.value}`)
const options = computed(() => {
  const override = props.config?.options
  return normalizeOptions(override ?? props.fieldDef?.options)
})

function update(v) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div>
    <template v-if="fieldDef.type === 'text'">
      <el-input :model-value="modelValue" :placeholder="placeholder" @update:model-value="update" />
    </template>

    <template v-else-if="fieldDef.type === 'textarea'">
      <el-input
        type="textarea"
        :rows="4"
        :model-value="modelValue"
        :placeholder="placeholder"
        @update:model-value="update"
      />
    </template>

    <template v-else-if="fieldDef.type === 'number'">
      <el-input-number style="width: 100%" :model-value="modelValue" @update:model-value="update" />
    </template>

    <template v-else-if="fieldDef.type === 'date'">
      <el-date-picker
        style="width: 100%"
        type="date"
        value-format="YYYY-MM-DD"
        :model-value="modelValue"
        @update:model-value="update"
      />
    </template>

    <template v-else-if="fieldDef.type === 'datetime'">
      <el-date-picker
        style="width: 100%"
        type="datetime"
        value-format="YYYY-MM-DDTHH:mm:ss"
        :model-value="modelValue"
        @update:model-value="update"
      />
    </template>

    <template v-else-if="fieldDef.type === 'select'">
      <el-select style="width: 100%" :model-value="modelValue" @update:model-value="update">
        <el-option v-for="o in options" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </template>

    <template v-else-if="fieldDef.type === 'multiselect'">
      <el-select multiple style="width: 100%" :model-value="modelValue" @update:model-value="update">
        <el-option v-for="o in options" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </template>

    <template v-else-if="fieldDef.type === 'radio'">
      <el-radio-group :model-value="modelValue" @update:model-value="update">
        <el-radio v-for="o in options" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
      </el-radio-group>
    </template>

    <template v-else-if="fieldDef.type === 'checkbox'">
      <el-checkbox-group :model-value="modelValue" @update:model-value="update">
        <el-checkbox v-for="o in options" :key="o.value" :label="o.value">{{ o.label }}</el-checkbox>
      </el-checkbox-group>
    </template>

    <template v-else-if="fieldDef.type === 'switch'">
      <el-switch :model-value="!!modelValue" @update:model-value="update" />
    </template>

    <template v-else>
      <el-input :model-value="modelValue" :placeholder="placeholder" @update:model-value="update" />
    </template>
  </div>
</template>

