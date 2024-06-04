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
describe('Test the CRUD functions with roles and MongoDB', () => {
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
    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },];

    //Test adding each role
    let testRole = await writeData('role', testRoles[0]);
    expect(testRole).toBe(true);
    //Batch insert
    testRole = await writeData('role', testRoles[1]);
    expect(testRole).toBe(true);
    testRole = await writeData('role', testRoles[2]);
    expect(testRole).toBe(true);
    testRole = await writeData('role', testRoles[2]);
    expect(testRole).toBeFalsy();

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

  it('Updates roles that have been already inserted into the database, should not update the ids', async () => {
    const { writeData, readData, updateData } = require('./db');
    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },]

    //Write the data, no need to test becuase this is for update
    await writeData('role', testRoles[0]);
    await writeData('role', testRoles[1]);
    await writeData('role', testRoles[2]);

    //verify the objects exist, check just the first one
    let testRole = await readData('role', { id: 1 });
    expect(testRole.id).toBe(testRoles[0].id);
    expect(testRole.name).toBe(testRoles[0].name);

    //Update the name
    testRole = await updateData('role', { id: 1 }, { id: 1, name: 'New Test Role 1' });
    expect(testRole).toBe(true);
    testRole = await readData('role', { id: 1 });
    expect(testRole.name).toBe('New Test Role 1');
    expect(testRole.id).toBe(1);
    //Update the name and id, but we expect the id to stay the same
    testRole = await updateData('role', { id: 1 }, { id: 4, name: 'Old Test Role 1' });
    expect(testRole).toBe(true);
    testRole = await readData('role', { name: 'Old Test Role 1' });
    expect(testRole.name).toBe('Old Test Role 1');
    expect(testRole.id).not.toBe(4);
  });

  it('removes roles that are in the database', async () => {
    const { readData, writeData, removeData } = require('./db');

    const testRoles = [{ name: 'Test Role 1', id: 1 }, { name: 'Test Role 2', id: 2 }, { name: 'Test Role 3', id: 3 },]

    await writeData('role', testRoles[0]);
    await writeData('role', testRoles[1]);
    await writeData('role', testRoles[2]);

    let testRole = await readData('role', { id: 1 });
    expect(testRole.name).toBe(testRoles[0].name);
    expect(testRole.id).toBe(1);

    testRole = await removeData('role', { id: 1 });
    expect(testRole).toBe(true);

    testRole = await readData('role', { id: 1 });
    expect(testRole).toBeUndefined();
  });
});