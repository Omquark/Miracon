const bcrypt = require('bcrypt')

const { logEvent, LogLevel } = require("../Log");
const { getUsers } = require("../rbac/User");
const { getGroups, resolveRoles } = require("../rbac/Group");
const { getRoles } = require('../rbac/Role');

/**
 * Checkes the userInfo against the User db to confirm username and password.
 * @param {Object} userInfo containse username and password used to check against the user DB
 * @returns Either an error message to pass to the front end or user sessionInfo object, which is 
 * username, email, user roles, resolved from roles and groups the user belongs to
 */
async function checkAndLoginUser(userInfo) {
    if (!userInfo.username || !userInfo.password) {
        logEvent(LogLevel.DEBUG, 'Attempted to login without as username or password');
        return { error: 'The username or password was not valid!' };
    }

    const pulledUsers = await getUsers({ name: userInfo.username });
    logEvent(LogLevel.DEBUG, `userInfo from login: ${JSON.stringify(userInfo)}`);
    logEvent(LogLevel.DEBUG, `pulleUser info: ${JSON.stringify(pulledUsers[0])}`);

    if (pulledUsers.length === 0 || !pulledUsers[0]) {
        logEvent(LogLevel.DEBUG, `Unable to find user with username ${userInfo.username}`);
        return { error: 'The username or password was not valid!' };
    }

    let password = bytesFromBase64(new TextEncoder().encode(userInfo.password));

    const verified = await bcrypt.compare(password, pulledUsers[0].password);

    if (!verified) {
        logEvent(LogLevel.INFO, `Invalid password given at an attempted login for user ${pulledUsers[0].name}`);
        return { error: 'The username or password was not valid!' };
    }

    // const resolvedRoles = (await resolveRoles(pulledUsers[0])).map(role => getRoles({ id: role })[0].name);
    const resolvedRoles = [];
    const userRoles = await resolveRoles(pulledUsers[0]);
    for (roleID of userRoles) {
        logEvent(LogLevel.DEBUG, `roleID: ${roleID}`);
        const role = await getRoles({ id: roleID });
        const roleName = role[0].name;
        resolvedRoles.push(roleName);
    }
    sessionInfo = {
        name: pulledUsers[0].name,
        email: pulledUsers[0].email,
        roles: resolvedRoles,
    }

    return sessionInfo;
}

function bytesToBase64(bytes) {
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
}

function bytesFromBase64(bytes) {
    const binString = String.fromCodePoint(...bytes);
    return atob(binString);
}

module.exports = { checkAndLoginUser }