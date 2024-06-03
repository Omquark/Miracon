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
//TODO: This runs off the live db, setup a test db MemoryMongoServer package should be used?
describe('Test the crud functions with MongoDB', () => {
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

  it('Should clear and initialize the database with indexes', async () => {
    const { initDatabase, closeConnection } = require('./db');
    await initDatabase();
    await closeConnection();
  });

  it('adds and reads roles, not allowing adding the same role by id OR name', async () => {
    const { writeData, readData, } = require('./db');
    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },]

    //Test adding each role
    let testRole = await writeData('role', testRoles[0]);
    expect(testRole).toBe(true);
    testRole = await writeData('role', testRoles[1]);
    expect(testRole).toBe(true);
    testRole = await writeData('role', testRoles[2]);
    expect(testRole).toBe(true);

    //Make sure if we try to add a duplicate name or id, fail
    testRole = await writeData('role', testRoles[0]);
    expect(testRole).toBeFalsy();

    //Check roles are not added without an id OR name(id's are added at a different layer)
    testRole = await writeData('role', { name: 'Test Role 4' });
    expect(testRole).toBeFalsy();
    testRole = await writeData('role', { id: 4 });
    expect(testRole).toBeFalsy();

    //Try to read the roles with ids and names
    testRole = await readData('role', { id: 1 });
    expect(testRole.id).toEqual(testRoles[0].id);
    expect(testRole.name).toEqual(testRoles[0].name);
    testRole = await readData('role', { id: 2 });
    expect(testRole.id).toEqual(testRoles[1].id);
    expect(testRole.name).toEqual(testRoles[1].name);
    testRole = await readData('role', { id: 3 });
    expect(testRole.id).toEqual(testRoles[2].id);
    expect(testRole.name).toEqual(testRoles[2].name);

    //Make sure info is pulled with only name
    testRole = await readData('role', { name: 'Test Role 1' });
    expect(testRole.id).toEqual(testRoles[0].id);
    expect(testRole.name).toEqual(testRoles[0].name);
    testRole = await readData('role', { name: 'Test Role 2' });
    expect(testRole.id).toEqual(testRoles[1].id);
    expect(testRole.name).toEqual(testRoles[1].name);
    testRole = await readData('role', { name: 'Test Role 3' });
    expect(testRole.id).toEqual(testRoles[2].id);
    expect(testRole.name).toEqual(testRoles[2].name);

    //Attempt to read the role with an id and a name, and make sure we pull the same object
    testRole = await readData('role', { id: 3 });
    let otherRole = await readData('role', { name: 'Test Role 3' });
    expect(otherRole).toEqual(testRole);
    expect(otherRole).not.toBe(testRole);

  });

  it('adds and reads groups, not allowing the same group to be added by id OR name', async () => {
    const { writeData, readData, } = require('./db');

    const testGroups = [
      { name: 'Test Group 1', id: 1, roles: ['1'] },
      { name: 'Test Group 2', id: 2, roles: ['2'] },
      { name: 'Test Group 3', id: 3, roles: ['3'] },
    ];

    //Try adding each group
    let testGroup = await writeData('group', testGroups[0]);
    expect(testGroup).toBe(true);
    testGroup = await writeData('group', testGroups[1]);
    expect(testGroup).toBe(true);
    testGroup = await writeData('group', testGroups[2]);
    expect(testGroup).toBe(true);

    //Attempt to write duplicate
    testGroup = await writeData('group', testGroup[0]);
    expect(testGroup).toBeFalsy();

    //Fail if the id AND name is not given
    testGroup = await writeData('group', { name: 'Test Group 4' });
    expect(testGroup).toBeFalsy();
    testGroup = await writeData('group', { id: 4 });
    expect(testGroup).toBeFalsy();

    //Attempt to read with only the name or id
    testGroup = await readData('group', { name: 'Test Group 1' });
    expect(testGroup.id).toEqual(testGroups[0].id);
    expect(testGroup.name).toEqual(testGroups[0].name);
    expect(testGroup.roles).toEqual(testGroups[0].roles);
    testGroup = await readData('group', { id: 2 });
    expect(testGroup.id).toEqual(testGroups[1].id);
    expect(testGroup.name).toEqual(testGroups[1].name);
    expect(testGroup.roles).toEqual(testGroups[1].roles);

    //Don't pull by roles
    testGroup = await readData('group', { roles: ['1'] });
    expect(testGroup).toBeFalsy();

    //Attempt to pull the same group with a name and id individually, make sure we pull the same group
    testGroup = await readData('group', { id: 1 });
    let otherGroup = await readData('group', { name: 'Test Group 1' });
    expect(otherGroup).toEqual(testGroup);
    expect(otherGroup).not.toBe(testGroup);
  });

  it('adds and reads users, not allowing to add without a name OR id', async () => {
    const { readData, writeData } = require('./db');
    const testUsers = [
      { name: 'Test User 1', id: 1, email: 'testuser1@email.com', roles: ['1', '2'], groups: ['1', '2'] },
      { name: 'Test User 2', id: 2, email: 'testuser2@email.com', roles: ['1', '3'], groups: ['1', '3'] },
      { name: 'Test User 3', id: 3, email: 'testuser3@email.com', roles: ['2', '3'], groups: ['2', '3'] },
    ]

    //Add each user
    let testUser = await writeData('user', testUsers[0]);
    expect(testUser).toBe(true);
    testUser = await writeData('user', testUsers[1]);
    expect(testUser).toBe(true);
    testUser = await writeData('user', testUsers[2]);
    expect(testUser).toBe(true);

    //Attempt writing a duplicate
    testUser = await writeData('user', testUsers[0]);
    expect(testUser).toBeFalsy();

    //Fail write if id AND name is not given
    testUser = await writeData('user', { name: 'Test User 4' });
    expect(testUser).toBeFalsy();
    testUser = await writeData('user', { id: 4 });
    expect(testUser).toBeFalsy();

    //Attempt to read with only an id or name
    testUser = await readData('user', { name: 'Test User 1' });
    expect(testUser.name).toEqual(testUsers[0].name);
    expect(testUser.id).toEqual(testUsers[0].id);
    expect(testUser.roles).toEqual(testUsers[0].roles);
    expect(testUser.groups).toEqual(testUsers[0].groups);
    testUser = await readData('user', { id: 2 });
    expect(testUser.name).toEqual(testUsers[1].name);
    expect(testUser.id).toEqual(testUsers[1].id);
    expect(testUser.roles).toEqual(testUsers[1].roles);
    expect(testUser.groups).toEqual(testUsers[1].groups);

    //Don't pull by groups or roles
    testUser = await readData('user', { roles: ['1', '2'] });
    expect(testUser).toBeFalsy();
    testUser = await readData('user', { groups: ['1', '2'] });
    expect(testUser).toBeFalsy();

    //Pull the same group by it's id and name individually, make sure the same user is pulled
    testUser = await readData('user', { name: 'Test User 1' });
    let otherUser = await readData('user', { id: 1 });
    expect(otherUser).toEqual(testUser);
    expect(otherUser).not.toBe(testUser);
  });
});