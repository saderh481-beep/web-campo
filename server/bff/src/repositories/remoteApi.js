const axios = require('axios');
const config = require('../config');
const mockData = require('../mockData');
const REMOTE_API_BASE = config.REMOTE_API_BASE;

async function requestRemote(method, url, req) {
  if (config.MOCK) {
    // Simple mock responses for end-to-end MVP
    let data;
    if (method === 'POST' && url.includes('/auth')) {
      data = { token: 'mock-token', user: { id: 1, name: 'Mock User' } };
    } else if (method === 'GET' && url.includes('/users')) {
      data = mockData.users;
    } else {
      data = { ok: true };
    }
    return { status: 200, headers: {}, data };
  }
  return axios({
    method,
    url,
    headers: { ...req.headers, host: undefined },
    data: req.body,
    params: req.query,
    withCredentials: true
  })
}

module.exports = { requestRemote };
