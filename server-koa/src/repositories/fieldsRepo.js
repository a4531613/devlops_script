const { parseJsonOrNull } = require("../utils/json");

function createFieldsRepo(db) {
  const listStmt = db.prepare(
    `
    SELECT id, name, label, type, options_json, created_at, updated_at
    FROM fields
    ORDER BY updated_at DESC
    `
  );
  const insertStmt = db.prepare(
    `
    INSERT INTO fields (id, name, label, type, options_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  );
  const updateStmt = db.prepare(
    `
    UPDATE fields
    SET name = ?, label = ?, type = ?, options_json = ?, updated_at = ?
    WHERE id = ?
    `
  );
  const deleteStmt = db.prepare("DELETE FROM fields WHERE id = ?");

  return {
    list: () =>
      listStmt.all().map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        type: r.type,
        options: parseJsonOrNull(r.options_json),
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    insert: (row) =>
      insertStmt.run(row.id, row.name, row.label, row.type, row.optionsJson, row.createdAt, row.updatedAt),
    update: (row) => updateStmt.run(row.name, row.label, row.type, row.optionsJson, row.updatedAt, row.id),
    remove: (id) => deleteStmt.run(id),
  };
}

module.exports = { createFieldsRepo };

