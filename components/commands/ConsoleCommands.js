const { logEvent, LogLevel } = require("../Log");
const { addConsoleCommands } = require("../rbac/ConsoleCommand");
const { getRoles } = require("../rbac/Role");
const { ConsoleCommands } = require("./ConsoleCmdDef");

async function InitConsoleCommands() {
  logEvent(LogLevel.INFO, `Initializeing the console commands for execution within RCON. This will remove any current console command relationships.`);
  logEvent(LogLevel.INFO, `Creating the commands with defaults to the default Minecraft command levels.`);

  const consoleExecutionRole = await getRoles([{ name: 'Level 1' }, { name: 'Level 2' }, { name: 'Level 3' }, { name: 'Level 4' }]);

  for (command of ConsoleCommands) {
    logEvent(LogLevel.INFO, `Setting roles for command ${command.name}`);

    const commandRole = consoleExecutionRole.find(role => role.name.toUpperCase() === command.roles[0].toUpperCase());

    if (!commandRole) {
      command.roles = [];
    }
    else {
      command.roles[0] = commandRole.id;
    }

    await addConsoleCommands(command);
  }
}

module.exports = { InitConsoleCommands }