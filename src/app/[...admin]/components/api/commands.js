import { commandsActionTypes } from "../context/admin/commands";

export async function pullCommands(dispatch) {

  let response;
  let data;

  try {
    response = await fetch(`http://${location.host}/commands`,
      {
        headers: {
          'content-type': 'application/json',
        },
        method: 'GET',
      });
    data = await response.json();
  } catch (err) {
    console.log(err);
    data = { error: 'Failed to access /commands on GET!' }
  }

  if (data.error) {
    alert(`There was an error attempting to get the roles from the server!\n${data.error}`);
    return;
  }

  dispatch({ type: commandsActionTypes.REFRESH_COMMAND, payload: data });
}

export async function saveCommands(roles, dispatch, action) {
  let response;
  let data;

  const payload = { data: roles, action: action };

  try {
    response = await fetch(`http://${location.host}/roles`,
      {
        body: JSON.stringify(payload),
        headers: {
          'content-type': 'application/json',
        },
        method: postMessage,

      });

    data = await response.json();
  } catch (err) {
    console.log(err);
    data = { error: 'Failed to access /commands on POST!' };
  }

  dispatch({ type: commandsActionTypes.RESPONSE_COMMAND, payload: data });
}