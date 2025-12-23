const fs = require("node:fs");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("koa2-cors");
const serve = require("koa-static");
const send = require("koa-send");

const { errorHandler } = require("../middlewares/errorHandler");
const { auth } = require("../middlewares/auth");
const { requestId } = require("../middlewares/requestId");

function accessLogger(logger) {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    if (logger?.access) {
      logger.access(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`);
    }
  };
}

function createKoaApp({ logger, staticDir, router }) {
  if (!router) throw new Error("router required");

  const app = new Koa();
  app.context.logger = logger;
  app.use(errorHandler());
  app.use(requestId());
  app.use(accessLogger(logger));
  app.use(cors());
  app.use(bodyParser({ jsonLimit: "2mb" }));
  app.use(auth());

  app.use(router.routes());
  app.use(router.allowedMethods());

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(serve(staticDir));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.status !== 404) return;
      if (ctx.path.startsWith("/api")) return;
      await send(ctx, "index.html", { root: staticDir });
    });
  }

  app.on("error", (err) => {
    if (logger?.error) logger.error(err?.stack || String(err));
    else console.error(err);
  });

  return app;
}

module.exports = { createKoaApp };
