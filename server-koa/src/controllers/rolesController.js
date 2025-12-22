const { requireString, optionalString } = require("../utils/validators");

function createRolesController(service) {
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
  };
}

module.exports = { createRolesController };

