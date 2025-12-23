const { withTransaction } = require("../db/sqlite");

function createTemplatesRepo(db) {
  const listStmt = db.prepare(
    "SELECT id, name, description, created_at FROM templates ORDER BY created_at DESC"
  );
  const insertStmt = db.prepare(
    "INSERT INTO templates (id, name, description, created_at) VALUES (?, ?, ?, ?)"
  );
  const updateStmt = db.prepare("UPDATE templates SET name = ?, description = ? WHERE id = ?");
  const deleteStmt = db.prepare("DELETE FROM templates WHERE id = ?");

  const insertTx = withTransaction(db, (row) =>
    insertStmt.run(row.id, row.name, row.description, row.createdAt)
  );
  const updateTx = withTransaction(db, (row) => updateStmt.run(row.name, row.description, row.id));
  const deleteTx = withTransaction(db, (id) => deleteStmt.run(id));

  return {
    list: () => listStmt.all(),
    insert: (row) => insertTx(row),
    update: (row) => updateTx(row),
    remove: (id) => deleteTx(id),
  };
}

module.exports = { createTemplatesRepo };
