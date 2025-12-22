const { requireString, requireObject, optionalString } = require("../utils/validators");

function createCasesController(service) {
  return {
    list: async (ctx) => {
      const filters = {
        templateId: optionalString(ctx.query.templateId),
        keyword: optionalString(ctx.query.keyword),
        from: optionalString(ctx.query.from),
        to: optionalString(ctx.query.to),
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
      ctx.body = service.getById(id);
    },
  };
}

module.exports = { createCasesController };

