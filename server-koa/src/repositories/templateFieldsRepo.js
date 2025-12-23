const { parseJsonOrNull } = require("../utils/json");
const { withTransaction } = require("../db/sqlite");

function createTemplateFieldsRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT
      id,
      template_id,
      field_code,
      field_name,
      field_type,
      required,
      default_value,
      placeholder,
      help_text,
      options_json,
      regex,
      min,
      max,
      status,
      created_at,
      updated_at
    FROM template_fields
    WHERE template_id = ?
    ORDER BY updated_at DESC
    `
  );

  const insertStmt = db.prepare(
    `
    INSERT INTO template_fields (
      id, template_id, field_code, field_name, field_type, required,
      default_value, placeholder, help_text, options_json, regex, min, max,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  );

  const updateStmt = db.prepare(
    `
    UPDATE template_fields
    SET
      field_code = ?, field_name = ?, field_type = ?, required = ?, default_value = ?,
      placeholder = ?, help_text = ?, options_json = ?, regex = ?, min = ?, max = ?,
      status = ?, updated_at = ?
    WHERE id = ? AND template_id = ?
    `
  );

  const deleteStmt = db.prepare("DELETE FROM template_fields WHERE id = ? AND template_id = ?");

  const insertTx = withTransaction(db, (row) =>
    insertStmt.run(
      row.id,
      row.templateId,
      row.fieldCode,
      row.fieldName,
      row.fieldType,
      row.required ? 1 : 0,
      row.defaultValue,
      row.placeholder,
      row.helpText,
      row.optionsJson,
      row.regex,
      row.min,
      row.max,
      row.status,
      row.createdAt,
      row.updatedAt
    )
  );
  const updateTx = withTransaction(db, (row) =>
    updateStmt.run(
      row.fieldCode,
      row.fieldName,
      row.fieldType,
      row.required ? 1 : 0,
      row.defaultValue,
      row.placeholder,
      row.helpText,
      row.optionsJson,
      row.regex,
      row.min,
      row.max,
      row.status,
      row.updatedAt,
      row.id,
      row.templateId
    )
  );
  const deleteTx = withTransaction(db, (id, templateId) => deleteStmt.run(id, templateId));

  return {
    list: (templateId) =>
      listStmt.all(templateId).map((r) => ({
        id: r.id,
        templateId: r.template_id,
        fieldCode: r.field_code,
        fieldName: r.field_name,
        fieldType: r.field_type,
        required: !!r.required,
        defaultValue: r.default_value,
        placeholder: r.placeholder,
        helpText: r.help_text,
        options: parseJsonOrNull(r.options_json),
        regex: r.regex,
        min: r.min,
        max: r.max,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    insert: (row) => insertTx(row),
    update: (row) => updateTx(row),
    remove: (id, templateId) => deleteTx(id, templateId),
  };
}

module.exports = { createTemplateFieldsRepo };
