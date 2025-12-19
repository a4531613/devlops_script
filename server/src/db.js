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

    CREATE TABLE IF NOT EXISTS field_defs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      options_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_field_configs (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      field_def_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      config_json TEXT,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
      FOREIGN KEY(field_def_id) REFERENCES field_defs(id) ON DELETE RESTRICT,
      UNIQUE(template_id, field_def_id)
    );
    CREATE INDEX IF NOT EXISTS idx_template_field_configs_template_sort
      ON template_field_configs(template_id, sort_order);

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_cases_template_created
      ON cases(template_id, created_at);

    CREATE TABLE IF NOT EXISTS case_values (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      field_def_id TEXT NOT NULL,
      value_json TEXT,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(field_def_id) REFERENCES field_defs(id) ON DELETE RESTRICT,
      UNIQUE(case_id, field_def_id)
    );
    CREATE INDEX IF NOT EXISTS idx_case_values_case
      ON case_values(case_id);
  `);
}

module.exports = { openDb, migrate };

