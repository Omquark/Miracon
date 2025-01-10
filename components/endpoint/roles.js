const { checkCommand } = require("../commands/Commands");
const { addRoles, getRoles, updateRoles, removeRoles } = require("../rbac/Role");

async function CreateRole(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('ADD_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (rawBody.data === undefined || rawBody.data.name === undefined) {
    logError('A role was attempted to be added without a name! A name must be specified, ID\'s are ignored')
    res.status(400).send({ error: 'No name was specified for the role! Please name the role and try again, ID\'s are ignored' });
    return;
  }

  const newRole = await addRoles({ name: rawBody.data.name })
  res.status(200).send(newRole);
}

async function ReadRole(req, res) {
  const commandError = await checkCommand('READ_ROLE', req.session.userInfo);
  if (commandError?.error) {
      res.status(403).send({ error: commandError.error });
      return;
  }
  res.status(200).send(JSON.stringify(await getRoles()));
}

async function UpdateRole(req, res) {
  const rawBody = req.body;

  let updated;

  const commandError = await checkCommand('UPDATE_ROLE', req.session.userInfo);
  if (commandError?.error) {
      res.status(403).send({ error: commandError.error });
      return;
  }

  if ((rawBody.data.name === undefined || rawBody.data.id === undefined)) {
      logError('A Role was attempted to be updated without an ID! This ID is required to update any roles!');
      res.status(400).send({ error: 'No ID provided with role! I don\'t know which one to upate without an ID!' });
      return;
  }

  updated = await updateRoles({ id: rawBody.data.id }, { name: rawBody.data.name });
  res.status(200).send(updated);
}

async function DeleteRole(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('DELETE_ROLE', req.session.userInfo);
  if (commandError?.error) {
      res.status(403).send({ error: commandError.error });
      return;
  }

  if (rawBody.data === undefined || (rawBody.data.name === undefined && rawBody.data.id === undefined)) {
      logError('A role was attempted to be deleted, but must contain either a role ID or a role name!');
      res.status(400).send({ error: 'No ID or name supplied to remove the role! Specify which role with either an ID or name and try again.' });
      return;
  }

  let foundRole = await getRoles({ id: rawBody.data.name });
  if (foundRole[0].critical) {
      logEvent(LogLevel.WARN, `Attempted to remove critical role ${foundRole[0].name}!`);
      res.status(403).send({ error: `Cannot remove critical role ${foundRole[0].name}` });
      return;
  }

  const removedRole = await removeRoles({ name: rawBody.data.name, id: rawBody.data.id });
  res.status(200).send(removedRole);
}

module.exports = { CreateRole, ReadRole, UpdateRole, DeleteRole }