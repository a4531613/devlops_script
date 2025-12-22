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
      const valueIds = {};
      const valuesJson = {};
      Object.entries(values || {}).forEach(([fieldId, value]) => {
        valueIds[fieldId] = randomUUID();
        valuesJson[fieldId] = jsonStringifyOrNull(value);
      });
      try {
        casesRepo.create({ id, templateId, title, createdAt, values: values || {}, valueIds, valuesJson });
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
  };
}

module.exports = { createCasesService };

