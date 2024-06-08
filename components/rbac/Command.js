const { logEvent, LogLevel } = require("../Log");
const { Command } = require("../commands/CmdDef");
const { validateRoles, addObjects, getObjects, updateObjects, removeObjects } = require("./CRUD");
const { strictProperties } = require("./Utility");

async function addCommands(command) {
  logEvent(LogLevel.INFO, 'Attempting to add commands.');
  let roleCheck = await validateRoles(command);
  let blacklistedRoles = { roles: command.roles };
  let blacklistCheck = await validateRoles(blacklistedRoles);

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, `Roles validated for the command command.name`);
    return addObjects('command', strictProperties(command, Command));
  } else {
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the command ${command.name}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the command ${command.name}`);
    }
    logEvent(LogLevel.INFO, 'The command has not been added');
  }

  return [];
}

async function getCommands(command) {
  logEvent(LogLevel.INFO, 'Retrieving commands from the database');
  return await getObjects('command', command);
}

async function updateCommands(oldCmd, newCmd) {
  logEvent(LogLevel.INFO, 'Attempting to update comamnds.');
  let roleCheck = await validateRoles(newCmd);
  let blacklistedRoles = { roles: newCmd.roles };
  let blacklistCheck = await validateRoles(blacklistedRoles);

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, `Roles validated for the command ${newCmd.name}`);
    return updateObjects('command', strictProperties(oldCmd, Command), strictProperties(newCmd, Command));
  } else {
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the command ${newCmd.name}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the command ${newCmd.name}`);
    }
    logEvent(LogLevel.INFO, 'The command has not been updated');
  }
  return [];
}

async function removeCommands(command) {
  logEvent(LogLevel.INFO, 'Attempting to remove commands.')
  return removeObjects('command', strictProperties(command, Command));
}

module.exports = { addCommands, getCommands, updateCommands, removeCommands };