const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  const buf = new SharedArrayBuffer(4);
  const arr = new Int32Array(buf);
  Atomics.wait(arr, 0, 0, ms);
}

function isBusyError(err) {
  return err && (err.code === "SQLITE_BUSY" || err.code === "SQLITE_LOCKED");
}

function withRetry(db, fn, options = {}) {
  const attempts = options.attempts ?? db.__retryOptions?.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? db.__retryOptions?.baseDelayMs ?? 50;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return fn();
    } catch (err) {
      if (!isBusyError(err) || i === attempts - 1) throw err;
      sleep(baseDelayMs * 2 ** i);
    }
  }
  return null;
}

function withTransaction(db, fn, options) {
  const tx = db.transaction(fn);
  return (...args) => withRetry(db, () => tx(...args), options);
}

function openDatabase(dbPath, options = {}) {
  const dir = path.dirname(dbPath);
  ensureDir(dir);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  if (options.busyTimeout) db.pragma(`busy_timeout = ${Number(options.busyTimeout)}`);
  db.__retryOptions = options.retry || { attempts: 3, baseDelayMs: 50 };
  return db;
}

module.exports = { openDatabase, withRetry, withTransaction };
