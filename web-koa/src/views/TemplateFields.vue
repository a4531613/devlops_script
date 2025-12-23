<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import OptionsEditor from '../components/OptionsEditor.vue'
import TableColumnsEditor from '../components/TableColumnsEditor.vue'

const route = useRoute()
const router = useRouter()
const templateId = computed(() => route.params.id)

const loading = ref(false)
const template = ref(null)
const rows = ref([])
const q = ref('')
const typeFilter = ref('')

const dialogOpen = ref(false)
const form = ref({
  id: null,
  fieldCode: '',
  fieldName: '',
  fieldType: 'input',
  required: false,
  defaultValue: '',
  placeholder: '',
  helpText: '',
  options: [],
  tableConfig: { columns: [], minRows: 0, maxRows: 200 },
  collapseConfig: { accordion: false, defaultOpen: true },
  regex: '',
  min: null,
  max: null,
  status: 'active',
})

const fieldTypes = [
  { value: 'input', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉单选' },
  { value: 'select_multi', label: '下拉多选' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'date', label: '日期' },
  { value: 'datetime', label: '日期时间' },
  { value: 'switch', label: '开关' },
  { value: 'divider', label: '分隔线' },
  { value: 'collapse', label: '折叠面板' },
  { value: 'richtext', label: '富文本' },
  { value: 'table', label: '表格' },
]

const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    const okType = !typeFilter.value || r.fieldType === typeFilter.value
    const okKeyword =
      !keyword ||
      r.fieldCode.toLowerCase().includes(keyword) ||
      r.fieldName.toLowerCase().includes(keyword)
    return okType && okKeyword
  })
})

async function load() {
  if (!templateId.value) return
  loading.value = true
  try {
    const [tplRes, fieldRes] = await Promise.all([
      api.get('/templates'),
      api.get(`/templates/${templateId.value}/fields`),
    ])
    template.value = tplRes.data.find((t) => t.id === templateId.value) || null
    rows.value = fieldRes.data
  } finally {
    loading.value = false
  }
}

function create() {
  form.value = {
    id: null,
    fieldCode: '',
    fieldName: '',
    fieldType: 'input',
    required: false,
    defaultValue: '',
    placeholder: '',
    helpText: '',
    options: [],
    tableConfig: { columns: [], minRows: 0, maxRows: 200 },
    collapseConfig: { accordion: false, defaultOpen: true },
    regex: '',
    min: null,
    max: null,
    status: 'active',
  }
  dialogOpen.value = true
}

function edit(row) {
  form.value = {
    id: row.id,
    fieldCode: row.fieldCode,
    fieldName: row.fieldName,
    fieldType: row.fieldType,
    required: row.required,
    defaultValue: row.defaultValue ?? '',
    placeholder: row.placeholder ?? '',
    helpText: row.helpText ?? '',
    options: row.options ?? [],
    tableConfig: row.options?.columns ? row.options : { columns: [], minRows: 0, maxRows: 200 },
    collapseConfig: row.options?.accordion != null ? row.options : { accordion: false, defaultOpen: true },
    regex: row.regex ?? '',
    min: row.min ?? null,
    max: row.max ?? null,
    status: row.status ?? 'active',
  }
  dialogOpen.value = true
}

async function save() {
  const payload = {
    fieldCode: form.value.fieldCode,
    fieldName: form.value.fieldName,
    fieldType: form.value.fieldType,
    required: !!form.value.required,
    defaultValue: form.value.defaultValue || null,
    placeholder: form.value.placeholder || null,
    helpText: form.value.helpText || null,
    options:
      form.value.fieldType === 'table'
        ? form.value.tableConfig
        : form.value.fieldType === 'collapse'
        ? form.value.collapseConfig
        : form.value.options,
    regex: form.value.regex || null,
    min: form.value.min,
    max: form.value.max,
    status: form.value.status || 'active',
  }
  if (!payload.fieldCode?.trim()) return ElMessage.error('请输入字段编码')
  if (!payload.fieldName?.trim()) return ElMessage.error('请输入字段名称')

  if (form.value.id) await api.put(`/templates/${templateId.value}/fields/${form.value.id}`, payload)
  else await api.post(`/templates/${templateId.value}/fields`, payload)

  dialogOpen.value = false
  ElMessage.success('已保存')
  await load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确认删除字段：${row.fieldName}？`, '提示', { type: 'warning' })
  await api.delete(`/templates/${templateId.value}/fields/${row.id}`)
  ElMessage.success('已删除')
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
        <div class="card-title">{{ template?.name || '模板' }} - 字段管理</div>
      </div>
      <div class="toolbar-left">
        <el-button @click="goDesigner">去配置</el-button>
        <el-button type="primary" @click="create">新增字段</el-button>
      </div>
    </div>

    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="q" placeholder="搜索 fieldCode/fieldName" class="w-240" clearable />
          <el-select v-model="typeFilter" placeholder="类型" class="w-180" clearable>
            <el-option v-for="t in fieldTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
      </div>

      <el-table :data="filtered" border>
        <el-table-column prop="fieldName" label="字段名" min-width="160" />
        <el-table-column prop="fieldCode" label="编码" min-width="160" />
        <el-table-column prop="fieldType" label="类型" min-width="120" />
        <el-table-column prop="required" label="必填" width="80">
          <template #default="{ row }">{{ row.required ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

  <el-dialog v-model="dialogOpen" :title="form.id ? '编辑字段' : '新增字段'" width="720px">
    <el-form label-width="110px">
      <el-form-item label="字段编码" required>
        <el-input v-model="form.fieldCode" placeholder="如：customer_name" />
      </el-form-item>
      <el-form-item label="字段名称" required>
        <el-input v-model="form.fieldName" placeholder="如：客户名称" />
      </el-form-item>
      <el-form-item label="字段类型" required>
        <el-select v-model="form.fieldType" class="w-220">
          <el-option v-for="t in fieldTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="必填">
        <el-switch v-model="form.required" />
      </el-form-item>
      <el-form-item label="默认值">
        <el-input v-model="form.defaultValue" />
      </el-form-item>
      <el-form-item label="占位符">
        <el-input v-model="form.placeholder" />
      </el-form-item>
      <el-form-item label="提示文案">
        <el-input v-model="form.helpText" />
      </el-form-item>
      <el-form-item label="正则">
        <el-input v-model="form.regex" placeholder="如：^1[3-9]\\d{9}$" />
      </el-form-item>
      <el-form-item label="最小值">
        <el-input-number v-model="form.min" class="w-100" />
      </el-form-item>
      <el-form-item label="最大值">
        <el-input-number v-model="form.max" class="w-100" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" class="w-160">
          <el-option label="active" value="active" />
          <el-option label="inactive" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item label="选项" v-if="['select','select_multi','radio','checkbox'].includes(form.fieldType)">
        <OptionsEditor v-model="form.options" />
      </el-form-item>
      <el-form-item label="折叠配置" v-if="form.fieldType === 'collapse'">
        <el-switch v-model="form.collapseConfig.accordion" active-text="手风琴" />
        <el-switch v-model="form.collapseConfig.defaultOpen" active-text="默认展开" class="ml-12" />
      </el-form-item>
      <el-form-item label="表格列" v-if="form.fieldType === 'table'">
        <TableColumnsEditor v-model="form.tableConfig" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
