const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");

function createFieldsService(repo) {
  return {
    list: () => repo.list(),
    create: ({ name, label, type, options }) => {
      const id = randomUUID();
      const ts = nowIso();
      try {
        repo.insert({
          id,
          name,
          label,
          type,
          optionsJson: jsonStringifyOrNull(options),
          createdAt: ts,
          updatedAt: ts,
        });
      } catch (err) {
        throw new HttpError(400, err.message);
      }
      return { id };
    },
    update: ({ id, name, label, type, options }) => {
      const ts = nowIso();
      const info = repo.update({
        id,
        name,
        label,
        type,
        optionsJson: jsonStringifyOrNull(options),
        updatedAt: ts,
      });
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    remove: (id) => {
      const info = repo.remove(id);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
  };
}

module.exports = { createFieldsService };

