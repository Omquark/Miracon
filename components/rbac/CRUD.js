const { logEvent, LogLevel, logError } = require("../Log");
const { Role, Group, User, Roles, Groups, Users } = require("./RoleDefs");
const { v4: uuidv4 } = require("uuid");
const { strictProperties } = require('./Utility');
const { writeData, readData, removeData } = require("./db");

/**
 * This file is used to access the Role database.
 * These are generic methods used to access the data base to provide CRUD operations.
 * This does not guarantee there is data integrity between tables, but will not allow
 * for any arrays managed to have identical keys. Each key managed is unique by { id: 'id' }.
 * ID's generated are created as a uuid, and are created at this layer. Names are required, and are considered unique
 * Other keys are ternary, and aren't necessary.
 * Any keys that are considered extra are "shaved" when loading, and will not be saved at the next serlaization.
 * 
 * These functions can be, but should not be accessed directly. Instead, it should be wrapped to allow for integrity between tables.
 */

/**
 * Attempts to add a new object to the list. Duplicate objects (by name, case insensitive) will not be added.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User>} object Array of property to add to the Role list.
 */
async function addObjects(type, object) {

    logEvent(LogLevel.INFO, `Attempting to add ${type.toLowerCase()}s to the master list.`);
    if (!object) {
        logEvent(LogLevel.WARN, 'An undefined object was attempted to add to the database. Please ensure that an object with at least an id or name property is assigned.')
        return [];
    }
    let upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to add was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    const os = Array.isArray(object) ? [...object] : [object];

    const addedObjects = os.map(async o => {
        if (!o.name && !o.id) {
            logEvent(LogLevel.WARN, 'An object was attempted to add without a name OR id. One of these must be provided to insert the record.')
            return;
        }
        if (!o.id) o.id = uuidv4();
        console.log('writing o', o);
        await writeData(type, o);
        return o;
    });

    return await Promise.all(addedObjects);
}

/**
 * Checks if a role exists within the master list. If it does, it is returned.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} object The objects to look for. 
 * If this is undefined, returns the entire list. The object passed only needs a name property as { name: "name" }
 * @returns {Array} An array of Roles as they exist in the master list, even if Array.length === 1.
 * If no roles are found, an Array with an empty object is returned e.g. [{}]
 */
async function getObjects(type, object = undefined) {
    const upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        console.log('upperType', upperType);
        logEvent(LogLevel.WARN, 'The type passed to read was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    if (object === undefined){
        console.log('reading all data, no object', object);
        return await readData(type);
    }
    const os = Array.isArray(object) ? [...object] : [object];
    const pulledObjects = os.map(async o => {
        console.log('reading o', o);
        return await readData(type, o);
    });

    return pulledObjects;
}

/**
 * Updates the objects passes by the objects to newObjects.
 * If a single Object is passed, it updates that single one.
 * If an Array is passed, it updates element for respective element, and will only update up
 * to the length of the smaller Array.
 * Returns the updated roles as they are after the update.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} oldObjects The roles to update
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} newObjects The new roles to update
 * @return An Array of Roles that were updated, as they were after the update. Returns an Array with an empty object if nothing was updated.
 */
async function updateObjects(type, oldObjects, newObjects) {
    const upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to update was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    if (!oldObjects || !newObjects) {
        logEvent(LogLevel.WARN, 'Attempted to update object, but no object was given. You must define which object to update ABD the new object to update to.');
        return;
    }

    const os = Array.isArray(oldObjects) ? [...oldObjects] : [oldObjects];
    const ns = Array.isArray(newObjects) ? [...newObjects] : [newObjects];

    if (os.length !== ns.length) {
        logEvent(LogLevel.WARN, 'The old objects and new objects must have an equal number passed.');
        logEvent(LogLevel.WARN, 'The old objects will be updated to the new objects in the same order corresponding to the element in the array.');
        return;
    }

    const updatedObjects = os.map(async (o, index) => {
        ns[index].id = o.id;
        console.log('ns', ns);
        await writeData(type, ns);
        return ns;
    });

    return updatedObjects;
}

/**
 * Removes one or more objects from the master list. Prints any success or failures, but succeeds regardless.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} objects The objects to remove from the master list.
 * @return The objects that were removed from the list, as they were at the time of removal.
 */
