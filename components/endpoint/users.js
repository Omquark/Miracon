/*
 * This defines actions related to users which are called from the endpoints 
 */

const { checkCommand } = require("../commands/Commands");
const { logError, logEvent, LogLevel } = require("../Log");
const { addUsers, updateUsers, getUsers, removeUsers } = require("../rbac/User");
const { bytesFromBase64, } = require("../utility/Utility");
const { isValidUsername, isValidPassword, isValidEmail } = require("../utility/Validators");
const bcrypt = require("bcrypt");

async function CreateUser(req, res) {
  const rawBody = req.body;

  console.log('req.session', req.session);

  const commandError = await checkCommand('CREATE_USER', req.session.userInfo);

  if (commandError?.error) {
    res.status(400).send({ error: commandError.error });
    return;
  }

  console.log('rawBody', rawBody);

  if (rawBody.data === undefined ||
    (
      rawBody.data.name === undefined &&
      rawBody.data.email === undefined &&
      rawBody.data.password === undefined)) {
    logError('A user was attempted to be created without a username, password or email! All of these must be provided to create a new user.')
    res.status(400).send({ error: 'An email, name, and password must be provided to create a user.' });
    return;
  }

  const password = bytesFromBase64(rawBody.data.password);
  console.log(`password: ${password}`);

  if (!isValidUsername(rawBody.data.name)) {
    res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
    return;
  }

  if (!isValidPassword(password)) {
    res.status(400).send({ error: 'Password must contain alohanumeric characters or any of _!@#$%^&*?\\' });
    return;
  }

  if (!isValidEmail(rawBody.data.email)) {
    res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _- are allowed' });
    return;
  }

  const newUser = await addUsers({
    name: rawBody.data.name,
    password: await bcrypt.hash(password, 14),
    email: rawBody.data.email,
    preferences: {},
    roles: rawBody.data.roles ? rawBody.data.roles : [],
    groups: rawBody.data.groups ? rawBody.data.groups : [],
    active: rawBody.data.active ? rawBody.data.active : false,
    changePassword: true,
    critical: false,
  });

  newUser.password = '****************';

  res.status(200).send(JSON.stringify(newUser));
}

async function ReadUser(req, res) {
  const commandError = await checkCommand('READ_USER', req.session.userInfo);

  if (commandError?.error) {
    res.status(403).send({ error: commandError });
    return;
  }

  const pulledUsers = (await getUsers()).map(user => {
    user.password = '*********************';
    return user;
  });
  res.status(200).send(JSON.stringify(pulledUsers));
}

async function UpdateUser(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('UPDATE_USER', req.session.userInfo);
  if (commandError?.error) {
    res.status(403).send({ error: commandError });
    return;
  }

  const password = rawBody.data.password ? bytesFromBase64(rawBody.data.password) : '';

  logEvent(LogLevel.DEBUG, 'Verifying data is present');
  if (!rawBody.data || (!rawBody.data.name && !rawBody.data.email && !rawBody.data.id)) {
    logError('A user was attempted to be updated without a username, email, or ID! At least one of these fields must be provided to update');
    res.status(400).send({ error: "No username, email, or id was provided! You must specifiy one of these to update a user." });
    return;
  }

  logEvent(LogLevel.DEBUG, 'Verifying valid username');
  if (rawBody.data.name && !isValidUsername(rawBody.data.name)) {
    logError('Username must only contain alphanumeric characters with underscore');
    res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
    return;
  }

  logEvent(LogLevel.DEBUG, 'Verifying valid email (correct characters, not the email is valid itself)');
  if (rawBody.data.email && !isValidEmail(rawBody.data.email)) {
    logError('Email is not valid, only alphanumeric character and _@. are allowed');
    res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _@. are allowed' });
    return;
  }

  logEvent(LogLevel.DEBUG, 'Attempting to find the current user to update');
  const user = await getUsers({ id: rawBody.data.id, name: rawBody.data.name, email: rawBody.data.email });

  user[0].name = rawBody.data.name ? rawBody.data.name : user.name;
  // user.password = rawBody.data.password ? await bcrypt.hash(rawBody.data.password, 14) : user.password;
  user[0].email = rawBody.data.email ? rawBody.data.email : user.email;
  user[0].roles = rawBody.data.roles ? rawBody.data.roles : user.roles;
  user[0].groups = rawBody.data.groups ? rawBody.data.groups : user.groups;
  user[0].active = rawBody.data.active !== undefined ? rawBody.data.active : user.active;
  user[0].changePassword = rawBody.data.changePassword !== undefined ? rawBody.data.changePassword : user.changePassword;

  logEvent(LogLevel.DEBUG, `Updating user ${JSON.stringify(user)}`);
  logEvent(LogLevel.DEBUG, `rawBody.data ${JSON.stringify(rawBody.data)}`);
  const updatedUser = await updateUsers({ id: user[0].id, name: user[0].name }, user[0]);

  logEvent(LogLevel.DEBUG, `updatedUser: ${JSON.stringify(updatedUser)}`);

  res.status(200).send(JSON.stringify(updatedUser))
}

async function DeleteUser(req, res) {
  const rawBody = req.body;

  const commandError = await checkCommand('DELETE_USER');

  if (commandError?.error) {
    res.status(400).send({ error: commandError.error });
    return;
  }

  if (rawBody.data === undefined ||
    (
      rawBody.data.name === undefined &&
      rawBody.data.email === undefined &&
      rawBody.data.password === undefined)) {
    logError('A user was attempted to be created without a username, password or email! All of these must be provided to create a new user.')
    res.status(400).send({ error: 'An email, name, and password must be provided to create a user.' });
    return;
  }

  let foundUser = await getUsers({ id: rawBody.data.name });
  if (foundUser[0].critical) {
    logEvent(LogLevel.WARN, `Attempted to remove critical user ${foundUser[0].name}!`);
    res.status(403).send({ error: `Cannot remove critical user ${foundUser[0].name}` });
    return;
  }

  const user = { name: rawBody.data.name, id: rawBody.data.id, email: rawBody.data.email };

  const removedUser = await removeUsers(user);
  res.status(400).send(removedUser);
}

module.exports = { CreateUser, ReadUser, UpdateUser, DeleteUser }