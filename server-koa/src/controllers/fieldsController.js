const { requireString } = require("../utils/validators");

function createFieldsController(service) {
  return {
    list: async (ctx) => {
      ctx.body = service.list();
    },
    create: async (ctx) => {
      const name = requireString(ctx.request.body?.name, "name");
      const label = requireString(ctx.request.body?.label, "label");
      const type = requireString(ctx.request.body?.type, "type");
      const options = ctx.request.body?.options ?? null;
      ctx.body = service.create({ name, label, type, options });
    },
    update: async (ctx) => {
      const id = ctx.params.id;
      const name = requireString(ctx.request.body?.name, "name");
      const label = requireString(ctx.request.body?.label, "label");
      const type = requireString(ctx.request.body?.type, "type");
      const options = ctx.request.body?.options ?? null;
      service.update({ id, name, label, type, options });
      ctx.body = { ok: true };
    },
    remove: async (ctx) => {
      const id = ctx.params.id;
      service.remove(id);
      ctx.body = { ok: true };
    },
  };
}

module.exports = { createFieldsController };

