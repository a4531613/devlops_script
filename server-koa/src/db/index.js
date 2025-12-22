const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function openDb() {
  const dataDir = path.join(__dirname, "..", "..", "data");
  ensureDir(dataDir);
  const dbPath = path.join(dataDir, "app.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function migrate(db) {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);

  // Handle legacy schemas by recreating changed tables.
  const tableInfo = (tableName) => db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = (tableName, columnName) => {
    try {
      return tableInfo(tableName).some((c) => c.name === columnName);
    } catch {
      return false;
    }
  };

  const legacyTemplateFields = hasColumn("template_fields", "template_id");
  const legacyFields = hasColumn("fields", "name");
  const legacyLinks = hasColumn("template_field_links", "field_id");
  const legacyTemplateConfig = hasColumn("template_config", "config_json");
  const legacyCaseData = hasColumn("case_data", "data_json");
  const hasTemplateFieldConfigs = hasColumn("template_field_configs", "template_id");
  const hasCaseValues = hasColumn("case_values", "case_id");

  if (
    legacyTemplateFields ||
    legacyFields ||
    legacyLinks ||
    legacyTemplateConfig ||
    legacyCaseData ||
    hasTemplateFieldConfigs ||
    hasCaseValues
  ) {
    db.pragma("foreign_keys = OFF");
    if (hasTemplateFieldConfigs) db.exec("DROP TABLE IF EXISTS template_field_configs;");
    if (hasCaseValues) db.exec("DROP TABLE IF EXISTS case_values;");
    if (legacyTemplateFields) db.exec("DROP TABLE IF EXISTS template_fields;");
    if (legacyFields) db.exec("DROP TABLE IF EXISTS fields;");
    if (legacyLinks) db.exec("DROP TABLE IF EXISTS template_field_links;");
    db.exec("DROP TABLE IF EXISTS template_config;");
    db.exec("DROP TABLE IF EXISTS case_data;");
    db.pragma("foreign_keys = ON");
    db.exec(schemaSql);
  }
}

module.exports = { openDb, migrate };
