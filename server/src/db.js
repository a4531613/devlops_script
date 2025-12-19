const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function openDb() {
  const dataDir = path.join(__dirname, "..", "data");
  ensureDir(dataDir);
  const dbPath = path.join(dataDir, "app.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    );

    -- Fields are defined per template
    CREATE TABLE IF NOT EXISTS template_fields (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      options_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
      UNIQUE(template_id, name)
    );
    CREATE INDEX IF NOT EXISTS idx_template_fields_template_updated
      ON template_fields(template_id, updated_at);

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_cases_template_created
      ON cases(template_id, created_at);

  `);

  // Handle legacy schemas (from earlier iterations) by recreating changed tables.
  // This is intentionally data-destructive for those tables because the new schema
  // is not directly mappable from the old "global field" model.
  const tableInfo = (tableName) => db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = (tableName, columnName) => {
    try {
      return tableInfo(tableName).some((c) => c.name === columnName);
    } catch {
      return false;
    }
  };

  const legacyTemplateFieldConfigs = hasColumn("template_field_configs", "field_def_id");
  const legacyCaseValues = hasColumn("case_values", "field_def_id");

  if (legacyTemplateFieldConfigs || legacyCaseValues) {
    db.pragma("foreign_keys = OFF");
    if (legacyTemplateFieldConfigs) db.exec("DROP TABLE IF EXISTS template_field_configs;");
    if (legacyCaseValues) db.exec("DROP TABLE IF EXISTS case_values;");
    db.pragma("foreign_keys = ON");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS template_field_configs (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      template_field_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      config_json TEXT,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
      FOREIGN KEY(template_field_id) REFERENCES template_fields(id) ON DELETE CASCADE,
      UNIQUE(template_id, template_field_id)
    );
    CREATE INDEX IF NOT EXISTS idx_template_field_configs_template_sort
      ON template_field_configs(template_id, sort_order);

    CREATE TABLE IF NOT EXISTS case_values (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      template_field_id TEXT NOT NULL,
      value_json TEXT,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(template_field_id) REFERENCES template_fields(id) ON DELETE CASCADE,
      UNIQUE(case_id, template_field_id)
    );
    CREATE INDEX IF NOT EXISTS idx_case_values_case
      ON case_values(case_id);
  `);
}

module.exports = { openDb, migrate };
