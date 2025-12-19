<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import DynamicFieldInput from '../components/DynamicFieldInput.vue'

const templates = ref([])
const templateId = ref('')
const templateConfigs = ref([])

const saving = ref(false)

const form = reactive({
  title: '',
  values: {},
})

const orderedFields = computed(() => templateConfigs.value ?? [])

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
    if (t === 'checkbox' || t === 'multiselect') form.values[c.fieldDefId] = []
    else if (t === 'switch') form.values[c.fieldDefId] = false
    else form.values[c.fieldDefId] = null
  })
}

function fieldLabel(cfg) {
  return cfg.config?.label || cfg.fieldDef?.label || cfg.fieldDef?.name || '字段'
}

function validateRequired() {
  if (!templateId.value) return { ok: false, msg: '请选择模板' }
  if (!form.title?.trim()) return { ok: false, msg: '请输入案例标题' }
  for (const cfg of orderedFields.value) {
    if (!cfg.required) continue
    const v = form.values[cfg.fieldDefId]
    const empty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
    if (empty) return { ok: false, msg: `请填写：${fieldLabel(cfg)}` }
  }
  return { ok: true }
}

async function submit() {
  const v = validateRequired()
  if (!v.ok) return ElMessage.error(v.msg)

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

onMounted(async () => {
  await loadTemplates()
})
</script>

<template>
  <el-card>
    <el-form label-width="90px">
      <el-form-item label="模板" required>
        <el-select v-model="templateId" placeholder="请选择模板" style="width: 360px" @change="loadConfig">
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <span style="margin-left: 10px; color: #9ca3af">模板配置后才会渲染字段</span>
      </el-form-item>

      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入案例标题" />
      </el-form-item>

      <template v-for="cfg in orderedFields" :key="cfg.fieldDefId">
        <el-form-item :label="fieldLabel(cfg)" :required="!!cfg.required">
          <DynamicFieldInput
            v-model="form.values[cfg.fieldDefId]"
            :field-def="cfg.fieldDef"
            :config="cfg.config"
          />
        </el-form-item>
      </template>
    </el-form>

    <div style="display: flex; justify-content: flex-end">
      <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
    </div>
  </el-card>
</template>
