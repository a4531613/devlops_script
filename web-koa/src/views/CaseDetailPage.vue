<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import DynamicForm from '../components/DynamicForm.vue'
import { buildSchemaFromFields, mergeConfigWithFieldDefs } from '../lib/templateConfig'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const notFound = ref(false)

const detail = ref(null)
const template = ref(null)
const config = ref(null)
const fields = ref([])
const values = ref({})

const useFallback = computed(() => !config.value?.layout?.length)
const merged = computed(() => mergeConfigWithFieldDefs(config.value, fields.value))
const schema = computed(() =>
  useFallback.value ? buildSchemaFromFields(fields.value) : merged.value.fields
)
const invalidCodes = computed(() => (useFallback.value ? [] : merged.value.invalidCodes))

const caseNo = computed(() => detail.value?.case_no || detail.value?.id || '-')
const roleCode = localStorage.getItem('roleCode') || 'admin'
const canEdit = roleCode === 'admin' || roleCode === 'editor'
const canDelete = roleCode === 'admin' || roleCode === 'editor'

async function load() {
  if (!route.params.id) return
  loading.value = true
  notFound.value = false
  try {
    const res = await api.get(`/cases/${route.params.id}`)
    detail.value = res.data.case
    template.value = res.data.template
    config.value = res.data.config_json
    fields.value = Array.isArray(res.data.fields) ? res.data.fields : []
    values.value = res.data.data_json || {}
  } catch (err) {
    if (err?.response?.status === 404) notFound.value = true
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  const url = window.location.href
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制链接')
    return
  }
  ElMessage.warning('当前环境不支持剪贴板')
}

function openNewWindow() {
  window.open(window.location.href, '_blank')
}

function goEdit() {
  if (!detail.value?.id) return
  router.push(`/cases/${detail.value.id}/edit`)
}

async function removeCase() {
  if (!detail.value?.id) return
  await ElMessageBox.confirm('确认删除该案例？', '提示', { type: 'warning' })
  await api.delete(`/cases/${detail.value.id}`)
  ElMessage.success('已删除')
  router.push('/cases/search')
}

function exportJson() {
  const data = JSON.stringify(values.value || {}, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${caseNo.value || 'case'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function goBack() {
  router.push('/cases/search')
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <div class="card-title">案例详情</div>
        <div class="toolbar-left">
          <el-button v-if="canEdit" type="primary" @click="goEdit">编辑</el-button>
          <el-button v-if="canDelete" type="danger" @click="removeCase">删除</el-button>
          <el-button @click="goBack">返回列表</el-button>
          <el-button @click="copyLink">复制链接</el-button>
          <el-button @click="openNewWindow">新窗口打开</el-button>
          <el-button @click="exportJson">导出 JSON</el-button>
        </div>
      </div>

      <el-empty v-if="notFound" description="案例不存在">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>

      <template v-else>
        <el-descriptions v-if="detail" :column="2" border class="mb-12">
          <el-descriptions-item label="案例编号">{{ caseNo }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="模板名称">{{ template?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updated_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="useFallback && fields.length"
          type="warning"
          show-icon
          :closable="false"
          title="该模板未配置布局，已按默认顺序展示"
          class="mb-12"
        />

        <el-alert
          v-if="invalidCodes.length"
          type="error"
          show-icon
          :closable="false"
          :title="`配置引用不存在字段：${invalidCodes.join('、')}`"
          class="mb-12"
        />

        <el-empty v-if="!fields.length" description="未找到字段定义" />

        <DynamicForm v-else v-model="values" :fields="schema" mode="readonly" />
      </template>
    </el-card>
  </div>
</template>
