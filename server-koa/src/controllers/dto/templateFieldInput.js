const { requireString } = require("../../utils/validators");

function buildTemplateFieldInput(ctx) {
  return {
    templateId: ctx.params.id,
    fieldId: ctx.params.fieldId,
    fieldCode: requireString(ctx.request.body?.fieldCode, "fieldCode"),
    fieldName: requireString(ctx.request.body?.fieldName, "fieldName"),
    fieldType: requireString(ctx.request.body?.fieldType, "fieldType"),
    required: !!ctx.request.body?.required,
    options: ctx.request.body?.options ?? null,
    defaultValue: ctx.request.body?.defaultValue ?? null,
    placeholder: ctx.request.body?.placeholder ?? null,
    helpText: ctx.request.body?.helpText ?? null,
    regex: ctx.request.body?.regex ?? null,
    min: ctx.request.body?.min ?? null,
    max: ctx.request.body?.max ?? null,
    status: ctx.request.body?.status ?? "active",
  };
}

module.exports = { buildTemplateFieldInput };
