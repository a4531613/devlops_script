export function mergeConfigWithFieldDefs(config, fieldDefs) {
  const map = new Map(fieldDefs.map((f) => [f.name, f]))
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
      id: fieldDef.id,
      label: item.label || fieldDef.label,
      name: fieldDef.name,
      type: fieldDef.type,
      options: fieldDef.options,
      required: !!item.required,
      config: {
        label: item.label || null,
        placeholder: item.placeholder || null,
        span: item.span ?? 12,
        visible: item.visible ?? true,
        readonly: item.readonly ?? false,
      },
    })
  })

  return { fields, invalidCodes }
}

export function sanitizeConfig(config, fieldDefs) {
  const codes = new Set(fieldDefs.map((f) => f.name))
  const layout = Array.isArray(config?.layout) ? config.layout : []
  return {
    version: 1,
    layout: layout.filter((item) => codes.has(item.fieldCode)),
  }
}

