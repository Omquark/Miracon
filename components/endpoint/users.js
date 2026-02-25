/*
 * This defines actions related to users which are called from the endpoints 
 */

const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { addUsers, updateUsers, getUsers, removeUsers } = require("../rbac/User");
const { bytesFromBase64, } = require("../utility/Utility");
const { isValidUsername, isValidPassword, isValidEmail } = require("../utility/Validators");
const bcrypt = require("bcrypt");
const {
  buildSelector,
  getBodyData,
  hasSelector,
  maskPasswordFields,
  sanitizeBoolean,
  sanitizeString,
  sanitizeStringArray
} = require("./common");

async function CreateUser(req, res) {
  const data = getBodyData(req);

  const commandError = await checkCommand('CREATE_USER', req.session.userInfo);

  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const userName = sanitizeString(data.name);
  const userEmail = sanitizeString(data.email);
  if (!userName || !userEmail || !data.password) {
    logError('A user was attempted to be created without a username, password or email! All of these must be provided to create a new user.')
    res.status(400).send({ error: 'An email, name, and password must be provided to create a user.' });
    return;
  }

  const password = bytesFromBase64(data.password).toString('utf8');

  if (!isValidUsername(userName)) {
    res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
    return;
  }

  if (!isValidPassword(password)) {
    res.status(400).send({ error: 'Password must contain alohanumeric characters or any of _!@#$%^&*?\\' });
    return;
  }

  if (!isValidEmail(userEmail)) {
    res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _- are allowed' });
    return;
  }

  const newUser = await addUsers({
    name: userName,
    password: await bcrypt.hash(password, 14),
    email: userEmail,
    preferences: {},
    roles: sanitizeStringArray(data.roles),
    groups: sanitizeStringArray(data.groups),
    active: sanitizeBoolean(data.active, false),
    changePassword: true,
    critical: false,
  });

  res.status(200).send(maskPasswordFields(newUser));
}

async function ReadUser(req, res) {
  const commandError = await checkCommand('READ_USER', req.session.userInfo);

  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  const pulledUsers = await getUsers();
  res.status(200).send(maskPasswordFields(pulledUsers));
}

async function UpdateUser(req, res) {
  const data = getBodyData(req);
  const selector = buildSelector(data);

  const commandError = await checkCommand('UPDATE_USER', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  logEvent(LogLevel.DEBUG, 'Verifying data is present');
  if (!hasSelector(selector)) {
    logError('A user was attempted to be updated without a username, email, or ID! At least one of these fields must be provided to update');
    res.status(400).send({ error: "No username, email, or id was provided! You must specifiy one of these to update a user." });
    return;
  }

  logEvent(LogLevel.DEBUG, 'Verifying valid username');
  if (selector.name && !isValidUsername(selector.name)) {
    logError('Username must only contain alphanumeric characters with underscore');
    res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
    return;
  }

  logEvent(LogLevel.DEBUG, 'Verifying valid email (correct characters, not the email is valid itself)');
  if (selector.email && !isValidEmail(selector.email)) {
    logError('Email is not valid, only alphanumeric character and _@. are allowed');
    res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _@. are allowed' });
    return;
  }

  let passwordHash;
  if (data.password !== undefined) {
    const password = bytesFromBase64(data.password).toString('utf8');
    if (!isValidPassword(password)) {
      res.status(400).send({ error: 'Password must contain alohanumeric characters or any of _!@#$%^&*?\\' });
      return;
    }
    passwordHash = await bcrypt.hash(password, 14);
  }

  logEvent(LogLevel.DEBUG, 'Attempting to find the current user to update');
  const foundUsers = await getUsers(selector);
  const existingUser = Array.isArray(foundUsers) ? foundUsers[0] : undefined;
  if (!existingUser) {
    res.status(404).send({ error: 'User could not be found.' });
    return;
  }

  const updatedData = {
    ...existingUser,
    name: selector.name || existingUser.name,
    email: selector.email || existingUser.email,
    roles: data.roles !== undefined ? sanitizeStringArray(data.roles) : existingUser.roles,
    groups: data.groups !== undefined ? sanitizeStringArray(data.groups) : existingUser.groups,
    active: data.active !== undefined ? sanitizeBoolean(data.active) : existingUser.active,
    changePassword: data.changePassword !== undefined ? sanitizeBoolean(data.changePassword) : existingUser.changePassword,
  };
  if (passwordHash) updatedData.password = passwordHash;

  const updatedUser = await updateUsers({ id: existingUser.id, name: existingUser.name }, updatedData);
  res.status(200).send(maskPasswordFields(updatedUser))
}

async function DeleteUser(req, res) {
  const data = getBodyData(req);
  const selector = buildSelector(data);

  const commandError = await checkCommand('DELETE_USER', req.session.userInfo);

  if (commandError?.error) {
    res.status(403).send({ error: commandError.error });
    return;
  }

  if (!hasSelector(selector)) {
    logError('A user was attempted to be deleted without a selector.');
    res.status(400).send({ error: 'A user id, name, or email must be provided to remove a user.' });
    return;
  }

  const foundUsers = await getUsers(selector);
  const existingUser = Array.isArray(foundUsers) ? foundUsers[0] : undefined;
  if (existingUser?.critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical user ${existingUser.name}!`);
    res.status(403).send({ error: `Cannot remove critical user ${existingUser.name}` });
    return;
  }

  const removedUser = await removeUsers(selector);
  res.status(200).send(maskPasswordFields(removedUser));
}

module.exports = { CreateUser, ReadUser, UpdateUser, DeleteUser }
