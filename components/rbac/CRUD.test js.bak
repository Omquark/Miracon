jest.doMock('../Log', () => {
    return {
        __esmodule: false,
        logEvent: (logLevel, message) => {
            //we don't need the debug messages
            if(logLevel.level > 0) console.log(`${logLevel.name} ${message}`);
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

jest.doMock('./RoleDefs', () => {
    return {
        Role: { name: 'Role', id: 0 },
        Group: { name: 'Group', id: 0 },
        User: { name: 'User', id: 0 },
        Roles: [{ name: 'Role', id: 0 }],
        Groups: [{ name: 'Group', id: 0 }],
        Users: [{ name: 'User', id: 0 }],
    }
});

//Tests addObjects with all three arrays(Roles, Groups, and Users)
//This does not validate foreign keys, only conflicts in name and id
describe('Test the addObjects functions with each object, and invalid inputs as applicable', () => {


    beforeEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });


    it('Console log should show invalid object with no name attempted to be added to each array', () => {
        const { addObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        const testRole = { id: 1 };
        const testGroup = { id: 1 };
        const testUser = { id: 1 };

        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        expect(spy).toHaveBeenCalledTimes(9);
        let type = 'role';
        let testString = `INFO Attempting to add ${type}s to the master list.`;
        expect(spy).toHaveBeenNthCalledWith(1, testString);
        testString = `WARN Attempted to add ${type} with no name given! Names are required to add the ${type}.`;
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        testString = `WARN Name the ${type} and try again.`;
        expect(spy).toHaveBeenNthCalledWith(3, testString);

        type = 'group';
        testString = `INFO Attempting to add ${type}s to the master list.`;
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        testString = `WARN Attempted to add ${type} with no name given! Names are required to add the ${type}.`;
        expect(spy).toHaveBeenNthCalledWith(5, testString);
        testString = `WARN Name the ${type} and try again.`;
        expect(spy).toHaveBeenNthCalledWith(6, testString);

        type = 'user';
        testString = `INFO Attempting to add ${type}s to the master list.`;
        expect(spy).toHaveBeenNthCalledWith(7, testString);
        testString = `WARN Attempted to add ${type} with no name given! Names are required to add the ${type}.`;
        expect(spy).toHaveBeenNthCalledWith(8, testString);
        testString = `WARN Name the ${type} and try again.`;
        expect(spy).toHaveBeenNthCalledWith(9, testString);

        spy.mockClear();
    });

    it('Console log should show added object, with corresponding type, as an INFO log', () => {
        const { addObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        const testRole = { name: 'Test Role' };
        const testGroup = { name: 'Test Group' };
        const testUser = { name: 'Test User' };
        let testString = '';
        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        expect(spy).toHaveBeenCalledTimes(6);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to add roles to the master list.');
        testString = 'INFO Successfully added role ' + JSON.stringify(testRole);
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        expect(spy).toHaveBeenNthCalledWith(3, 'INFO Attempting to add groups to the master list.');
        testString = 'INFO Successfully added group ' + JSON.stringify(testGroup);
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        expect(spy).toHaveBeenNthCalledWith(5, 'INFO Attempting to add users to the master list.');
        testString = 'INFO Successfully added user ' + JSON.stringify(testUser);
        expect(spy).toHaveBeenNthCalledWith(6, testString);
        spy.mockClear();
    });

    it('Console should show multiple adds for each object in the passed array', () => {
        const { addObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        const testRole = [{ name: 'Test Role 1' }, { name: 'Test Role 2' }, { name: 'test Role 3' }];
        const testGroup = [{ name: 'Test Group 1' }, { name: 'Test Group 2' }, { name: 'test Group 3' }];
        const testUser = [{ name: 'Test User 1' }, { name: 'Test User 2' }, { name: 'test User 3' }];
        let testString;
        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        testString = 'INFO Successfully added role' + JSON.stringify(testRole[0]);
        expect(spy).toHaveBeenCalledTimes(12);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to add roles to the master list.');
        testString = 'INFO Successfully added role ' + JSON.stringify(testRole[0]);
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        testString = 'INFO Successfully added role ' + JSON.stringify(testRole[1]);
        expect(spy).toHaveBeenNthCalledWith(3, testString);
        testString = 'INFO Successfully added role ' + JSON.stringify(testRole[2]);
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        expect(spy).toHaveBeenNthCalledWith(5, 'INFO Attempting to add groups to the master list.');
        testString = 'INFO Successfully added group ' + JSON.stringify(testGroup[0]);
        expect(spy).toHaveBeenNthCalledWith(6, testString);
        testString = 'INFO Successfully added group ' + JSON.stringify(testGroup[1]);
        expect(spy).toHaveBeenNthCalledWith(7, testString);
        testString = 'INFO Successfully added group ' + JSON.stringify(testGroup[2]);
        expect(spy).toHaveBeenNthCalledWith(8, testString);
        expect(spy).toHaveBeenNthCalledWith(9, 'INFO Attempting to add users to the master list.');
        testString = 'INFO Successfully added user ' + JSON.stringify(testUser[0]);
        expect(spy).toHaveBeenNthCalledWith(10, testString);
        testString = 'INFO Successfully added user ' + JSON.stringify(testUser[1]);
        expect(spy).toHaveBeenNthCalledWith(11, testString);
        testString = 'INFO Successfully added user ' + JSON.stringify(testUser[2]);
        expect(spy).toHaveBeenNthCalledWith(12, testString);
        spy.mockClear();
    });

    //Shuffles the name and id to match an already existing, testing both individually and together.
    //This tests singular values.
    it('Console should show object already exists on the second addition', () => {
        const { addObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        let testRole = { name: 'Test Role' };
        let testGroup = { name: 'Test Group' };
        let testUser = { name: 'Test User' };
        let testString = '';
        addObjects('role', testRole);
        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        addObjects('user', testUser);
        expect(spy).toHaveBeenCalledTimes(12);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to add roles to the master list.');
        testString = 'INFO Successfully added role ' + JSON.stringify(testRole);
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        expect(spy).toHaveBeenNthCalledWith(3, 'INFO Attempting to add roles to the master list.');
        testString = 'WARN role ' + JSON.stringify(testRole) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        expect(spy).toHaveBeenNthCalledWith(5, 'INFO Attempting to add groups to the master list.');
        testString = 'INFO Successfully added group ' + JSON.stringify(testGroup);
        expect(spy).toHaveBeenNthCalledWith(6, testString);
        expect(spy).toHaveBeenNthCalledWith(7, 'INFO Attempting to add groups to the master list.');
        testString = 'WARN group ' + JSON.stringify(testGroup) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(8, testString);
        expect(spy).toHaveBeenNthCalledWith(9, 'INFO Attempting to add users to the master list.');
        testString = 'INFO Successfully added user ' + JSON.stringify(testUser);
        expect(spy).toHaveBeenNthCalledWith(10, testString);
        expect(spy).toHaveBeenNthCalledWith(11, 'INFO Attempting to add users to the master list.');
        testString = 'WARN user ' + JSON.stringify(testUser) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(12, testString);
        spy.mockClear();
    });

    it('Console should show object already exists with both adds, due to name and id.', () => {
        const { addObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        let testRole = { name: 'Test Role 100', id: 0 };
        let testGroup = { name: 'Test Group 100', id: 0 };
        let testUser = { name: 'Test User 100', id: 0 };

        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        expect(spy).toHaveBeenCalledTimes(6);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to add roles to the master list.');
        testString = 'WARN role ' + JSON.stringify(testRole) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        expect(spy).toHaveBeenNthCalledWith(3, 'INFO Attempting to add groups to the master list.');
        testString = 'WARN group ' + JSON.stringify(testGroup) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        expect(spy).toHaveBeenNthCalledWith(5, 'INFO Attempting to add users to the master list.');
        testString = 'WARN user ' + JSON.stringify(testUser) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(6, testString);
        spy.mockClear();

        testRole = { name: 'Role', id: 100 };
        testGroup = { name: 'Group', id: 100 };
        testUser = { name: 'User', id: 100 };

        addObjects('role', testRole);
        addObjects('group', testGroup);
        addObjects('user', testUser);
        expect(spy).toHaveBeenCalledTimes(6);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to add roles to the master list.');
        testString = 'WARN role ' + JSON.stringify(testRole) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(2, testString);
        expect(spy).toHaveBeenNthCalledWith(3, 'INFO Attempting to add groups to the master list.');
        testString = 'WARN group ' + JSON.stringify(testGroup) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(4, testString);
        expect(spy).toHaveBeenNthCalledWith(5, 'INFO Attempting to add users to the master list.');
        testString = 'WARN user ' + JSON.stringify(testUser) + ' already exists!';
        expect(spy).toHaveBeenNthCalledWith(6, testString);
        spy.mockClear();
    });
});

//Objects here will use the objects added in the previous test.
describe('Test the getObjects functions with each object, and invalid inputs as applicable', () => {

    beforeAll(() => {
    })

    beforeEach(() => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role', id: 0 },],
                Groups: [{ name: 'Group', id: 0 },],
                Users: [{ name: 'User', id: 0 },],
            }
        });
        jest.resetModules();
        jest.resetAllMocks();
    });

    test('Should show all objects from each table, and verify a deep copy', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role', id: 0 }, { name: 'Role 1', id: 1 },],
                Groups: [{ name: 'Group', id: 0 }, { name: 'Group 1', id: 1 },],
                Users: [{ name: 'User', id: 0 }, { name: 'User 1', id: 1 },],
            }
        });

        const { getObjects } = require('./CRUD');

        const testRoles = [{ name: 'Role', id: 0 }, { name: 'Role 1', id: 1 },];
        const testGroups = [{ name: 'Group', id: 0 }, { name: 'Group 1', id: 1 },];
        const testUsers = [{ name: 'User', id: 0 }, { name: 'User 1', id: 1 },];

        let pulledRoles = getObjects('role');
        let pulledGroups = getObjects('group');
        let pulledUsers = getObjects('user');

        expect(pulledRoles).toEqual(testRoles);
        expect(pulledGroups).toEqual(testGroups);
        expect(pulledUsers).toEqual(testUsers);

        pulledRoles[0].id = 1;
        pulledRoles[1].id = 2;
        pulledGroups[0].id = 1;
        pulledGroups[1].id = 2;
        pulledUsers[0].id = 1;
        pulledUsers[1].id = 2;

        pulledRoles = getObjects('role');
        pulledGroups = getObjects('group');
        pulledUsers = getObjects('user');

        expect(pulledRoles).toEqual(testRoles);
        expect(pulledGroups).toEqual(testGroups);
        expect(pulledUsers).toEqual(testUsers);

        jest.resetAllMocks();
    });

    test('Test getObjects to pull against ids, and verify we get a deep copy', () => {

        const { getObjects } = require('./CRUD');

        let testRole = getObjects('role', { id: 0 });
        let testGroup = getObjects('group', { id: 0 });
        let testUser = getObjects('user', { id: 0 });
        let otherRole;
        let otherGroup;
        let otherUser;

        expect(getObjects('role')).toEqual([{ name: 'Role', id: 0 }]);
        expect(testRole).toEqual([{ name: 'Role', id: 0 }]);
        testRole[0].id = 2;
        otherRole = getObjects('role', { id: 0 });
        expect(otherRole).toEqual([{ name: 'Role', id: 0 }]);
        expect(otherRole).not.toBe(testRole);
        expect(otherRole).not.toEqual(testRole);

        expect(testGroup).toEqual([{ name: 'Group', id: 0 }]);
        testGroup[0].id = 2;
        otherGroup = getObjects('group', { id: 0 });
        expect(otherGroup).toEqual([{ name: 'Group', id: 0 }]);
        expect(otherGroup).not.toBe(testGroup);
        expect(otherGroup).not.toEqual(testGroup);

        expect(testUser).toEqual([{ name: 'User', id: 0 }]);
        testUser[0].id = 2;
        otherUser = getObjects('user', { id: 0 });
        expect(otherUser).toEqual([{ name: 'User', id: 0 }]);
        expect(otherUser).not.toBe(testUser);
        expect(otherUser).not.toEqual(testUser);
    });
});

