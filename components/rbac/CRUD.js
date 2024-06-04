const { logEvent, LogLevel, logError } = require("../Log");
const { Role, Group, User, Roles, Groups, Users } = require("./RoleDefs");
const { v4: uuidv4 } = require("uuid");
const { strictProperties } = require('./Utility');
const { writeData, readData, removeData, updateData } = require("./db");

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
    let upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to add was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    const os = Array.isArray(object) ? [...object] : [object];

    const addedObjects = os.map(async o => {
        if (!o || (!o.name && !o.id)) {
            logEvent(LogLevel.WARN, 'An object was attempted to add without a name OR id. One of these must be provided to insert the record.')
            return undefined;
        }
        if (!o.id) o.id = uuidv4();
        if (await writeData(type, o)) {
            return o;
        }
        return undefined;
    });

    return await Promise.all(addedObjects);
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
    const upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to read was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    if (object === undefined) {
        logEvent(LogLevel.INFO, `No object passed, retrieving all ${type}s.`)
        return await readData(type);
    }
    const os = Array.isArray(object) ? [...object] : [object];
    const pulledObjects = os.map(async o => {
        return await readData(type, o);
    });

    return await Promise.all(pulledObjects);
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
    for (i = 0; i < os.length; i++) {
        let result = await updateData(type, os[i], ns[i]);
        if (result) updatedObjects.push(ns[i]);
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
    let upperType;
    logEvent(LogLevel.INFO, `Attempting to remove ${type} from the master list`);
    let removedObjects = [];
    if (!objects) {
        logEvent(LogLevel.WARN, 'There was no object passed to removeObjects.')
        return [];
    }

    upperType = type.toUpperCase();
    if (upperType !== "ROLE" && upperType !== "GROUP" && upperType !== "USER") {
        logEvent(LogLevel.WARN, 'The type passed to remove was not role, group, or user. It must be one of these three, and is case insensitive.');
        return [];
    }

    let os = Array.isArray(objects) ? [...objects] : [objects];

    for (o of os) {
        if (await removeData(type, o)) {
            removedObjects.push(o);
        }
    }

    return removedObjects;

}

async function cascadeRemove(member, memberType, containerType) {
    logEvent(LogLevel.DEBUG, 'Calling cascade removal');

    const memberList = await Promise.resolve(getObjects(memberType, member));
    const containerList = await Promise.resolve(getObjects(containerType));

    const changedOther = [];


    if (!Array.isArray(memberList) || memberList.length === 0 || //Object.keys(main[0]).length === 0 || 
        !Array.isArray(containerList) || containerList.length === 0 /*|| Object.keys(other[0].length === 0)*/) {
        logEvent(LogLevel.WARN, 'Database did not return any results to cascade remove.');
        return;
    }

    logEvent(LogLevel.INFO, `Cascade removing ${memberType} from ${containerType}s`);
    for (container of containerList) {
        let foundIndex = container[`${memberType}s`].findIndex((val) => val === member);
        if (foundIndex !== -1) {
            logEvent(LogLevel.INFO, `Found a ${containerType} which contains the ${memberType} id of ${member}`);
            container[`${memberType}s`].splice(foundIndex, 1);
            await updateObjects(containerType, container, container)
        }
    }
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
                logEvent(LogLevel.DEBUG, `A role was found for the group/user: ${JSON.stringify(c)}`);
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