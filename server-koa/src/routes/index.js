const Router = require("@koa/router");

function createRootRouter({ rolesRouter, templatesRouter, casesRouter }) {
  const router = new Router();
  router.get("/api/health", (ctx) => {
    ctx.body = { ok: true };
  });
  router.use(rolesRouter.routes());
  router.use(templatesRouter.routes());
  router.use(casesRouter.routes());
  return router;
}

module.exports = { createRootRouter };
