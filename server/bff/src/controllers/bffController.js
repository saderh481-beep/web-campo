const config = require('../config');
const { forward } = require('../usecases/proxyUsecase');

function authProxy(req, res) {
  const url = `${config.REMOTE_API_BASE}/api/v1${req.path}`;
  return forward(req.method, url, req, res);
}

function catchAllProxy(req, res) {
  const url = `${config.REMOTE_API_BASE}/api/v1${req.originalUrl}`;
  return forward(req.method, url, req, res);
}

module.exports = { authProxy, catchAllProxy };
