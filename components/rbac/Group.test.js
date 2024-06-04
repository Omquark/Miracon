jest.doMock('../Log', () => {
  return {
    __esmodule: false,
    logEvent: (logLevel, message) => {
      //we don't need the debug messages
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

describe('Test the crud functions at the top later for Groups', () => {
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

  it('checks the add and read function for groups', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups } = require('./Group');

    const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },];
    const testGroups = [
      { name: 'Test Group 1', id: '1', roles: ['1', '2'] },
      { name: 'Test Group 2', id: '2', roles: ['1', '3'] },
      { name: 'Test Group 3', id: '3', roles: ['2', '3'] },
    ];

    //Verify the roles are present
    let testRole = await addRoles(testRoles);
    testRole = await getRoles();
    expect(testRole.length).toBe(3);

    //Add a single group
    let testGroup = await addGroups(testGroups[0]);
    expect(testGroup.length).toBe(1);
    expect(testGroup[0].name).toBe(testGroups[0].name);

    //Add an array
    testGroup = await addGroups([testGroups[1], testGroups[2]]);
    expect(testGroup.length).toBe(2);
    expect(testGroup[0].name).toBe(testGroups[1].name);
    expect(testGroup[1].name).toBe(testGroups[2].name);

    //Attempt to add a duplicate group
    testGroup = await addGroups(testGroups[0]);
    expect(testGroup.length).toBe(1);
    expect(testGroup[0]).toBeUndefined();

    //Add a group with an invalid role, should fail to add the group
    testGroup = await addGroups({ name: 'Invalid Role Group 1', id: 4, roles: ['4'] })
    expect(testGroup.length).toBe(0);
    expect(testGroup[0]).toBeUndefined();

    //Confirm the role is not present in the database
    testGroup = await getGroups({ id: 4 });
    expect(testGroup.length).toBe(1);
    expect(testGroup[0]).toBeUndefined();
  });

  it('checks the update function of groups', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups, updateGroups } = require('./Group');

    const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },];
    const testGroups = [
      { name: 'Test Group 1', id: '1', roles: ['1', '2'] },
      { name: 'Test Group 2', id: '2', roles: ['1', '3'] },
      { name: 'Test Group 3', id: '3', roles: ['2', '3'] },
    ];

    await addRoles(testRoles);
    await addGroups(testGroups);

    //Add the test roles
    let testRole = await getRoles();
    expect(testRole.length).toBe(3);

    //Add the test groups
    let testGroup = await getGroups();
    expect(testGroup.length).toBe(3);

    //Update a group
    testGroup = await updateGroups({ name: 'Test Group 1' }, { name: 'New Group 1' });
    //Verify only changed info was updated.
    expect(testGroup.length).toBe(1);
    expect(testGroup[0].name).toBe('New Group 1');

    testGroup = await getGroups({ name: 'New Group 1' });
    expect(testGroup.length).toBe(1);
    expect(testGroup[0].name).toBe('New Group 1');
    expect(testGroup[0].id).toBe('1');
    expect(testGroup[0].roles.length).toBe(2);
    expect(testGroup[0].roles).toContain('1');
    expect(testGroup[0].roles).toContain('2');

    //Update the roles of a group, verify the return
    testGroup = await updateGroups([testGroups[1], testGroups[2]], [{ name: 'New Group 2' }, { name: 'New Group 3' }]);
    expect(testGroup.length).toBe(2);
    expect(testGroup[0].name).toBe('New Group 2');

    expect(testGroup[1].name).toBe('New Group 3');

    //Verify the data was changed in the database
    testGroup = await getGroups([{ name: 'New Group 2' }, { name: 'New Group 3' }]);
    expect(testGroup.length).toBe(2);
    expect(testGroup[0]).toBeDefined();
    expect(testGroup[0].name).toBe('New Group 2');
    expect(testGroup[0].id).toBe('2');
    expect(testGroup[0].roles.length).toBe(2);
    expect(testGroup[0].roles).toContain('1');
    expect(testGroup[0].roles).toContain('3');

    expect(testGroup[1]).toBeDefined();
    expect(testGroup[1].name).toBe('New Group 3');
    expect(testGroup[1].id).toBe('3');
    expect(testGroup[1].roles.length).toBe(2);
    expect(testGroup[1].roles).toContain('2');
    expect(testGroup[1].roles).toContain('3');

    //Attempt to update roles, invalid roles should not be added
    testGroup = await updateGroups({ name: 'New Group 1' }, { roles: ['1', '2', '3'] });
    expect(testGroup.length).toBe(1);
    expect(testGroup[0]).toBeDefined();
    expect(testGroup[0].roles.length).toBe(3);
    expect(testGroup[0].roles).toContain('1');
    expect(testGroup[0].roles).toContain('2');
    expect(testGroup[0].roles).toContain('3');

  });

  it('checks the remove function for groups', async () => {
    const { getRoles, addRoles } = require('./Role');
    const { getGroups, addGroups, removeGroups } = require('./Group');

    const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },];
    const testGroups = [
      { name: 'Test Group 1', id: 1, roles: ['1', '2'] },
      { name: 'Test Group 2', id: 2, roles: ['1', '3'] },
      { name: 'Test Group 3', id: 3, roles: ['2', '3'] },
    ];

    //Set up the database
    await addRoles(testRoles);
    await addGroups(testGroups);

    let testRole = await getRoles();
    let testGroup = await getGroups();

    //Check the database was built
    expect(testRole.length).toBe(3);
    expect(testGroup.length).toBe(3);

    //Remove an invalid role
    testGroup = await removeGroups({ name: 'Invalid Group 1' });
    expect(testGroup.length).toBe(0);

    //validate the groups were removed
    testGroup = await removeGroups({ name: 'Test Group 1' });
    expect(testGroup.length).toBe(1);
    expect(testGroup[0].name).toBe('Test Group 1');
    testGroup = await getGroups({ name: 'Test Group 1' });
    expect(testGroup.length).toBe(1);
    expect(testGroup[0]).toBeUndefined();

    //Bulk removal
    testGroup = await removeGroups([{ name: testGroups[1].name }, { id: testGroups[2].id }]);
    expect(testGroup.length).toBe(2);
    expect(testGroup[0].name).toBe(testGroups[1].name);
    expect(testGroup[1].id).toBe(testGroups[2].id);
    testGroup = await getGroups();
    expect(testGroup.length).toBe(0);
  });

  it('checks to cascade removal of roles', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups, removeGroups } = require('./Group');
    const { getUsers, addUsers } = require('./User');

    const testRoles = [{ name: 'Test Role 1', id: '1' }, { name: 'Test Role 2', id: '2' }, { name: 'Test Role 3', id: '3' },];
    const testGroups = [
      { name: 'Test Group 1', id: '1', roles: ['1', '2'] },
      { name: 'Test Group 2', id: '2', roles: ['1', '3'] },
      { name: 'Test Group 3', id: '3', roles: ['2', '3'] },
    ];
    const testUsers = [
      { name: 'Test User 1', password: 'password', email: 'TestUser1@email.com', preferences: {}, roles: ['1'], groups: ['1', '2'], id: '1', active: true, changePassword: true },
      { name: 'Test User 2', password: 'password', email: 'TestUser2@email.com', preferences: {}, roles: ['2'], groups: ['1', '3'], id: '2', active: true, changePassword: true },
      { name: 'Test User 3', password: 'password', email: 'TestUser3@email.com', preferences: {}, roles: ['3'], groups: ['2', '3'], id: '3', active: true, changePassword: true },
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

    //Remove the group, and check if the user has it afterwards
    testGroup = await removeGroups({ id: '1' });
    expect(testGroup.length).toBe(1);
    testGroup = await getGroups({ id: '1'});
    expect(testGroup.length).toBe(1);
    expect(testGroup[0]).toBeUndefined();
    //Check the users
    testUser = await getUsers({ name: 'Test User 1'});
    expect(testUser.length).toBe(1);
    expect(testUser[0].name).toBe('Test User 1');
    expect(testUser[0].id).toBe('1');
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].groups.length).toBe(1);
    expect(testUser[0].groups).not.toContain('1');
    expect(testUser[0].groups).toContain('2');
    testUser = await getUsers({ name: 'Test User 2'});
    expect(testUser.length).toBe(1);
    expect(testUser[0].name).toBe('Test User 2');
    expect(testUser[0].id).toBe('2');
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].groups.length).toBe(1);
    expect(testUser[0].groups).not.toContain('1');
    expect(testUser[0].groups).toContain('3');
    testUser = await getUsers({ name: 'Test User 3'});
    expect(testUser.length).toBe(1);
    expect(testUser[0].name).toBe('Test User 3');
    expect(testUser[0].id).toBe('3');
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].groups.length).toBe(2);
    expect(testUser[0].groups).not.toContain('1');
    expect(testUser[0].groups).toContain('2');
    expect(testUser[0].groups).toContain('3');
  });
});