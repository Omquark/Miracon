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

module.exports = { addGroups, getGroups, updateGroups, removeGroups }