const { badRequest } = require("./errors");

const IGNORE_TYPES = new Set(["divider", "section", "collapse"]);

function parseOptions(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "").trim();
}

function isEmpty(value, type) {
  if (value == null) return true;
  if (type === "checkbox" || type === "select_multi" || type === "table") {
    return !Array.isArray(value) || value.length === 0;
  }
  if (type === "richtext") return stripHtml(value) === "";
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function validateTable(field, value) {
  if (!Array.isArray(value)) {
    throw badRequest(`${field.fieldName} must be array`);
  }
  const opt = parseOptions(field.options) || {};
  const minRows = opt.minRows ?? 0;
  const maxRows = opt.maxRows ?? 200;
  if (value.length < minRows) throw badRequest(`${field.fieldName} at least ${minRows} rows`);
  if (value.length > maxRows) throw badRequest(`${field.fieldName} max ${maxRows} rows`);
  const cols = Array.isArray(opt.columns) ? opt.columns : [];
  value.forEach((row, rowIndex) => {
    if (!row || typeof row !== "object") {
      throw badRequest(`${field.fieldName} row ${rowIndex + 1} invalid`);
    }
    cols.forEach((col) => {
      if (!col.required) return;
      const cell = row[col.code];
      if (cell == null || String(cell).trim() === "") {
        throw badRequest(`${field.fieldName} column ${col.name} required`);
      }
    });
  });
}

function validateCaseData(fields, config, dataJson) {
  if (!dataJson || typeof dataJson !== "object" || Array.isArray(dataJson)) {
    throw badRequest("data_json must be object");
  }
  const fieldMap = new Map(fields.map((f) => [f.fieldCode, f]));
  const layoutCodes = Array.isArray(config?.layout)
    ? config.layout.map((i) => i.fieldCode)
    : null;
  const fieldList = layoutCodes
    ? layoutCodes.map((code) => fieldMap.get(code)).filter(Boolean)
    : fields;

  fieldList.forEach((field) => {
    if (!field || IGNORE_TYPES.has(field.fieldType)) return;
    const value = dataJson[field.fieldCode];

    if (field.required && isEmpty(value, field.fieldType)) {
      throw badRequest(`${field.fieldName} required`);
    }
    if (isEmpty(value, field.fieldType)) return;

    if (field.fieldType === "number") {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) throw badRequest(`${field.fieldName} must be number`);
      if (field.min != null && num < field.min) {
        throw badRequest(`${field.fieldName} min ${field.min}`);
      }
      if (field.max != null && num > field.max) {
        throw badRequest(`${field.fieldName} max ${field.max}`);
      }
      return;
    }

    if (field.fieldType === "checkbox" || field.fieldType === "select_multi") {
      if (!Array.isArray(value)) {
        throw badRequest(`${field.fieldName} must be array`);
      }
    }

    if (field.fieldType === "table") {
      validateTable(field, value);
    }

    if (field.fieldType === "richtext") {
      if (stripHtml(value) === "") {
        throw badRequest(`${field.fieldName} required`);
      }
    }

    if (field.regex) {
      const re = field.regex instanceof RegExp ? field.regex : new RegExp(field.regex);
      if (!re.test(String(value))) {
        throw badRequest(`${field.fieldName} invalid`);
      }
    }
  });
}

module.exports = { validateCaseData };
