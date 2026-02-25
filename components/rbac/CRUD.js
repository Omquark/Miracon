const { logEvent, LogLevel } = require("../Log");
const { Role, Group, User, Roles, Groups, Users } = require("./RoleDefs");
const { v4: uuidv4 } = require("uuid");
const {
    writeData,
    writeManyData,
    readData,
    readManyData,
    removeData,
    removeManyData,
    updateData,
    updateManyData,
    pullFromArray,
} = require("./db");

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
 * @returns {Array<Role> | Array<Group> | Array<User>} Returns an array whose objects will match the type passed. If any objects fail, they will be undefined within the array
 */
async function addObjects(type, object) {

    logEvent(LogLevel.INFO, `Attempting to add ${type.toLowerCase()}s to the master list.`);
    if (!object) {
        logEvent(LogLevel.WARN, 'An undefined object was attempted to add to the database. Please ensure that an object with at least an id or name property is assigned.')
        return [];
    }
    const os = Array.isArray(object) ? [...object] : [object];

    os.forEach(o => {
        if (!o || (!o.name && !o.id)) {
            logEvent(LogLevel.WARN, 'An object was attempted to add without a name OR id. One of these must be provided to insert the record.')
            return;
        }
        if (!o.id) o.id = uuidv4();
    });

    if (os.length === 1) {
        if (await writeData(type, os[0])) {
            return [os[0]];
        }
        return [undefined];
    }

    const insertResults = await writeManyData(type, os);
    return os.map((o, index) => (insertResults[index] ? o : undefined));
}

/**
 * Checks if a role exists within the master list. If it does, it is returned.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} object The objects to look for. 
 * If this is undefined, returns the entire list. The object passed only needs a name property as { name: "name" }
 * @returns {Array} An array of objects matching the type as set in type. Or an empty array if there was an error
 * The returned array will always be of the same size as the object(s) passed. Any objects not found will be undefined within the array
 */
async function getObjects(type, object = undefined) {
    if (object === undefined) {
        logEvent(LogLevel.INFO, `No object passed, retrieving all ${type}s.`)
        return await readData(type);
    }
    const os = Array.isArray(object) ? [...object] : [object];
    if (os.length === 1) {
        return [await readData(type, os[0])];
    }
    return await readManyData(type, os);
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
    if (!oldObjects || !newObjects) {
        logEvent(LogLevel.WARN, 'Attempted to update object, but no object was given. You must define which object to update AND the new object to update to.');
        return [];
    }

    const os = Array.isArray(oldObjects) ? [...oldObjects] : [oldObjects];
    const ns = Array.isArray(newObjects) ? [...newObjects] : [newObjects];

    if (os.length !== ns.length) {
        logEvent(LogLevel.WARN, 'The old objects and new objects must have an equal number passed.');
        logEvent(LogLevel.WARN, 'The old objects will be updated to the new objects in the same order corresponding to the element in the array.');
        return [];
    }

    const updatedObjects = [];
    if (os.length === 1) {
        const result = await updateData(type, os[0], ns[0]);
        if (result) updatedObjects.push(ns[0]);
        return updatedObjects;
    }

    const updateResults = await updateManyData(type, os, ns);
    for (let i = 0; i < updateResults.length; i++) {
        if (updateResults[i]) updatedObjects.push(ns[i]);
    }
    return updatedObjects;
}

/**
 * Removes one or more objects from the master list. Prints any success or failures, but succeeds regardless.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} objects The objects to remove from the master list.
 * @return The objects that were removed from the list, as they were at the time of removal.
 */
