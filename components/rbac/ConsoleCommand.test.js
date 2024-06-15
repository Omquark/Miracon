jest.doMock('../Log', () => {
  return {
    __esmodule: false,
    logEvent: (logLevel, message) => {
      //we do need the debug messages
      if (logLevel.level > -10) console.log(`${logLevel.name} ${message}`);
    },
    logError: (message) => {
      console.log(`${message}`);
    },
    LogLevel: {
      ALL: { name: 'ALL', level: -1 },
      DEBUG: { name: 'DEBUG', level: 0 },
      INFO: { name: 'INFO', level: 1 },
      WARN: { name: 'WARN', level: 2 },
      ERROR: { name: 'ERROR', level: 255 },
    }
  }
});

jest.doMock('../Config', () => {
  return {
    getConfig: () => {
      return {
        init: false,
        minecraftServer: {
          path: '/opt/minecraft',
          address: 'localhost',
          port: '25575',
          password: 'cGFzc3dvcmQK' //64-bit encoded
        },
        log: {
          level: 'DEBUG',
          path: '/var/miracon',
          logFolder: 'log',
          auditFolder: 'audit',
        },
        nodeConfig: {
          port: '3010',
          installPath: '/opt/miracon',
          initUsers: true,
        },
        dbConfig: {
          dbname: 'miracon',
          url: 'localhost',
          port: 27017,
          username: 'miracon',
          password: 'miracon'
        }
      }
    },
    HiddenConfig: {
      dbConfig: { password: 'miracon' }
    }
  }
});

