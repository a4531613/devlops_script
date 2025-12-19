# 案例管理系统（Vue + SQLite）

## 启动

1. 安装依赖：`npm i`
2. 启动前后端：`npm run dev`

访问：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:5174/api/health`

## 功能

- 角色管理：`/roles`
- 案例模板管理：`/templates`
- 模板字段管理（字段库）：`/field-defs`
- 模板配置：在模板列表点“配置”，字段可拖拽排序，可设置必填、覆盖显示名/placeholder/选项
- 新建案例：`/cases/new`（按模板配置动态渲染表单）
- 案例查询：`/cases/search`

## 数据库

- SQLite 文件：`server/data/app.db`（启动后端时自动创建/迁移）

