const { logEvent, LogLevel } = require('../Log');
const cmdDef = require('./CmdDef');
const { addGroups, getGroups, resolveRoles } = require('../rbac/Group');
const { addRoles, getRoles } = require('../rbac/Role');
const { getUsers, updateUsers } = require('../rbac/User');
const { addCommands, getCommands } = require('../rbac/Command');

async function InitCommands() {
  logEvent(LogLevel.INFO, 'Initializing the command roles database! This will remove any existing command role relationships.');
  logEvent(LogLevel.INFO, 'Creating roles to assign to commands.');

  const commandAdminGroup = { name: 'Command Admin', roles: [] }

  //Create a role for each command listed in the comDef object. Name them with the same name for the hell of it(simplicity)
  for (command of cmdDef.Commands) {
    // cmdDef.Commands.forEach(async command => {
    logEvent(LogLevel.DEBUG, `Adding role for command ${command.name}`);
    await addRoles({ name: command.name });
    const addedRole = await getRoles({ name: command.name });
    logEvent(LogLevel.DEBUG, `addedRole: ${JSON.stringify(addedRole)}`)

    if (addedRole.length !== 1 || !addedRole[0].name || !addedRole[0].id) {
      logEvent(LogLevel.WARN, `Failed to add a role for the command ${command.name}`);
      return;
    };
    command.roles.push(addedRole[0].id);
    commandAdminGroup.roles.push(addedRole[0].id)
    logEvent(LogLevel.INFO, `Role ${addedRole[0].name} has been bound to command ${command.name}.`);
    await addCommands(command);
  }
  // });

  logEvent(LogLevel.INFO, 'Creating group for admin access to commands');
  await addGroups(commandAdminGroup);
  const newGroup = await getGroups(commandAdminGroup);

  const checkForRole = async (count = 0) => {
    const maxAttempts = 3;
    const timeOutSec = 3;
    const adminUser = await getUsers({ name: 'Miracon' });

    if (adminUser.length === 0 || !adminUser[0]) {
      if (count >= maxAttempts) {
        logEvent(LogLevel.WARN, 'Could not find user that matches the Miracon user to apply Admin commands!');
        return;
      }
      logEvent(LogLevel.DEBUG, 'Miracon user not found! Making another attempt.');
      setTimeout(async () => await checkForRole(count + 1), timeOutSec * 1000);
      return;
    }
    logEvent(LogLevel.DEBUG, `adminUser->InitCommands: ${JSON.stringify(adminUser)}`);
    adminUser[0].groups.push(newGroup[0].id);
    logEvent(LogLevel.INFO, 'Adding command admin group to Miracon user');
    await updateUsers(adminUser, adminUser);
  }

  await checkForRole();

}

/**
 * Checks roles against a validation set. This does not resolve roles from groups. Returns true if the user is allowed to use the command,
 * false if the user is blacklisted or does not have the appropriate roles
 * @param {Array<string>} checkRoles The roles to check to see if they exist
 * @param {Command} validateCmd The command to check if the role is allowed access
 */
function CheckAuthorization(checkRoles, validateCmd) {
  if (!checkRoles || !Array.isArray(checkRoles) || checkRoles.length === 0 || !validateCmd || !validateCmd.roles || !validateCmd.blacklistRoles) {
    logEvent(LogLevel.WARN, 'Either checkRoles or validateCmd is not correctly defined while attempting to check authorization!');
    logEvent(LogLevel.WARN, 'Assuming the user is not authorized.');
    return false;
  }

  const allowed = { blacklisted: false, whitelisted: false };

  validateCmd.roles.forEach(cmdRole => {
    if (checkRoles.find(role => {
      return role === cmdRole
    })) {
      logEvent(LogLevel.DEBUG, `Found role ${cmdRole} which allows the command ${JSON.stringify(validateCmd)}`)
      allowed.whitelisted = true;
    }
  });
  validateCmd.blacklistRoles.forEach(cmdRole => {
    if (checkRoles.find(role => role.id === cmdRole)) {
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
 * @returns 
 */
async function getCommand(name, user,) {
  if (!name) {
    logEvent(LogLevel.AUDIT, `Attempted to execute a command, but the command name is not defined!\nname: ${name.toUpperCase()}`);
    return { error: `Command ${name.toUpperCase()} could not be found` };
  }
  if (!user || (!user.name && !user.id)) {
    logEvent(LogLevel.AUDIT, `Attempted to execute command ${name.toUpperCase()}, but the user was not defined, or is incomplete! user: ${JSON.stringify(user)}`);
    return { error: `user or username was not defined!` };
  }
  logEvent(LogLevel.DEBUG, `Attempting to find command ${name.toUpperCase()} by ${user.name}`);
  //const foundCommand = cmdDef.Commands.find(cmd => cmd.name.toUpperCase() === name.toUpperCase());
  const foundCommand = (await getCommands({ name: name }))[0];

  logEvent(LogLevel.DEBUG, `foundCommand: ${JSON.stringify(foundCommand)}`)
  if (!foundCommand) {
    logEvent(LogLevel.AUDIT, `Attempted to execute a command that could not be found! Command name: ${name}, user: ${JSON.stringify(user)}`);
    return { error: `Command ${name.toUpperCase()} could not be found` };
  }

  const pulledUser = await getUsers({ name: user.name, id: user.id });
  if (!pulledUser[0]) {
    // if (pulledUser.length === 0) {
    logEvent(LogLevel.AUDIT, `Attempted to execute command ${foundCommand.name.toUpperCase()}, but the user ${user.name} could not be found`)
    return { error: `The user ${user.name} could not be found`, invalidate: true }
  }

  const userRoles = await resolveRoles(pulledUser);
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

module.exports = { InitCommands, getCommand }