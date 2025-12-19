<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import OptionsEditor from '../components/OptionsEditor.vue'
import { FIELD_TYPES, isOptionType } from '../lib/fieldTypes'

const loading = ref(false)
const rows = ref([])
const q = ref('')

const dialogOpen = ref(false)
const form = ref({ id: null, name: '', label: '', type: 'text', options: [] })

const filtered = computed(() => {
  if (!q.value.trim()) return rows.value
  const s = q.value.trim().toLowerCase()
  return rows.value.filter((r) => r.name.toLowerCase().includes(s) || r.label.toLowerCase().includes(s))
})

async function load() {
  loading.value = true
  try {
    rows.value = (await api.get('/field-defs')).data
  } finally {
    loading.value = false
  }
}

function create() {
  form.value = { id: null, name: '', label: '', type: 'text', options: [] }
  dialogOpen.value = true
}

function edit(row) {
  form.value = {
    id: row.id,
    name: row.name,
    label: row.label,
    type: row.type,
    options: row.options ?? [],
  }
  dialogOpen.value = true
}

async function save() {
  const payload = {
    name: form.value.name,
    label: form.value.label,
    type: form.value.type,
    options: isOptionType(form.value.type) ? form.value.options : null,
  }
  if (!payload.name?.trim()) return ElMessage.error('请输入字段名称（name）')
  if (!payload.label?.trim()) return ElMessage.error('请输入字段显示名（label）')

  if (form.value.id) await api.put(`/field-defs/${form.value.id}`, payload)
  else await api.post('/field-defs', payload)

  dialogOpen.value = false
  ElMessage.success('已保存')
  await load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确认删除字段：${row.label}（${row.name}）？`, '提示', { type: 'warning' })
  await api.delete(`/field-defs/${row.id}`)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px">
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="font-weight: 600">字段库</div>
        <el-input v-model="q" placeholder="搜索 name / label" style="width: 280px" clearable />
      </div>
      <el-button type="primary" @click="create">新增字段</el-button>
    </div>

    <el-table v-loading="loading" :data="filtered" border>
      <el-table-column prop="name" label="name" min-width="180" />
      <el-table-column prop="label" label="label" min-width="160" />
      <el-table-column prop="type" label="类型" min-width="120" />
      <el-table-column label="选项" min-width="220">
        <template #default="{ row }">
          <span v-if="row.options?.length">{{ row.options.map((o) => o.label).join('、') }}</span>
          <span v-else style="color: #9ca3af">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" min-width="220" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="edit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogOpen" :title="form.id ? '编辑字段' : '新增字段'" width="680px">
    <el-form label-width="110px">
      <el-form-item label="name" required>
        <el-input v-model="form.name" placeholder="如：patient_name" />
      </el-form-item>
      <el-form-item label="label" required>
        <el-input v-model="form.label" placeholder="如：患者姓名" />
      </el-form-item>
      <el-form-item label="字段类型" required>
        <el-select v-model="form.type" style="width: 260px">
          <el-option v-for="t in FIELD_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="isOptionType(form.type)" label="选项">
        <OptionsEditor v-model="form.options" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

