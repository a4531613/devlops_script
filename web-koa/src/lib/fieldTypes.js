export const FIELD_TYPES = [
  { value: 'input', label: '单行文本' },
  { value: 'text', label: '单行文本(兼容)' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'datetime', label: '日期时间' },
  { value: 'select', label: '下拉单选' },
  { value: 'select_multi', label: '下拉多选' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'switch', label: '开关' },
  { value: 'divider', label: '分隔线' },
  { value: 'collapse', label: '折叠面板' },
  { value: 'richtext', label: '富文本' },
  { value: 'table', label: '表格' },
]

export function isOptionType(type) {
  return ['select', 'select_multi', 'radio', 'checkbox'].includes(type)
}

export function normalizeOptions(options) {
  if (!Array.isArray(options)) return []
  return options
    .map((o) => {
      if (!o) return null
      if (typeof o === 'string') return { label: o, value: o }
      const label = o.label ?? o.value
      const value = o.value ?? o.label
      if (label == null || value == null) return null
      return { label: String(label), value: String(value) }
    })
    .filter(Boolean)
}

export function parseOptionsJson(options) {
  if (!options) return null
  if (typeof options === 'object') return options
  try {
    return JSON.parse(options)
  } catch {
    return null
  }
}

export function displayValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.join('、') || '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
