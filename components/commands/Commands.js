const { logEvent, LogLevel } = require('../Log');
const cmdDef = require('./CmdDef');
const { addGroups, getGroups, resolveRoles } = require('../rbac/Group');
const { addRoles, getRoles } = require('../rbac/Role');
const { getUsers, updateUsers } = require('../rbac/User');
const { addCommands, getCommands } = require('../rbac/Command');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeRoleIds(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map(role => (typeof role === 'string' ? role : role?.id))
    .filter(roleId => typeof roleId === 'string' && roleId.trim() !== '');
}

/**
 * Initializes the commands for the minecraft server. This will remove any related data currently in the MongoDB.
 * All roles added here will need to be flagged so they cannot be removed.
 * @returns undefined
 */
async function InitCommands() {
  logEvent(LogLevel.INFO, 'Initializing the command roles database! This will remove any existing command role relationships.');
  logEvent(LogLevel.INFO, 'Creating roles to assign to commands.');

  const commandAdminGroup = { name: 'Command Admin', roles: [] }

  //Create a role for each command listed in the cmdDef object.
  for (const command of cmdDef.Commands) {
    logEvent(LogLevel.DEBUG, `Adding role for command ${command.name}`);
    const commandPayload = {
      ...command,
      roles: Array.isArray(command.roles) ? [...command.roles] : [],
      blacklistRoles: Array.isArray(command.blacklistRoles) ? [...command.blacklistRoles] : [],
    };
    await addRoles({ name: commandPayload.name, critical: true });
    const addedRole = await getRoles({ name: commandPayload.name });
    logEvent(LogLevel.DEBUG, `addedRole: ${JSON.stringify(addedRole)}`)

    if (addedRole.length !== 1 || !addedRole[0]?.name || !addedRole[0]?.id) {
      logEvent(LogLevel.WARN, `Failed to add a role for the command ${command.name}`);
      continue;
    }

    commandPayload.roles.push(addedRole[0].id);
    commandAdminGroup.roles.push(addedRole[0].id)
    logEvent(LogLevel.INFO, `Role ${addedRole[0].name} has been bound to command ${commandPayload.name}.`);
    await addCommands(commandPayload);
  }

  logEvent(LogLevel.INFO, 'Creating group for admin access to commands');
  await addGroups(commandAdminGroup);
  const newGroup = await getGroups(commandAdminGroup);
  const adminGroupId = newGroup?.[0]?.id;
  if (!adminGroupId) {
    logEvent(LogLevel.WARN, 'Command Admin group could not be found after creation. Skipping Miracon user update.');
    return;
  }

  const maxAttempts = 3;
  const timeOutSec = 3;
  for (let count = 0; count <= maxAttempts; count++) {
    const adminUser = await getUsers({ name: 'Miracon' });

    if (adminUser.length > 0 && adminUser[0]) {
      logEvent(LogLevel.DEBUG, `adminUser->InitCommands: ${JSON.stringify(adminUser)}`);
      const oldUser = adminUser[0];
      const oldGroups = Array.isArray(oldUser.groups) ? oldUser.groups : [];
      const nextGroups = oldGroups.includes(adminGroupId) ? oldGroups : [...oldGroups, adminGroupId];
      const newUser = { ...oldUser, groups: nextGroups };

      logEvent(LogLevel.INFO, 'Adding command admin group to Miracon user');
      await updateUsers(oldUser, newUser);
      return;
    }

    if (count >= maxAttempts) {
      logEvent(LogLevel.WARN, 'Could not find user that matches the Miracon user to apply Admin commands!');
      return;
    }
    logEvent(LogLevel.DEBUG, 'Miracon user not found! Making another attempt.');
    await sleep(timeOutSec * 1000);
  }
}

/**
 * Checks roles against a validation set. This does not resolve roles from groups. Returns true if the user is allowed to use the command,
 * false if the user is blacklisted or does not have the appropriate roles
 * @param {Array<string>} checkRoles The roles to check to see if they exist
 * @param {Command} validateCmd The command to check if the role is allowed access
 */
