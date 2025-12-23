const fs = require("node:fs");
const path = require("node:path");

function isPkg() {
  return !!process.pkg;
}

function getAppDir() {
  if (isPkg()) return path.dirname(process.execPath);
  return path.resolve(__dirname, "..", "..");
}

function getResourcePath(relativePath) {
  const appDir = getAppDir();
  const externalPath = path.join(appDir, relativePath);
  if (fs.existsSync(externalPath)) return externalPath;
  const snapshotRoot = path.resolve(__dirname, "..", "..");
  const direct = path.join(snapshotRoot, relativePath);
  if (fs.existsSync(direct)) return direct;
  return path.join(snapshotRoot, "src", relativePath);
}

module.exports = { getAppDir, getResourcePath, isPkg };
