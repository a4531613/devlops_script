const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");

function createCasesService(casesRepo) {
  return {
    list: (filters) => casesRepo.list(filters),
    create: ({ templateId, title, values }) => {
      if (!templateId) throw new HttpError(400, "templateId required");
      if (!title) throw new HttpError(400, "title required");
      const id = randomUUID();
      const createdAt = nowIso();
      const dataId = randomUUID();
      const dataJson = jsonStringifyOrNull(values || {}) || "{}";
      try {
        casesRepo.create({ id, templateId, title, createdAt, dataId, dataJson });
      } catch (err) {
        throw new HttpError(400, err.message);
      }
      return { id, createdAt };
    },
    getById: (id) => {
      const c = casesRepo.getById(id);
      if (!c) throw new HttpError(404, "not found");
      return c;
    },
    getDetail: (id) => {
      const c = casesRepo.getDetail(id);
      if (!c) throw new HttpError(404, "not found");
      return c;
    },
  };
}

module.exports = { createCasesService };
