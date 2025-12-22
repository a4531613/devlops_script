const { HttpError } = require("../utils/errors");

const ROLE_PERMS = {
  admin: ["read", "write"],
  editor: ["read", "write"],
  viewer: ["read"],
};

function canAccess(roleCode, method) {
  const perms = ROLE_PERMS[roleCode];
  if (!perms) return false;
  const needed = method === "GET" ? "read" : "write";
  return perms.includes(needed);
}

function auth() {
  return async (ctx, next) => {
    if (ctx.path === "/api/health") return next();
    if (!ctx.path.startsWith("/api")) return next();

    const roleCode = ctx.get("x-role-code");
    if (!roleCode) throw new HttpError(401, "x-role-code required");
    if (!canAccess(roleCode, ctx.method)) throw new HttpError(403, "forbidden");

    ctx.state.roleCode = roleCode;
    return next();
  };
}

module.exports = { auth };

