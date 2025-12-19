<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'

const router = useRouter()

const loading = ref(false)
const rows = ref([])

const dialogOpen = ref(false)
const form = ref({ id: null, name: '', description: '' })

async function load() {
  loading.value = true
  try {
    rows.value = (await api.get('/templates')).data
  } finally {
    loading.value = false
  }
}

function create() {
  form.value = { id: null, name: '', description: '' }
  dialogOpen.value = true
}

function edit(row) {
  form.value = { id: row.id, name: row.name, description: row.description ?? '' }
  dialogOpen.value = true
}

async function save() {
  const payload = { name: form.value.name, description: form.value.description }
  if (!payload.name?.trim()) return ElMessage.error('请输入模板名称')
  if (form.value.id) await api.put(`/templates/${form.value.id}`, payload)
  else await api.post('/templates', payload)
  dialogOpen.value = false
  ElMessage.success('已保存')
  await load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确认删除模板：${row.name}？（将删除模板配置）`, '提示', { type: 'warning' })
  await api.delete(`/templates/${row.id}`)
  ElMessage.success('已删除')
  await load()
}

function goConfig(row) {
  router.push(`/templates/${row.id}/config`)
}

onMounted(load)
</script>

<template>
  <el-card>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
      <div style="font-weight: 600">模板列表</div>
      <el-button type="primary" @click="create">新增模板</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="name" label="名称" min-width="200" />
      <el-table-column prop="description" label="描述" min-width="260" />
      <el-table-column prop="created_at" label="创建时间" min-width="220" />
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="goConfig(row)">配置</el-button>
          <el-button link type="primary" @click="edit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogOpen" :title="form.id ? '编辑模板' : '新增模板'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

