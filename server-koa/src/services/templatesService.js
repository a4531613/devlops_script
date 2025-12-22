const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");
const { validateTemplateConfigJson } = require("../utils/templateConfig");

function createTemplatesService(templatesRepo, fieldsRepo, configsRepo) {
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
    listFields: (templateId) => fieldsRepo.list(templateId),
    createField: ({ templateId, name, label, type, options }) => {
      const id = randomUUID();
      const ts = nowIso();
      try {
        fieldsRepo.insert({
          id,
          templateId,
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
    updateField: ({ templateId, fieldId, name, label, type, options }) => {
      const ts = nowIso();
      const info = fieldsRepo.update({
        id: fieldId,
        templateId,
        name,
        label,
        type,
        optionsJson: jsonStringifyOrNull(options),
        updatedAt: ts,
      });
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    removeField: ({ templateId, fieldId }) => {
      const info = fieldsRepo.remove(fieldId, templateId);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    listConfig: (templateId) => configsRepo.list(templateId),
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
      const fields = fieldsRepo.list(templateId);
      const fieldMap = new Map(fields.map((f) => [f.name, f]));
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
