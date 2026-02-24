const { logEvent, LogLevel } = require("../Log");
const { getObjects, addObjects, updateObjects, removeObjects, cascadeRemove, validateRoles } = require("./CRUD");
const { Group } = require("./RoleDefs");
const { strictProperties } = require("./Utility");

async function addGroups(group) {
    logEvent(LogLevel.INFO, 'Attempting to add groups.')
    let roleCheck = await validateRoles(group);

    if (roleCheck) {
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, adding.');
        return addObjects('group', strictProperties(group, Group));
    } else {
        logEvent(LogLevel.INFO, 'There was a role that could not be validated. You must add the role first, or remove it from the group.');
        logEvent(LogLevel.INFO, 'No Groups have been added.');
    }

    return [];
}

async function getGroups(group) {
    logEvent(LogLevel.INFO, 'Retrieving groups from array');
    return await getObjects('group', group);
}

async function updateGroups(oldGroup, newGroup) {
    logEvent(LogLevel.INFO, 'Attempting to update groups.')
    let roleCheck = await validateRoles(newGroup);

    if (roleCheck) {
        logEvent(LogLevel.INFO, 'Was able to validate all group roles, adding.');
        return updateObjects('group', strictProperties(oldGroup, Group), strictProperties(newGroup, Group));
    } else {
        logEvent(LogLevel.WARN, 'There was a role that could not be validated while trying to update a group. You must add the role first, or remove it from the group.');
        logEvent(LogLevel.INFO, 'No Groups have been updated.');
    };

    return [];
}

async function removeGroups(group) {
    logEvent(LogLevel.INFO, 'Attempting to remove groups.')
    const gs = Array.isArray(group) ? [...group] : [group];
    for (const g of gs) {
        if (g?.id) {
            await cascadeRemove(g.id, 'group', 'user');
        }
    }
    return removeObjects('group', strictProperties(group, Group));
}

/**
 * Takes an Array of Users or Groups and returns the roles contained by each
 * @param {Array<User> | Array<Group>} target An array of users or groups to find the roles for
 * @return {Array<string>} A string with the role ids pulled from the target
 */
async function resolveRoles(target) {
    const pulledRoles = [];

    const toResolve = Array.isArray(target) ? [...target] : [target]
    const groupIds = new Set();
    toResolve.forEach(ob => {
        if (!ob || !Array.isArray(ob.groups)) return;
        ob.groups.forEach(groupId => {
            if (groupId !== undefined && groupId !== null) {
                groupIds.add(groupId);
            }
        });
    });

    const groupRoleMap = new Map();
    if (groupIds.size > 0) {
        const pulledGroups = await getGroups([...groupIds].map(id => ({ id })));
        pulledGroups.forEach(group => {
            if (!group || group.id === undefined || !Array.isArray(group.roles)) return;
            groupRoleMap.set(group.id, group.roles);
        });
    }

    for (const ob of toResolve) {
        if (ob.roles && Array.isArray(ob.roles) && ob.roles.length > 0) {
            ob.roles.forEach(role => pulledRoles.push(role));
        }
        if (ob.groups && Array.isArray(ob.groups) && ob.groups.length > 0) {
            for (const groupId of ob.groups) {
                const groupRoles = groupRoleMap.get(groupId);
                groupRoles?.forEach(role => {
                    pulledRoles.push(role);
                });
            }
        }
    }

    return pulledRoles;
}

module.exports = { addGroups, getGroups, updateGroups, removeGroups, resolveRoles }
