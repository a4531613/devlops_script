const fs = require("node:fs");
const path = require("node:path");

const { createApp } = require("./app");
const { loadConfig } = require("./config/loadConfig");
const { getAppDir, getResourcePath } = require("./config/paths");
const { openDatabase } = require("./db/sqlite");
const { migrate } = require("./db/migrate");
const { createLogger } = require("./utils/logger");

function resolvePath(appDir, p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.join(appDir, p);
}

function main() {
  const { config, configPath } = loadConfig(process.argv.slice(2));
  const appDir = getAppDir();
  const logDir = path.join(appDir, "logs");
  const logger = createLogger({ logDir });

  const dbPath = resolvePath(appDir, config.db.path);
  const isNewDb = !fs.existsSync(dbPath);
  const db = openDatabase(dbPath, {
    busyTimeout: config.db.busyTimeout,
    retry: config.db.retry,
  });

  migrate(db, {
    schemaPath: getResourcePath("db/schema.sql"),
    seedPath: getResourcePath("db/seed.sql"),
    isNew: isNewDb,
  });

  const staticDir = config.server.staticDir
    ? getResourcePath(config.server.staticDir)
    : null;

  const app = createApp({ db, logger, staticDir });
  const host = config.server.host || "0.0.0.0";
  const port = Number(config.server.port || 8080);

  app.listen(port, host, () => {
    logger.info(`Server started on http://${host}:${port}`);
    logger.info(`DB path: ${dbPath}`);
    logger.info(`Static path: ${staticDir || "-"}`);
    logger.info(`Config: ${configPath || "default"}`);
    logger.info(`Node env: ${process.env.NODE_ENV || "development"}`);
  });
}

main();
