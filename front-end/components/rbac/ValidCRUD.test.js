jest.doMock('./RoleDefs', () => {
    Role = {
        name: 'Test Role 1',
        id: 0,
    };
    Group = {
        name: 'Test Group 1',
        roles: [Role.id],
        id: 0,
    };
    User = {
        name: 'Test User 1',
        password: 'Test Password 1',
        email: 'test.email@email.com',
        preferences: {},
        roles: undefined,
        groups: [Group.id],
        id: 0,
    }
    return {
        Role: Role,
        Roles: [Role, { name: 'Test Role 2', id: 1 }, { name: 'Test Role 3', id: 2 }, { name: 'Test Role 4', id: 3 },],
        Groups: [Group],
        Users: [User],
    }
});

let mockUUID = 0;
jest.doMock('uuid', () => {
    return {
        __esmodule: false,
        v4: () => { mockUUID++; return mockUUID; },
    }
});

describe('Tests the CRUD functions of the Roles with cross validation', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    })

    //First, confirm the add roles works
    it('should getRoles from the test Array', () => {
        const { getRoles, updateRoles } = require('./Role');

        const testRoles = [{ name: 'Test Role 1', id: 0 }, { name: 'Test Role 2', id: 1 }, { name: 'Test Role 3', id: 2 }, { name: 'Test Role 4', id: 3 },];

        const pulledRoles1 = getRoles();
        const pulledRoles2 = getRoles(testRoles[0]);
        const pulledRoles3 = getRoles([testRoles[1], testRoles[3]]);
        const pulledRoles4 = getRoles([testRoles[2], testRoles[1], testRoles[0]]);

        expect(pulledRoles1).toEqual(testRoles);

        expect(pulledRoles2.length).toBe(1)
        expect(pulledRoles2[0]).toEqual(testRoles[0]);
        expect(pulledRoles2[0]).not.toBe(testRoles[0]);

        expect(pulledRoles3.length).toBe(2);
        expect(pulledRoles3[0]).toEqual(testRoles[1]);
        expect(pulledRoles3[1]).toEqual(testRoles[3]);

        expect(pulledRoles4.length).toBe(3);
        expect(pulledRoles4[0]).toEqual(testRoles[2]);
        expect(pulledRoles4[1]).toEqual(testRoles[1]);
        expect(pulledRoles4[2]).toEqual(testRoles[0]);
    });

    //Now add roles and verify with getRoles
    it('should add roles to the array, and verify by retrieving those same roles', () => {
        const { addRoles, getRoles } = require('./Role');

        const addedRoles1 = { name: 'Added Role 1', id: 10 };
        const addedRoles2 = [{ name: 'Added Role 2', id: 11 }, { name: 'Added Role 3', id: 12}];
        const addedRoles3 = [{ name: 'Added Role 4', id: 13 }, { name: 'Added Role 5', id: 14}, { name: 'Added Role 6', id: 15}];
        const addedRoles4 = [{ name: 'Added Role 7', id: 16 }];

        addRoles(addedRoles1);
        addRoles(addedRoles2);
        addRoles(addedRoles3);
        addRoles(addedRoles4);

        const pulledRoles1 = getRoles(addedRoles1);
        const pulledRoles2 = getRoles(addedRoles2);
        const pulledRoles3 = getRoles(addedRoles3);
        const pulledRoles4 = getRoles(addedRoles4);

        const allRoles = [{name: 'Test Role 1', id: 0}, {name: 'Test Role 2', id: 1}, {name: 'Test Role 3', id: 2}, {name: 'Test Role 4', id: 3}, 
            addedRoles1, ...addedRoles2, ...addedRoles3, ...addedRoles4];

        const allPulledRoles = getRoles();

        expect(allRoles.length).toBe(allPulledRoles.length);
        expect(allRoles).toEqual(allPulledRoles);
        expect(allRoles).not.toBe(allPulledRoles);

        expect(pulledRoles1.length).toBe(1);
        expect(pulledRoles1[0]).toEqual(addedRoles1);
        expect(pulledRoles1[0]).not.toBe(addedRoles1);

        expect(pulledRoles2.length).toBe(2);
        expect(pulledRoles2[0]).toEqual(addedRoles2[0]);
        expect(pulledRoles2[0]).not.toBe(addedRoles2[0]);
        expect(pulledRoles2[1]).toEqual(addedRoles2[1]);
        expect(pulledRoles2[1]).not.toBe(addedRoles2[1]);

        expect(pulledRoles3.length).toBe(3);
        expect(pulledRoles3[0]).toEqual(addedRoles3[0]);
        expect(pulledRoles3[0]).not.toBe(addedRoles3[0]);
        expect(pulledRoles3[1]).toEqual(addedRoles3[1]);
        expect(pulledRoles3[1]).not.toBe(addedRoles3[1]);
        expect(pulledRoles3[2]).toEqual(addedRoles3[2]);
        expect(pulledRoles3[2]).not.toBe(addedRoles3[2]);

        expect(pulledRoles4.length).toBe(1);
        expect(pulledRoles4[0]).toEqual(addedRoles4[0]);
        expect(pulledRoles4[0]).not.toBe(addedRoles4[0]);
    });

    it('should not allow for adding name conflicts, should keep original in array', () => {
        const { addRoles, getRoles } = require('./Role');

        const addedRoles1 = { name: 'Test Role 1', id: 10 };
        const addedRoles2 = { name: 'Test Role 2', id: 11 };
        const addedRoles3 = { name: 'Test Role 3', id: 0 };
        const addedRoles4 = { name: 'Test Role 4', id: 1 };

        const addedRoles5 = [{ name: 'Added Role 4', id: 13 }, { name: 'Added Role 5', id: 14}, { name: 'Added Role 6', id: 15}];
        const addedRoles6 = [{ name: 'Added Role 7', id: 16 }];
        const addedRoles7 = [{ name: 'Added Role 4', id: 103 }, { name: 'Added Role 5', id: 104}, { name: 'Added Role 6', id: 105}];
        const addedRoles8 = [{ name: 'Added Role 7', id: 106 }];

        addRoles(addedRoles1);
        addRoles(addedRoles2);
        addRoles(addedRoles3);
        addRoles(addedRoles4);
        addRoles(addedRoles5);
        addRoles(addedRoles6);
        addRoles(addedRoles7);
        addRoles(addedRoles8);

        const pulledRoles1 = getRoles({ name: 'Test Role 1' });
        const pulledRoles2 = getRoles({ name: 'Test Role 2' });
        const pulledRoles3 = getRoles({ name: 'Test Role 3' });
        const pulledRoles4 = getRoles({ name: 'Test Role 4' });
        const pulledRoles5 = getRoles({ name: 'Added Role 4' });
        const pulledRoles6 = getRoles({ name: 'Added Role 5' });
        const pulledRoles7 = getRoles({ name: 'Added Role 6' });
        const pulledRoles8 = getRoles({ name: 'Added Role 7' });

        expect(pulledRoles1[0]).toEqual({ name: 'Test Role 1', id: 0 });
        expect(pulledRoles2[0]).toEqual({ name: 'Test Role 2', id: 1 });
        expect(pulledRoles3[0]).toEqual({ name: 'Test Role 3', id: 2 });
        expect(pulledRoles4[0]).toEqual({ name: 'Test Role 4', id: 3 });
        expect(pulledRoles5[0]).toEqual({ name: 'Added Role 4', id: 13 });
        expect(pulledRoles6[0]).toEqual({ name: 'Added Role 5', id: 14 });
        expect(pulledRoles7[0]).toEqual({ name: 'Added Role 6', id: 15 });
        expect(pulledRoles8[0]).toEqual({ name: 'Added Role 7', id: 16 });
    });

    it('should not allow for an empty name, and auto generate an id for insertions (test ids may conflict)', () => {
        const { addRoles, getRoles } = require('./Role');

        const testRole1 = { name: '', id: 100 };
        const testRole2 = { name: 'Added Role 1' };

        addRoles(testRole1);
        addRoles(testRole2);

        const pulledRoles1 = getRoles({id : 100 });
        const pulledRoles2 = getRoles(testRole2);

        expect(pulledRoles1.length).toBe(1);
        expect(Object.keys(pulledRoles1[0]).length).toBe(0);

        expect(pulledRoles2.length).toBe(1);
        expect(pulledRoles2[0]).toMatchObject(testRole2);
        expect(pulledRoles2[0]).not.toBe(testRole2);
    });

    it('should allow to update objects without conflicts, ensure deep copies are updated', () => {
        const { getRoles, updateRoles } = require('./Role');

        const oldRoles1 = { name: 'Test Role 1' };
        const oldRoles2 = { name: 'Test Role 2' };
        const oldRoles3 = { name: 'Test Role 3' };
        const oldRoles4 = { name: 'Test Role 4' };

        const newRoles1 = { name: 'Updated Role 1' };
        const newRoles2 = { name: 'Updated Role 2' };
        const newRoles3 = { name: 'Updated Role 3' };
        const newRoles4 = { name: 'Updated Role 4' };

        const updatedRoles1 = updateRoles(oldRoles1, newRoles1);
        const updatedRoles2 = updateRoles([oldRoles2, oldRoles3, oldRoles4], [newRoles2, newRoles3, newRoles4]);

        expect(updatedRoles1.length).toBe(1);
        expect(updatedRoles1[0]).toMatchObject(newRoles1)

        expect(updatedRoles2.length).toBe(3);
        expect(updatedRoles2[0]).toMatchObject(newRoles2);
        expect(updatedRoles2[1]).toMatchObject(newRoles3);
        expect(updatedRoles2[2]).toMatchObject(newRoles4);

        const allRoles = getRoles();
        let pulledRoles1 = getRoles({ id: 0 });
        let pulledRoles2 = getRoles({ id: 1 });
        const pulledRoles3 = getRoles({ id: 2 });
        const pulledRoles4 = getRoles({ id: 3 });

        expect(allRoles.length).toBe(4);

        expect(pulledRoles1[0]).toMatchObject({ name: 'Updated Role 1' });
        expect(pulledRoles2[0]).toMatchObject({ name: 'Updated Role 2' });
        expect(pulledRoles3[0]).toMatchObject({ name: 'Updated Role 3' });
        expect(pulledRoles4[0]).toMatchObject({ name: 'Updated Role 4' });

        newRoles1.name = 'Updated Role 3';
        newRoles2.name = 'Updated Role 4';

        pulledRoles1 = getRoles({ id: 0 });
        pulledRoles2 = getRoles({ id: 1 });
        
        expect(pulledRoles1[0]).toMatchObject({ name: 'Updated Role 1' });
        expect(pulledRoles2[0]).toMatchObject({ name: 'Updated Role 2' });
    });

    it('should not allow for updates with naming conflicts', () => {
        const { getRoles, updateRoles } = require('./Role');

        const oldRoles1 = { name: 'Test Role 1' };
        const oldRoles2 = { name: 'Test Role 2' };
        const oldRoles3 = { name: 'Test Role 3' };
        const oldRoles4 = { name: 'Test Role 4' };

        const newRoles1 = { name: 'Test Role 1' };
        const newRoles2 = { name: 'Test Role 2' };
        const newRoles3 = { name: 'Test Role 3' };
        const newRoles4 = { name: 'Test Role 4' };

        const updatedRoles = updateRoles([oldRoles1, oldRoles2, oldRoles3, oldRoles4], [newRoles4, newRoles3, newRoles2, newRoles1]);
        const allRoles = getRoles();


        expect(updatedRoles.length).toBe(1);
        expect(Object.keys(updatedRoles[0]).length).toBe(0);
        expect(allRoles.length).toBe(4);
        expect(allRoles[0]).toMatchObject(oldRoles1);
        expect(allRoles[1]).toMatchObject(oldRoles2);
        expect(allRoles[2]).toMatchObject(oldRoles3);
        expect(allRoles[3]).toMatchObject(oldRoles4);
    });

    it('should not allow id updates', () => {
        const { getRoles, updateRoles } = require('./Role');

        const oldRoles1 = { id: 0 };
        const oldRoles2 = { id: 1 };
        const oldRoles3 = { id: 2 };
        const oldRoles4 = { id: 3 };

        const newRoles1 = { id: 4 };
        const newRoles2 = { id: 5 };
        const newRoles3 = { id: 6 };
        const newRoles4 = { id: 7 };

        const updatedRoles = updateRoles([oldRoles1, oldRoles2, oldRoles3, oldRoles4], [newRoles4, newRoles3, newRoles2, newRoles1]);
        const allRoles = getRoles();

        expect(updatedRoles.length).toBe(1);
        expect(Object.keys(updatedRoles[0]).length).toBe(0);
        expect(allRoles.length).toBe(4);
        expect(allRoles[0]).toMatchObject(oldRoles1);
        expect(allRoles[1]).toMatchObject(oldRoles2);
        expect(allRoles[2]).toMatchObject(oldRoles3);
        expect(allRoles[3]).toMatchObject(oldRoles4);
    });

    it('should remove roles, no cascading roles are checked', () => {
        const { getRoles, removeRoles } = require('./Role');
        
        const testRoles1 = { id: 0 };
        const testRoles2 = { id: 1 };
        const testRoles3 = { id: 2 };
        const testRoles4 = { id: 3 };

        const removedRoles1 = removeRoles(testRoles2);
        const removedRoles2 = removeRoles([testRoles3, testRoles4]);

        expect(removedRoles1.length).toBe(1);
        expect(removedRoles1[0]).toMatchObject(testRoles2);
        expect(removedRoles1[0].name).toBeDefined();

        expect(removedRoles2.length).toBe(2);
        expect(removedRoles2[0]).toMatchObject(testRoles3);
        expect(removedRoles2[0].name).toBeDefined();
        expect(removedRoles2[1]).toMatchObject(testRoles4);
        expect(removedRoles2[1].name).toBeDefined();
    });

    it('should cascade removeRoles, checked by getGroups and getUsers', () => {
        const { getRoles, removeRoles } = require('./Role');
        const { getGroups } = require('./Group');
        const { getUsers } = require('./User');
        
        const testRoles1 = { id: 0 };

        const beforeGroup = getGroups();
        const beforeUser = getUsers();

        const removedRoles1 = removeRoles(testRoles1);

        const afterGroup = getGroups();
        const afterUser = getUsers();

        const allRoles = getRoles();

        console.log(beforeGroup);
        console.log(afterGroup);

        expect(removedRoles1.length).toBe(1);
        expect(removedRoles1[0]).toMatchObject(testRoles1);

        expect(beforeGroup).not.toEqual(afterGroup);
        expect(beforeUser).toEqual(afterUser);

        expect(allRoles.length).toBe(3);
        expect(allRoles[0]).toMatchObject({ name: 'Test Role 2'});
        expect(allRoles[1]).toMatchObject({ name: 'Test Role 3'});
        expect(allRoles[2]).toMatchObject({ name: 'Test Role 4'});
    });
});