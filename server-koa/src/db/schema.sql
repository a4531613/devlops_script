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
  template_field_id TEXT NOT NULL,
  value_json TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY(template_field_id) REFERENCES template_fields(id) ON DELETE CASCADE,
  UNIQUE(case_id, template_field_id)
);

CREATE INDEX IF NOT EXISTS idx_case_values_case
  ON case_values(case_id);

