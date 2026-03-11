const { checkCommand } = require("../commands/Commands");
const { getBodyData, sanitizeString } = require("./common");

function notImplemented(res) {
  res.status(501).send({ error: "Whitelist endpoints are not implemented yet." });
}

async function CreateWhitelist(req, res) {
  const commandError = await checkCommand("CREATE_WHITELIST", req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const data = getBodyData(req);
  const name = sanitizeString(data.name);
  if (!name) {
    res.status(400).send({ error: "Whitelist create requires a name." });
    return;
  }

  notImplemented(res);
}

async function ReadWhitelist(req, res) {
  const commandError = await checkCommand("READ_WHITELIST", req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  notImplemented(res);
}

async function UpdateWhitelist(req, res) {
  const commandError = await checkCommand("UPDATE_WHITELIST", req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const data = getBodyData(req);
  const name = sanitizeString(data.name);
  if (!name) {
    res.status(400).send({ error: "Whitelist update requires a name." });
    return;
  }

  notImplemented(res);
}

async function DeleteWhitelist(req, res) {
  const commandError = await checkCommand("DELETE_WHITELIST", req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const data = getBodyData(req);
  const name = sanitizeString(data.name);
  if (!name) {
    res.status(400).send({ error: "Whitelist delete requires a name." });
    return;
  }

  notImplemented(res);
}

module.exports = { CreateWhitelist, ReadWhitelist, UpdateWhitelist, DeleteWhitelist }
