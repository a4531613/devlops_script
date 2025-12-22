<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import DynamicForm from '../components/DynamicForm.vue'

const templates = ref([])
const templateId = ref('')
const templateConfigs = ref([])
const formRef = ref()

const saving = ref(false)

const form = reactive({
  title: '',
  values: {},
})

const schema = computed(() =>
  templateConfigs.value.map((c) => ({
    id: c.fieldId,
    label: c.fieldDef.label,
    name: c.fieldDef.name,
    type: c.fieldDef.type,
    options: c.config?.options ?? c.fieldDef.options,
    required: !!c.required,
    config: c.config ?? {},
  }))
)

async function loadTemplates() {
  templates.value = (await api.get('/templates')).data
}

async function loadConfig() {
  if (!templateId.value) {
    templateConfigs.value = []
    form.title = ''
    form.values = {}
    return
  }
  templateConfigs.value = (await api.get(`/templates/${templateId.value}/config`)).data
  form.values = {}
  templateConfigs.value.forEach((c) => {
    const t = c.fieldDef?.type
    if (t === 'checkbox' || t === 'multiselect') form.values[c.fieldId] = []
    else if (t === 'switch') form.values[c.fieldId] = false
    else form.values[c.fieldId] = null
  })
}

async function submit() {
  if (!templateId.value) return ElMessage.error('请选择模板')
  if (!form.title?.trim()) return ElMessage.error('请输入案例标题')
  const ok = await formRef.value?.validate?.()
  if (!ok) return

  saving.value = true
  try {
    await api.post('/cases', {
      templateId: templateId.value,
      title: form.title,
      values: form.values,
    })
    ElMessage.success('已创建')
    form.title = ''
    await loadConfig()
  } finally {
    saving.value = false
  }
}

onMounted(loadTemplates)
</script>

<template>
  <el-card>
    <el-form label-width="90px">
      <el-form-item label="模板" required>
        <el-select v-model="templateId" placeholder="请选择模板" style="width: 360px" @change="loadConfig">
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <span class="muted" style="margin-left: 10px">模板配置后才会渲染字段</span>
      </el-form-item>

      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入案例标题" />
      </el-form-item>
    </el-form>

    <DynamicForm ref="formRef" v-model="form.values" :fields="schema" />

    <div style="display: flex; justify-content: flex-end">
      <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
    </div>
  </el-card>
</template>
