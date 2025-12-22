function createConfigsRepo(db) {
  const getStmt = db.prepare("SELECT config_json FROM template_config WHERE template_id = ?");
  const upsertStmt = db.prepare(
    `
    INSERT INTO template_config (template_id, config_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(template_id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at
    `
  );

  return {
    get: (templateId) => {
      const row = getStmt.get(templateId);
      return row ? row.config_json : null;
    },
    save: (templateId, configJson, updatedAt) => {
      upsertStmt.run(templateId, configJson, updatedAt);
    },
  };
}

module.exports = { createConfigsRepo };

