const { logEvent, LogLevel } = require("../Log");
const { ConsoleCommand } = require("../commands/ConsoleCmdDef");
const { validateRoles, addObjects, getObjects, updateObjects, removeObjects } = require("./CRUD");
const { strictProperties } = require("./Utility");

async function addConsoleCommands(consoleCommand) {
  logEvent(LogLevel.INFO, 'Attempting to add commands.');
  let roleCheck = await validateRoles(consoleCommand);
  let blacklistedRoles = { roles: consoleCommand.roles };
  let blacklistCheck = await validateRoles(blacklistedRoles);

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, `Roles validated for the consoleCommand consoleCommand.name`);
    return addObjects('consoleCommand', strictProperties(consoleCommand, ConsoleCommand));
  } else {
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the consoleCommand ${consoleCommand.name}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the consoleCommand ${consoleCommand.name}`);
    }
    logEvent(LogLevel.INFO, 'The consoleCommand has not been added');
  }

  return [];
}

async function getConsoleCommands(consoleCommand) {
  logEvent(LogLevel.INFO, 'Retrieving commands from the database');
  return await getObjects('consoleCommand', consoleCommand);
}

async function updateConsoleCommands(oldCmd, newCmd) {
  logEvent(LogLevel.INFO, 'Attempting to update comamnds.');
  let roleCheck = await validateRoles(newCmd);
  let blacklistedRoles = { roles: newCmd.roles };
  let blacklistCheck = await validateRoles(blacklistedRoles);

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, `Roles validated for the consoleCommand ${newCmd.name}`);
    return updateObjects('consoleCommand', strictProperties(oldCmd, ConsoleCommand), strictProperties(newCmd, ConsoleCommand));
  } else {
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the consoleCommand ${newCmd.name}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the consoleCommand ${newCmd.name}`);
    }
    logEvent(LogLevel.INFO, 'The consoleCommand has not been updated');
  }
  return [];
}

async function removeConsoleCommands(consoleCommand) {
  logEvent(LogLevel.INFO, 'Attempting to remove commands.')
  return removeObjects('consoleCommand', strictProperties(consoleCommand, ConsoleCommand));
}

module.exports = { addConsoleCommands, getConsoleCommands, updateConsoleCommands, removeConsoleCommands };