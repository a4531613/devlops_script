const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");
const { validateTemplateConfigJson } = require("../utils/templateConfig");

function createTemplatesService(templatesRepo, fieldsRepo, templateFieldLinksRepo, configsRepo) {
  return {
    list: () => templatesRepo.list(),
    create: ({ name, description }) => {
      const id = randomUUID();
      const createdAt = nowIso();
      try {
        templatesRepo.insert({ id, name, description, createdAt });
      } catch (err) {
        throw new HttpError(400, err.message);
      }
      return { id };
    },
    update: ({ id, name, description }) => {
      const info = templatesRepo.update({ id, name, description });
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    remove: (id) => {
      const info = templatesRepo.remove(id);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    listFields: (templateId) => templateFieldLinksRepo.list(templateId),
    bindFields: ({ templateId, fieldIds }) => {
      const ts = nowIso();
      const rows = fieldIds.map((fieldId) => ({
        id: randomUUID(),
        templateId,
        fieldId,
        required: 0,
        status: "active",
        createdAt: ts,
      }));
      try {
        templateFieldLinksRepo.insertMany(rows);
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    },
    unbindField: ({ templateId, fieldId }) => {
      const info = templateFieldLinksRepo.remove(templateId, fieldId);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    listConfig: (templateId) => configsRepo.list(templateId),
    getConfigJson: (templateId) => {
      const items = configsRepo.list(templateId);
      return {
        version: 1,
        layout: items.map((item) => ({
          fieldCode: item.fieldDef.name,
          span: item.config?.span ?? 12,
          label: item.config?.label ?? item.fieldDef.label,
          placeholder: item.config?.placeholder ?? null,
          visible: item.config?.visible ?? true,
          readonly: item.config?.readonly ?? false,
        })),
      };
    },
    replaceConfig: ({ templateId, items }) => {
      const payload = items.map((item, index) => ({
        id: randomUUID(),
        fieldId: item.fieldId,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
        required: !!item.required,
        configJson: jsonStringifyOrNull(item.config ?? {}),
      }));
      try {
        configsRepo.replaceAll(templateId, payload);
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    },
    replaceConfigFromJson: ({ templateId, configJson }) => {
      const pool = templateFieldLinksRepo.list(templateId);
      const fieldMap = new Map(pool.map((f) => [f.name, f]));
      const fieldCodes = new Set(fieldMap.keys());
      const normalized = validateTemplateConfigJson(configJson, fieldCodes);

      const payload = normalized.layout.map((item, index) => ({
        id: randomUUID(),
        fieldId: fieldMap.get(item.fieldCode).id,
        sortOrder: index,
        required: false,
        configJson: jsonStringifyOrNull({
          label: item.label,
          placeholder: item.placeholder,
          span: item.span,
          visible: item.visible,
          readonly: item.readonly,
        }),
      }));

      try {
        configsRepo.replaceAll(templateId, payload);
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    },
  };
}

module.exports = { createTemplatesService };