function CheckAuthorization(checkRoles, validateCmd) {
  if (!validateCmd || !Array.isArray(validateCmd.roles) || !Array.isArray(validateCmd.blacklistRoles)) {
    logEvent(LogLevel.WARN, 'Either checkRoles or validateCmd is not correctly defined while attempting to check authorization!');
    logEvent(LogLevel.WARN, 'Assuming the user is not authorized.');
    return false;
  }

  const normalizedRoles = normalizeRoleIds(checkRoles);
  if (normalizedRoles.length === 0) {
    logEvent(LogLevel.WARN, 'No valid roles were provided while attempting to check authorization.');
    return false;
  }

  const allowed = { blacklisted: false, whitelisted: false };

  validateCmd.roles.forEach(cmdRole => {
    if (normalizedRoles.find(role => {
      return role === cmdRole
    })) {
      logEvent(LogLevel.DEBUG, `Found role ${cmdRole} which allows the command ${JSON.stringify(validateCmd)}`)
      allowed.whitelisted = true;
    }
  });
  validateCmd.blacklistRoles.forEach(cmdRole => {
    if (normalizedRoles.find(role => role === cmdRole)) {
      logEvent(LogLevel.DEBUG, `Found role ${cmdRole} which has blacklisted the command ${JSON.stringify(validateCmd)}`)
      allowed.blacklisted = true;
    }
  });

  return allowed.blacklisted ? false : allowed.whitelisted;
}

/**
 * 
 * @param {string} name The name of the command to execute to get
 * @param {object} user The user, containing at least the user name or id
 * @returns Either the command, or an object { error: "error message" }
 */
async function getCommand(name, user,) {
  if (!name) {
    logEvent(LogLevel.AUDIT, 'Attempted to execute a command, but the command name is not defined!');
    return { error: 'Command could not be found' };
  }
  const normalizedName = String(name).toUpperCase();
  if (!user || (!user.name && !user.id)) {
    logEvent(LogLevel.AUDIT, `Attempted to execute command ${normalizedName}, but the user was not defined, or is incomplete! user: ${JSON.stringify(user)}`);
    return { error: `User or username was not defined!` };
  }
  logEvent(LogLevel.DEBUG, `Attempting to find command ${normalizedName} by ${user.name || user.id}`);
  //const foundCommand = cmdDef.Commands.find(cmd => cmd.name.toUpperCase() === name.toUpperCase());
  const foundCommand = (await getCommands({ name: name }))[0];

  logEvent(LogLevel.DEBUG, `foundCommand: ${JSON.stringify(foundCommand)}`)
  if (!foundCommand) {
    logEvent(LogLevel.AUDIT, `Attempted to execute a command that could not be found! Command name: ${name}, user: ${JSON.stringify(user)}`);
    return { error: `Command ${normalizedName} could not be found` };
  }

  let userRoles;
  if (Array.isArray(user.roleIds)) {
    userRoles = [...user.roleIds];
  } else {
    const userLookup = {};
    if (user.name) userLookup.name = user.name;
    if (user.id) userLookup.id = user.id;
    const pulledUser = await getUsers(userLookup);
    if (!pulledUser[0]) {
      logEvent(LogLevel.AUDIT, `Attempted to execute command ${foundCommand.name.toUpperCase()}, but the user ${user.name} could not be found`)
      return { error: `The user ${user.name} could not be found`, invalidate: true }
    }
    userRoles = await resolveRoles(pulledUser);
  }
  logEvent(LogLevel.DEBUG, `Pulled user's resolved roles: ${JSON.stringify(userRoles)}`);

  if (!Array.isArray(userRoles) || userRoles.length === 0) {
    logEvent(LogLevel.AUDIT, `${user.name} attempted to access command ${foundCommand.name.toUpperCase()}, but the user does not have any roles! user: ${user}`);
    return { error: `user ${user.name} does not have any roles` };
  }

  logEvent(LogLevel.DEBUG, `Checking authorization for ${user.name} to use the command ${foundCommand.name.toUpperCase()}`);
  const authorized = CheckAuthorization(userRoles, foundCommand);
  if (!authorized) {
    logEvent(LogLevel.AUDIT, `${user.name} attempted to access command ${foundCommand.name.toUpperCase()}, but is not authorized! user: ${JSON.stringify(user)}`);
    return { error: `User ${user.name} is not authorized to access command ${foundCommand.name.toUpperCase()}` };
  }


  logEvent(LogLevel.AUDIT, `User ${user.name} has been authorized to access ${foundCommand.name.toUpperCase()}`);
  return foundCommand;
}

async function checkCommand(commandName, userInfo) {
  const foundCmd = await getCommand(commandName, userInfo);
  if (foundCmd.error) {
    logEvent(LogLevel.WARN, `There was an error attempting to access command ${commandName}`);
    return { error: foundCmd.error };
  }

  return;
}


module.exports = { InitCommands, getCommand, checkCommand, CheckAuthorization }
