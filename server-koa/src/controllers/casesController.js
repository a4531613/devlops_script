const { requireString, requireObject, optionalString } = require("../utils/validators");

function createCasesController(service) {
  return {
    list: async (ctx) => {
      const filters = {
        templateId: optionalString(ctx.query.templateId),
        keyword: optionalString(ctx.query.keyword),
        from: optionalString(ctx.query.from),
        to: optionalString(ctx.query.to),
        includeDeleted: optionalString(ctx.query.includeDeleted) === "1",
      };
      ctx.body = service.list(filters);
    },
    create: async (ctx) => {
      const templateId = requireString(ctx.request.body?.templateId, "templateId");
      const title = requireString(ctx.request.body?.title, "title");
      const values = requireObject(ctx.request.body?.values ?? {}, "values");
      ctx.body = service.create({ templateId, title, values });
    },
    getById: async (ctx) => {
      const id = ctx.params.id;
      ctx.body = service.getDetail(id);
    },
    update: async (ctx) => {
      const id = ctx.params.id;
      const title = requireString(ctx.request.body?.title, "title");
      const status = optionalString(ctx.request.body?.status) || null;
      const dataJson = requireObject(ctx.request.body?.data_json ?? {}, "data_json");
      ctx.body = service.update({
        id,
        title,
        status,
        dataJson,
        roleCode: ctx.state.roleCode,
      });
    },
    remove: async (ctx) => {
      const id = ctx.params.id;
      ctx.body = { data: service.remove({ id, roleCode: ctx.state.roleCode }) };
    },
  };
}

module.exports = { createCasesController };
