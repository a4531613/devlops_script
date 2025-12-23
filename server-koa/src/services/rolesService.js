const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { badRequest, notFound } = require("../utils/errors");

function createRolesService(repo) {
  return {
    list: () => repo.list(),
    create: ({ name, description }) => {
      const id = randomUUID();
      const createdAt = nowIso();
      try {
        repo.insert({ id, name, description, createdAt });
      } catch (err) {
        throw badRequest(err.message);
      }
      return { id, name, description, created_at: createdAt };
    },
    update: ({ id, name, description }) => {
      const info = repo.update({ id, name, description });
      if (info.changes === 0) throw notFound();
    },
    remove: (id) => {
      const info = repo.remove(id);
      if (info.changes === 0) throw notFound();
    },
  };
}

module.exports = { createRolesService };
