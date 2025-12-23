<script setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import DynamicForm from '../components/DynamicForm.vue'
import { buildSchemaFromFields, mergeConfigWithFieldDefs } from '../lib/templateConfig'

const router = useRouter()

const templates = ref([])
const templateId = ref('')
const keyword = ref('')
const range = ref([])

const loading = ref(false)
const rows = ref([])

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detailCase = ref(null)
const detailTemplate = ref(null)
const detailConfig = ref(null)
const detailFields = ref([])
const detailValues = ref({})

const templateMap = computed(() => new Map(templates.value.map((t) => [t.id, t.name])))
const useFallback = computed(() => !detailConfig.value?.layout?.length)
const detailMerged = computed(() => mergeConfigWithFieldDefs(detailConfig.value, detailFields.value))
const detailSchema = computed(() =>
  useFallback.value ? buildSchemaFromFields(detailFields.value) : detailMerged.value.fields
)
const detailInvalidCodes = computed(() =>
  useFallback.value ? [] : detailMerged.value.invalidCodes
)

const roleCode = localStorage.getItem('roleCode') || 'admin'
const canEdit = roleCode === 'admin' || roleCode === 'editor'
const canDelete = roleCode === 'admin' || roleCode === 'editor'

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

function goDetailPage(row) {
  router.push(`/cases/${row.id}`)
}

function goEditPage(row) {
  router.push(`/cases/${row.id}/edit`)
}

async function copyLink(row) {
  const url = `${window.location.origin}/cases/${row.id}`
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制链接')
    return
  }
  ElMessage.warning('当前环境不支持剪贴板')
}

async function removeCase(row) {
  await ElMessageBox.confirm('确认删除该案例？', '提示', { type: 'warning' })
  await api.delete(`/cases/${row.id}`)
  ElMessage.success('已删除')
  await search()
}

async function openDetail(row) {
  drawerOpen.value = true
  detailLoading.value = true
  detailCase.value = null
  detailTemplate.value = null
  detailConfig.value = null
  detailFields.value = []
  detailValues.value = {}
  try {
    const d = (await api.get(`/cases/${row.id}`)).data
    detailCase.value = d.case
    detailTemplate.value = d.template
    detailConfig.value = d.config_json
    detailFields.value = d.fields || []
    detailValues.value = d.data_json || {}
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadTemplates()
  await search()
})
</script>

<template>
  <el-card class="mb-12">
    <el-form inline>
      <el-form-item label="模板">
        <el-select v-model="templateId" placeholder="全部" class="w-220" clearable>
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="keyword" placeholder="标题包含" clearable class="w-220" />
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="range"
          type="daterange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
        />
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
      <el-table-column label="操作" width="320" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="goDetailPage(row)">查看详情</el-button>
          <el-button link type="primary" @click="openDetail(row)">预览</el-button>
          <el-button v-if="canEdit" link type="primary" @click="goEditPage(row)">编辑</el-button>
          <el-button v-if="canDelete" link type="danger" @click="removeCase(row)">删除</el-button>
          <el-button link type="primary" @click="copyLink(row)">复制链接</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="muted mt-8">提示：双击行也可预览详情。</div>
  </el-card>

  <el-drawer v-model="drawerOpen" size="520px" title="案例详情">
    <div v-loading="detailLoading">
      <template v-if="detailCase">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="案例编号">{{ detailCase.case_no || detailCase.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detailCase.title }}</el-descriptions-item>
          <el-descriptions-item label="模板">
            {{ templateMap.get(detailCase.template_id) || detailTemplate?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailCase.created_at }}</el-descriptions-item>
        </el-descriptions>

        <div class="toolbar mt-12 mb-6">
          <div class="card-title">字段值</div>
          <el-button link type="primary" @click="goDetailPage(detailCase)">打开独立页面</el-button>
        </div>

        <el-alert
          v-if="useFallback && detailFields.length"
          type="warning"
          show-icon
          :closable="false"
          title="该模板未配置布局，已按默认顺序展示"
          class="mb-12"
        />

        <el-alert
          v-if="detailInvalidCodes.length"
          type="error"
          show-icon
          :closable="false"
          :title="`配置引用不存在字段：${detailInvalidCodes.join('、')}`"
          class="mb-12"
        />

        <DynamicForm :fields="detailSchema" v-model="detailValues" mode="readonly" />
      </template>
      <template v-else>
        <div class="muted">-</div>
      </template>
    </div>
  </el-drawer>
</template>
