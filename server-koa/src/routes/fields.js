const Router = require("@koa/router");

function createFieldsRouter(controller) {
  const router = new Router({ prefix: "/api/fields" });
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
}

module.exports = { createFieldsRouter };

