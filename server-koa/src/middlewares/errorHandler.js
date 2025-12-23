const { isHttpError } = require("../utils/errors");

function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      const status = isHttpError(err) ? err.status : 500;
      const message = err.message || "internal error";
      ctx.status = status;
      ctx.body = { error: message };
      if (ctx.app?.context?.logger?.error) {
        const requestId = ctx.state.requestId;
        const ridPart = requestId ? ` rid=${requestId}` : "";
        ctx.app.context.logger.error(`${ctx.method} ${ctx.url} ${status} - ${message}${ridPart}`);
      }
      ctx.app.emit("error", err, ctx);
    }
  };
}

module.exports = { errorHandler };
