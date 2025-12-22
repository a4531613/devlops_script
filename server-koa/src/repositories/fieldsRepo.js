const { parseJsonOrNull } = require("../utils/json");

function createFieldsRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT id, template_id, name, label, type, options_json, created_at, updated_at
    FROM template_fields
    WHERE template_id = ?
    ORDER BY updated_at DESC
    `
  );
  const insertStmt = db.prepare(
    `
    INSERT INTO template_fields (id, template_id, name, label, type, options_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  );
  const updateStmt = db.prepare(
    `
    UPDATE template_fields
    SET name = ?, label = ?, type = ?, options_json = ?, updated_at = ?
    WHERE id = ? AND template_id = ?
    `
  );
  const deleteStmt = db.prepare(
    "DELETE FROM template_fields WHERE id = ? AND template_id = ?"
  );

  return {
    list: (templateId) =>
      listStmt.all(templateId).map((r) => ({
        id: r.id,
        templateId: r.template_id,
        name: r.name,
        label: r.label,
        type: r.type,
        options: parseJsonOrNull(r.options_json),
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    insert: (row) =>
      insertStmt.run(
        row.id,
        row.templateId,
        row.name,
        row.label,
        row.type,
        row.optionsJson,
        row.createdAt,
        row.updatedAt
      ),
    update: (row) =>
      updateStmt.run(
        row.name,
        row.label,
        row.type,
        row.optionsJson,
        row.updatedAt,
        row.id,
        row.templateId
      ),
    remove: (id, templateId) => deleteStmt.run(id, templateId),
  };
}

module.exports = { createFieldsRepo };

