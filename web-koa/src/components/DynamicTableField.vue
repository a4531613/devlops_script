<script setup>
import { computed } from 'vue'
import { normalizeOptions } from '../lib/fieldTypes'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
  minRows: { type: Number, default: 0 },
  maxRows: { type: Number, default: 200 },
})

const emit = defineEmits(['update:modelValue'])

const rows = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function updateRow(index, code, value) {
  const next = rows.value.map((r, i) => (i === index ? { ...r, [code]: value } : r))
  emit('update:modelValue', next)
}

function addRow() {
  if (rows.value.length >= props.maxRows) return
  const row = {}
  props.columns.forEach((c) => {
    row[c.code] = c.type === 'number' ? 0 : c.type === 'select' ? null : ''
  })
  emit('update:modelValue', [...rows.value, row])
}

function removeRow(index) {
  if (rows.value.length <= props.minRows) return
  emit('update:modelValue', rows.value.filter((_, i) => i !== index))
}

function inputComponent(type) {
  if (type === 'number') return 'el-input-number'
  if (type === 'select') return 'el-select'
  if (type === 'date') return 'el-date-picker'
  return 'el-input'
}
</script>

<template>
  <div>
    <el-table :data="rows" border size="small">
      <el-table-column
        v-for="col in columns"
        :key="col.code"
        :label="col.name"
        :min-width="120"
      >
        <template #default="{ row, $index }">
          <template v-if="readonly">
            <span>{{ row[col.code] ?? '-' }}</span>
          </template>
          <template v-else>
            <component
              :is="inputComponent(col.type)"
              v-if="col.type !== 'select' && col.type !== 'date'"
              class="w-100"
              :model-value="row[col.code]"
              @update:model-value="(v) => updateRow($index, col.code, v)"
            />
            <el-date-picker
              v-else-if="col.type === 'date'"
              type="date"
              value-format="YYYY-MM-DD"
              class="w-100"
              :model-value="row[col.code]"
              @update:model-value="(v) => updateRow($index, col.code, v)"
            />
            <el-select
              v-else
              class="w-100"
              :model-value="row[col.code]"
              @update:model-value="(v) => updateRow($index, col.code, v)"
            >
              <el-option
                v-for="o in normalizeOptions(col.options)"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </template>
        </template>
      </el-table-column>
      <el-table-column v-if="!readonly" label="操作" width="90" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-8">
      <el-button v-if="!readonly" @click="addRow">新增行</el-button>
      <span class="muted ml-8">行数：{{ rows.length }}</span>
    </div>
  </div>
</template>