describe('Test the crud functions at the top later for Commands', () => {

  const { getRoles, addRoles } = require('./Role');
  const { getConsoleCommands, addConsoleCommands, updateConsoleCommands, removeConsoleCommands } = require('./ConsoleCommand');
  const { initDatabase, closeConnection, } = require('./db');

  const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },
  { name: 'Blacklisted role 1', id: '4' }, { name: 'Blacklisted role 2', id: '5' }, { name: 'Blacklisted role 3', id: '6' },];

  const testCommands = [
    {
      "name": "TEST_COMMAND 1",
      "description": "Test Command 1 is a test consoleCommand not meant for production.",
      "roles": ['1', '2'],
      "blacklistRoles": ['4'],
      "requirePassword": false,
      "enabled": true,
      "id": "1"
    },
    {
      "name": "TEST_COMMAND 2",
      "description": "Test Command 2 is a test consoleCommand not meant for production.",
      "roles": ['1', '3'],
      "blacklistRoles": ['5'],
      "requirePassword": true,
      "enabled": true,
      "id": "2"
    },
    {
      "name": "TEST_COMMAND 3",
      "description": "Test Command 3 is a test consoleCommand not meant for production.",
      "roles": ['2', '3'],
      "blacklistRoles": ['6'],
      "requirePassword": true,
      "enabled": false,
      "id": "3"
    }
  ]

  beforeEach(async () => {
    jest.resetModules();
    jest.resetAllMocks();

    await initDatabase();
    await closeConnection();
  });

  afterEach(async () => {
    await closeConnection();
  });

  it('checks the add and get functionality for commands', async () => {
    //Add and verify the roles
    await addRoles(testRoles);
    let testRole = await getRoles();
    expect(testRole.length).toBe(6);

    //Attempt to add a single consoleCommand
    let testCommand = await addConsoleCommands(testCommands[0]);
    expect(testCommand.length).toBe(1);

    //Verify the consoleCommand has been added and can be retrieved
    testCommand = await getConsoleCommands({ id: '1' });
    expect(testCommand.length).toBe(1);
    expect(testCommand[0].name).toBe(testCommands[0].name);
    expect(testCommand[0].id).toBe(testCommands[0].id);
    expect(testCommand[0].description).toBe(testCommands[0].description);
    expect(testCommand[0].roles.length).toBe(2);
    expect(testCommand[0].roles).toContain('1');
    expect(testCommand[0].roles).toContain('2');
    expect(testCommand[0].blacklistRoles.length).toBe(1)
    expect(testCommand[0].blacklistRoles).toContain['4'];

    //Add an array
    testCommand = await addConsoleCommands([testCommands[1], testCommands[2]]);
    expect(testCommand.length).toBe(2);

    //Retrieve an array
    testCommand = await getConsoleCommands([{ id: '2' }, { id: '3' }]);
    expect(testCommand.length).toBe(2);
    expect(testCommand[0].name).toBe(testCommands[1].name);
    expect(testCommand[0].id).toBe(testCommands[1].id);
    expect(testCommand[0].description).toBe(testCommands[1].description);
    expect(testCommand[0].roles.length).toBe(2);
    expect(testCommand[0].roles).toContain('1');
    expect(testCommand[0].roles).toContain('3');
    expect(testCommand[0].blacklistRoles.length).toBe(1)
    expect(testCommand[0].blacklistRoles).toContain['5'];

    expect(testCommand[1].name).toBe(testCommands[2].name);
    expect(testCommand[1].id).toBe(testCommands[2].id);
    expect(testCommand[1].description).toBe(testCommands[2].description);
    expect(testCommand[1].roles.length).toBe(2);
    expect(testCommand[1].roles).toContain('2');
    expect(testCommand[1].roles).toContain('3');
    expect(testCommand[1].blacklistRoles.length).toBe(1)
    expect(testCommand[1].blacklistRoles).toContain['6'];

    //Retrieve all roles
    testCommand = await getConsoleCommands();
    expect(testCommand.length).toBe(3);
  });

  it('checks the update function for the commands', async () => {
    await addRoles(testRoles);
    let testRole = await getRoles();
    expect(testRole.length).toBe(6);

    //Attempt to add a single consoleCommand
    let testCommand = await addConsoleCommands(testCommands);
    expect(testCommand.length).toBe(3);

    let updatedCommand = { ...testCommands[0] };
    updatedCommand.name = 'NEW_COMMAND 1';
    updatedCommand.description = 'New consoleCommand 1 is a test consoleCommand not meant for production.'
    updatedCommand.roles = ['1'];
    updatedCommand.blacklistRoles = ['2'];
    updatedCommand.requirePassword = true;
    updatedCommand.enabled = false;

    //Attempt to update an invalid consoleCommand
    testCommand = await updateConsoleCommands({ id: '10' }, updatedCommand);
    expect(testCommand.length).toBe(0);

    //Change all the fields and confirm they update
    testCommand = await updateConsoleCommands(testCommands[0], updatedCommand);
    expect(testCommand.length).toBe(1);
    expect(testCommand[0]).toBeDefined();
    testCommand = await getConsoleCommands({ id: updatedCommand.id });
    expect(testCommand.length).toBe(1);
    expect(testCommand[0].name).toBe(updatedCommand.name);
    expect(testCommand[0].id).toBe(updatedCommand.id);
    expect(testCommand[0].description).toBe(updatedCommand.description);
    expect(testCommand[0].roles.length).toBe(updatedCommand.roles.length);
    expect(testCommand[0].roles).toContain('1');
    expect(testCommand[0].blacklistRoles.length).toBe(updatedCommand.blacklistRoles.length);
    expect(testCommand[0].blacklistRoles).toContain['2'];

    //Update an array
    updatedCommand = [testCommands[1], testCommands[2]];
    updatedCommand[0].name = 'NEW_COMMAND 2';
    updatedCommand[0].description = 'New consoleCommand 2 is a test consoleCommand not meant for production.'
    updatedCommand[0].roles = ['2'];
    updatedCommand[0].blacklistRoles = ['3'];
    updatedCommand[0].requirePassword = false;
    updatedCommand[0].enabled = false;
    updatedCommand[1].name = 'NEW_COMMAND 3';
    updatedCommand[1].description = 'New consoleCommand 3 is a test consoleCommand not meant for production.'
    updatedCommand[1].roles = ['3'];
    updatedCommand[1].blacklistRoles = ['4'];
    updatedCommand[1].requirePassword = false;
    updatedCommand[1].enabled = true;

    testCommand = await updateConsoleCommands([{ id: testCommands[1].id }, { id: testCommands[2].id }], [updatedCommand[0], updatedCommand[1]]);
    expect(testCommand.length).toBe(2);
    testCommand = await getConsoleCommands([{ id: updatedCommand[0].id }, { id: updatedCommand[1].id }]);
    expect(testCommand.length).toBe(2);

    expect(testCommand[0].name).toBe(updatedCommand[0].name);
    expect(testCommand[0].id).toBe(updatedCommand[0].id);
    expect(testCommand[0].description).toBe(updatedCommand[0].description);
    expect(testCommand[0].roles.length).toBe(updatedCommand[0].roles.length);
    expect(testCommand[0].roles).toContain('2');
    expect(testCommand[0].blacklistRoles.length).toBe(updatedCommand[0].blacklistRoles.length);
    expect(testCommand[0].blacklistRoles).toContain['3'];

    expect(testCommand[1].name).toBe(updatedCommand[1].name);
    expect(testCommand[1].id).toBe(updatedCommand[1].id);
    expect(testCommand[1].description).toBe(updatedCommand[1].description);
    expect(testCommand[1].roles.length).toBe(updatedCommand[1].roles.length);
    expect(testCommand[1].roles).toContain('3');
    expect(testCommand[1].blacklistRoles.length).toBe(updatedCommand[1].blacklistRoles.length);
    expect(testCommand[1].blacklistRoles).toContain['4'];
  });

  it('checkes the remove function for the commands', async () => {
    await addRoles(testRoles);
    let testRole = await getRoles();
    expect(testRole.length).toBe(6);

    await addConsoleCommands(testCommands);
    let testCommand = await getConsoleCommands();
    expect(testCommand.length).toBe(3);

    //Attempt to remove an invalid consoleCommand
    testCommand = await removeConsoleCommands({ id: '10' });
    expect(testCommand.length).toBe(0);
    expect(testCommand[0]).toBeUndefined();

    //Remove a valid consoleCommand
    testCommand = await removeConsoleCommands({ id: '1' });
    expect(testCommand.length).toBe(1);

    //Check the consoleCommand was removed
    testCommand = await getConsoleCommands({ id: 1 });
    expect(testCommand.length).toBe(1);
    expect(testCommand[0]).toBeUndefined();

    //Remove an Array
    testCommand = await removeConsoleCommands([{ id: '2' }, { name: 'NEW_COMMAND 3' }]);
    expect(testCommand.length).toBe(2);

    //And check they no longer exist
    testCommand = await getConsoleCommands([{ id: '2' }, { id: '3' }]);
    expect(testCommand.length).toBe(2);
    expect(testCommand[0]).toBeUndefined();
    expect(testCommand[1]).toBeUndefined();
  });
});