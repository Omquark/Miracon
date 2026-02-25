const { requestApi } = require("./client");
const commandsActionTypes = {
  REFRESH_COMMAND: 'REFRESH_COMMAND',
  RESPONSE_COMMAND: 'RESPONSE_COMMAND',
};

async function pullCommands(dispatch) {
  const data = await requestApi('/commands', { method: 'GET' });

  if (data.error) {
    alert(`There was an error attempting to get the roles from the server!\n${data.error}`);
    return;
  }

  dispatch({ type: commandsActionTypes.REFRESH_COMMAND, payload: data });
}

async function saveCommands(roles, dispatch, action) {
  const data = {
    error: `Command mutation is not implemented on the backend. Requested action: ${action}`,
    requested: roles,
  };

  dispatch({ type: commandsActionTypes.RESPONSE_COMMAND, payload: data });
}

module.exports = { pullCommands, saveCommands };
