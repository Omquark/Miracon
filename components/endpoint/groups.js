/**
 * This defines actions related to groups which are called from the endpoints 
 */

const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { updateGroups, getGroups, addGroups, removeGroups } = require("../rbac/Group");

async function CreateGroup(req, res) {
  const rawBody = req.body;
  let added;

  const commandError = await checkCommand('CREATE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if ((rawBody.name === undefined)) {
    logError('A Group was attempted to be added is missing an name and ID! At least one of these values must be provided!');
    res.status(400).send({ error: 'No name provided with group! Group must have a name to be added.' });
    return;
  }

  added = await addGroups({ name: rawBody.data.name, roles: rawBody.data.roles });
  res.status(200).send(added);
}

async function ReadGroup(req, res) {
  const commandError = await checkCommand('READ_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const pulledGroups = await getGroups()
  res.status(200).send(JSON.stringify(pulledGroups));
}

async function UpdateGroup(req, res) {
  const rawBody = req.body;
  const newGroup = {};
  let updated;

  const commandError = await checkCommand('UPDATE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if ((rawBody.name === undefined && rawBody.id === undefined)) {
    logError('A Group was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
    res.status(400).send({ error: 'No ID or name provided with group! I don\'t know which one to upate without an ID or name!' });
    return;
  }

  newGroup.name = rawBody.data.name;
  newGroup.roles = rawBody.data.roles ? rawBody.data.roles : [];
  newGroup.id = rawBody.data.id;

  updated = await updateGroups(newGroup, newGroup);
  res.status(200).send(updated);
}

async function DeleteGroup(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('DELETE_GROUP', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (rawBody.data === undefined || (rawBody.data.name === undefined && rawBody.data.id === undefined)) {
    logError('A group was attempted to be deleted, but must contain either an ID or a name!');
    res.status(400).send({ error: 'No ID or name supplied to remove the group! Specify which group with either an ID or name and try again.' });
    return;
  }

  let foundGroup = await getRoles({ id: rawBody.data.name });
  if (foundGroup[0].critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical group ${foundGroup[0].name}!`);
    res.status(403).send({ error: `Cannot remove critical group ${foundGroup[0].name}` });
    return;
  }


  const removedGroup = await removeGroups({ name: rawBody.data.name, id: rawBody.data.id });
  res.status(200).send(removedGroup);
}

module.exports = { CreateGroup, ReadGroup, UpdateGroup, DeleteGroup }