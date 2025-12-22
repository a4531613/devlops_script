export const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'datetime', label: '日期时间' },
  { value: 'select', label: '下拉单选' },
  { value: 'multiselect', label: '下拉多选' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'switch', label: '开关' },
]

export function isOptionType(type) {
  return ['select', 'multiselect', 'radio', 'checkbox'].includes(type)
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

export function displayValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.join('、') || '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

