<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import DynamicForm from '../components/DynamicForm.vue'
import { buildSchemaFromFields, mergeConfigWithFieldDefs } from '../lib/templateConfig'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const notFound = ref(false)
const saving = ref(false)

const detail = ref(null)
const template = ref(null)
const config = ref(null)
const fields = ref([])
const values = ref({})

const formRef = ref()
const form = ref({ title: '', status: 'DRAFT' })

const useFallback = computed(() => !config.value?.layout?.length)
const merged = computed(() => mergeConfigWithFieldDefs(config.value, fields.value))
const schema = computed(() =>
  useFallback.value ? buildSchemaFromFields(fields.value) : merged.value.fields
)
const invalidCodes = computed(() => (useFallback.value ? [] : merged.value.invalidCodes))

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
    form.value = {
      title: res.data.case?.title || '',
      status: res.data.case?.status || 'DRAFT',
    }
  } catch (err) {
    if (err?.response?.status === 404) notFound.value = true
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!detail.value?.id) return
  const ok = await formRef.value?.validate?.()
  if (!ok) return
  saving.value = true
  try {
    await api.put(`/cases/${detail.value.id}`, {
      title: form.value.title,
      status: form.value.status,
      data_json: values.value || {},
    })
    ElMessage.success('已保存')
    router.push(`/cases/${detail.value.id}`)
  } finally {
    saving.value = false
  }
}

function cancel() {
  if (!detail.value?.id) return router.push('/cases/search')
  router.push(`/cases/${detail.value.id}`)
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <div class="card-title">编辑案例</div>
        <div class="toolbar-left">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </div>

      <el-empty v-if="notFound" description="案例不存在">
        <el-button type="primary" @click="cancel">返回列表</el-button>
      </el-empty>

      <template v-else>
        <el-descriptions v-if="detail" :column="2" border style="margin-bottom: 12px">
          <el-descriptions-item label="案例编号">{{ detail.case_no || detail.id }}</el-descriptions-item>
          <el-descriptions-item label="模板名称">{{ template?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updated_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="90px" style="margin-bottom: 12px">
          <el-form-item label="标题" required>
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 200px">
              <el-option label="草稿" value="DRAFT" />
              <el-option label="已提交" value="SUBMITTED" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-alert
          v-if="useFallback && fields.length"
          type="warning"
          show-icon
          :closable="false"
          title="该模板未配置布局，已按默认顺序展示"
          style="margin-bottom: 12px"
        />

        <el-alert
          v-if="invalidCodes.length"
          type="error"
          show-icon
          :closable="false"
          :title="`配置引用不存在字段：${invalidCodes.join('、')}`"
          style="margin-bottom: 12px"
        />

        <el-empty v-if="!fields.length" description="未找到字段定义" />

        <DynamicForm
          v-else
          ref="formRef"
          v-model="values"
          :fields="schema"
          mode="edit"
        />
      </template>
    </el-card>
  </div>
</template>
