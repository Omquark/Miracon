const { logEvent, LogLevel } = require("../Log");
const { addConsoleCommands } = require("../rbac/ConsoleCommand");
const { getRoles } = require("../rbac/Role");
const { ConsoleCommands } = require("./ConsoleCmdDef");

/**
 * Initializes the console commands data within the DB.
 */
async function InitConsoleCommands() {
  logEvent(LogLevel.INFO, `Initializing the console commands for execution within RCON. This will remove any current console command relationships.`);
  logEvent(LogLevel.INFO, `Creating the commands with defaults to the default Minecraft command levels.`);

  const requestedRoles = [{ name: 'Level 0' }, { name: 'Level 1' }, { name: 'Level 2' }, { name: 'Level 3' }, { name: 'Level 4' }];
  const consoleExecutionRole = await getRoles(requestedRoles);
  const roles = Array.isArray(consoleExecutionRole) ? consoleExecutionRole : [];

  for (const command of ConsoleCommands) {
    logEvent(LogLevel.INFO, `Setting roles for command ${command.name}`);
    const commandPayload = {
      ...command,
      roles: (Array.isArray(command.roles) ? [...command.roles] : []).filter(roleId => typeof roleId === 'string' && roleId.trim() !== ''),
      blacklistRoles: (Array.isArray(command.blacklistRoles) ? [...command.blacklistRoles] : []).filter(roleId => typeof roleId === 'string' && roleId.trim() !== ''),
    };
    const configuredRole = commandPayload.roles[0];
    const commandRole = roles.find(role =>
      role?.name &&
      typeof configuredRole === 'string' &&
      role.name.toUpperCase() === configuredRole.toUpperCase()
    );

    if (!commandRole?.id) {
      logEvent(LogLevel.WARN, `No matching role found for command ${command.name}. Command will be inserted without execution roles.`);
      commandPayload.roles = [];
    } else {
      commandPayload.roles = [commandRole.id];
    }

    try {
      await addConsoleCommands(commandPayload);
    } catch (error) {
      logEvent(
        LogLevel.ERROR,
        `Failed to add console command ${command.name}: ${error?.message || JSON.stringify(error)}`
      );
    }
  }
}

async function CheckAuthorization(consoleCommand, userInfo) {
  if (!consoleCommand || !userInfo) {
    return false;
  }

  const cmdRoles = Array.isArray(consoleCommand.roles) ? consoleCommand.roles : [];
  const cmdBlacklist = Array.isArray(consoleCommand.blacklistRoles) ? consoleCommand.blacklistRoles : [];
  const userRolesRaw = Array.isArray(userInfo.roleIds)
    ? userInfo.roleIds
    : (Array.isArray(userInfo.roles) ? userInfo.roles : []);
  const userRoleIds = userRolesRaw
    .map(role => (typeof role === 'string' ? role : role?.id))
    .filter(roleId => typeof roleId === 'string' && roleId.trim() !== '');

  const blacklisted = cmdBlacklist.some(roleId => userRoleIds.includes(roleId));
  if (blacklisted) {
    return false;
  }

  return cmdRoles.some(roleId => userRoleIds.includes(roleId));
}

module.exports = { InitConsoleCommands, CheckAuthorization }
