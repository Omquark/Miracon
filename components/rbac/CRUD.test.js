jest.doMock('../Log', () => {
    return {
        __esmodule: false,
        logEvent: (logLevel, message) => {
            //we don't need the debug messages
            if (logLevel.level > 0) console.log(`${logLevel.name} ${message}`);
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

    it('Console log should show invalid object with no name attempted to be added to each array', () => {
    });

    it('Console log should show added object, with corresponding type, as an INFO log', () => {
    });

    it('Console should show multiple adds for each object in the passed array', () => {
    });

    it('Console should show object already exists on the second addition', () => {
    });

    it('Console should show object already exists with both adds, due to name and id.', () => {
    });
});

//Objects here will use the objects added in the previous test.
describe('Test the getObjects functions with each object, and invalid inputs as applicable', () => {


    test('Should show all objects from each table, and verify a deep copy', () => {
    });

    test('Test getObjects to pull against ids, and verify we get a deep copy', () => {
    });
});

describe('Test the updateObjects function with each object and invalid inputs as applicable', () => {

    it('updateObjects single object with each array, should log the updated object', () => {
    });

    it('updateObjects with object array to each array, should log each updated object.', () => {
    });

    it('updateObjects with old objects larger than the new, should log each updated and skipped objects.', () => {
    });

    it('updateObjects with new objects larger than the old, should log each updated and skipped objects.', () => {
    });

    it('updateObject to add a new field to any given object in an array, should show updated object in the log.', () => {
    });

    it('updateObject to add a new field to any multiple objects in an array, should show updated object in the log.', () => {
    });

    it('updateObject to attempt to add a new field without a name or id, should log a warning and the object', () => {
    });

});

describe('Test the removeObjects function with each object and invalid inputs as applicable', () => {
    it('removeObjects single object with each array, should log the updated object', () => {
    });

    it('updateObjects multiple objects with each array, should log the updated object', () => {
    });
});