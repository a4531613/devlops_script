const { HttpError } = require("./errors");

function validateTemplateConfigJson(config, fieldCodes) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new HttpError(400, "template_config_json must be object");
  }
  if (config.version !== 1) {
    throw new HttpError(400, "template_config_json.version must be 1");
  }
  if (!Array.isArray(config.layout)) {
    throw new HttpError(400, "template_config_json.layout must be array");
  }

  const layout = [];
  const seen = new Set();
  config.layout.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new HttpError(400, `layout[${index}] must be object`);
    }
    const fieldCode = item.fieldCode;
    if (!fieldCode || typeof fieldCode !== "string") {
      throw new HttpError(400, `layout[${index}].fieldCode required`);
    }
    if (!fieldCodes.has(fieldCode)) {
      throw new HttpError(400, `layout[${index}].fieldCode not found`);
    }
    if (seen.has(fieldCode)) {
      throw new HttpError(400, `layout[${index}].fieldCode duplicated`);
    }
    seen.add(fieldCode);

    const span = Number.isInteger(item.span) ? item.span : null;
    if (span == null || span < 1 || span > 24) {
      throw new HttpError(400, `layout[${index}].span must be 1-24`);
    }

    layout.push({
      fieldCode,
      span,
      label: item.label ?? null,
      placeholder: item.placeholder ?? null,
      visible: item.visible ?? true,
      readonly: item.readonly ?? false,
    });
  });

  return { version: 1, layout };
}

module.exports = { validateTemplateConfigJson };

