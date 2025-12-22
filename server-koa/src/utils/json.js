function parseJsonOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function jsonStringifyOrNull(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  return JSON.stringify(value);
}

module.exports = { parseJsonOrNull, jsonStringifyOrNull };

