const Router = require("@koa/router");

function createCasesRouter(controller) {
  const router = new Router({ prefix: "/api/cases" });
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.getById);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
}

module.exports = { createCasesRouter };
