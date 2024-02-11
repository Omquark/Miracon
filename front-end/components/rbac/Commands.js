const { logEvent, LogLevel } = require('../Log');
const cmdDef = require('../commands/CmdDef');
const { addGroups } = require('./Group');
const { addRoles } = require('./Role');
const { getUsers, updateUsers } = require('./User');

function InitCommands() {
  logEvent(LogLevel.INFO, 'Initializing the command roles database! This will remove any existing command role relationships.');
  logEvent(LogLevel.INFO, 'Creating roles to assign to commands.');

  const commandAdminGroup = { name: 'Command Admin', roles: [] }
  //Create a role for each command listed in the comDef object. Name them with the same name for the hell of it(simplicity)
  cmdDef.Commands.forEach(command => {
    logEvent(LogLevel.DEBUG, `Adding role for command ${command.name}`);
    const addedRole = addRoles({ name: command.name });
    if(addedRole.length !== 1 || !addedRole[0].name || !addedRole[0].id){
      logEvent(LogLevel.WARN, `Failed to add a role for the command ${command.name}`);
      return;
    };
    command.role.push(addedRole[0].id);
    commandAdminGroup.roles.push(addedRole[0].id)
    logEvent(LogLevel.INFO, `Role ${addedRole[0].name} has been bound to command ${command.name}.`);
  });

  logEvent(LogLevel.INFO, 'Creating group for admin access to commands');
  const newGroup = addGroups(commandAdminGroup);

  //console.log(getUsers());
  return;

  const adminUser = getUsers({name: 'Miracon'});
  adminUser[0].groups.push(newGroup);
  logEvent(LogLevel.INFO, 'Adding command admin group to Miracon user');
  updateUsers(adminUser, adminUser);
}

/**
 * Checks roles against a validation set. This does not resolve roles from groups. Returns true if the user is allowed to use the command,
 * false if the user is blacklisted or does not have the appropriate roles
 * @param {Array<string>} checkRoles The roles to check to see if they exist
 * @param {Command} validateCmd The command to check if the role is allowed access
 */
function CheckAuthorization(checkRoles, validateCmd) {
  if (!checkRoles || !Array.isArray(checkRoles) || !validateCmd || !Array.isArray(validateCmd)) {
    logEvent(LogLevel.WARN, "You must pass arrays of string in order to check the roles! This returns that the check has failed");
    return false;
  }
  
  const allowed = { blacklisted: false, whitelisted: false };

  return allowed.blacklisted ? false : allowed.whitelisted;
}

module.exports = { InitCommands, CheckAuthorization }