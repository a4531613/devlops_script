const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const minimist = require("minimist");
const { getAppDir } = require("./paths");

const DEFAULTS = {
  server: {
    host: "0.0.0.0",
    port: 8080,
    staticDir: "public",
  },
  db: {
    type: "sqlite",
    path: "./data/app.db",
    busyTimeout: 5000,
    retry: {
      attempts: 3,
      baseDelayMs: 50,
    },
  },
  log: {
    level: "info",
  },
  auth: {
    mode: "simple",
  },
};

function readConfigFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") return JSON.parse(raw);
  return yaml.load(raw) || {};
}

function mergeDeep(target, source) {
  if (!source) return target;
  Object.keys(source).forEach((key) => {
    const val = source[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], val);
    } else if (val !== undefined) {
      target[key] = val;
    }
  });
  return target;
}

function loadConfig(argv = process.argv.slice(2)) {
  const args = minimist(argv, {
    string: ["config", "host", "port", "dbPath"],
    alias: { c: "config" },
  });

  const appDir = getAppDir();
  const configPath = args.config
    ? path.resolve(args.config)
    : path.join(appDir, "config.yaml");

  const fileConfig = readConfigFile(configPath);
  const config = mergeDeep(JSON.parse(JSON.stringify(DEFAULTS)), fileConfig);

  if (args.host) config.server.host = String(args.host);
  if (args.port) config.server.port = Number(args.port);
  if (args.dbPath) config.db.path = String(args.dbPath);

  return { config, configPath };
}

module.exports = { loadConfig };
