# 案例管理系统（Koa + SQLite，Vue3 + Vite）

该工作区包含 Koa + SQLite 后端，以及 Vue3 + Vite 前端。

## 目录结构

- `server-koa/` - Koa API 服务（SQLite）
- `web-koa/` - Vue3 + Vite + Element Plus 前端

## 环境要求

- Node.js 20+
- npm 10+

## 后端（Koa）

目录：`server-koa`

安装：
```
cd server-koa
npm install
```

启动：
```
npm run dev
```

默认端口：`http://localhost:5175`

健康检查：
```
GET /api/health
```

角色鉴权请求头：
```
x-role-code: admin | editor | viewer
```

数据库：
- SQLite 文件：`server-koa/data/app.db`
- Schema：`server-koa/src/db/schema.sql`

模板配置 JSON Schema：
- `server-koa/src/schemas/templateConfig.schema.json`

## 前端（Vue3）

目录：`web-koa`

安装：
```
cd web-koa
npm install
```

启动：
```
npm run dev
```

默认端口：`http://localhost:5173`

代理：
- `/api` 代理到 `http://localhost:5175`

## 页面

- 角色管理：`/roles`
- 模板管理：`/templates`
- 字段管理：`/fields`
- 模板配置：`/templates/:id/config`
- 新建案例：`/cases/new`
- 案例查询：`/cases/search`

## 模板配置 JSON 示例

```
{
  "version": 1,
  "layout": [
    {
      "fieldCode": "customerName",
      "span": 12,
      "label": "客户名称",
      "placeholder": "请输入客户名称",
      "visible": true,
      "readonly": false
    },
    {
      "fieldCode": "remark",
      "span": 24,
      "label": "备注",
      "placeholder": "补充说明",
      "visible": true,
      "readonly": false
    }
  ]
}
```
