const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { addRoles, getRoles, updateRoles, removeRoles } = require("../rbac/Role");
const { isValidUsername } = require("../utility/Validators");
const { strictProperties } = require("../rbac/Utility");
const { Role } = require("../rbac/RoleDefs");
const { buildSelector, getBodyData, hasSelector, sanitizeString } = require("./common");

/**
 * This defines actions related to roles which are called from the endpoints 
 */

async function CreateRole(req, res) {
  const data = getBodyData(req);
  const roleName = sanitizeString(data.name);

  const commandError = await checkCommand('CREATE_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!roleName) {
    logError('A role was attempted to be added without a name! A name must be specified, ID\'s are ignored')
    res.status(400).send({ error: 'No name was specified for the role! Please name the role and try again, ID\'s are ignored' });
    return;
  }

  if (!isValidUsername(roleName)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  const newRole = await addRoles({ name: roleName })
  res.status(200).send(strictProperties(newRole, Role));
}

async function ReadRole(req, res) {
  const commandError = await checkCommand('READ_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const foundRoles = (await getRoles()).flatMap(role => strictProperties(role, Role));
  res.status(200).send(foundRoles);
}

async function UpdateRole(req, res) {
  const data = getBodyData(req);
  const roleName = sanitizeString(data.name);
  const roleId = sanitizeString(data.id);

  const commandError = await checkCommand('UPDATE_ROLE', req.session.userInfo);
  if (commandError && commandError.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!roleName || !roleId) {
    logError('A Role was attempted to be updated without an ID! This ID is required to update any roles!');
    res.status(400).send({ error: 'No ID provided with role! I don\'t know which one to upate without an ID!' });
    return;
  }

  if (!isValidUsername(roleName)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  const updated = await updateRoles({ id: roleId }, { name: roleName, id: roleId });
  res.status(200).send(updated);
}

async function DeleteRole(req, res) {
  const data = getBodyData(req);
  const selector = buildSelector(data);

  const commandError = await checkCommand('DELETE_ROLE', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!hasSelector(selector)) {
    logError('A role was attempted to be deleted, but must contain either a role ID or a role name!');
    res.status(400).send({ error: 'No ID or name supplied to remove the role! Specify which role with either an ID or name and try again.' });
    return;
  }

  if (selector.name && !isValidUsername(selector.name)) {
    res.status(400).send({ error: 'Role name can only contain alphanumeric characters and _' });
    return;
  }

  const foundRole = await getRoles(selector);
  const existingRole = Array.isArray(foundRole) ? foundRole[0] : undefined;
  if (existingRole?.critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical role ${existingRole.name}!`);
    res.status(403).send({ error: `Cannot remove critical role ${existingRole.name}` });
    return;
  }

  const removedRole = await removeRoles(selector);
  res.status(200).send(removedRole);
}

module.exports = { CreateRole, ReadRole, UpdateRole, DeleteRole }
