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
const { createFieldsRepo } = require("./repositories/fieldsRepo");
const { createTemplateFieldLinksRepo } = require("./repositories/templateFieldLinksRepo");
const { createConfigsRepo } = require("./repositories/configsRepo");
const { createCasesRepo } = require("./repositories/casesRepo");

const { createRolesService } = require("./services/rolesService");
const { createFieldsService } = require("./services/fieldsService");
const { createTemplatesService } = require("./services/templatesService");
const { createCasesService } = require("./services/casesService");

const { createRolesController } = require("./controllers/rolesController");
const { createFieldsController } = require("./controllers/fieldsController");
const { createTemplatesController } = require("./controllers/templatesController");
const { createCasesController } = require("./controllers/casesController");

const { createRolesRouter } = require("./routes/roles");
const { createFieldsRouter } = require("./routes/fields");
const { createTemplatesRouter } = require("./routes/templates");
const { createCasesRouter } = require("./routes/cases");
const { createRootRouter } = require("./routes");

function createApp() {
  const db = openDb();
  migrate(db);

  const rolesRepo = createRolesRepo(db);
  const templatesRepo = createTemplatesRepo(db);
  const fieldsRepo = createFieldsRepo(db);
  const templateFieldLinksRepo = createTemplateFieldLinksRepo(db);
  const configsRepo = createConfigsRepo(db);
  const casesRepo = createCasesRepo(db);

  const rolesService = createRolesService(rolesRepo);
  const fieldsService = createFieldsService(fieldsRepo);
  const templatesService = createTemplatesService(
    templatesRepo,
    fieldsRepo,
    templateFieldLinksRepo,
    configsRepo
  );
  const casesService = createCasesService(casesRepo);

  const rolesController = createRolesController(rolesService);
  const fieldsController = createFieldsController(fieldsService);
  const templatesController = createTemplatesController(templatesService);
  const casesController = createCasesController(casesService);

  const rolesRouter = createRolesRouter(rolesController);
  const fieldsRouter = createFieldsRouter(fieldsController);
  const templatesRouter = createTemplatesRouter(templatesController);
  const casesRouter = createCasesRouter(casesController);

  const app = new Koa();
  app.use(errorHandler());
  app.use(requestId());
  app.use(logger());
  app.use(cors());
  app.use(bodyParser({ jsonLimit: "2mb" }));
  app.use(auth());

  const rootRouter = createRootRouter({ rolesRouter, fieldsRouter, templatesRouter, casesRouter });
  app.use(rootRouter.routes());
  app.use(rootRouter.allowedMethods());

  app.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
  });

  return app;
}

module.exports = { createApp };
