const { badRequest } = require("./errors");

function validateTemplateConfigJson(config, fieldCodes) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw badRequest("template_config_json must be object");
  }
  if (config.version !== 1) {
    throw badRequest("template_config_json.version must be 1");
  }
  if (!Array.isArray(config.layout)) {
    throw badRequest("template_config_json.layout must be array");
  }

  const layout = [];
  const seen = new Set();
  const missing = new Set();
  config.layout.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw badRequest(`layout[${index}] must be object`);
    }
    const fieldCode = item.fieldCode;
    if (!fieldCode || typeof fieldCode !== "string") {
      throw badRequest(`layout[${index}].fieldCode required`);
    }
    if (!fieldCodes.has(fieldCode)) {
      missing.add(fieldCode);
      return;
    }
    if (seen.has(fieldCode)) {
      throw badRequest(`layout[${index}].fieldCode duplicated`);
    }
    seen.add(fieldCode);

    const span = Number.isInteger(item.span) ? item.span : null;
    if (span == null || span < 1 || span > 24) {
      throw badRequest(`layout[${index}].span must be 1-24`);
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

  if (missing.size) {
    throw badRequest(`fieldCode not found: ${Array.from(missing).join(",")}`);
  }

  return { version: 1, layout };
}

module.exports = { validateTemplateConfigJson };
