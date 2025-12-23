const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull, parseJsonOrNull } = require("../utils/json");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { validateCaseData } = require("../utils/caseDataValidator");

function ensureEditable(roleCode) {
  if (roleCode !== "admin" && roleCode !== "editor") {
    throw forbidden();
  }
}

function loadCaseOrThrow(casesRepo, id) {
  const current = casesRepo.getById(id);
  if (!current) throw notFound();
  return current;
}

function validateCasePayload(templateFieldsRepo, configsRepo, templateId, dataJson) {
  const fields = templateFieldsRepo.list(templateId);
  const configRaw = configsRepo.get(templateId);
  const config = configRaw ? parseJsonOrNull(configRaw) : null;
  validateCaseData(fields, config, dataJson);
}

function buildUpdatePayload({ id, title, status, dataJson }) {
  const updatedAt = nowIso();
  return {
    id,
    title,
    status,
    updatedAt,
    dataId: randomUUID(),
    dataJson: jsonStringifyOrNull(dataJson) || "{}",
  };
}

function createCasesService(casesRepo, templateFieldsRepo, configsRepo) {
  return {
    list: (filters) => casesRepo.list(filters),
    create: ({ templateId, title, values }) => {
      if (!templateId) throw badRequest("templateId required");
      if (!title) throw badRequest("title required");
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
        throw badRequest(err.message);
      }
      return { id, createdAt };
    },
    getById: (id) => {
      const c = casesRepo.getById(id);
      if (!c) throw notFound();
      return c;
    },
    getDetail: (id) => {
      const c = casesRepo.getDetail(id);
      if (!c) throw notFound();
      return c;
    },
    update: ({ id, title, status, dataJson, roleCode }) => {
      ensureEditable(roleCode);
      const current = loadCaseOrThrow(casesRepo, id);
      validateCasePayload(templateFieldsRepo, configsRepo, current.templateId, dataJson);
      const payload = buildUpdatePayload({ id, title, status, dataJson });
      const info = casesRepo.update(payload);
      if (!info || info.changes === 0) throw notFound();
      return { id, title, status, updatedAt: payload.updatedAt };
    },
    remove: ({ id, roleCode }) => {
      ensureEditable(roleCode);
      const info = casesRepo.softDelete(id, nowIso());
      if (!info || info.changes === 0) throw notFound();
      return true;
    },
  };
}

module.exports = { createCasesService };
