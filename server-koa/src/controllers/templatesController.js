const { requireString, optionalString } = require("../utils/validators");

function createTemplatesController(service) {
  return {
    list: async (ctx) => {
      ctx.body = service.list();
    },
    create: async (ctx) => {
      const name = requireString(ctx.request.body?.name, "name");
      const description = optionalString(ctx.request.body?.description);
      ctx.body = service.create({ name, description });
    },
    update: async (ctx) => {
      const id = ctx.params.id;
      const name = requireString(ctx.request.body?.name, "name");
      const description = optionalString(ctx.request.body?.description);
      service.update({ id, name, description });
      ctx.body = { ok: true };
    },
    remove: async (ctx) => {
      const id = ctx.params.id;
      service.remove(id);
      ctx.body = { ok: true };
    },
    listFields: async (ctx) => {
      const templateId = ctx.params.id;
      ctx.body = service.listFields(templateId);
    },
    createField: async (ctx) => {
      const templateId = ctx.params.id;
      const fieldCode = requireString(ctx.request.body?.fieldCode, "fieldCode");
      const fieldName = requireString(ctx.request.body?.fieldName, "fieldName");
      const fieldType = requireString(ctx.request.body?.fieldType, "fieldType");
      const required = !!ctx.request.body?.required;
      const options = ctx.request.body?.options ?? null;
      const defaultValue = ctx.request.body?.defaultValue ?? null;
      const placeholder = ctx.request.body?.placeholder ?? null;
      const helpText = ctx.request.body?.helpText ?? null;
      const regex = ctx.request.body?.regex ?? null;
      const min = ctx.request.body?.min ?? null;
      const max = ctx.request.body?.max ?? null;
      const status = ctx.request.body?.status ?? "active";
      ctx.body = service.createField({
        templateId,
        fieldCode,
        fieldName,
        fieldType,
        required,
        options,
        defaultValue,
        placeholder,
        helpText,
        regex,
        min,
        max,
        status,
      });
    },
    updateField: async (ctx) => {
      const templateId = ctx.params.id;
      const fieldId = ctx.params.fieldId;
      const fieldCode = requireString(ctx.request.body?.fieldCode, "fieldCode");
      const fieldName = requireString(ctx.request.body?.fieldName, "fieldName");
      const fieldType = requireString(ctx.request.body?.fieldType, "fieldType");
      const required = !!ctx.request.body?.required;
      const options = ctx.request.body?.options ?? null;
      const defaultValue = ctx.request.body?.defaultValue ?? null;
      const placeholder = ctx.request.body?.placeholder ?? null;
      const helpText = ctx.request.body?.helpText ?? null;
      const regex = ctx.request.body?.regex ?? null;
      const min = ctx.request.body?.min ?? null;
      const max = ctx.request.body?.max ?? null;
      const status = ctx.request.body?.status ?? "active";
      service.updateField({
        templateId,
        fieldId,
        fieldCode,
        fieldName,
        fieldType,
        required,
        options,
        defaultValue,
        placeholder,
        helpText,
        regex,
        min,
        max,
        status,
      });
      ctx.body = { ok: true };
    },
    removeField: async (ctx) => {
      const templateId = ctx.params.id;
      const fieldId = ctx.params.fieldId;
      service.removeField({ templateId, fieldId });
      ctx.body = { ok: true };
    },
    getConfig: async (ctx) => {
      const templateId = ctx.params.id;
      ctx.body = service.getConfigJson(templateId);
    },
    replaceConfig: async (ctx) => {
      const templateId = ctx.params.id;
      const body = ctx.request.body;
      service.replaceConfigFromJson({ templateId, configJson: body });
      ctx.body = { ok: true };
    },
  };
}

module.exports = { createTemplatesController };
