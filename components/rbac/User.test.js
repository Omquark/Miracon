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

describe('Test the crud functions at the top later for Users', () => {
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

  it('Test the add and get functions for users', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups } = require('./Group');
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

    let testRole = await getRoles();
    expect(testRole.length).toBe(3);
    let testGroup = await getGroups();
    expect(testGroup.length).toBe(3);

    //Add the user
    let testUser = await addUsers(testUsers[0]);
    expect(testUser.length).toBe(1);
    expect(testUser[0].name).toBe(testUsers[0].name);
    expect(testUser[0].id).toBe(testUsers[0].id);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles[0]).toBe('1');
    expect(testUser[0].groups.length).toBe(2);
    expect(testUser[0].groups[0]).toBe('1');
    expect(testUser[0].groups[1]).toBe('2');

    //Check the user was added
    testUser = await getUsers(testUsers[0]);
    expect(testUser.length).toBe(1);
    expect(testUser[0].name).toBe(testUsers[0].name);
    expect(testUser[0].id).toBe(testUsers[0].id);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles).toContain('1');
    expect(testUser[0].groups.length).toBe(2);
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('2');

    testUser = await addUsers([testUsers[1], testUsers[2]]);
    expect(testUser.length).toBe(2);
    expect(testUser[0].name).toBe(testUsers[1].name);
    expect(testUser[0].id).toBe(testUsers[1].id);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles).toContain('2');
    expect(testUser[0].groups.length).toBe(2);
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('3');
    expect(testUser[1].name).toBe(testUsers[2].name);
    expect(testUser[1].id).toBe(testUsers[2].id);
    expect(testUser[1].roles.length).toBe(1);
    expect(testUser[1].roles).toContain('3');
    expect(testUser[1].groups.length).toBe(2);
    expect(testUser[1].groups).toContain('2');
    expect(testUser[1].groups).toContain('3');

    testUser = await getUsers([testUsers[1], testUsers[2]]);
    expect(testUser.length).toBe(2);
    expect(testUser[0].name).toBe(testUsers[1].name);
    expect(testUser[0].id).toBe(testUsers[1].id);
    expect(testUser[0].roles.length).toBe(1);
    expect(testUser[0].roles).toContain('2');
    expect(testUser[0].groups.length).toBe(2);
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('3');
    expect(testUser[1].name).toBe(testUsers[2].name);
    expect(testUser[1].id).toBe(testUsers[2].id);
    expect(testUser[1].roles.length).toBe(1);
    expect(testUser[1].roles).toContain('3');
    expect(testUser[1].groups.length).toBe(2);
    expect(testUser[1].groups).toContain('2');
    expect(testUser[1].groups).toContain('3');

  });

  it('Test the update function for users', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups } = require('./Group');
    const { getUsers, addUsers, updateUsers } = require('./User');

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

    //Verify set up
    expect(testRole.length).toBe(3);
    expect(testGroup.length).toBe(3);
    expect(testUser.length).toBe(3);

    //Now update and check
    testUser = await updateUsers({ name: 'Test User 1' }, { name: 'New User 1' });
    expect(testUser.length).toBe(1);
    expect(testUser[0]).toBeDefined();
    expect(testUser[0].name).toBe('New User 1');
    testUser = await getUsers({ name: 'Test User 1' });
    expect(testUser.length).toBe(1);
    expect(testUser[0]).toBeUndefined();
    testUser = await getUsers({ name: 'New User 1' });
    expect(testUser.length).toBe(1);
    expect(testUser[0]).toBeDefined();
    expect(testUser[0].name).toBe('New User 1');
    expect(testUser[0].id).toBe('1');
    expect(testUser[0].roles).toContain('1');
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('2');

    //Bulk Update
    testUser = await updateUsers([{ name: 'Test User 2' }, { name: 'Test User 3' }], [{ name: 'New User 2' }, { name: 'New User 3' }]);
    expect(testUser.length).toBe(2);
    expect(testUser[0]).toBeDefined();
    expect(testUser[0].name).toBe('New User 2');
    expect(testUser[1].name).toBe('New User 3')
    testUser = await getUsers([{ name: 'Test User 2' }, { name: 'Test User 3' }]);
    expect(testUser.length).toBe(2);
    expect(testUser[0]).toBeUndefined();
    expect(testUser[1]).toBeUndefined();
    testUser = await getUsers([{ name: 'New User 2' }, { name: 'New User 3' }]);
    expect(testUser.length).toBe(2);
    expect(testUser[0]).toBeDefined();
    expect(testUser[0].name).toBe('New User 2');
    expect(testUser[0].id).toBe('2');
    expect(testUser[0].roles).toContain('2');
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('3');
    expect(testUser[1]).toBeDefined();
    expect(testUser[1].name).toBe('New User 3');
    expect(testUser[1].id).toBe('3');
    expect(testUser[1].roles).toContain('3');
    expect(testUser[1].groups).toContain('2');
    expect(testUser[1].groups).toContain('3');

    //Attempt to update to a conflict
    testUser = await updateUsers({ name: 'New User 1' }, { name: 'New User 2' });
    expect(testUser.length).toBe(0);

    //Attempt to update each property of a user
    //Password
    let changedUser = await getUsers({ name: 'New User 1' });
    changedUser[0].password = 'New Password';
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].password).toBe('New Password');
    //Email
    changedUser[0].email = 'New Email';
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].email).toBe('New Email');
    //Preferences
    changedUser[0].preferences = { ...changedUser.preferences, darkMode: true };
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].preferences.darkMode).toBe(true);
    //Roles
    changedUser[0].roles = [...changedUser[0].roles, '3'];
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].roles.length).toBe(2);
    expect(testUser[0].roles).toContain('1');
    expect(testUser[0].roles).toContain('3');
    //Groups
    changedUser[0].groups = [...changedUser[0].groups, '3'];
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].groups.length).toBe(3);
    expect(testUser[0].groups).toContain('1');
    expect(testUser[0].groups).toContain('2');
    expect(testUser[0].groups).toContain('3');
    //active
    changedUser[0].active = false;
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].active).toBe(false);
    //change password
    changedUser[0].changePassword = false;
    await updateUsers(changedUser, changedUser);
    testUser = await getUsers(changedUser);
    expect(testUser[0].changePassword).toBe(false);
    //id, shouldn't change
    await updateUsers({ id: '2' }, { id: '5' });
    testUser = await getUsers({ id: '5' });
    expect(testUser.length).toBe(1);
    expect(testUser[0]).toBeUndefined();

  });

  it('Test the remove functions for users', async () => {
    const { getRoles, addRoles, } = require('./Role');
    const { getGroups, addGroups, } = require('./Group');
    const { getUsers, addUsers, removeUsers } = require('./User');

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

    expect(testRole.length).toBe(3)
    expect(testGroup.length).toBe(3)
    expect(testUser.length).toBe(3)

    testUser = await removeUsers({ id: '1' });
    expect(testUser.length).toBe(1);
    expect(testUser[0].id).toBe('1');

    testUser = await getUsers({ id: '1' });
    expect(testUser.length).toBe(1);
    expect(testUser[0]).toBeUndefined();

    testUser = await removeUsers({ id: '5' });
    expect(testUser.length).toBe(0);

    testUser = await removeUsers([{ name: 'Test User 2' }, { id: '3' }]);
    expect(testUser.length).toBe(2);
    expect(testUser[0].name).toBe('Test User 2');
    expect(testUser[1].id).toBe('3');

    testUser = await getUsers();
    expect(testUser.length).toBe(0);
  });
});