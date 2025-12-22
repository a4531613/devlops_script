const { parseJsonOrNull } = require("../utils/json");

function createTemplateFieldLinksRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT
      l.id AS link_id,
      l.template_id,
      l.field_id,
      l.required,
      l.status,
      l.created_at AS link_created_at,
      f.name,
      f.label,
      f.type,
      f.options_json
    FROM template_field_links l
    JOIN fields f ON f.id = l.field_id
    WHERE l.template_id = ?
    ORDER BY l.created_at DESC
    `
  );

  const insertStmt = db.prepare(
    `
    INSERT OR IGNORE INTO template_field_links (id, template_id, field_id, required, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `
  );

  const deleteStmt = db.prepare(
    "DELETE FROM template_field_links WHERE template_id = ? AND field_id = ?"
  );

  return {
    list: (templateId) =>
      listStmt.all(templateId).map((r) => ({
        id: r.field_id,
        templateId: r.template_id,
        fieldId: r.field_id,
        required: !!r.required,
        status: r.status,
        created_at: r.link_created_at,
        name: r.name,
        label: r.label,
        type: r.type,
        options: parseJsonOrNull(r.options_json),
      })),
    insertMany: (rows) => {
      const tx = db.transaction(() => {
        rows.forEach((r) => insertStmt.run(r.id, r.templateId, r.fieldId, r.required, r.status, r.createdAt));
      });
      tx();
    },
    remove: (templateId, fieldId) => deleteStmt.run(templateId, fieldId),
  };
}

module.exports = { createTemplateFieldLinksRepo };
