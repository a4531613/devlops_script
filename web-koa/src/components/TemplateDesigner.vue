<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

import { api } from '../api/client'

const props = defineProps({
  templateId: { type: String, default: '' },
})

const route = useRoute()
const resolvedTemplateId = computed(() => props.templateId || route.params.id)

const loading = ref(false)
const template = ref(null)
const fields = ref([])
const selected = ref([])
const q = ref('')

const available = computed(() => {
  const chosen = new Set(selected.value.map((s) => s.fieldId))
  const base = fields.value.filter((f) => !chosen.has(f.id))
  if (!q.value.trim()) return base
  const s = q.value.trim().toLowerCase()
  return base.filter((f) => f.name.toLowerCase().includes(s) || f.label.toLowerCase().includes(s))
})

const templateConfigJson = computed(() =>
  JSON.stringify(
    selected.value.map((item, index) => ({
      fieldId: item.fieldId,
      sortOrder: index,
      ui: {
        label: item.ui.label || null,
        placeholder: item.ui.placeholder || null,
        span: item.ui.span,
        visible: item.ui.visible,
        readonly: item.ui.readonly,
      },
    })),
    null,
    2
  )
)

function cloneField(field) {
  return {
    fieldId: field.id,
    fieldDef: field,
    ui: {
      label: field.label,
      placeholder: '',
      span: 12,
      visible: true,
      readonly: false,
    },
  }
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
    const [tplRes, fieldRes, configRes] = await Promise.all([
      api.get('/templates'),
      api.get(`/templates/${resolvedTemplateId.value}/fields`),
      api.get(`/templates/${resolvedTemplateId.value}/config`),
    ])
    template.value = tplRes.data.find((t) => t.id === resolvedTemplateId.value) || null
    fields.value = fieldRes.data
    selected.value = (configRes.data ?? []).map((c) => ({
      fieldId: c.fieldId,
      fieldDef: c.fieldDef,
      ui: {
        label: c.config?.label ?? c.fieldDef?.label ?? '',
        placeholder: c.config?.placeholder ?? '',
        span: c.config?.span ?? 12,
        visible: c.config?.visible ?? true,
        readonly: c.config?.readonly ?? false,
      },
    }))
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!resolvedTemplateId.value) return ElMessage.error('缺少模板 ID')
  const payload = selected.value.map((item, index) => ({
    fieldId: item.fieldId,
    sortOrder: index,
    required: false,
    config: {
      label: item.ui.label || null,
      placeholder: item.ui.placeholder || null,
      span: item.ui.span,
      visible: item.ui.visible,
      readonly: item.ui.readonly,
    },
  }))
  await api.put(`/templates/${resolvedTemplateId.value}/config`, payload)
  ElMessage.success('已保存模板配置')
}

onMounted(load)
watch(resolvedTemplateId, load)
</script>

<template>
  <div v-loading="loading">
    <div class="toolbar">
      <div class="card-title">{{ template?.name || '模板' }} - 配置设计器</div>
      <el-button type="primary" :disabled="!selected.length" @click="save">保存配置</el-button>
    </div>

    <el-row :gutter="12">
      <el-col :span="9">
        <el-card>
          <div class="toolbar">
            <div class="card-title">字段池</div>
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
                <div style="font-weight: 600">{{ element.label }}</div>
                <div class="muted">{{ element.name }} · {{ element.type }}</div>
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
                    <div style="font-weight: 600">{{ element.fieldDef.label }}</div>
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
  </div>
</template>

