<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

import { api } from '../api/client'
import OptionsEditor from '../components/OptionsEditor.vue'
import { isOptionType } from '../lib/fieldTypes'

const route = useRoute()
const router = useRouter()
const templateId = computed(() => route.params.id)

const loading = ref(false)
const templates = ref([])
const fields = ref([])
const selected = ref([])
const q = ref('')
const columns = ref(2)

const template = computed(() => templates.value.find((t) => t.id === templateId.value))

const available = computed(() => {
  const chosen = new Set(selected.value.map((s) => s.fieldId))
  const base = fields.value.filter((f) => !chosen.has(f.id))
  if (!q.value.trim()) return base
  const s = q.value.trim().toLowerCase()
  return base.filter((f) => f.name.toLowerCase().includes(s) || f.label.toLowerCase().includes(s))
})

const itemStyle = computed(() => {
  const c = Number(columns.value) || 2
  if (c <= 1) return { width: '100%' }
  const gap = 10
  return { width: `calc(${100 / c}% - ${(gap * (c - 1)) / c}px)` }
})

async function load() {
  loading.value = true
  try {
    const [tplRes, fieldRes, configRes] = await Promise.all([
      api.get('/templates'),
      api.get(`/templates/${templateId.value}/fields`),
      api.get(`/templates/${templateId.value}/config`),
    ])
    templates.value = tplRes.data
    fields.value = fieldRes.data
    selected.value = (configRes.data ?? []).map((c) => ({
      fieldId: c.fieldId,
      required: !!c.required,
      config: {
        label: c.config?.label ?? '',
        placeholder: c.config?.placeholder ?? '',
        options: c.config?.options ?? null,
      },
      fieldDef: c.fieldDef,
    }))
  } finally {
    loading.value = false
  }
}

function addField(fieldDef) {
  selected.value.push({
    fieldId: fieldDef.id,
    required: false,
    config: { label: '', placeholder: '', options: null },
    fieldDef,
  })
}

function removeField(index) {
  selected.value.splice(index, 1)
}

async function save() {
  const payload = selected.value.map((s, index) => ({
    fieldId: s.fieldId,
    sortOrder: index,
    required: !!s.required,
    config: {
      label: s.config?.label?.trim() || null,
      placeholder: s.config?.placeholder?.trim() || null,
      options: isOptionType(s.fieldDef.type) ? s.config?.options ?? null : null,
    },
  }))
  await api.put(`/templates/${templateId.value}/config`, payload)
  ElMessage.success('已保存')
}

function back() {
  router.push('/templates')
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
      <div style="display: flex; align-items: center; gap: 12px">
        <el-button @click="back">返回</el-button>
        <div style="font-weight: 700">{{ template?.name || '模板' }} - 配置</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <div style="color: #6b7280">列数</div>
        <el-select v-model="columns" style="width: 120px">
          <el-option :value="1" label="1 列" />
          <el-option :value="2" label="2 列" />
          <el-option :value="3" label="3 列" />
        </el-select>
        <el-button type="primary" :disabled="!selected.length" @click="save">保存配置</el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <el-col :span="10">
        <el-card>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
            <div style="font-weight: 600">可选字段</div>
            <el-input v-model="q" placeholder="搜索" style="width: 220px" clearable />
          </div>
          <el-table :data="available" size="small" border height="540">
            <el-table-column prop="label" label="label" min-width="140" />
            <el-table-column prop="name" label="name" min-width="140" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column label="" width="80" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="addField(row)">添加</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <div style="font-weight: 600; margin-bottom: 10px">已选字段（支持左右/上下拖拽排序）</div>

          <Draggable
            v-model="selected"
            item-key="fieldId"
            handle=".drag-handle"
            :component-data="{ style: 'display:flex; flex-wrap:wrap; gap:10px;' }"
          >
            <template #item="{ element, index }">
              <div
                style="
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 12px;
                  margin-bottom: 10px;
                  background: #fff;
                "
                :style="itemStyle"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <div class="drag-handle" style="cursor: move; color: #6b7280">☰</div>
                    <div style="font-weight: 600">{{ element.fieldDef.label }}</div>
                    <el-tag size="small" type="info">{{ element.fieldDef.type }}</el-tag>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px">
                    <el-switch v-model="element.required" active-text="必填" />
                    <el-button link type="danger" @click="removeField(index)">移除</el-button>
                  </div>
                </div>

                <el-divider style="margin: 10px 0" />
                <el-row :gutter="10">
                  <el-col :span="12">
                    <div style="margin-bottom: 6px; color: #6b7280">显示名覆盖（可选）</div>
                    <el-input v-model="element.config.label" placeholder="不填则用字段 label" />
                  </el-col>
                  <el-col :span="12">
                    <div style="margin-bottom: 6px; color: #6b7280">Placeholder（可选）</div>
                    <el-input v-model="element.config.placeholder" placeholder="不填则自动生成" />
                  </el-col>
                </el-row>

                <div v-if="isOptionType(element.fieldDef.type)" style="margin-top: 10px">
                  <div style="margin-bottom: 6px; color: #6b7280">选项覆盖（可选）</div>
                  <OptionsEditor v-model="element.config.options" />
                </div>
              </div>
            </template>
          </Draggable>

          <div v-if="!selected.length" style="color: #9ca3af">从左侧添加字段后，可拖拽排序并保存。</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
