const { parseJsonOrNull } = require("../utils/json");

function createCasesRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
    FROM cases c
    JOIN templates t ON t.id = c.template_id
    WHERE 1 = 1
    `
  );

  const insertCaseStmt = db.prepare(
    "INSERT INTO cases (id, template_id, title, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertDataStmt = db.prepare(
    "INSERT INTO case_data (id, case_id, data_json) VALUES (?, ?, ?)"
  );
  const getCaseStmt = db.prepare(
    `
    SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
    FROM cases c
    JOIN templates t ON t.id = c.template_id
    WHERE c.id = ?
    `
  );
  const getDataStmt = db.prepare("SELECT data_json FROM case_data WHERE case_id = ?");

  const getDetailStmt = db.prepare(
    `
    SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
    FROM cases c
    JOIN templates t ON t.id = c.template_id
    WHERE c.id = ?
    `
  );
  const getConfigStmt = db.prepare("SELECT config_json FROM template_config WHERE template_id = ?");
  const getFieldsStmt = db.prepare(
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

  return {
    list: (filters) => {
      const where = [];
      const params = [];
      if (filters.templateId) {
        where.push("c.template_id = ?");
        params.push(filters.templateId);
      }
      if (filters.keyword) {
        where.push("c.title LIKE ?");
        params.push(`%${filters.keyword}%`);
      }
      if (filters.from) {
        where.push("c.created_at >= ?");
        params.push(filters.from);
      }
      if (filters.to) {
        where.push("c.created_at <= ?");
        params.push(filters.to);
      }
      const sql = `
        SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
        FROM cases c
        JOIN templates t ON t.id = c.template_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY c.created_at DESC
        LIMIT 200
      `;
      return db.prepare(sql).all(...params).map((r) => ({
        id: r.id,
        templateId: r.template_id,
        templateName: r.template_name,
        title: r.title,
        createdAt: r.created_at,
      }));
    },
    create: (row) => {
      const tx = db.transaction(() => {
        insertCaseStmt.run(row.id, row.templateId, row.title, row.createdAt);
        insertDataStmt.run(row.dataId, row.id, row.dataJson);
      });
      tx();
    },
    getById: (id) => {
      const c = getCaseStmt.get(id);
      if (!c) return null;
      const dataRow = getDataStmt.get(id);
      const values = dataRow ? parseJsonOrNull(dataRow.data_json) : {};
      return {
        id: c.id,
        templateId: c.template_id,
        templateName: c.template_name,
        title: c.title,
        createdAt: c.created_at,
        values,
      };
    },
    getDetail: (id) => {
      const c = getDetailStmt.get(id);
      if (!c) return null;
      const dataRow = getDataStmt.get(id);
      const configRow = getConfigStmt.get(c.template_id);
      const fields = getFieldsStmt.all(c.template_id).map((r) => ({
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
      }));
      return {
        case: {
          id: c.id,
          case_no: c.id,
          title: c.title,
          template_id: c.template_id,
          status: null,
          created_at: c.created_at,
          updated_at: c.created_at,
        },
        template: {
          id: c.template_id,
          name: c.template_name,
          code: null,
        },
        config_json: configRow ? parseJsonOrNull(configRow.config_json) : null,
        fields,
        data_json: dataRow ? parseJsonOrNull(dataRow.data_json) : {},
      };
    },
  };
}

module.exports = { createCasesRepo };
