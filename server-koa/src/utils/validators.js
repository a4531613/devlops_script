const { HttpError } = require("./errors");

function requireString(value, field) {
  if (!value || typeof value !== "string") throw new HttpError(400, `${field} required`);
  return value.trim();
}

function optionalString(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return String(value);
  return value;
}

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new HttpError(400, `${field} must be array`);
  return value;
}

function requireObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${field} must be object`);
  }
  return value;
}

module.exports = { requireString, optionalString, requireArray, requireObject };

