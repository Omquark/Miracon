/**
 * This defines actions related to groups which are called from the endpoints 
 */

const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { updateGroups, getGroups, addGroups, removeGroups } = require("../rbac/Group");
const { isValidUsername } = require("../utility/Validators");
const { buildSelector, getBodyData, hasSelector, sanitizeString, sanitizeStringArray } = require("./common");

async function CreateGroup(req, res) {
  const data = getBodyData(req);
  const groupName = sanitizeString(data.name);

  const commandError = await checkCommand('CREATE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!groupName) {
    logError('A Group was attempted to be added is missing an name and ID! At least one of these values must be provided!');
    res.status(400).send({ error: 'No name provided with group! Group must have a name to be added.' });
    return;
  }

  if (!isValidUsername(groupName)) {
    res.status(400).send({ error: 'Group name can only contain alphanumeric characters and _' });
    return;
  }

  const added = await addGroups({ name: groupName, roles: sanitizeStringArray(data.roles) });
  res.status(200).send(added);
}

async function ReadGroup(req, res) {
  const commandError = await checkCommand('READ_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const pulledGroups = await getGroups()
  res.status(200).send(pulledGroups);
}

async function UpdateGroup(req, res) {
  const data = getBodyData(req);
  const selector = buildSelector(data);
  const updatedValues = {};

  const commandError = await checkCommand('UPDATE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!hasSelector(selector)) {
    logError('A Group was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
    res.status(400).send({ error: 'No ID or name provided with group! I don\'t know which one to upate without an ID or name!' });
    return;
  }

  const groupName = sanitizeString(data.name);
  if (groupName && !isValidUsername(groupName)) {
    res.status(400).send({ error: 'Group name can only contain alphanumeric characters and _' });
    return;
  }

  if (groupName) updatedValues.name = groupName;
  if (data.roles !== undefined) updatedValues.roles = sanitizeStringArray(data.roles);
  if (selector.id) updatedValues.id = selector.id;

  const updated = await updateGroups(selector, updatedValues);
  res.status(200).send(updated);
}


async function DeleteGroup(req, res) {
  const data = getBodyData(req);
  const selector = buildSelector(data);

  const commandError = await checkCommand('DELETE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!hasSelector(selector)) {
    logError('A group was attempted to be deleted, but must contain either an ID or a name!');
    res.status(400).send({ error: 'No ID or name supplied to remove the group! Specify which group with either an ID or name and try again.' });
    return;
  }

  if (selector.name && !isValidUsername(selector.name)) {
    res.status(400).send({ error: 'Group name can only contain alphanumeric characters and _' });
    return;
  }

  const foundGroup = await getGroups(selector);
  const existingGroup = Array.isArray(foundGroup) ? foundGroup[0] : undefined;
  if (existingGroup?.critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical group ${existingGroup.name}!`);
    res.status(403).send({ error: `Cannot remove critical group ${existingGroup.name}` });
    return;
  }


  const removedGroup = await removeGroups(selector);
  res.status(200).send(removedGroup);
}

module.exports = { CreateGroup, ReadGroup, UpdateGroup, DeleteGroup }
