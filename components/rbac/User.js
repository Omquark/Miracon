const { logEvent, LogLevel } = require("../Log");
const { addObjects, getObjects, updateObjects, removeObjects, validateRoles, validateGroups } = require("./CRUD");
const { User } = require("./RoleDefs");
const { strictProperties } = require("./Utility");

/**
 * Provides CRUD functionality as a wrapper for the User array.
 * The goal of this class is to also provide integrity between foreign keys.
 */

/**
 * Attempts to add users to the master list. 
 * @param {User | Array<User>} users Users that are attempted to be added.
 * @returns AN set of objects that were added to the array
 */
function addUsers(user) {
    logEvent(LogLevel.INFO, 'Attempting to add users.');
    let roleCheck = validateRoles(user);
    let groupCheck = validateGroups(user);

    if(!roleCheck){
        logEvent(LogLevel.WARN, 'There was a role that could not be validated while adding a User. You must add the role first, or remove it from the User.');
        logEvent(LogLevel.INFO, 'No Users have been added.');
    }
    if(!groupCheck){
        logEvent(LogLevel.WARN, 'There was a group that could not be validated while adding a User. You must add the group first, or remove it from the User.');
        logEvent(LogLevel.INFO, 'No Users have been added.');
    }

    return addObjects('user', strictProperties(user, User));
}

function getUsers(user){
    const pulledUser = getObjects('user', user);
    return pulledUser;
}

function updateUsers(oldUser, newUser){
    logEvent(LogLevel.INFO, 'Attempting to add users.');
    let roleCheck = validateRoles(newUser);
    let groupCheck = validateGroups(newUser);

    if(!roleCheck){
        logEvent(LogLevel.WARN, 'There was a role that could not be validated while adding a User. You must add the role first, or remove it from the User.');
        logEvent(LogLevel.INFO, 'No Users have been added.');
        return [{}];
    }
    if(!groupCheck){
        logEvent(LogLevel.WARN, 'There was a group that could not be validated while adding a User. You must add the group first, or remove it from the User.');
        logEvent(LogLevel.INFO, 'No Users have been added.');
        return [{}];
    }

    return updateObjects('user', strictProperties(oldUser, User), strictProperties(newUser, User));
}

function removeUsers(user){
    return removeObjects('user', user);
}

module.exports = { addUsers, getUsers, updateUsers, removeUsers }