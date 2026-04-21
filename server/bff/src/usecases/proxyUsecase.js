const { requestRemote } = require('../repositories/remoteApi');

async function forward(method, url, req, res) {
  try {
    const resp = await requestRemote(method, url, req);
    res.status(resp.status).set(resp.headers).send(resp.data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).send(err.response.data);
    } else {
      res.status(500).send({ error: err.message });
    }
  }
}

module.exports = { forward };
