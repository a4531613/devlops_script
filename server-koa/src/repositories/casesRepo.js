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
  const insertValueStmt = db.prepare(
    "INSERT INTO case_values (id, case_id, template_field_id, value_json) VALUES (?, ?, ?, ?)"
  );
  const getCaseStmt = db.prepare(
    `
    SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
    FROM cases c
    JOIN templates t ON t.id = c.template_id
    WHERE c.id = ?
    `
  );
  const listValuesStmt = db.prepare(
    "SELECT template_field_id, value_json FROM case_values WHERE case_id = ?"
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
        Object.entries(row.values).forEach(([fieldId, value]) => {
          insertValueStmt.run(row.valueIds[fieldId], row.id, fieldId, row.valuesJson[fieldId]);
        });
      });
      tx();
    },
    getById: (id) => {
      const c = getCaseStmt.get(id);
      if (!c) return null;
      const values = listValuesStmt
        .all(id)
        .reduce((acc, r) => {
          acc[r.template_field_id] = parseJsonOrNull(r.value_json);
          return acc;
        }, {});
      return {
        id: c.id,
        templateId: c.template_id,
        templateName: c.template_name,
        title: c.title,
        createdAt: c.created_at,
        values,
      };
    },
  };
}

module.exports = { createCasesRepo };

