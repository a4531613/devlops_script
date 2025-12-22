const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { HttpError } = require("../utils/errors");

function createRolesService(repo) {
  return {
    list: () => repo.list(),
    create: ({ name, description }) => {
      const id = randomUUID();
      const createdAt = nowIso();
      try {
        repo.insert({ id, name, description, createdAt });
      } catch (err) {
        throw new HttpError(400, err.message);
      }
      return { id, name, description, created_at: createdAt };
    },
    update: ({ id, name, description }) => {
      const info = repo.update({ id, name, description });
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    remove: (id) => {
      const info = repo.remove(id);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
  };
}

module.exports = { createRolesService };

