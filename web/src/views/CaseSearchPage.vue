<script setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { api } from '../api/client'

const templates = ref([])
const templateId = ref('')
const keyword = ref('')
const range = ref([])

const loading = ref(false)
const rows = ref([])

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const detailConfig = ref([])

const templateMap = computed(() => new Map(templates.value.map((t) => [t.id, t.name])))

async function loadTemplates() {
  templates.value = (await api.get('/templates')).data
}

async function search() {
  loading.value = true
  try {
    const params = {}
    if (templateId.value) params.templateId = templateId.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (Array.isArray(range.value) && range.value.length === 2) {
      params.from = dayjs(range.value[0]).toISOString()
      params.to = dayjs(range.value[1]).toISOString()
    }
    rows.value = (await api.get('/cases', { params })).data
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  drawerOpen.value = true
  detailLoading.value = true
  detail.value = null
  detailConfig.value = []
  try {
    const d = (await api.get(`/cases/${row.id}`)).data
    detail.value = d
    detailConfig.value = (await api.get(`/templates/${d.templateId}/config`)).data
  } finally {
    detailLoading.value = false
  }
}

function fieldLabel(cfg) {
  return cfg.config?.label || cfg.fieldDef?.label || cfg.fieldDef?.name || '字段'
}

function displayValue(v) {
  if (v === null || v === undefined || v === '') return '-'
  if (Array.isArray(v)) return v.join('、') || '-'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

onMounted(async () => {
  await loadTemplates()
  await search()
})
</script>

<template>
  <el-card style="margin-bottom: 12px">
    <el-form inline>
      <el-form-item label="模板">
        <el-select v-model="templateId" placeholder="全部" style="width: 220px" clearable>
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="keyword" placeholder="标题包含" clearable style="width: 220px" />
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker v-model="range" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="search">查询</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card>
    <el-table v-loading="loading" :data="rows" border @row-dblclick="openDetail">
      <el-table-column prop="title" label="标题" min-width="240" />
      <el-table-column prop="templateName" label="模板" min-width="180" />
      <el-table-column prop="createdAt" label="创建时间" min-width="220" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 8px; color: #9ca3af">提示：双击行也可查看详情。</div>
  </el-card>

  <el-drawer v-model="drawerOpen" size="520px" title="案例详情">
    <div v-loading="detailLoading">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="模板">{{ templateMap.get(detail.templateId) || detail.templateName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 12px; font-weight: 600">字段值</div>
        <el-table :data="detailConfig" size="small" border style="margin-top: 8px">
          <el-table-column label="字段" min-width="180">
            <template #default="{ row }">{{ fieldLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="值" min-width="240">
            <template #default="{ row }">
              {{ displayValue(detail.values?.[row.fieldDefId]) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-else>
        <div style="color: #9ca3af">-</div>
      </template>
    </div>
  </el-drawer>
</template>

