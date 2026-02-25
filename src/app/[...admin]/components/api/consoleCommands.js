const { requestApi } = require("./client");

async function pullConsoleCommands() {
  return requestApi('/console', { method: 'GET' });
}

async function effectCommand(commandName) {
  const data = await requestApi('/console', {
    method: 'POST',
    body: { name: commandName },
  });
  if (data?.error?.code) {
    return { error: data.error.code };
  }
  return data;
}

module.exports = { pullConsoleCommands, effectCommand };
