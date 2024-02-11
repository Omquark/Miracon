const { logEvent, LogLevel } = require("../Log");
const { Role, Group, User, Roles, Groups, Users } = require("./RoleDefs");
const { v4: uuidv4 } = require("uuid");
const { strictProperties } = require('./Utility');

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
 * Selects which array to use for the functions as needed.
 * @param {string} type A string to select which type of array to use. Can be either Role, Group, or User.
 */
function selectList(type) {
    if (!type) return [];
    if (type.toUpperCase() === 'ROLE'.toUpperCase()) {
        return Roles;
    } else if (type.toUpperCase() === 'GROUP'.toUpperCase()) {
        return Groups;
    } else if (type.toUpperCase() === 'USER'.toUpperCase()) {
        return Users;
    } else {
        return undefined;
    }
}

/**
 * Attempts to add a new object to the list. Duplicate objects (by name, case insensitive) will not be added.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User>} object Array of property to add to the Role list.
 */
function addObjects(type, object) {

    logEvent(LogLevel.INFO, `Attempting to add ${type.toLowerCase()}s to the master list.`);

    const activeList = selectList(type);
    const addedObjects = [];
    if (activeList === undefined) {
        logEvent(LogLevel.WARN, 'An invalid type was attempted to be selected while adding to an array! Here\'s what I know...');
        logEvent(LogLevel.WARN, `type: ${type} objects: ${JSON.stringify(object)}`);
        return [{}];
    }

    if (Array.isArray(object.name) && (!object.name || object.name === '')) {
        logEvent(LogLevel.WARN, `Attempted to add ${type} with no name given! Names are rquired to add the ${type}.`);
        logEvent(LogLevel.WARN, `Name the ${type} and try again.`);
        return [{}];
    }

    let objects = Array.isArray(object) ? [...object] : [object];
    objects.forEach(obj => {
        if (!obj.name) {
            logEvent(LogLevel.WARN, `Attempted to add ${type} with no name given! Names are required to add the ${type}.`);
            logEvent(LogLevel.WARN, `Name the ${type} and try again.`);
            return;
        }
        if (activeList.find(o => {
            return o.name.toUpperCase() === obj.name.toUpperCase() || o.id === obj.id;
        })
        ) {
            logEvent(LogLevel.WARN, `${type} ${JSON.stringify(obj)} already exists!`);
        } else {
            const temp = {};
            Object.keys(obj).forEach(key => {
                temp[key] = obj[key];
            });
            if (!temp.id) temp.id = uuidv4();
            activeList.push(temp);
            addedObjects.push(temp);

            logEvent(LogLevel.INFO, `Successfully added ${type.toLowerCase()} with id ${temp.id}`);
        }
    });

    if(addedObjects.length === 0){
        logEvent(LogLevel.INFO, 'No objects have been added')
        return[{}];
        //addedObjects.push({});
    }

    return addedObjects;
}

/**
 * Checks if a role exists within the master list. If it does, it is returned.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} object The objects to look for. 
 * If this is undefined, returns the entire list. The object passed only needs a name property as { name: "name" }
 * @returns {Array} An array of Roles as they exist in the master list, even if Array.length === 1.
 * If no roles are found, an Array with an empty object is returned e.g. [{}]
 */
