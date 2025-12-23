const { createRolesRepo } = require("../repositories/rolesRepo");
const { createTemplatesRepo } = require("../repositories/templatesRepo");
const { createTemplateFieldsRepo } = require("../repositories/templateFieldsRepo");
const { createConfigsRepo } = require("../repositories/configsRepo");
const { createCasesRepo } = require("../repositories/casesRepo");

const { createRolesService } = require("../services/rolesService");
const { createTemplatesService } = require("../services/templatesService");
const { createCasesService } = require("../services/casesService");

const { createRolesController } = require("../controllers/rolesController");
const { createTemplatesController } = require("../controllers/templatesController");
const { createCasesController } = require("../controllers/casesController");

const { createRolesRouter } = require("../routes/roles");
const { createTemplatesRouter } = require("../routes/templates");
const { createCasesRouter } = require("../routes/cases");
const { createRootRouter } = require("../routes");

function createAppContext({ db }) {
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

  const rootRouter = createRootRouter({ rolesRouter, templatesRouter, casesRouter });

  return { rootRouter };
}

module.exports = { createAppContext };
