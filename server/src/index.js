const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { randomUUID } = require("node:crypto");
const { openDb, migrate } = require("./db");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5174;

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return randomUUID();
}

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

const db = openDb();
migrate(db);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Roles
app.get("/api/roles", (req, res) => {
  const rows = db
    .prepare("SELECT id, name, description, created_at FROM roles ORDER BY created_at DESC")
    .all();
  res.json(rows);
});

app.post("/api/roles", (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const id = newId();
  const createdAt = nowIso();
  try {
    db.prepare("INSERT INTO roles (id, name, description, created_at) VALUES (?, ?, ?, ?)").run(
      id,
      name.trim(),
      description ?? null,
      createdAt
    );
    res.json({ id, name: name.trim(), description: description ?? null, created_at: createdAt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  try {
    const info = db
      .prepare("UPDATE roles SET name = ?, description = ? WHERE id = ?")
      .run(name.trim(), description ?? null, id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  const info = db.prepare("DELETE FROM roles WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.json({ ok: true });
});

// Field definitions
app.get("/api/field-defs", (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, label, type, options_json, created_at, updated_at FROM field_defs ORDER BY updated_at DESC"
    )
    .all()
    .map((r) => ({ ...r, options: parseJsonOrNull(r.options_json) }));
  res.json(rows);
});

app.post("/api/field-defs", (req, res) => {
  const { name, label, type, options } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  if (!label || typeof label !== "string") return res.status(400).json({ error: "label required" });
  if (!type || typeof type !== "string") return res.status(400).json({ error: "type required" });
  const id = newId();
  const ts = nowIso();
  try {
    db.prepare(
      "INSERT INTO field_defs (id, name, label, type, options_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, name.trim(), label.trim(), type.trim(), jsonStringifyOrNull(options), ts, ts);
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/field-defs/:id", (req, res) => {
  const { id } = req.params;
  const { name, label, type, options } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  if (!label || typeof label !== "string") return res.status(400).json({ error: "label required" });
  if (!type || typeof type !== "string") return res.status(400).json({ error: "type required" });
  const ts = nowIso();
  try {
    const info = db
      .prepare(
        "UPDATE field_defs SET name = ?, label = ?, type = ?, options_json = ?, updated_at = ? WHERE id = ?"
      )
      .run(name.trim(), label.trim(), type.trim(), jsonStringifyOrNull(options), ts, id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/field-defs/:id", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM field_defs WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Templates
app.get("/api/templates", (req, res) => {
  const rows = db
    .prepare("SELECT id, name, description, created_at FROM templates ORDER BY created_at DESC")
    .all();
  res.json(rows);
});

app.post("/api/templates", (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const id = newId();
  const createdAt = nowIso();
  try {
    db.prepare("INSERT INTO templates (id, name, description, created_at) VALUES (?, ?, ?, ?)").run(
      id,
      name.trim(),
      description ?? null,
      createdAt
    );
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/templates/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  try {
    const info = db
      .prepare("UPDATE templates SET name = ?, description = ? WHERE id = ?")
      .run(name.trim(), description ?? null, id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/templates/:id", (req, res) => {
  const { id } = req.params;
  const info = db.prepare("DELETE FROM templates WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.json({ ok: true });
});

// Template config
app.get("/api/templates/:id/config", (req, res) => {
  const { id } = req.params;
  const configs = db
    .prepare(
      `
      SELECT
        c.id,
        c.template_id,
        c.field_def_id,
        c.sort_order,
        c.required,
        c.config_json,
        f.name AS field_name,
        f.label AS field_label,
        f.type AS field_type,
        f.options_json AS field_options_json
      FROM template_field_configs c
      JOIN field_defs f ON f.id = c.field_def_id
      WHERE c.template_id = ?
      ORDER BY c.sort_order ASC
      `
    )
    .all(id)
    .map((r) => ({
      id: r.id,
      templateId: r.template_id,
      fieldDefId: r.field_def_id,
      sortOrder: r.sort_order,
      required: !!r.required,
      config: parseJsonOrNull(r.config_json) ?? {},
      fieldDef: {
        id: r.field_def_id,
        name: r.field_name,
        label: r.field_label,
        type: r.field_type,
        options: parseJsonOrNull(r.field_options_json),
      },
    }));
  res.json(configs);
});

app.put("/api/templates/:id/config", (req, res) => {
  const { id: templateId } = req.params;
  const items = Array.isArray(req.body) ? req.body : null;
  if (!items) return res.status(400).json({ error: "array body required" });

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM template_field_configs WHERE template_id = ?").run(templateId);
    const insert = db.prepare(
      "INSERT INTO template_field_configs (id, template_id, field_def_id, sort_order, required, config_json) VALUES (?, ?, ?, ?, ?, ?)"
    );
    items.forEach((item, index) => {
      if (!item?.fieldDefId) return;
      insert.run(
        newId(),
        templateId,
        item.fieldDefId,
        typeof item.sortOrder === "number" ? item.sortOrder : index,
        item.required ? 1 : 0,
        jsonStringifyOrNull(item.config ?? {})
      );
    });
  });

  try {
    tx();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Cases
app.get("/api/cases", (req, res) => {
  const { templateId, keyword, from, to } = req.query;
  const where = [];
  const params = [];
  if (templateId) {
    where.push("c.template_id = ?");
    params.push(templateId);
  }
  if (keyword) {
    where.push("c.title LIKE ?");
    params.push(`%${keyword}%`);
  }
  if (from) {
    where.push("c.created_at >= ?");
    params.push(from);
  }
  if (to) {
    where.push("c.created_at <= ?");
    params.push(to);
  }

  const sql = `
    SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
    FROM cases c
    JOIN templates t ON t.id = c.template_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY c.created_at DESC
    LIMIT 200
  `;

  const rows = db.prepare(sql).all(...params);
  res.json(
    rows.map((r) => ({
      id: r.id,
      templateId: r.template_id,
      templateName: r.template_name,
      title: r.title,
      createdAt: r.created_at,
    }))
  );
});

app.post("/api/cases", (req, res) => {
  const { templateId, title, values } = req.body ?? {};
  if (!templateId) return res.status(400).json({ error: "templateId required" });
  if (!title || typeof title !== "string") return res.status(400).json({ error: "title required" });

  const caseId = newId();
  const createdAt = nowIso();
  const inputValues = values && typeof values === "object" ? values : {};

  const tx = db.transaction(() => {
    db.prepare("INSERT INTO cases (id, template_id, title, created_at) VALUES (?, ?, ?, ?)").run(
      caseId,
      templateId,
      title.trim(),
      createdAt
    );

    const insertValue = db.prepare(
      "INSERT INTO case_values (id, case_id, field_def_id, value_json) VALUES (?, ?, ?, ?)"
    );
    Object.entries(inputValues).forEach(([fieldDefId, value]) => {
      insertValue.run(newId(), caseId, fieldDefId, jsonStringifyOrNull(value));
    });
  });

  try {
    tx();
    res.json({ id: caseId, createdAt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/cases/:id", (req, res) => {
  const { id } = req.params;
  const c = db
    .prepare(
      `
      SELECT c.id, c.template_id, c.title, c.created_at, t.name AS template_name
      FROM cases c
      JOIN templates t ON t.id = c.template_id
      WHERE c.id = ?
      `
    )
    .get(id);
  if (!c) return res.status(404).json({ error: "not found" });

  const values = db
    .prepare("SELECT field_def_id, value_json FROM case_values WHERE case_id = ?")
    .all(id)
    .reduce((acc, r) => {
      acc[r.field_def_id] = parseJsonOrNull(r.value_json);
      return acc;
    }, {});

  res.json({
    id: c.id,
    templateId: c.template_id,
    templateName: c.template_name,
    title: c.title,
    createdAt: c.created_at,
    values,
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});
