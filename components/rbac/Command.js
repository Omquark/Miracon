const { logEvent, LogLevel } = require("../Log");
const { Command } = require("../commands/CmdDef");
const { validateRoles, addObjects, getObjects, updateObjects, removeObjects } = require("./CRUD");
const { strictProperties } = require("./Utility");

/**
 * 
 * @param {Command | Array<Command> } command The command to add, should have a structure as from @components/commands/CmdDef.js
 * @returns Either the objects added, or an empty array if they could not be added
 */
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

/**
 * Retrieves commands from the DB by either name or id
 * @param {Command | Array<Command>} command The command to find, which should have either a name or an id
 * @returns The commands which were found, or an empty array if one could not be found
 */
async function getCommands(command) {
  logEvent(LogLevel.INFO, 'Retrieving commands from the database');
  return await getObjects('command', command);
}

/**
 * Updated command(s) with new properties. The old and new command must be of the same size, you can even update a single
 * command with an array count of 1.
 * @param {Command | Array<Command>} oldCmd The old command(s) which should be updated. This does not need to be the full
 * old command, but needs either an id or a name.
 * @param {Command | Array<Command>} newCmd The new command to update to, any ommited fields will not be updated.
 * @returns 
 */
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

/**
 * Removes a command from the DB. This can removed by name or id.
 * @param {Command | Array<Command>} command The command to remove from the DB
 * @returns Array<Command> of comamnds removed. This could be 1 or more. An empty Array will be returned 
 * if the command could not be found
 */
async function removeCommands(command) {
  logEvent(LogLevel.INFO, 'Attempting to remove commands.')
  return removeObjects('command', strictProperties(command, Command));
}

module.exports = { addCommands, getCommands, updateCommands, removeCommands };