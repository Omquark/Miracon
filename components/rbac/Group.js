const { logEvent, LogLevel } = require("../Log");
const { getObjects, addObjects, updateObjects, removeObjects, cascadeRemove, validateRoles } = require("./CRUD");
const { Group } = require("./RoleDefs");
const { strictProperties } = require("./Utility");

async function addGroups(group) {
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

async function getGroups(group) {
    logEvent(LogLevel.INFO, 'Retrieving groups from array');
    return await getObjects('group', group);
}

async function updateGroups(oldGroup, newGroup) {
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

async function removeGroups(group) {
    logEvent(LogLevel.INFO, 'Attempting to remove groups.')
    let roleCheck = validateRoles(group);

    if(roleCheck){
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, removing.');
        await cascadeRemove(strictProperties(group, Group), 'group', 'user');
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
async function resolveRoles(target){
    const pulledRoles = [];

    const toResolve = Array.isArray(target) ? [...target] : [target]

    toResolve.forEach(ob => {
        if(ob.roles && Array.isArray(ob.roles) && ob.roles.length > 0){
            ob.roles.forEach(role => pulledRoles.push(role));
        }
        if(ob.groups && Array.isArray(ob.groups) && ob.groups.length > 0){
            ob.groups.forEach(group => {
                const pulledGroup = getGroups({ id: group });
                pulledGroup[0].roles.forEach(role => {
                    pulledRoles.push(role);
                })
            });
        }
    });

    return pulledRoles;
}

module.exports = { addGroups, getGroups, updateGroups, removeGroups, resolveRoles }