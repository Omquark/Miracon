const { logEvent, LogLevel } = require("../Log");
const { getObjects, addObjects, updateObjects, removeObjects, cascadeRemove } = require("./CRUD");
const { Role } = require("./RoleDefs");
const { strictProperties } = require('./Utility');

/**
 * Removes extra fields from role objects before inserting into the master list.
 * @param {Role | Array<Role>} role A role or list of roles to process
 * @return An array of new elements with only the name and id properties
 */

function addRoles(role) {
    logEvent(LogLevel.INFO, `Attempting to add role ${JSON.stringify(role)} to array.`);
    return addObjects('role', strictProperties(role, Role));
}

function getRoles(role) {
    logEvent(LogLevel.INFO, 'Retrieving roles from array');
    return getObjects('role', role);
}

function updateRoles(oldRoles, newRoles) {
    logEvent(LogLevel.INFO, 'attempting to update roles in array');
    return updateObjects('role', strictProperties(oldRoles, Role), strictProperties(newRoles, Role));
}

function removeRoles(role) {
    logEvent(LogLevel.INFO, 'Cascade removing roles from array');
    const rs = Array.isArray(role) ? [...role] : [role];

    cascadeRemove(strictProperties(role, Role), 'role', 'group');
    cascadeRemove(strictProperties(role, Role), 'role', 'user');

    return removeObjects('role', strictProperties(rs, Role));
}

module.exports = { addRoles, getRoles, updateRoles, removeRoles }