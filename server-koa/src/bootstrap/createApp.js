const { createAppContext } = require("./createAppContext");
const { createKoaApp } = require("../app/createKoaApp");

function createApp({ db, logger, staticDir }) {
  const { rootRouter } = createAppContext({ db });
  return createKoaApp({ logger, staticDir, router: rootRouter });
}

module.exports = { createApp };
