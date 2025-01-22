const { raw } = require("body-parser");
const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { addRoles, getRoles, updateRoles, removeRoles } = require("../rbac/Role");
const { isValidUsername } = require("../utility/Validators");
const { strictProperties } = require("../rbac/Utility");
const { Role } = require("../rbac/RoleDefs");

/**
 * This defines actions related to roles which are called from the endpoints 
 */

async function CreateRole(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('CREATE_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (rawBody.data === undefined || rawBody.data.name === undefined) {
    logError('A role was attempted to be added without a name! A name must be specified, ID\'s are ignored')
    res.status(400).send({ error: 'No name was specified for the role! Please name the role and try again, ID\'s are ignored' });
    return;
  }

  if (!isValidUsername(rawBody.data.name)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  const newRole = await addRoles({ name: rawBody.data.name })
  res.status(200).send(strictProperties(newRole, Role));
}

async function ReadRole(req, res) {
  const commandError = await checkCommand('READ_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const foundRoles = (await getRoles()).flatMap(role => strictProperties(role, Role));
  res.status(200).send(JSON.stringify(foundRoles));
}

async function UpdateRole(req, res) {
  const rawBody = req.body;

  let updated;

  const commandError = await checkCommand('UPDATE_ROLE', req.session.userInfo);
  if (commandError && commandError.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!rawBody.data || rawBody.data.name === undefined || rawBody.data.id === undefined) {
    logError('A Role was attempted to be updated without an ID! This ID is required to update any roles!');
    res.status(400).send({ error: 'No ID provided with role! I don\'t know which one to upate without an ID!' });
    return;
  }

  if (!isValidUsername(rawBody.data.name)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  updated = await updateRoles({ id: rawBody.data.id }, { name: rawBody.data.name, id: rawBody.data.id });
  console.log('updated', updated);
  res.status(200).send(updated);
}

async function DeleteRole(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('DELETE_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!rawBody.data || (rawBody.data.name === undefined && rawBody.data.id === undefined)) {
    logError('A role was attempted to be deleted, but must contain either a role ID or a role name!');
    res.status(400).send({ error: 'No ID or name supplied to remove the role! Specify which role with either an ID or name and try again.' });
    return;
  }

  let foundRole = await getRoles({ name: rawBody.data.name });
  if (!isValidUsername(rawBody.data.name)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  if (foundRole[0].critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical role ${foundRole[0].name}!`);
    res.status(403).send({ error: `Cannot remove critical role ${foundRole[0].name}` });
    return;
  }

  const removedRole = await removeRoles({ name: rawBody.data.name, id: rawBody.data.id });
  res.status(200).send(removedRole);
}

module.exports = { CreateRole, ReadRole, UpdateRole, DeleteRole }