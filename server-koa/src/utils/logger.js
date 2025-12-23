const fs = require("node:fs");
const path = require("node:path");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function logFileName(prefix = "app") {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.log`;
}

function formatLine(level, message) {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

function createLogger({ logDir }) {
  ensureDir(logDir);
  const write = (level, message, prefix) => {
    const line = formatLine(level, message);
    console.log(line);
    const filePath = path.join(logDir, logFileName(prefix));
    fs.appendFileSync(filePath, `${line}\n`, "utf-8");
  };
  return {
    info: (msg) => write("INFO", msg, "app"),
    error: (msg) => write("ERROR", msg, "error"),
    access: (msg) => write("ACCESS", msg, "access"),
  };
}

module.exports = { createLogger };