async function removeObjects(type, objects) {
    logEvent(LogLevel.INFO, `Attempting to remove ${type} from the master list`);
    let removedObjects = [];
    if (!objects) {
        logEvent(LogLevel.WARN, 'There was no object passed to removeObjects.')
        return [];
    }

    let os = Array.isArray(objects) ? [...objects] : [objects];

    if (os.length === 1) {
        if (await removeData(type, os[0])) {
            removedObjects.push(os[0]);
        }
        return removedObjects;
    }

    const removeResults = await removeManyData(type, os);
    for (let i = 0; i < removeResults.length; i++) {
        if (removeResults[i]) {
            removedObjects.push(os[i]);
        }
    }
    return removedObjects;

}

async function cascadeRemove(member, memberType, containerType) {
    logEvent(LogLevel.DEBUG, 'Calling cascade removal');
    if (!member) {
        logEvent(LogLevel.WARN, 'A member id must be passed to cascadeRemove.');
        return;
    }
    logEvent(LogLevel.INFO, `Cascade removing ${memberType} from ${containerType}s`);
    await pullFromArray(containerType, `${memberType}s`, member);
};

/**
 * Determines if a list of Roles is valid for the passed list of groups or users. This is an all or none pass.
 * If one role does not pass for any group or user, then all of them fail.
 * @param {Group | User | Array<Group> | Array<User>} check list of users/groups to check the roles of
 * @returns If the Roles for the Groups or Users are valid. If one fails, all fails. No roles are accepted.
 */
async function validateRoles(check) {
    logEvent(LogLevel.INFO, 'Checking Roles.')
    logEvent(LogLevel.DEBUG, `check from validateRoles: ${JSON.stringify(check)}`);
    const cs = Array.isArray(check) ? [...check] : [check];
    if (cs.length === 0) {
        logEvent(LogLevel.INFO, 'No roles passed, updating object to have no roles');
        return true;
    }

    const roleIds = new Set();
    cs.forEach(c => {
        if (!c || !Array.isArray(c.roles)) return;
        c.roles.forEach(roleId => {
            if (roleId !== undefined && roleId !== null) {
                roleIds.add(roleId);
            }
        });
    });

    if (roleIds.size === 0) {
        return true;
    }

    const pulledRoles = await getObjects('role', [...roleIds].map(id => ({ id })));
    const validRoleIds = new Set(
        pulledRoles
            .filter(role => role && role.id !== undefined)
            .map(role => role.id)
    );
    const invalidRole = [...roleIds].find(roleId => !validRoleIds.has(roleId));
    if (invalidRole !== undefined) {
        logEvent(LogLevel.WARN, `A role cannot be found for the object: ${JSON.stringify(check)}`);
        return false;
    }

    return true;
}

/**
 * Determines if a list of Groups is valid for the passed list of users. This is an all or none pass.
 * If one group does not pass for any user, then all of them fail.
 * @param {User | Array<User>} check list of users to check the groups of
 * @returns If the groups for the Users are valid.
 */
async function validateGroups(check) {
    logEvent(LogLevel.INFO, 'Checking Groups.')
    logEvent(LogLevel.DEBUG, `check from validateGroups: ${JSON.stringify(check)}`);
    const cs = Array.isArray(check) ? [...check] : [check];
    const groupIds = new Set();
    cs.forEach(c => {
        if (!c || !Array.isArray(c.groups)) return;
        c.groups.forEach(groupId => {
            if (groupId !== undefined && groupId !== null) {
                groupIds.add(groupId);
            }
        });
    });

    if (groupIds.size === 0) {
        return true;
    }

    const pulledGroups = await getObjects('group', [...groupIds].map(id => ({ id })));
    const validGroupIds = new Set(
        pulledGroups
            .filter(group => group && group.id !== undefined)
            .map(group => group.id)
    );
    const invalidGroup = [...groupIds].find(groupId => !validGroupIds.has(groupId));
    if (invalidGroup !== undefined) {
        logEvent(LogLevel.WARN, `A group cannot be found for the user: ${JSON.stringify(check)}`);
        return false;
    }

    return true;
}


module.exports = { addObjects, getObjects, updateObjects, removeObjects, cascadeRemove, validateRoles, validateGroups }
