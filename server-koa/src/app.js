const fs = require("node:fs");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("koa2-cors");
const serve = require("koa-static");
const send = require("koa-send");

const { errorHandler } = require("./middlewares/errorHandler");
const { auth } = require("./middlewares/auth");
const { requestId } = require("./middlewares/requestId");

const { createRolesRepo } = require("./repositories/rolesRepo");
const { createTemplatesRepo } = require("./repositories/templatesRepo");
const { createTemplateFieldsRepo } = require("./repositories/templateFieldsRepo");
const { createConfigsRepo } = require("./repositories/configsRepo");
const { createCasesRepo } = require("./repositories/casesRepo");

const { createRolesService } = require("./services/rolesService");
const { createTemplatesService } = require("./services/templatesService");
const { createCasesService } = require("./services/casesService");

const { createRolesController } = require("./controllers/rolesController");
const { createTemplatesController } = require("./controllers/templatesController");
const { createCasesController } = require("./controllers/casesController");

const { createRolesRouter } = require("./routes/roles");
const { createTemplatesRouter } = require("./routes/templates");
const { createCasesRouter } = require("./routes/cases");
const { createRootRouter } = require("./routes");

function accessLogger(logger) {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    if (logger?.access) {
      logger.access(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`);
    }
  };
}

function createApp({ db, logger, staticDir }) {
  if (!db) throw new Error("db required");

  const rolesRepo = createRolesRepo(db);
  const templatesRepo = createTemplatesRepo(db);
  const templateFieldsRepo = createTemplateFieldsRepo(db);
  const configsRepo = createConfigsRepo(db);
  const casesRepo = createCasesRepo(db);

  const rolesService = createRolesService(rolesRepo);
  const templatesService = createTemplatesService(templatesRepo, templateFieldsRepo, configsRepo);
  const casesService = createCasesService(casesRepo, templateFieldsRepo, configsRepo);

  const rolesController = createRolesController(rolesService);
  const templatesController = createTemplatesController(templatesService);
  const casesController = createCasesController(casesService);

  const rolesRouter = createRolesRouter(rolesController);
  const templatesRouter = createTemplatesRouter(templatesController);
  const casesRouter = createCasesRouter(casesController);

  const app = new Koa();
  app.context.logger = logger;
  app.use(errorHandler());
  app.use(requestId());
  app.use(accessLogger(logger));
  app.use(cors());
  app.use(bodyParser({ jsonLimit: "2mb" }));
  app.use(auth());

  const rootRouter = createRootRouter({ rolesRouter, templatesRouter, casesRouter });
  app.use(rootRouter.routes());
  app.use(rootRouter.allowedMethods());

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(serve(staticDir));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.status !== 404) return;
      if (ctx.path.startsWith("/api")) return;
      await send(ctx, "index.html", { root: staticDir });
    });
  }

  app.on("error", (err) => {
    if (logger?.error) logger.error(err?.stack || String(err));
    else console.error(err);
  });

  return app;
}

module.exports = { createApp };
