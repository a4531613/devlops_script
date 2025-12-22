<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import { FIELD_TYPES } from '../lib/fieldTypes'

const route = useRoute()
const router = useRouter()
const templateId = computed(() => route.params.id)

const loading = ref(false)
const template = ref(null)
const allFields = ref([])
const poolFields = ref([])
const selectedFieldIds = ref([])

const q = ref('')
const typeFilter = ref('')

const typeOptions = computed(() => FIELD_TYPES.map((t) => ({ label: t.label, value: t.value })))

const filteredAll = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  return allFields.value.filter((f) => {
    const okType = !typeFilter.value || f.type === typeFilter.value
    const okKeyword =
      !keyword || f.name.toLowerCase().includes(keyword) || f.label.toLowerCase().includes(keyword)
    return okType && okKeyword
  })
})

async function load() {
  if (!templateId.value) return
  loading.value = true
  try {
    const [tplRes, allRes, poolRes] = await Promise.all([
      api.get('/templates'),
      api.get('/fields'),
      api.get(`/templates/${templateId.value}/fields`),
    ])
    template.value = tplRes.data.find((t) => t.id === templateId.value) || null
    allFields.value = allRes.data
    poolFields.value = poolRes.data
  } finally {
    loading.value = false
  }
}

async function bindSelected() {
  if (!selectedFieldIds.value.length) return ElMessage.warning('请先选择字段')
  await api.post(`/templates/${templateId.value}/fields`, { fieldIds: selectedFieldIds.value })
  ElMessage.success('已加入字段池')
  selectedFieldIds.value = []
  await load()
}

async function removeField(row) {
  await ElMessageBox.confirm(`确认从字段池移除：${row.label}？`, '提示', { type: 'warning' })
  await api.delete(`/templates/${templateId.value}/fields/${row.fieldId}`)
  ElMessage.success('已移除')
  await load()
}

function goDesigner() {
  router.push(`/templates/${templateId.value}/designer`)
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="router.push('/templates')">返回</el-button>
        <div class="card-title">{{ template?.name || '模板' }} - 字段池</div>
      </div>
      <el-button type="primary" @click="goDesigner">去配置</el-button>
    </div>

    <el-row :gutter="12">
      <el-col :span="10">
        <el-card>
          <div class="toolbar">
            <div class="card-title">全局字段库</div>
            <div class="toolbar-left">
              <el-input v-model="q" placeholder="搜索 name/label" style="width: 200px" clearable />
              <el-select v-model="typeFilter" placeholder="类型" style="width: 140px" clearable>
                <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </div>
          </div>

          <el-table :data="filteredAll" border height="520" @selection-change="(rows) => (selectedFieldIds = rows.map((r) => r.id))">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="label" label="字段名" min-width="140" />
            <el-table-column prop="name" label="编码" min-width="140" />
            <el-table-column prop="type" label="类型" width="100" />
          </el-table>
          <div style="margin-top: 8px">
            <el-button type="primary" @click="bindSelected">加入字段池</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <div class="card-title" style="margin-bottom: 10px">模板字段池</div>
          <el-table :data="poolFields" border height="520">
            <el-table-column prop="label" label="字段名" min-width="160" />
            <el-table-column prop="name" label="编码" min-width="160" />
            <el-table-column prop="type" label="类型" width="110" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">{{ row.required ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeField(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

