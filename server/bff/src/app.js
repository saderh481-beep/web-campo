const express = require('express');
const morgan = require('morgan');
const { authProxy, catchAllProxy } = require('./controllers/bffController');
const config = require('./config');

function createApp() {
  const app = express();
  const PORT = config.PORT;

  app.use(express.json());
  // Básico CORS para desarrollo
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Proxy endpoints (layered: controllers -> usecases -> repositories)
  app.all('/auth/*', authProxy);
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  // Simple MVP frontend for end-to-end testing (served by BFF)
  app.get('/', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Campo Web MVP</title>
  </head>
  <body>
    <h1>Campo Web MVP</h1>
    <p>Este es un cliente MVP que prueba la BFF en capas.</p>
    <pre id=\"log\" style=\"background:#f6f8fa;padding:1em;border:1px solid #ddd;min-height:100px\"></pre>
    <script>
      async function log(msg){ document.getElementById('log').textContent += msg + '\n'; }
      async function test() {
        try {
          const login = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: 'demo', pass: 'demo' })
          });
          const loginData = await login.json();
          log('Login response: ' + JSON.stringify(loginData));
          const users = await fetch('/api/v1/users');
          const usersData = await users.json();
          log('Users: ' + JSON.stringify(usersData));
        } catch (e) {
          log('Error: ' + e.message);
        }
      }
      test();
    </script>
  </body>
  </html>`);
  });
  app.all('*', catchAllProxy);

  return app;
}

module.exports = { createApp };
