const { requireArray, requireString, optionalString } = require("../utils/validators");

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
      const name = requireString(ctx.request.body?.name, "name");
      const label = requireString(ctx.request.body?.label, "label");
      const type = requireString(ctx.request.body?.type, "type");
      const options = ctx.request.body?.options ?? null;
      ctx.body = service.createField({ templateId, name, label, type, options });
    },
    updateField: async (ctx) => {
      const templateId = ctx.params.id;
      const fieldId = ctx.params.fieldId;
      const name = requireString(ctx.request.body?.name, "name");
      const label = requireString(ctx.request.body?.label, "label");
      const type = requireString(ctx.request.body?.type, "type");
      const options = ctx.request.body?.options ?? null;
      service.updateField({ templateId, fieldId, name, label, type, options });
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
      ctx.body = service.listConfig(templateId);
    },
    replaceConfig: async (ctx) => {
      const templateId = ctx.params.id;
      const body = ctx.request.body;
      if (body && typeof body === "object" && !Array.isArray(body) && body.layout) {
        service.replaceConfigFromJson({ templateId, configJson: body });
      } else {
        const items = requireArray(body, "body");
        service.replaceConfig({ templateId, items });
      }
      ctx.body = { ok: true };
    },
  };
}

module.exports = { createTemplatesController };
