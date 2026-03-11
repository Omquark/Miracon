const { logEvent, LogLevel } = require("../Log");
const { ConsoleCommand } = require("../commands/ConsoleCmdDef");
const { validateRoles, addObjects, getObjects, updateObjects, removeObjects } = require("./CRUD");
const { strictProperties } = require("./Utility");

function toBlacklistValidationPayload(consoleCommand) {
  const commands = Array.isArray(consoleCommand) ? consoleCommand : [consoleCommand];
  return commands.map(cmd => ({ roles: cmd?.blacklistRoles || [] }));
}

async function addConsoleCommands(consoleCommand) {
  logEvent(LogLevel.INFO, 'Attempting to add commands.');
  let roleCheck = await validateRoles(consoleCommand);
  let blacklistCheck = await validateRoles(toBlacklistValidationPayload(consoleCommand));

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, 'Roles validated for console command insert');
    return addObjects('consoleCommand', strictProperties(consoleCommand, ConsoleCommand));
  } else {
    const commandName = Array.isArray(consoleCommand) ? '[batch]' : consoleCommand?.name;
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the consoleCommand ${commandName}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the consoleCommand ${commandName}`);
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
  let blacklistCheck = await validateRoles(toBlacklistValidationPayload(newCmd));

  if (roleCheck && blacklistCheck) {
    logEvent(LogLevel.INFO, 'Roles validated for console command update');
    return updateObjects('consoleCommand', strictProperties(oldCmd, ConsoleCommand), strictProperties(newCmd, ConsoleCommand));
  } else {
    const commandName = Array.isArray(newCmd) ? '[batch]' : newCmd?.name;
    if (!roleCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated for the consoleCommand ${commandName}`);
    }
    if (!blacklistCheck) {
      logEvent(LogLevel.INFO, `There was a role that could not be validated to be blacklisted for the consoleCommand ${commandName}`);
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