async function removeObjects(type, objects) {
    let upperType;
    logEvent(LogLevel.INFO, `Attempting to remove ${type} from the master list`);
    if (!objects) {
        logEvent(LogLevel.WARN, 'There was no object passed to removeObjects.')
    }

    upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to remove was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    let os = Array.isArray(objects) ? [...objects] : [objects];

    let removedObjects = [];
    os.forEach(async (o) => {
        if (await removeData(type, o)) {
            removedObjects.push(o);
        }
    });

    return removedObjects;

}

async function cascadeRemove(parent, parentType, otherType) {
    logEvent(LogLevel.DEBUG, 'Calling cascade removal');

    console.log('parent', parent);
    console.log('parentType', parentType);


    const main = await Promise.resolve(getObjects(parentType, parent));
    const other = await Promise.resolve(getObjects(otherType));

    console.log('main', main);
    console.log('other', other);

    const changedOther = [];

    if (!Array.isArray(main) || main.length == 0 || Object.keys(main[0]).length == 0) {
        logEvent(LogLevel.WARN, 'Database did not return any results to cascade remove.');
        return;
    }
    
    console.log('main', main);
    main.forEach(async (m) => {
        console.log('m', m);
        const compRole = await getObjects(parentType, strictProperties(m, Role))[0];
        if (Object.keys(compRole).length === 0) {
            logEvent(LogLevel.WARN, `Role ${m} could not be found!`);
            return;
        }
        other.forEach(o => {
            if (!o.roles || o.roles.length === 0) return;
            let rIndex = o.roles.findIndex(or => or === compRole.id);
            if (rIndex !== -1) {
                logEvent(LogLevel.INFO, `I found a ${otherType} ${JSON.stringify(o)} references the ${parentType}.id ${compRole.id}. I am removing it from the ${otherType}'s array.`);
                otherRoles = o.roles;
                otherRoles = otherRoles.splice(rIndex, 1);
                changedOther.push(o);
            } else {
                logEvent(LogLevel.DEBUG, `No index found for ${JSON.stringify(compRole)}`);
            }
        });
    });

    updateObjects(otherType, changedOther, changedOther);
};

/**
 * Determines if a list of Roles is valid for the passed list of groups or users. This is an all or none pass.
 * If one role does not pass for any group or user, then all of them fail.
 * @param {Group | User | Array<Group> | Array<User>} check list of users/groups to check the roles of
 * @returns If the Roles for the Groups or Users are valid. If one fails, all fails. No roles are accepted.
 */
async function validateRoles(check) {
    logEvent(LogLevel.INFO, 'Checking Roles.')
    const rs = await getObjects('role');
    const cs = Array.isArray(check) ? [...check] : [check]
    if (check.length === 0) {
        logEvent(LogLevel.INFO, 'No roles passed, updating group/user to have no roles');
        return true;
    }
    let roleCheck = false;

    rs.forEach(r => {
        if (!r || !r.id) return;
        cs.forEach(c => {
            if (!c.roles || c.roles.length === 0) {
                roleCheck = true;
                return;
            }
            const foundRole = c.roles.find(gr => {
                return gr === r.id;
            });
            if (foundRole) {
                logEvent(LogLevel.DEBUG, `A role has been found for the group/user: ${JSON.stringify(c)}`);
                roleCheck = true;
            }
        });
    });

    if (!roleCheck) {
        logEvent(LogLevel.WARN, `A role cannot be found for the group/user: ${JSON.stringify(check)}`);
    }

    return roleCheck;
}

/**
 * Determines if a list of Groups is valid for the passed list of users. This is an all or none pass.
 * If one group does not pass for any user, then all of them fail.
 * @param {User | Array<User>} check list of users to check the groups of
 * @returns If the groups for the Users are valid.
 */
async function validateGroups(check) {
    logEvent(LogLevel.INFO, 'Checking Groups.')
    const rs = await getObjects('group');
    logEvent(LogLevel.DEBUG, `rs ${rs}`);
    if (!rs || (rs.length === 1 && Object.keys(rs[0]).length)) {
        logEvent(LogLevel.INFO, `Received an empty array from getGroups for validating groups`);
        return;
    }
    const cs = Array.isArray(check) ? [...check] : [check]
    let roleCheck = true;

    rs.forEach(r => {
        cs.forEach(c => {
            if (!c.roles || c.roles.length === 0) {
                return;
            }
            const foundRole = c.roles.find(gr => gr === r.name);
            if (!foundRole) {
                logEvent(LogLevel.WARN, `A group cannot be found for the user: ${JSON.stringify(c)}`);
                roleCheck = false;
            }
        });
    });

    return roleCheck;
}


module.exports = { addObjects, getObjects, updateObjects, removeObjects, cascadeRemove, validateRoles, validateGroups }