function getObjects(type, object = undefined) {
    logEvent(LogLevel.DEBUG, `object ${JSON.stringify(object)}`);
    logEvent(LogLevel.INFO, `Attempting to retrieve ${type}`);

    if (!Array.isArray(object) && (object && !object.name && !object.id)) {
        logEvent(LogLevel.WARN, 'Attempted to search for an object without a name or id! At least one of these values must be provided.')
    }

    const activeList = selectList(type);
    if (activeList === undefined) {
        logEvent(LogLevel.WARN, 'An invalid type was attempted to be selected while reading from an array! Here\'s what I know...');
        logEvent(LogLevel.WARN, `type: ${type} objects: ${JSON.stringify(object)}`);
        return;
    }

    if (!object) {
        logEvent(LogLevel.INFO, `Retrieving all ${type}`);
        return structuredClone(activeList);
    }

    const objs = Array.isArray(object) ? [...object] : [object];

    let foundObjs = [];
    objs.forEach(obj => {
        let foundObj = activeList.find(o => obj.name && (o.name.toUpperCase() === obj.name.toUpperCase()) || (obj.id || obj.id === 0) && o.id === obj.id);
        if (foundObj) {
            logEvent(LogLevel.DEBUG, `Adding ${JSON.stringify(foundObj)} to found objects.`);
            foundObjs.push(foundObj);
        } else {
            logEvent(LogLevel.WARN, `The ${type} ${JSON.stringify(obj)} could not be found!`);
        }
    });


    if (foundObjs.length === 0) return [{}];
    logEvent(LogLevel.DEBUG, `foundObjs: ${JSON.stringify(foundObjs)}`);
    return structuredClone(foundObjs);
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
function updateObjects(type, oldObjects, newObjects) {
    logEvent(LogLevel.INFO, `Attempting to update ${type}`);
    const oo = Array.isArray(oldObjects) ? [...oldObjects] : [oldObjects];
    const no = Array.isArray(newObjects) ? [...newObjects] : [newObjects];

    const activeList = selectList(type);
    if (activeList === undefined) {
        logEvent(LogLevel.WARN, 'An invalid type was attempted to be selected while updating an array! Here\'s what I know...');
        logEvent(LogLevel.WARN, `type: ${type} oldObjects: ${JSON.stringify(oldObjects)} newObjects: ${newObjects}`);
    }

    //The following if blocks show the difference if either no is greater in length or oo
    if (oo.length > no.length) {
        logEvent(LogLevel.WARN, `More old ${type}s were passed than new ones! Will process all the new ${type}s with their matches.`);
        logEvent(LogLevel.INFO, `These old ${type}s will be ignored:`);
        for (let i = no.length; i < oo.length; i++) {
            logEvent(LogLevel.INFO, `${JSON.stringify(oo[i])}`);
        }
    } else if (oo.length < no.length) {
        logEvent(LogLevel.WARN, `More new ${type}s were passed than old ones! Will process all the old ${type}s with their matches.`);
        logEvent(LogLevel.INFO, `These new ${type}s will be ignored:`);
        for (let i = oo.length; i < no.length; i++) {
            logEvent(LogLevel.INFO, `${JSON.stringify(no[i])}`);
        }
    } else {
        //Placeholder, this is if both match. We don't really need to do anything here.
    }

    let replacedObjs = [];

    for (let i = 0; i < oo.length && i < no.length; i++) {
        let foundObj = activeList.find(obj => oo[i].name && (obj.name.toUpperCase() === oo[i].name.toUpperCase()) || oo[i].id !== undefined && (obj.id === oo[i].id));
        let otherFound = activeList.filter(obj => no[i].name && (obj.name.toUpperCase() === no[i].name.toUpperCase()) || no[i].id !== undefined && (obj.id === no[i].id));
        if (foundObj && otherFound.length > 0) {
            if (otherFound.length > 1 || otherFound[0].id !== foundObj.id) {
                logEvent(LogLevel.WARN, `Attempted to update a ${type} to an already existing by name! Silently failing.`);
                continue;
            }
        }
        if (foundObj) {
            const oldFound = structuredClone(foundObj);
            if (Object.keys(no[i]).length === 1 && no[i].id !== undefined) {
                logEvent(LogLevel.INFO, 'Ignoring strict update to id');
                continue;
            }
            Object.keys(no[i]).forEach(key => {
                if (key === 'id') {
                    logEvent(LogLevel.DEBUG, 'Ignoring id');
                    if (foundObj[key] !== no[i][key]) logEvent(LogLevel.DEBUG, `Attempted to change key on ${foundObj.name}!`);
                    return;
                }
                foundObj[key] = no[i][key];
            });
            logEvent(LogLevel.INFO, `Updating ${JSON.stringify(oldFound)} to ${JSON.stringify(foundObj)}`);
            replacedObjs.push(foundObj);
        } else {
            logEvent(LogLevel.WARN, `Unable to find a match to an object for an update! Here's what I know: `);
            logEvent(LogLevel.WARN, `oldObject: ${JSON.stringify(oo[i])}`);
        }
    }

    if (replacedObjs.length === 0) return [{}];

    return structuredClone(replacedObjs);
}

/**
 * Removes one or more objects from the master list. Prints any success or failures, but succeeds regardless.
 * @param {string} type A string that defines array to use. Must be either Role, Group, or User, and is case insensitive.
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User> | undefined} objects The objects to remove from the master list.
 * @return The objects that were removed from the list, as they were at the time of removal.
 */
function removeObjects(type, objects) {
    logEvent(LogLevel.INFO, `Attempting to remove ${type} from the master list`);

    const activeList = selectList(type);
    if (activeList === undefined) {
        logEvent(LogLevel.WARN, 'An invalid type was attempted to be selected while removing from an array! Here\'s what I know...');
        logEvent(LogLevel.WARN, `type: ${type} objects: ${JSON.stringify(objects)}`);
        return [{}];
    }

    let o = Array.isArray(objects) ? [...objects] : [objects];
    let foundObjs = [];
    o.forEach(obj => {
        let oIndex = activeList.findIndex(a => obj.name && (a.name.toUpperCase() === obj.name.toUpperCase()) || (obj.id || obj.id === 0) && (a.id === obj.id));
        if (oIndex !== -1) {
            logEvent(LogLevel.INFO, `Removing ${type.toLowerCase()} ${JSON.stringify(activeList[oIndex])} from the master list.`);
            foundObjs.push(activeList[oIndex]);
            activeList.splice(oIndex, 1);
        } else {
            logEvent(LogLevel.WARN, `Cannot find a ${type.toLowerCase()} matching properties ${JSON.stringify(obj)}!`);
        }
    });

    if (foundObjs.length === 0) return [{}];
    logEvent(LogLevel.DEBUG, `removeObjects foundObjs: ${JSON.stringify(foundObjs)}`);
    return foundObjs;
}

function cascadeRemove(prt, prtType, otherType) {
    logEvent(LogLevel.DEBUG, 'Calling cascade removal');

    const main = getObjects(prtType, prt);
    const other = getObjects(otherType);

    const changedOther = [];

    main.forEach(m => {
        const compRole = getObjects(prtType, strictProperties(m, Role))[0];
        if (Object.keys(compRole).length === 0) {
            logEvent(LogLevel.WARN, `Role ${m} could not be found!`);
            return;
        }
        other.forEach(o => {
            if (!o.roles || o.roles.length === 0) return;
            let rIndex = o.roles.findIndex(or => or === compRole.id);
            if (rIndex !== -1) {
                logEvent(LogLevel.INFO, `I found a ${otherType} ${JSON.stringify(o)} references the ${prtType}.id ${compRole.id}. I am removing it from the ${otherType}'s array.`);
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
function validateRoles(check) {
    logEvent(LogLevel.INFO, 'Checking Roles.')
    const rs = getObjects('role');

    const cs = Array.isArray(check) ? [...check] : [check]
    if (check.length === 0) {
        logEvent(LogLevel.INFO, 'No roles passed, updating group/user to have no roles');
        return true;
    }
    let roleCheck = false;

    rs.forEach(r => {
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
function validateGroups(check) {
    logEvent(LogLevel.INFO, 'Checking Groups.')
    const rs = getObjects('group');

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