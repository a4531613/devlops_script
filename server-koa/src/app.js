const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("koa2-cors");
const logger = require("koa-logger");

const { openDb, migrate } = require("./db");
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

function createApp() {
  const db = openDb();
  migrate(db);

  const rolesRepo = createRolesRepo(db);
  const templatesRepo = createTemplatesRepo(db);
  const templateFieldsRepo = createTemplateFieldsRepo(db);
  const configsRepo = createConfigsRepo(db);
  const casesRepo = createCasesRepo(db);

  const rolesService = createRolesService(rolesRepo);
  const templatesService = createTemplatesService(templatesRepo, templateFieldsRepo, configsRepo);
  const casesService = createCasesService(casesRepo);

  const rolesController = createRolesController(rolesService);
  const templatesController = createTemplatesController(templatesService);
  const casesController = createCasesController(casesService);

  const rolesRouter = createRolesRouter(rolesController);
  const templatesRouter = createTemplatesRouter(templatesController);
  const casesRouter = createCasesRouter(casesController);

  const app = new Koa();
  app.use(errorHandler());
  app.use(requestId());
  app.use(logger());
  app.use(cors());
  app.use(bodyParser({ jsonLimit: "2mb" }));
  app.use(auth());

  const rootRouter = createRootRouter({ rolesRouter, templatesRouter, casesRouter });
  app.use(rootRouter.routes());
  app.use(rootRouter.allowedMethods());

  app.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
  });

  return app;
}

module.exports = { createApp };
