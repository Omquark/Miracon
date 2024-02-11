const { logEvent, LogLevel } = require("../Log");
const { getObjects, addObjects, updateObjects, removeObjects, cascadeRemove, validateRoles } = require("./CRUD");
const { Group } = require("./RoleDefs");
const { strictProperties } = require("./Utility");

function addGroups(group) {
    logEvent(LogLevel.INFO, 'Attempting to add groups.')
    let roleCheck = validateRoles(group);

    if(roleCheck){
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, adding.');
        return addObjects('group', strictProperties(group, Group));
    } else {
        logEvent(LogLevel.INFO, 'There was a role that could not be validated. You must add the role first, or remove it from the group.');
        logEvent(LogLevel.INFO, 'No Groups have been added.');
    }
}

function getGroups(group) {
    logEvent(LogLevel.INFO, 'Retrieving groups from array');
    return getObjects('group', group);
}

function updateGroups(oldGroup, newGroup) {
    logEvent(LogLevel.INFO, 'Attempting to update groups.')
    let roleCheck = validateRoles(newGroup);

    if(roleCheck){
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, adding.');
        return updateObjects('group', strictProperties(oldGroup, Group), strictProperties(newGroup, Group));
    } else {
        logEvent(LogLevel.WARN, 'There was a role that could not be validated while trying to update a group. You must add the role first, or remove it from the group.');
        logEvent(LogLevel.INFO, 'No Groups have been updated.');
    };
    
    return [{}];
}

function removeGroups(group) {
    logEvent(LogLevel.INFO, 'Attempting to remove groups.')
    let roleCheck = validateRoles(group);

    if(roleCheck){
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, removing.');
        cascadeRemove(strictProperties(group, Group), 'group', 'user');
        return removeObjects('group', strictProperties(group, Group));
    } else {
        logEvent(LogLevel.INFO, 'There was a role that could not be validated. You must add the role first, or remove it from the group.');
        logEvent(LogLevel.INFO, 'No Groups have been removed.');
    }

    return [{}];
}

/**
 * Takes an Array of Users or Groups and returns the roles contained by each
 * @param {Array<User> | Array<Group>} target An array of users or groups to find the roles for
 * @return {Array<string>} A string with the role ids pulled from the target
 */
function resolveRoles(target){

    const pulledRoles = []

    console.log('target', target);

    target.forEach(ob => {
        if(ob.roles && Array.isArray(ob.roles) && ob.roles.length > 0){
            ob.roles.forEach(role => pulledRoles.push(role));
        }
        if(ob.groups && Array.isArray(ob.groups) && ob.groups.length > 0){
            const pulledGroups = getGroups(ob.groups);
            pulledGroups.forEach(group => {
                console.log('ob group', group);
                if(group.roles && isArray(group.roles) && group.roles.length > 0){
                    groups.roles.forEach(role => {
                        pulledRoles.push(role);
                    })
                }
            });
        }
    });

    return pulledRoles;
}

module.exports = { addGroups, getGroups, updateGroups, removeGroups, resolveRoles }