<script setup>
import { computed, ref } from 'vue'
import OptionsEditor from './OptionsEditor.vue'
import { normalizeOptions, parseOptionsJson } from '../lib/fieldTypes'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ columns: [], minRows: 0, maxRows: 200 }) },
})
const emit = defineEmits(['update:modelValue'])

const local = ref({
  columns: props.modelValue.columns || [],
  minRows: props.modelValue.minRows ?? 0,
  maxRows: props.modelValue.maxRows ?? 200,
})

const columns = computed(() => local.value.columns || [])

function normalizeColumnOptions(options) {
  if (Array.isArray(options)) return normalizeOptions(options)
  const parsed = parseOptionsJson(options)
  if (Array.isArray(parsed)) return normalizeOptions(parsed)
  return []
}

function update() {
  emit('update:modelValue', {
    columns: columns.value.map((c) => ({ ...c, options: normalizeColumnOptions(c.options) })),
    minRows: local.value.minRows,
    maxRows: local.value.maxRows,
  })
}

function addColumn() {
  local.value.columns.push({
    code: `col_${columns.value.length + 1}`,
    name: '列名',
    type: 'input',
    required: false,
    placeholder: '',
    options: [],
  })
  update()
}

function removeColumn(index) {
  local.value.columns.splice(index, 1)
  update()
}
</script>

<template>
  <div>
    <el-table :data="columns" size="small" border>
      <el-table-column label="编码" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.code" @change="update" />
        </template>
      </el-table-column>
      <el-table-column label="名称" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.name" @change="update" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-select v-model="row.type" class="w-120" @change="update">
            <el-option value="input" label="输入框" />
            <el-option value="number" label="数字" />
            <el-option value="select" label="下拉" />
            <el-option value="date" label="日期" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="必填" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.required" @change="update" />
        </template>
      </el-table-column>
      <el-table-column label="选项" min-width="220">
        <template #default="{ row }">
          <OptionsEditor v-if="row.type === 'select'" v-model="row.options" />
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeColumn($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-8 flex items-center gap-12">
      <el-button @click="addColumn">新增列</el-button>
      <div class="muted">最小行</div>
      <el-input-number v-model="local.minRows" @change="update" />
      <div class="muted">最大行</div>
      <el-input-number v-model="local.maxRows" @change="update" />
    </div>
  </div>
</template>
