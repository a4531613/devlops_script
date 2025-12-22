const { createApp } = require("./app");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5175;

const app = createApp();
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Koa API listening on http://localhost:${PORT}`);
});

