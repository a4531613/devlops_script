const { parseJsonOrNull } = require("../utils/json");

function createConfigsRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT
      c.id,
      c.template_id,
      c.template_field_id,
      c.sort_order,
      c.required,
      c.config_json,
      f.name AS field_name,
      f.label AS field_label,
      f.type AS field_type,
      f.options_json AS field_options_json
    FROM template_field_configs c
    JOIN template_fields f ON f.id = c.template_field_id
    WHERE c.template_id = ?
    ORDER BY c.sort_order ASC
    `
  );
  const deleteStmt = db.prepare("DELETE FROM template_field_configs WHERE template_id = ?");
  const insertStmt = db.prepare(
    `
    INSERT INTO template_field_configs (id, template_id, template_field_id, sort_order, required, config_json)
    VALUES (?, ?, ?, ?, ?, ?)
    `
  );

  return {
    list: (templateId) =>
      listStmt.all(templateId).map((r) => ({
        id: r.id,
        templateId: r.template_id,
        fieldId: r.template_field_id,
        sortOrder: r.sort_order,
        required: !!r.required,
        config: parseJsonOrNull(r.config_json) ?? {},
        fieldDef: {
          id: r.template_field_id,
          name: r.field_name,
          label: r.field_label,
          type: r.field_type,
          options: parseJsonOrNull(r.field_options_json),
        },
      })),
    replaceAll: (templateId, items) => {
      const tx = db.transaction(() => {
        deleteStmt.run(templateId);
        items.forEach((item, index) => {
          if (!item?.fieldId) return;
          insertStmt.run(
            item.id,
            templateId,
            item.fieldId,
            typeof item.sortOrder === "number" ? item.sortOrder : index,
            item.required ? 1 : 0,
            item.configJson
          );
        });
      });
      tx();
    },
  };
}

module.exports = { createConfigsRepo };