describe('Test the updateObjects function with each object and invalid inputs as applicable', () => {

    beforeEach(() => {
        jest.resetModules();
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('updateObjects single object with each array, should log the updated object', () => {
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        spy.mockClear(); //Otherwise it records all the console outputs from getObjects!
        updateObjects('role', { name: 'Role 1', id: 0 }, { name: 'Role Updated', });
        updateObjects('group', { name: 'Group 1', id: 0 }, { name: 'Group Updated', });
        updateObjects('user', { name: 'User 1', id: 0 }, { name: 'User Updated', });
        expect(spy).toHaveBeenCalledTimes(6);

        let type = 'role';
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to update ${type}`);
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Updating ${JSON.stringify({ name: 'Role 1', id: 0 })} to ${JSON.stringify({ name: 'Role Updated', id: 0 })}`);
        type = 'group';
        expect(spy).toHaveBeenNthCalledWith(3, `INFO Attempting to update ${type}`);
        expect(spy).toHaveBeenNthCalledWith(4, `INFO Updating ${JSON.stringify({ name: 'Group 1', id: 0 })} to ${JSON.stringify({ name: 'Group Updated', id: 0 })}`);
        type = 'user';
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Attempting to update ${type}`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Updating ${JSON.stringify({ name: 'User 1', id: 0 })} to ${JSON.stringify({ name: 'User Updated', id: 0 })}`);
        spy.mockClear();
    });

    it('updateObjects with object array to each array, should log each updated object.', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        const oldRoles = [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },];
        const newRoles = [{ name: 'Role 1 Updated', id: 0 }, { name: 'Role 2 Updated', id: 1 }];
        const oldGroups = [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },];
        const newGroups = [{ name: 'Group 1 Updated', id: 0 }, { name: 'Group 2 Updated', id: 1 }];
        const oldUsers = [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },];
        const newUsers = [{ name: 'User 1 Updated', id: 0 }, { name: 'User 2 Updated', id: 1 }];

        updateObjects('role', oldRoles, newRoles);
        updateObjects('group', oldGroups, newGroups);
        updateObjects('user', oldUsers, newUsers);

        expect(spy).toHaveBeenCalledTimes(9);
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to update role`);
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Updating ${JSON.stringify(oldRoles[0])} to ${JSON.stringify(newRoles[0])}`);
        expect(spy).toHaveBeenNthCalledWith(3, `INFO Updating ${JSON.stringify(oldRoles[1])} to ${JSON.stringify(newRoles[1])}`);
        expect(spy).toHaveBeenNthCalledWith(4, `INFO Attempting to update group`);
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Updating ${JSON.stringify(oldGroups[0])} to ${JSON.stringify(newGroups[0])}`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Updating ${JSON.stringify(oldGroups[1])} to ${JSON.stringify(newGroups[1])}`);
        expect(spy).toHaveBeenNthCalledWith(7, `INFO Attempting to update user`);
        expect(spy).toHaveBeenNthCalledWith(8, `INFO Updating ${JSON.stringify(oldUsers[0])} to ${JSON.stringify(newUsers[0])}`);
        expect(spy).toHaveBeenNthCalledWith(9, `INFO Updating ${JSON.stringify(oldUsers[1])} to ${JSON.stringify(newUsers[1])}`);
        spy.mockClear();
    });

    it('updateObjects with old objects larger than the new, should log each updated and skipped objects.', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        const oldRoles = [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },];
        const newRoles = [{ name: 'Role 1 Updated', id: 0 }];
        const oldGroups = [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },];
        const newGroups = [{ name: 'Group 1 Updated', id: 0 }];
        const oldUsers = [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },];
        const newUsers = [{ name: 'User 1 Updated', id: 0 }];

        updateObjects('role', oldRoles, newRoles);
        updateObjects('group', oldGroups, newGroups);
        updateObjects('user', oldUsers, newUsers);

        expect(spy).toHaveBeenCalledTimes(15);
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to update role`);
        expect(spy).toHaveBeenNthCalledWith(2, `WARN More old roles were passed than new ones! Will process all the new roles with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(3, `INFO These old roles will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(4, `INFO ${JSON.stringify({ name: 'Role 2', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Updating ${JSON.stringify(oldRoles[0])} to ${JSON.stringify(newRoles[0])}`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Attempting to update group`);
        expect(spy).toHaveBeenNthCalledWith(7, `WARN More old groups were passed than new ones! Will process all the new groups with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(8, `INFO These old groups will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(9, `INFO ${JSON.stringify({ name: 'Group 2', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(10, `INFO Updating ${JSON.stringify(oldGroups[0])} to ${JSON.stringify(newGroups[0])}`);
        expect(spy).toHaveBeenNthCalledWith(11, `INFO Attempting to update user`);
        expect(spy).toHaveBeenNthCalledWith(12, `WARN More old users were passed than new ones! Will process all the new users with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(13, `INFO These old users will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(14, `INFO ${JSON.stringify({ name: 'User 2', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(15, `INFO Updating ${JSON.stringify(oldUsers[0])} to ${JSON.stringify(newUsers[0])}`);
        spy.mockClear();
    });

    it('updateObjects with new objects larger than the old, should log each updated and skipped objects.', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');
        const oldRoles = [{ name: 'Role 1', id: 0 },];
        const newRoles = [{ name: 'Role 1 Updated', id: 0 }, { name: 'Role 2 Updated', id: 1 }];
        const oldGroups = [{ name: 'Group 1', id: 0 },];
        const newGroups = [{ name: 'Group 1 Updated', id: 0 }, { name: 'Group 2 Updated', id: 1 }];
        const oldUsers = [{ name: 'User 1', id: 0 },];
        const newUsers = [{ name: 'User 1 Updated', id: 0 }, { name: 'User 2 Updated', id: 1 }];

        updateObjects('role', oldRoles, newRoles);
        updateObjects('group', oldGroups, newGroups);
        updateObjects('user', oldUsers, newUsers);

        expect(spy).toHaveBeenCalledTimes(15);
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to update role`);
        expect(spy).toHaveBeenNthCalledWith(2, `WARN More new roles were passed than old ones! Will process all the old roles with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(3, `INFO These new roles will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(4, `INFO ${JSON.stringify({ name: 'Role 2 Updated', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Updating ${JSON.stringify(oldRoles[0])} to ${JSON.stringify(newRoles[0])}`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Attempting to update group`);
        expect(spy).toHaveBeenNthCalledWith(7, `WARN More new groups were passed than old ones! Will process all the old groups with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(8, `INFO These new groups will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(9, `INFO ${JSON.stringify({ name: 'Group 2 Updated', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(10, `INFO Updating ${JSON.stringify(oldGroups[0])} to ${JSON.stringify(newGroups[0])}`);
        expect(spy).toHaveBeenNthCalledWith(11, `INFO Attempting to update user`);
        expect(spy).toHaveBeenNthCalledWith(12, `WARN More new users were passed than old ones! Will process all the old users with their matches.`);
        expect(spy).toHaveBeenNthCalledWith(13, `INFO These new users will be ignored:`);
        expect(spy).toHaveBeenNthCalledWith(14, `INFO ${JSON.stringify({ name: 'User 2 Updated', id: 1 })}`);
        expect(spy).toHaveBeenNthCalledWith(15, `INFO Updating ${JSON.stringify(oldUsers[0])} to ${JSON.stringify(newUsers[0])}`);
        spy.mockClear();
    });

    it('updateObject to add a new field to any given object in an array, should show updated object in the log.', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        const oldRoles = [{ name: 'Role 1', id: 0, }];
        const newRoles = [{ newField: 'Test Field' }];

        const replacedRoles = updateObjects('role', oldRoles, newRoles);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to update role');
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Updating ${JSON.stringify(oldRoles[0])} to ${JSON.stringify(replacedRoles[0])}`);
        spy.mockClear();
    });

    it('updateObject to add a new field to any multiple objects in an array, should show updated object in the log.', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        const oldRoles = [{ name: 'Role 1', id: 0, }, { name: 'Role 2', id: 1, },];
        const newRoles = [{ newField: 'Test Field 1' }, { newField: 'Test Field 2' }];

        const replacedRoles = updateObjects('role', oldRoles, newRoles);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to update role');
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Updating ${JSON.stringify(oldRoles[0])} to ${JSON.stringify(replacedRoles[0])}`);
        expect(spy).toHaveBeenNthCalledWith(3, `INFO Updating ${JSON.stringify(oldRoles[1])} to ${JSON.stringify(replacedRoles[1])}`);
        spy.mockReset();
    });

    it('updateObject to attempt to add a new field without a name or id, should log a warning and the object', () => {
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
        const { updateObjects } = require('./CRUD');

        const spy = jest.spyOn(console, 'log');

        const oldRoles = [{ newField: 'Test Field 1' }, { newField: 'Test Field 2' }];
        const newRoles = [{ newField: 'Test Field 1' }, { newField: 'Test Field 2' }];

        const replacedRoles = updateObjects('role', oldRoles, newRoles);

        expect(spy).toHaveBeenCalledTimes(5);
        expect(spy).toHaveBeenNthCalledWith(1, 'INFO Attempting to update role');
        expect(spy).toHaveBeenNthCalledWith(2, `WARN Unable to find a match to an object for an update! Here's what I know: `);
        expect(spy).toHaveBeenNthCalledWith(3, `WARN oldObject: ${JSON.stringify(oldRoles[0])}`);
        expect(spy).toHaveBeenNthCalledWith(4, `WARN Unable to find a match to an object for an update! Here's what I know: `);
        expect(spy).toHaveBeenNthCalledWith(5, `WARN oldObject: ${JSON.stringify(oldRoles[1])}`);
        spy.mockClear();
    });

});

describe('Test the removeObjects function with each object and invalid inputs as applicable', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
        jest.doMock('./RoleDefs', () => {
            return {
                Roles: [{ name: 'Role 1', id: 0 }, { name: 'Role 2', id: 1 },],
                Groups: [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },],
                Users: [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },],
            }
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('removeObjects single object with each array, should log the updated object', () => {
        const { removeObjects } = require('./CRUD');

        const removedRoles = { name: 'Role 1', id: 0 };
        const removedGroups = { name: 'Group 1', id: 0 };
        const removedUsers = { name: 'User 1', id: 0 };

        const spy = jest.spyOn(console, 'log');
        removeObjects('role', removedRoles);
        removeObjects('group', removedGroups);
        removeObjects('user', removedUsers);
        expect(spy).toHaveBeenCalledTimes(6);

        let type = 'role';
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Removing role ${JSON.stringify(removedRoles)} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(3, `DEBUG removeObjects foundObjs: ${JSON.stringify([removedRoles])}`);
        type = 'group';
        expect(spy).toHaveBeenNthCalledWith(3, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(4, `INFO Removing ${type} ${JSON.stringify(removedGroups)} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(6, `DEBUG removeObjects foundObjs: ${JSON.stringify([removedGroups])}`);
        type = 'user';
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Removing ${type} ${JSON.stringify(removedUsers)} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(9, `DEBUG removeObjects foundObjs: ${JSON.stringify([removedUsers])}`);
    });

    it('updateObjects multiple objects with each array, should log the updated object', () => {
        const { removeObjects } = require('./CRUD');

        const updatedRoles = [{ id: 0 }, { name: 'Role 2', id: 1 },]
        const updatedGroups = [{ name: 'Group 1', id: 0 }, { name: 'Group 2', id: 1 },]
        const updatedUsers = [{ name: 'User 1', id: 0 }, { name: 'User 2', id: 1 },]

        const spy = jest.spyOn(console, 'log');
        const removedRoles = removeObjects('role', updatedRoles);
        const removedGroups = removeObjects('group', updatedGroups);
        const removedUsers = removeObjects('user', updatedUsers);
        expect(spy).toHaveBeenCalledTimes(9);

        let type = 'role';
        expect(spy).toHaveBeenNthCalledWith(1, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(2, `INFO Removing role ${JSON.stringify(removedRoles[0])} from the master list.`);
        expect(spy).toHaveBeenNthCalledWith(3, `INFO Removing role ${JSON.stringify(removedRoles[1])} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(4, `DEBUG removeObjects foundObjs: ${JSON.stringify(removedRoles)}`);
        type = 'group';
        expect(spy).toHaveBeenNthCalledWith(4, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(5, `INFO Removing group ${JSON.stringify(removedGroups[0])} from the master list.`);
        expect(spy).toHaveBeenNthCalledWith(6, `INFO Removing group ${JSON.stringify(removedGroups[1])} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(8, `DEBUG removeObjects foundObjs: ${JSON.stringify(removedGroups)}`);
        type = 'user';
        expect(spy).toHaveBeenNthCalledWith(7, `INFO Attempting to remove ${type} from the master list`);
        expect(spy).toHaveBeenNthCalledWith(8, `INFO Removing user ${JSON.stringify(removedUsers[0])} from the master list.`);
        expect(spy).toHaveBeenNthCalledWith(9, `INFO Removing user ${JSON.stringify(removedUsers[1])} from the master list.`);
        //expect(spy).toHaveBeenNthCalledWith(12, `DEBUG removeObjects foundObjs: ${JSON.stringify(removedUsers)}`);
    });
});