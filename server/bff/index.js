const { createApp } = require('./src/app.js');
const PORT = process.env.BFF_PORT ? parseInt(process.env.BFF_PORT, 10) : 3001;
const app = createApp();
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CAMPO BFF listening on http://localhost:${PORT}`);
});
