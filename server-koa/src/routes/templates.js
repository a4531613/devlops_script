const Router = require("@koa/router");

function createTemplatesRouter(controller) {
  const router = new Router({ prefix: "/api/templates" });
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  router.get("/:id/fields", controller.listFields);
  router.post("/:id/fields", controller.bindFields);
  router.delete("/:id/fields/:fieldId", controller.unbindField);

  router.get("/:id/config", controller.getConfig);
  router.put("/:id/config", controller.replaceConfig);
  return router;
}

module.exports = { createTemplatesRouter };
