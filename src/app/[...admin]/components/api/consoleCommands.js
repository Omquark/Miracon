export async function pullConsoleCommands() {
  let response;
  let data;

  try {
    response = await fetch(`http://${location.host}/console`,
      {
        headers: {
          'content-type': 'application/json',
        },
        method: 'GET'
      });
    data = await response.json();
  } catch (err) {
    console.log(err);
    data = { error: 'Failed to access /console on GET!' }
  }
  return data;
}

export async function effectCommand(commandName) {
  let response;
  let data;

  try {
    response = await fetch(`http://${location.host}/console`,
      {
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: commandName }),
        method: 'PUT'
      });
    data = await response.json();
  } catch (err) {
    console.log(err);
    data = { error: 'Failed to access /console on PUT!' };
  }
  return data;
}