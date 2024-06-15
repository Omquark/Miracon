jest.doMock('../Log', () => {
  return {
    __esmodule: false,
    logEvent: (logLevel, message) => {
      //we don't need the debug messages
      if (logLevel.level > 0) console.log(`${logLevel.name} ${message}`);
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
          level: 'ALL',
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

describe('Test the CRUD functions at the top layer for Roles', () => {
  beforeEach(async () => {
    const { initDatabase, closeConnection, } = require('./db');
    jest.resetModules();
    jest.resetAllMocks();

    await initDatabase();
    await closeConnection();
  });

  afterEach(async () => {
    const { closeConnection } = require('./db');

    await closeConnection();
  });

  it('checks the add and get functions for roles', async () => {
    const { getRoles, addRoles } = require('./Role');
    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },];

    //Add a single role
    let testRole = await addRoles(testRoles[0]);
    expect(Array.isArray(testRole)).toBe(true);
    expect(testRole.length).toBe(1);
    expect(testRole[0].name).toBe(testRoles[0].name);

    //Add an array
    testRole = await addRoles([testRoles[1], testRoles[2]]);
    expect(testRole.length).toBe(2);
    expect(testRole[0].name).toBe(testRoles[1].name);
    expect(testRole[1].name).toBe(testRoles[2].name);

    //Attempt to add a duplicate role
    testRole = await addRoles(testRoles[0]);
    expect(testRole.length).toBe(1);
    expect(testRole[0]).toBeUndefined();

    //Get a single role
    testRole = await getRoles({ id: 1 });
    expect(testRole.length).toBe(1);
    expect(testRole[0].name).toBe(testRoles[0].name);
    expect(testRole[0].id).toBe(testRoles[0].id);

    //Get all the roles
    testRole = await getRoles();
    expect(testRole.length).toBe(3);
    expect(testRole[0].name).toBe(testRoles[0].name);
    expect(testRole[0].id).toBe(testRoles[0].id);
    expect(testRole[1].name).toBe(testRoles[1].name);
    expect(testRole[1].id).toBe(testRoles[1].id);
    expect(testRole[2].name).toBe(testRoles[2].name);
    expect(testRole[2].id).toBe(testRoles[2].id);

    //Attempt to get an invalid id
    testRole = await getRoles({ id: 4 });
    expect(testRole.length).toBe(1);
    expect(testRole[0]).toBeUndefined();
  });

  it('checks the update function to confirm role updates', async () => {
    const { getRoles, addRoles, updateRoles } = require('./Role');
    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },];

    //Set up the database
    await addRoles(testRoles);
    let testRole = await getRoles();
    expect(testRole.length).toBe(3);

    //Attempt to update a single role
    testRole = await updateRoles({ name: 'Test Role 1' }, { name: 'New Role 1' });
    expect(testRole.length).toBe(1);
    expect(testRole[0].name).toBe('New Role 1');
    testRole = await getRoles({ id: 1 })
    expect(testRole[0].name).toBe('New Role 1');

    //Attempt to update an array of roles, by name then id
    testRole = await updateRoles([{ name: testRoles[1].name }, { id: testRoles[2].id }], [{ name: 'New Role 2' }, { name: 'New Role 3' }]);
    expect(testRole.length).toBe(2);
    expect(testRole[0].name).toBe('New Role 2');
    expect(testRole[1].name).toBe('New Role 3');
    testRole = await getRoles([{ id: 2 }, { id: 3 }]);
    expect(testRole.length).toBe(2);
    expect(testRole[0].id).toBe(2);
    expect(testRole[0].name).toBe('New Role 2');
    expect(testRole[1].id).toBe(3);
    expect(testRole[1].name).toBe('New Role 3');

    //Attempt to update an id, which should not work
    testRole = await updateRoles({ id: 1 }, { id: 4 });
    expect(testRole.length).toBe(0);
  });

  it('tests the remove function to confirm role removals', async () => {
    const { getRoles, addRoles, removeRoles } = require('./Role');

    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },];

    //Set up the database
    await addRoles(testRoles);
    let testRole = await getRoles();
    expect(testRole.length).toBe(3);

    //Try to remove an invalid role
    testRole = await removeRoles({ name: 'Invalid Role 1' });
    expect(testRole.length).toBe(0);

    //Remove a role and confirm
    testRole = await removeRoles({ id: 1 });
    expect(testRole.length).toBe(1);
    expect(testRole[0].id).toBe(1);
    testRole = await getRoles({ id: 1 });
    expect(testRole.length).toBe(1);
    expect(testRole[0]).toBeUndefined();

    //Bulk remove
    testRole = await removeRoles([{ id: 2 }, { name: 'Test Role 3' }]);
    expect(testRole.length).toBe(2);
    expect(testRole[0].id).toBe(2);
    expect(testRole[1].name).toBe('Test Role 3');
    testRole = await getRoles();
    expect(testRole.length).toBe(0);
  });

  it('tests cascade removal for the roles to make sure no invalid references for groups and users', async () => {
    const { getRoles, addRoles, removeRoles } = require('./Role');
    const { getGroups, addGroups } = require('./Group');
    const { getUsers, addUsers } = require('./User');

    const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },];
    const testGroups = [
      { name: 'Test Group 1', id: 1, roles: ['1', '2'] },
      { name: 'Test Group 2', id: 2, roles: ['1', '3'] },
      { name: 'Test Group 3', id: 3, roles: ['2', '3'] },
    ];
    const testUsers = [
      { name: 'Test User 1', password: 'password', email: 'TestUser1@email.com', preferences: {}, roles: ['1'], groups: ['1'], id: '1', active: true, changePassword: true },
      { name: 'Test User 2', password: 'password', email: 'TestUser2@email.com', preferences: {}, roles: ['2'], groups: ['2'], id: '2', active: true, changePassword: true },
      { name: 'Test User 3', password: 'password', email: 'TestUser3@email.com', preferences: {}, roles: ['3'], groups: ['3'], id: '3', active: true, changePassword: true },
    ];
    //Set up the database
    await addRoles(testRoles);
    await addGroups(testGroups);
    await addUsers(testUsers);

    let testRole = await getRoles();
    let testGroup = await getGroups();
    let testUser = await getUsers();
    
    //Confirm data is working
    expect(testRole.length).toBe(3);
    expect(testGroup.length).toBe(3);
    expect(testUser.length).toBe(3);

    //Remove a role, and confirm it was removed from the groups and users
    testRole = await removeRoles(testRoles[0]);
    //First groups
    testGroup = await getGroups(testGroups[0]);
    expect(testGroup[0].roles.length).toBe(1);
    expect(testGroup[0].roles).not.toContain('1');
    testGroup = await getGroups(testGroups[1]);
    expect(testGroup[0].roles.length).toBe(1);
    expect(testGroup[0].roles).not.toContain('1');
    testGroup = await getGroups(testGroups[2]);
    expect(testGroup[0].roles.length).toBe(2);
    expect(testGroup[0].roles).not.toContain('1');
    //Then users
    testUser = await getUsers([testUsers[0]]);
    expect(testUser[0].roles.length).toBe(0);
    testUser = await getUsers([testUsers[1]]);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles).not.toContain('1');
    testUser = await getUsers([testUsers[2]]);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles).not.toContain('1');
  });
});