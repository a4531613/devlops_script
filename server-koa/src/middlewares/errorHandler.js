const { HttpError } = require("../utils/errors");

function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      ctx.status = status;
      ctx.body = { error: err.message || "internal error" };
      if (ctx.app?.context?.logger?.error) {
        ctx.app.context.logger.error(
          `${ctx.method} ${ctx.url} ${status} - ${err.message || "internal error"}`
        );
      }
      ctx.app.emit("error", err, ctx);
    }
  };
}

module.exports = { errorHandler };
