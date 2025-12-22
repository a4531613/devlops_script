# Case Management System (Koa + SQLite, Vue3 + Vite)

This workspace contains a Koa + SQLite backend and a Vue3 + Vite frontend.

## Structure

- `server-koa/` - Koa API server (SQLite)
- `web-koa/` - Vue3 + Vite + Element Plus frontend

## Requirements

- Node.js 20+
- npm 10+

## Backend (Koa)

Location: `server-koa`

Install:
```
cd server-koa
npm install
```

Run:
```
npm run dev
```

Default port: `http://localhost:5175`

Health:
```
GET /api/health
```

Role auth header:
```
x-role-code: admin | editor | viewer
```

Database:
- SQLite file in `server-koa/data/app.db`
- Schema file: `server-koa/src/db/schema.sql`

Template config schema:
- JSON Schema: `server-koa/src/schemas/templateConfig.schema.json`

## Frontend (Vue3)

Location: `web-koa`

Install:
```
cd web-koa
npm install
```

Run:
```
npm run dev
```

Default port: `http://localhost:5173`

Proxy:
- `/api` is proxied to `http://localhost:5175`

## Pages

- Roles: `/roles`
- Templates: `/templates`
- Fields: `/fields`
- Template config: `/templates/:id/config`
- New case: `/cases/new`
- Case search: `/cases/search`

## Template Config JSON Example

```
{
  "version": 1,
  "layout": [
    {
      "fieldCode": "customerName",
      "span": 12,
      "label": "Customer Name",
      "placeholder": "Enter name",
      "visible": true,
      "readonly": false
    },
    {
      "fieldCode": "remark",
      "span": 24,
      "label": "Remark",
      "placeholder": "Notes",
      "visible": true,
      "readonly": false
    }
  ]
}
```

