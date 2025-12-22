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

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  options_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_fields_updated
  ON fields(updated_at);

CREATE TABLE IF NOT EXISTS template_field_links (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  field_id TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY(field_id) REFERENCES fields(id) ON DELETE CASCADE,
  UNIQUE(template_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_template_field_links_template
  ON template_field_links(template_id);

CREATE TABLE IF NOT EXISTS template_field_configs (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  field_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  config_json TEXT,
  FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY(field_id) REFERENCES fields(id) ON DELETE CASCADE,
  UNIQUE(template_id, field_id)
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
  field_id TEXT NOT NULL,
  value_json TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY(field_id) REFERENCES fields(id) ON DELETE CASCADE,
  UNIQUE(case_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_case_values_case
  ON case_values(case_id);
