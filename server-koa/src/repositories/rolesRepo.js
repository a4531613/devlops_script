function createRolesRepo(db) {
  const listStmt = db.prepare(
    "SELECT id, name, description, created_at FROM roles ORDER BY created_at DESC"
  );
  const insertStmt = db.prepare(
    "INSERT INTO roles (id, name, description, created_at) VALUES (?, ?, ?, ?)"
  );
  const updateStmt = db.prepare("UPDATE roles SET name = ?, description = ? WHERE id = ?");
  const deleteStmt = db.prepare("DELETE FROM roles WHERE id = ?");

  return {
    list: () => listStmt.all(),
    insert: (row) => insertStmt.run(row.id, row.name, row.description, row.createdAt),
    update: (row) => updateStmt.run(row.name, row.description, row.id),
    remove: (id) => deleteStmt.run(id),
  };
}

module.exports = { createRolesRepo };

