<script setup>
import { computed } from 'vue'
import { normalizeOptions } from '../lib/fieldTypes'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const rows = computed(() => normalizeOptions(props.modelValue))

function updateAt(index, patch) {
  const next = rows.value.map((r, i) => (i === index ? { ...r, ...patch } : r))
  emit('update:modelValue', next)
}

function addRow() {
  emit('update:modelValue', [...rows.value, { label: '选项', value: `opt_${rows.value.length + 1}` }])
}

function removeRow(index) {
  emit('update:modelValue', rows.value.filter((_, i) => i !== index))
}
</script>

<template>
  <div>
    <el-table :data="rows" size="small" border>
      <el-table-column label="显示" min-width="140">
        <template #default="{ row, $index }">
          <el-input :model-value="row.label" @update:model-value="(v) => updateAt($index, { label: v })" />
        </template>
      </el-table-column>
      <el-table-column label="值" min-width="140">
        <template #default="{ row, $index }">
          <el-input :model-value="row.value" @update:model-value="(v) => updateAt($index, { value: v })" />
        </template>
      </el-table-column>
      <el-table-column label="" width="84" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-8">
      <el-button @click="addRow">新增选项</el-button>
    </div>
  </div>
</template>
