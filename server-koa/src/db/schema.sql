PRAGMA foreign_keys = ON;

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

CREATE TABLE IF NOT EXISTS template_fields (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  field_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  options_json TEXT,
  regex TEXT,
  min REAL,
  max REAL,
  status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, field_code)
);

CREATE INDEX IF NOT EXISTS idx_template_fields_template
  ON template_fields(template_id);

CREATE TABLE IF NOT EXISTS template_config (
  template_id TEXT PRIMARY KEY,
  config_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  case_no TEXT NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_cases_template_created
  ON cases(template_id, created_at);

CREATE TABLE IF NOT EXISTS case_data (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  UNIQUE(case_id)
);

CREATE INDEX IF NOT EXISTS idx_case_data_case
  ON case_data(case_id);
