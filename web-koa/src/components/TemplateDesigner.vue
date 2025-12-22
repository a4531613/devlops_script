<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

import { api } from '../api/client'
import DynamicForm from './DynamicForm.vue'
import { normalizeOptions } from '../lib/fieldTypes'
import { mergeConfigWithFieldDefs, sanitizeConfig } from '../lib/templateConfig'
import { useTemplateFields } from '../lib/useTemplateFields'
import { useTemplateConfig } from '../lib/useTemplateConfig'

const props = defineProps({
  templateId: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()
const resolvedTemplateId = computed(() => props.templateId || route.params.id)

const loading = ref(false)
const template = ref(null)
const fields = ref([])
const selected = ref([])
const q = ref('')
const savedSnapshot = ref([])

const previewOpen = ref(false)
const previewReadonly = ref(false)
const previewUseSaved = ref(false)
const previewValues = ref({})
const previewOutput = ref('')
const previewFormRef = ref()

const { fields: poolFields, load: loadPool } = useTemplateFields(resolvedTemplateId)
const { config: savedConfigRef, load: loadConfig, save: saveConfig } = useTemplateConfig(resolvedTemplateId)

const available = computed(() => {
  const chosen = new Set(selected.value.map((s) => s.fieldId))
  const base = fields.value.filter((f) => !chosen.has(f.id))
  if (!q.value.trim()) return base
  const s = q.value.trim().toLowerCase()
  return base.filter(
    (f) => f.fieldCode.toLowerCase().includes(s) || f.fieldName.toLowerCase().includes(s)
  )
})

function buildConfigFromSelected(items) {
  return {
    version: 1,
    layout: items.map((item) => ({
      fieldCode: item.fieldDef.fieldCode,
      span: item.ui.span,
      label: item.ui.label || null,
      placeholder: item.ui.placeholder || null,
      visible: item.ui.visible,
      readonly: item.ui.readonly,
    })),
  }
}

const currentConfig = computed(() => buildConfigFromSelected(selected.value))
const templateConfigJson = computed(() => JSON.stringify(currentConfig.value, null, 2))
const previewConfig = computed(() => (previewUseSaved.value ? savedConfigRef.value : currentConfig.value))
const previewMerged = computed(() => mergeConfigWithFieldDefs(previewConfig.value, fields.value))
const previewSchema = computed(() => previewMerged.value.fields)
const previewInvalid = computed(() => previewMerged.value.invalidCodes)

function cloneField(field) {
  return {
    fieldId: field.id,
    fieldDef: field,
    ui: {
      label: field.fieldName,
      placeholder: '',
      span: 12,
      visible: true,
      readonly: false,
    },
  }
}

function defaultValueFor(type) {
  if (type === 'checkbox') return []
  if (type === 'select_multi') return []
  if (type === 'switch') return false
  return null
}

function syncPreviewValues() {
  const next = { ...previewValues.value }
  const keys = new Set(previewSchema.value.map((f) => f.id))
  Object.keys(next).forEach((k) => {
    if (!keys.has(k)) delete next[k]
  })
  previewSchema.value.forEach((f) => {
    if (!(f.id in next)) next[f.id] = defaultValueFor(f.type)
  })
  previewValues.value = next
}

function mockValueFor(field) {
  const type = field.type
  if (type === 'checkbox') {
    const opts = normalizeOptions(field.options)
    return opts.length ? [opts[0].value] : []
  }
  if (type === 'select_multi') {
    const opts = normalizeOptions(field.options)
    return opts.length ? [opts[0].value] : []
  }
  if (type === 'select' || type === 'radio') {
    const opts = normalizeOptions(field.options)
    return opts.length ? opts[0].value : null
  }
  if (type === 'number') return 1
  if (type === 'date') return new Date().toISOString().slice(0, 10)
  if (type === 'datetime') return new Date().toISOString()
  if (type === 'switch') return true
  if (type === 'divider' || type === 'section') return null
  return `${field.label || field.name || '字段'}示例`
}

function fillMock() {
  const next = { ...previewValues.value }
  previewSchema.value.forEach((f) => {
    next[f.id] = mockValueFor(f)
  })
  previewValues.value = next
}

async function submitPreview() {
  previewOutput.value = ''
  const ok = await previewFormRef.value?.validate?.()
  if (!ok) return
  previewOutput.value = JSON.stringify(previewValues.value, null, 2)
}

async function copyPreviewJson() {
  const text = JSON.stringify(previewValues.value, null, 2)
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制 JSON')
    return
  }
  ElMessage.warning('当前环境不支持剪贴板')
}

function openPreview() {
  if (previewUseSaved.value && !savedConfigRef.value?.layout) {
    ElMessage.warning('暂无已保存配置')
    return
  }
  if (!selected.value.length && !previewUseSaved.value) {
    ElMessage.warning('未选择任何字段')
    return
  }
  previewOutput.value = ''
  previewOpen.value = true
  syncPreviewValues()
}

function resetToSaved() {
  selected.value = JSON.parse(JSON.stringify(savedSnapshot.value))
  ElMessage.success('已重置为已保存配置')
}

function cleanInvalidFields() {
  const invalidCodes = previewInvalid.value
  if (!invalidCodes.length) return
  if (previewUseSaved.value && savedConfigRef.value?.layout) {
    savedConfigRef.value = sanitizeConfig(savedConfigRef.value, fields.value)
  } else {
    selected.value = selected.value.filter((item) => !invalidCodes.includes(item.fieldDef.fieldCode))
  }
  ElMessage.success('已清理无效字段')
}

function goBack() {
  router.back()
}

function itemStyle(span) {
  const s = Math.min(Math.max(Number(span) || 12, 1), 24)
  return { width: `calc(${(s / 24) * 100}% - 10px)` }
}

function removeAt(index) {
  selected.value.splice(index, 1)
}

function onSelectedChange(evt) {
  if (!evt?.added) return
  const item = evt.added.element
  const duplicated = selected.value.filter((s) => s.fieldId === item.fieldId).length > 1
  if (duplicated) {
    selected.value.splice(evt.added.newIndex, 1)
    ElMessage.warning('该字段已在布局中')
  }
}

async function load() {
  if (!resolvedTemplateId.value) return
  loading.value = true
  try {
    const [tplRes] = await Promise.all([api.get('/templates'), loadPool(), loadConfig()])
    template.value = tplRes.data.find((t) => t.id === resolvedTemplateId.value) || null
    fields.value = poolFields.value

    const config = savedConfigRef.value
    if (config?.layout?.length) {
      const merged = mergeConfigWithFieldDefs(config, fields.value)
      selected.value = merged.fields.map((f) => ({
        fieldId: f.id,
        fieldDef: fields.value.find((x) => x.id === f.id),
        ui: {
          label: f.config?.label ?? f.label ?? '',
          placeholder: f.config?.placeholder ?? '',
          span: f.config?.span ?? 12,
          visible: f.config?.visible ?? true,
          readonly: f.config?.readonly ?? false,
        },
      }))
    } else {
      selected.value = []
    }

    savedSnapshot.value = JSON.parse(JSON.stringify(selected.value))
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!resolvedTemplateId.value) return ElMessage.error('缺少模板 ID')
  const payload = buildConfigFromSelected(selected.value)
  await saveConfig(payload)
  ElMessage.success('已保存模板配置')
  savedSnapshot.value = JSON.parse(JSON.stringify(selected.value))
}

onMounted(load)
watch(resolvedTemplateId, load)
watch(selected, syncPreviewValues, { deep: true })
watch(previewUseSaved, syncPreviewValues)
watch(
  poolFields,
  (val) => {
    fields.value = val
  },
  { deep: true }
)
</script>

<template>
  <div v-loading="loading">
    <div class="toolbar">
    <div class="card-title">{{ template?.name || '模板' }} - 模板配置</div>
      <div class="toolbar-left">
        <el-button type="primary" :disabled="!selected.length" @click="save">保存配置</el-button>
        <el-button @click="openPreview">一键预览</el-button>
        <el-button :disabled="!savedSnapshot.length" @click="resetToSaved">重置</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-breadcrumb separator="/">
      <el-breadcrumb-item @click="router.push('/templates')">模板管理</el-breadcrumb-item>
      <el-breadcrumb-item>{{ template?.name || '当前模板' }}</el-breadcrumb-item>
      <el-breadcrumb-item>模板配置</el-breadcrumb-item>
    </el-breadcrumb>

    <el-alert
      v-if="!fields.length"
      type="warning"
      show-icon
      :closable="false"
      style="margin: 12px 0"
      title="字段池为空，请先维护字段池"
    />

    <el-row :gutter="12">
      <el-col :span="9">
        <el-card>
          <div class="toolbar">
            <div class="card-title">字段池（只读）</div>
            <el-input v-model="q" placeholder="搜索字段" style="width: 220px" clearable />
          </div>

          <Draggable
            :list="available"
            item-key="id"
            :group="{ name: 'fields', pull: 'clone', put: false }"
            :sort="false"
            :clone="cloneField"
          >
            <template #item="{ element }">
              <div class="drag-card" style="margin-bottom: 8px; cursor: grab">
                <div style="font-weight: 600">{{ element.fieldName }}</div>
                <div class="muted">{{ element.fieldCode }} · {{ element.fieldType }}</div>
              </div>
            </template>
          </Draggable>
        </el-card>
      </el-col>

      <el-col :span="15">
        <el-card>
          <div class="card-title" style="margin-bottom: 10px">表单布局区（拖拽排序）</div>

          <Draggable
            v-model="selected"
            item-key="fieldId"
            handle=".drag-handle"
            :group="{ name: 'fields', pull: true, put: true }"
            :component-data="{ class: 'grid-wrap' }"
            @change="onSelectedChange"
          >
            <template #item="{ element, index }">
              <div class="drag-card" :style="itemStyle(element.ui.span)">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <div class="drag-handle" style="cursor: move; color: #6b7280">☰</div>
                    <div style="font-weight: 600">{{ element.fieldDef.fieldName }}</div>
                  </div>
                  <el-button link type="danger" @click="removeAt(index)">移除</el-button>
                </div>

                <el-divider style="margin: 10px 0" />
                <el-row :gutter="10">
                  <el-col :span="12">
                    <div class="muted" style="margin-bottom: 6px">Label</div>
                    <el-input v-model="element.ui.label" placeholder="字段显示名" />
                  </el-col>
                  <el-col :span="12">
                    <div class="muted" style="margin-bottom: 6px">Placeholder</div>
                    <el-input v-model="element.ui.placeholder" placeholder="输入提示" />
                  </el-col>
                </el-row>

                <el-row :gutter="10" style="margin-top: 8px">
                  <el-col :span="8">
                    <div class="muted" style="margin-bottom: 6px">Span</div>
                    <el-input-number v-model="element.ui.span" :min="1" :max="24" style="width: 100%" />
                  </el-col>
                  <el-col :span="8">
                    <div class="muted" style="margin-bottom: 6px">显示</div>
                    <el-switch v-model="element.ui.visible" />
                  </el-col>
                  <el-col :span="8">
                    <div class="muted" style="margin-bottom: 6px">只读</div>
                    <el-switch v-model="element.ui.readonly" />
                  </el-col>
                </el-row>
              </div>
            </template>
          </Draggable>

          <div v-if="!selected.length" class="muted">从左侧拖入字段，按顺序设计表单布局。</div>
        </el-card>

        <el-card style="margin-top: 12px">
          <div class="card-title" style="margin-bottom: 8px">template_config_json</div>
          <el-input type="textarea" :rows="10" :model-value="templateConfigJson" readonly />
        </el-card>
      </el-col>
    </el-row>

    <el-drawer v-model="previewOpen" size="680px" title="预览表单">
      <div v-if="previewInvalid.length" style="margin-bottom: 12px">
        <el-alert type="error" :closable="false" show-icon>
          <template #title>发现无效字段：{{ previewInvalid.join('、') }}</template>
        </el-alert>
        <div style="margin-top: 8px">
          <el-button type="danger" @click="cleanInvalidFields">清理无效字段</el-button>
        </div>
      </div>

      <div class="toolbar" style="margin-bottom: 8px">
        <div class="toolbar-left">
          <el-switch v-model="previewReadonly" active-text="只读预览" />
          <el-switch v-model="previewUseSaved" active-text="使用已保存配置" :disabled="!savedConfigRef?.layout" />
        </div>
        <div class="toolbar-left">
          <el-button @click="fillMock">填充示例数据</el-button>
          <el-button @click="submitPreview">提交预览</el-button>
          <el-button @click="copyPreviewJson">复制 JSON</el-button>
        </div>
      </div>

      <template v-if="previewSchema.length">
        <DynamicForm
          ref="previewFormRef"
          v-model="previewValues"
          :fields="previewSchema"
          :mode="previewReadonly ? 'readonly' : 'edit'"
        />
      </template>
      <template v-else>
        <el-empty description="未选择任何字段或字段定义缺失" />
      </template>

      <el-card v-if="previewOutput" style="margin-top: 12px">
        <div class="card-title" style="margin-bottom: 8px">预览输出 JSON</div>
        <el-input type="textarea" :rows="8" :model-value="previewOutput" readonly />
      </el-card>
    </el-drawer>
  </div>
</template>
