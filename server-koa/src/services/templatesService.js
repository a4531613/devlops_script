const { randomUUID } = require("node:crypto");
const { nowIso } = require("../utils/time");
const { jsonStringifyOrNull, parseJsonOrNull } = require("../utils/json");
const { HttpError } = require("../utils/errors");
const { validateTemplateConfigJson } = require("../utils/templateConfig");

function createTemplatesService(templatesRepo, templateFieldsRepo, configsRepo) {
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
    listFields: (templateId) => templateFieldsRepo.list(templateId),
    createField: (input) => {
      const id = randomUUID();
      const ts = nowIso();
      try {
        templateFieldsRepo.insert({
          id,
          templateId: input.templateId,
          fieldCode: input.fieldCode,
          fieldName: input.fieldName,
          fieldType: input.fieldType,
          required: !!input.required,
          defaultValue: input.defaultValue ?? null,
          placeholder: input.placeholder ?? null,
          helpText: input.helpText ?? null,
          optionsJson: jsonStringifyOrNull(input.options ?? null),
          regex: input.regex ?? null,
          min: input.min ?? null,
          max: input.max ?? null,
          status: input.status ?? "active",
          createdAt: ts,
          updatedAt: ts,
        });
      } catch (err) {
        throw new HttpError(400, err.message);
      }
      return { id };
    },
    updateField: (input) => {
      const ts = nowIso();
      const info = templateFieldsRepo.update({
        id: input.fieldId,
        templateId: input.templateId,
        fieldCode: input.fieldCode,
        fieldName: input.fieldName,
        fieldType: input.fieldType,
        required: !!input.required,
        defaultValue: input.defaultValue ?? null,
        placeholder: input.placeholder ?? null,
        helpText: input.helpText ?? null,
        optionsJson: jsonStringifyOrNull(input.options ?? null),
        regex: input.regex ?? null,
        min: input.min ?? null,
        max: input.max ?? null,
        status: input.status ?? "active",
        updatedAt: ts,
      });
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    removeField: ({ templateId, fieldId }) => {
      const info = templateFieldsRepo.remove(fieldId, templateId);
      if (info.changes === 0) throw new HttpError(404, "not found");
    },
    getConfigJson: (templateId) => {
      const raw = configsRepo.get(templateId);
      return raw ? parseJsonOrNull(raw) : { version: 1, layout: [] };
    },
    replaceConfigFromJson: ({ templateId, configJson }) => {
      const fields = templateFieldsRepo.list(templateId);
      const fieldCodes = new Set(fields.map((f) => f.fieldCode));
      const normalized = validateTemplateConfigJson(configJson, fieldCodes);
      const ts = nowIso();
      try {
        configsRepo.save(templateId, jsonStringifyOrNull(normalized) || "{}", ts);
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    },
  };
}

module.exports = { createTemplatesService };
