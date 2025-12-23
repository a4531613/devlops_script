const { requireString, optionalString } = require("../utils/validators");
const { buildTemplateFieldInput } = require("./dto/templateFieldInput");

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
      const input = buildTemplateFieldInput(ctx);
      ctx.body = service.createField(input);
    },
    updateField: async (ctx) => {
      const input = buildTemplateFieldInput(ctx);
      service.updateField(input);
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
