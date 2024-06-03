const { logEvent, LogLevel } = require('../Log');
const cmdDef = require('../commands/CmdDef');
const { addGroups, resolveRoles } = require('./Group');
const { addRoles } = require('./Role');
const { getUsers, updateUsers } = require('./User');

async function InitCommands() {
  logEvent(LogLevel.INFO, 'Initializing the command roles database! This will remove any existing command role relationships.');
  logEvent(LogLevel.INFO, 'Creating roles to assign to commands.');

  const commandAdminGroup = { name: 'Command Admin', roles: [] }

  //Create a role for each command listed in the comDef object. Name them with the same name for the hell of it(simplicity)
  cmdDef.Commands.forEach(command => {
    logEvent(LogLevel.DEBUG, `Adding role for command ${command.name}`);
    const addedRole = addRoles({ name: command.name });
    if (addedRole.length !== 1 || !addedRole[0].name || !addedRole[0].id) {
      logEvent(LogLevel.WARN, `Failed to add a role for the command ${command.name}`);
      return;
    };
    command.roles.push(addedRole[0].id);
    commandAdminGroup.roles.push(addedRole[0].id)
    logEvent(LogLevel.INFO, `Role ${addedRole[0].name} has been bound to command ${command.name}.`);
  });

  logEvent(LogLevel.INFO, 'Creating group for admin access to commands');
  const newGroup = await addGroups(commandAdminGroup);

  const checkForRole = (count = 0) => {
    const maxAttempts = 3;
    const timeOutSec = 3;
    const adminUser = getUsers({ name: 'Miracon' });

    if (adminUser.length === 0) {
      if (count >= maxAttempts) {
        logEvent(LogLevel.WARN, 'Could not find user that matches the Miracon user to apply Admin commands!');
        return;
      }
      logEvent(LogLevel.DEBUG, 'Miracon user not found! Making another attempt.');
      setTimeout(() => checkForRole(count + 1), timeOutSec * 1000);
      return;
    }
    adminUser[0]?.groups?.push(newGroup[0].id);
    logEvent(LogLevel.INFO, 'Adding command admin group to Miracon user');
    updateUsers(adminUser, adminUser);
  }

  checkForRole();

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
    })) allowed.whitelisted = true;
  });
  validateCmd.blacklistRoles.forEach(cmdRole => {
    if (checkRoles.find(role => role.id === cmdRole)) allowed.blacklisted = true;
  });

  return allowed.blacklisted ? false : allowed.whitelisted;
}

/**
 * 
 * @param {string} name The name of the command to execute to get
 * @param {object} user The user, containing at least the user name or id
 * @returns 
 */
function getCommand(name, user, ){
  if(!name){
    logEvent(LogLevel.AUDIT, `Attempted to execute a command, but the command name is not defined!\nname: ${name.toUpperCase()}`);
    return { error: `Command ${name.toUpperCase()} could not be found`};
  }
  if(!user || (!user.name && !user.id)){
    logEvent(LogLevel.AUDIT, `Attempted to execute command ${name.toUpperCase()}, but the user was not defined, or is incomplete! user: ${user}`);
    return { error: `user or username was not defined!`};
  }
  logEvent(LogLevel.DEBUG, `Attempting to find command ${name.toUpperCase()} by ${user.name}`);
  const foundCommand = cmdDef.Commands.find(cmd => cmd.name.toUpperCase() === name.toUpperCase());

  if(!foundCommand){
    logEvent(LogLevel.AUDIT, `Attempted to execute a command that could not be found! ${name}, user ${user}`);
    return { error: `Command ${name.toUpperCase()} could not be found`};
  }

  const pulledUser = getUsers({ name: user.name, id: user.id });
  if(pulledUser.length === 0){
    logEvent(LogLevel.AUDIT, `Attempted to execute command ${foundCommand.name.toUpperCase()}, but the user ${user.name} could not be found`)
    return { error: `The user ${user.name} could not be found`, invalidate: true }
  }

  const userRoles = resolveRoles(pulledUser);

  if(!Array.isArray(userRoles) || userRoles.length === 0){
    logEvent(LogLevel.AUDIT, `${user.name} attempted to access command ${foundCommand.name.toUpperCase()}, but the user does not have any roles! user: ${user}`);
    return { error: `user ${user.name} does not have any roles`};
  }

  const authorized = CheckAuthorization(userRoles, foundCommand);
  if(!authorized){
    logEvent(LogLevel.AUDIT, `${user.name} attempted to access command ${foundCommand.name.toUpperCase()}, but is not authorized! user: ${user}`);
    return { error: `user ${user.name} is not authorized to access command ${foundCommand.name.toUpperCase()}`};
  }

  return foundCommand;
}

module.exports = { InitCommands, getCommand }