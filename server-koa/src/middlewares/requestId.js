const { randomUUID } = require("node:crypto");

function requestId() {
  return async (ctx, next) => {
    const id = randomUUID();
    ctx.state.requestId = id;
    ctx.set("x-request-id", id);
    await next();
  };
}

module.exports = { requestId };

