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

let mockUUID = 0;
jest.doMock('uuid', () => {
    return {
        __esmodule: false,
        v4: () => { mockUUID++; return mockUUID; },
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


describe('Tests for the crud functions, object ids are created at this layer, and accepts batch writes', () => {
    beforeEach(async () => {
        const { initDatabase, closeConnection } = require('./db');
        jest.resetModules();
        jest.resetAllMocks();

        await initDatabase();
        await closeConnection();
    });

    afterEach(async () => {
        const { closeConnection } = require('./db');

        await closeConnection();
    });

    it('tests the functions of add and get objects for roles', async () => {
        const { addObjects, getObjects } = require('./CRUD');
        //Verify the writes
        const testRoles = [{ name: 'Test Role 1' }, { name: 'Test Role 2' }, { name: 'Test Role 3' },];
        let testRole = await addObjects('role', testRoles[0]);
        expect(testRole[0]).toBeDefined();
        console.log('testRole', testRole);

        expect(testRole[0].name).toBe(testRoles[0].name);
        expect(testRole[0].id).toBe(1);

        testRole = await addObjects('role', [testRoles[1], testRoles[2]]);
        expect(testRole.length).toBe(2);
        expect(testRole[0].name).toBe(testRoles[1].name);
        expect(testRole[0].id).toBe(2);
        expect(testRole[1].name).toBe(testRoles[2].name);
        expect(testRole[1].id).toBe(3);

        //Now verify with reads, single
        testRole = await getObjects('role', { name: 'Test Role 1' });
        expect(Array.isArray(testRole)).toBeTruthy();
        expect(testRole.length).toBe(1);
        expect(testRole[0].name).toBe(testRoles[0].name);
        expect(testRole[0].id).toBe(1);

        //Multiple reads
        testRole = await getObjects('role', [{ name: 'Test Role 1' }, { name: 'Test Role 2' }, { name: 'Test Role 3' }]);
        expect(testRole.length).toBe(3);
        expect(testRole[0].name).toBe(testRoles[0].name);
        expect(testRole[0].id).toBe(1);
        expect(testRole[1].name).toBe(testRoles[1].name);
        expect(testRole[1].id).toBe(2);
        expect(testRole[2].name).toBe(testRoles[2].name);
        expect(testRole[2].id).toBe(3);

        //Get all the roles
        testRole = await getObjects('role');
        expect(testRole.length).toBe(3);
        expect(testRole[0].name).toBe(testRoles[0].name);
        expect(testRole[0].id).toBe(1);
        expect(testRole[1].name).toBe(testRoles[1].name);
        expect(testRole[1].id).toBe(2);
        expect(testRole[2].name).toBe(testRoles[2].name);
        expect(testRole[2].id).toBe(3);

        testRole = await getObjects('role', { name: 'Test Role 4' })
        expect(testRole.length).toBe(1);
    });

    if ('tests the function of update object with roles', async () => {
        const { getObjects, addObjects, updateObjects } = require('./CRUD');
        const testRoles = [{ name: 'Test Role 1' }, { name: 'Test Role 2' }, { name: 'Test Role 3' },];

        await addObjects('role', testRoles);
        let testRole = await getObjects('role');

        expect(testRole.length).toBe(3);
        expect(testRole[0]).toBeDefined();
        expect(testRole[1]).toBeDefined();
        expect(testRole[2]).toBeDefined();

        await updateObjects('role', testRoles[0], { name: 'New Role 1' });
        await updateObjects('role',
            [{ name: testRoles[1].name }, { name: testRole[2].name }],
            [{ name: 'New Role 2' }, { name: 'New Role 3' }]
        );

        testRole = await getObjects('role');
        expect(testRole.length).toBe(3);
        expect(testRole[0].name).toBe('New Role 1');
        expect(testRole[1].name).toBe('New Role 2');
        expect(testRole[2].name).toBe('New Role 3');
    });

    it('tests the function of remove objects with roles', async () => {
        const { getObjects, addObjects, removeObjects } = require('./CRUD');
        const testRoles = [{ name: 'Test Role 1' }, { name: 'Test Role 2' }, { name: 'Test Role 3' },];

        await addObjects('role', testRoles);
        let testRole = await getObjects('role');

        expect(testRole.length).toBe(3);
        expect(testRole[0]).toBeDefined();
        expect(testRole[1]).toBeDefined();
        expect(testRole[2]).toBeDefined();

        testRole = await removeObjects('role', testRoles[0]);
        expect(testRole.length).toBe(1);
        expect(testRole[0].name).toBe('Test Role 1');
        testRole = await removeObjects('role', [testRoles[1], testRoles[2]]);
        expect(testRole.length).toBe(2);
        expect(testRole[0].name).toBe('Test Role 2');
        expect(testRole[1].name).toBe('Test Role 3');

        testRole = await getObjects('role');

        expect(testRole.length).toBe(0);
    });
});