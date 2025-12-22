export function mergeConfigWithFieldDefs(config, fieldDefs) {
  const map = new Map(fieldDefs.map((f) => [f.fieldCode, f]))
  const layout = Array.isArray(config?.layout) ? config.layout : []
  const invalidCodes = []
  const fields = []

  layout.forEach((item) => {
    const fieldDef = map.get(item.fieldCode)
    if (!fieldDef) {
      invalidCodes.push(item.fieldCode)
      return
    }
    fields.push({
      id: fieldDef.fieldCode,
      label: item.label || fieldDef.fieldName,
      name: fieldDef.fieldCode,
      type: fieldDef.fieldType,
      options: fieldDef.options,
      required: !!fieldDef.required,
      regex: fieldDef.regex || null,
      min: fieldDef.min ?? null,
      max: fieldDef.max ?? null,
      defaultValue: fieldDef.defaultValue ?? null,
      config: {
        label: item.label || null,
        placeholder: item.placeholder || fieldDef.placeholder || null,
        span: item.span ?? 12,
        visible: item.visible ?? true,
        readonly: item.readonly ?? false,
      },
    })
  })

  return { fields, invalidCodes }
}

export function sanitizeConfig(config, fieldDefs) {
  const codes = new Set(fieldDefs.map((f) => f.fieldCode))
  const layout = Array.isArray(config?.layout) ? config.layout : []
  return {
    version: 1,
    layout: layout.filter((item) => codes.has(item.fieldCode)),
  }
}
