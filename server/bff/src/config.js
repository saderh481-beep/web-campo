module.exports = {
  PORT: process.env.BFF_PORT ? parseInt(process.env.BFF_PORT, 10) : 3001,
  REMOTE_API_BASE: process.env.REMOTE_API_BASE || 'https://campo-api-web-campo-saas.up.railway.app',
  MOCK: process.env.BFF_MOCK === 'true'
}
