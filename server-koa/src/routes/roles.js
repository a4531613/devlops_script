const Router = require("@koa/router");

function createRolesRouter(controller) {
  const router = new Router({ prefix: "/api/roles" });
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
}

module.exports = { createRolesRouter };

