const fs = require("node:fs");

function runSqlFile(db, filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, "utf-8");
  if (sql && sql.trim()) db.exec(sql);
}

function migrateLegacy(db, schemaSql) {
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
  const hasCaseNo = hasColumn("cases", "case_no");
  const hasCaseStatus = hasColumn("cases", "status");
  const hasCaseUpdated = hasColumn("cases", "updated_at");
  const hasCaseDeleted = hasColumn("cases", "is_deleted");
  const hasCaseDeletedAt = hasColumn("cases", "deleted_at");

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

  if (!hasCaseNo) db.exec("ALTER TABLE cases ADD COLUMN case_no TEXT NOT NULL DEFAULT ''");
  if (!hasCaseStatus) db.exec("ALTER TABLE cases ADD COLUMN status TEXT");
  if (!hasCaseUpdated) db.exec("ALTER TABLE cases ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''");
  if (!hasCaseDeleted) db.exec("ALTER TABLE cases ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0");
  if (!hasCaseDeletedAt) db.exec("ALTER TABLE cases ADD COLUMN deleted_at TEXT");

  if (!hasCaseNo || !hasCaseUpdated) {
    const rows = db.prepare("SELECT id, created_at FROM cases").all();
    const updateStmt = db.prepare("UPDATE cases SET case_no = ?, updated_at = ? WHERE id = ?");
    const tx = db.transaction(() => {
      rows.forEach((r) => updateStmt.run(r.id, r.created_at, r.id));
    });
    tx();
  }
}

function migrate(db, { schemaPath, seedPath, isNew }) {
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
  migrateLegacy(db, schemaSql);
  if (isNew) runSqlFile(db, seedPath);
}

module.exports = { migrate };
