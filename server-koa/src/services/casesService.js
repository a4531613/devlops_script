const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull, parseJsonOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");
const { validateCaseData } = require("../utils/caseDataValidator");

function createCasesService(casesRepo, templateFieldsRepo, configsRepo) {
  const canEdit = (roleCode) => roleCode === "admin" || roleCode === "editor";
  return {
    list: (filters) => casesRepo.list(filters),
    create: ({ templateId, title, values }) => {
      if (!templateId) throw new HttpError(400, "templateId required");
      if (!title) throw new HttpError(400, "title required");
      const id = randomUUID();
      const createdAt = nowIso();
      const dataId = randomUUID();
      const dataJson = jsonStringifyOrNull(values || {}) || "{}";
      const caseNo = `CASE-${Date.now()}`;
      const status = "DRAFT";
      try {
        casesRepo.create({
          id,
          caseNo,
          templateId,
          title,
          status,
          createdAt,
          updatedAt: createdAt,
          dataId,
          dataJson,
        });
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
    update: ({ id, title, status, dataJson, roleCode }) => {
      if (!canEdit(roleCode)) throw new HttpError(403, "forbidden");
      const current = casesRepo.getById(id);
      if (!current) throw new HttpError(404, "not found");
      const templateId = current.templateId;

      const fields = templateFieldsRepo.list(templateId);
      const configRaw = configsRepo.get(templateId);
      const config = configRaw ? parseJsonOrNull(configRaw) : null;
      validateCaseData(fields, config, dataJson);

      const updatedAt = nowIso();
      const payload = {
        id,
        title,
        status,
        updatedAt,
        dataId: randomUUID(),
        dataJson: jsonStringifyOrNull(dataJson) || "{}",
      };
      const info = casesRepo.update(payload);
      if (!info || info.changes === 0) throw new HttpError(404, "not found");
      return { id, title, status, updatedAt };
    },
    remove: ({ id, roleCode }) => {
      if (!canEdit(roleCode)) throw new HttpError(403, "forbidden");
      const info = casesRepo.softDelete(id, nowIso());
      if (!info || info.changes === 0) throw new HttpError(404, "not found");
      return true;
    },
  };
}

module.exports = { createCasesService };
