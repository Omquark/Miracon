const bcrypt = require('bcrypt')

const { logEvent, LogLevel } = require("../Log");
const { getUsers, updateUsers } = require("../rbac/User");
const { resolveRoles } = require("../rbac/Group");
const { getRoles } = require('../rbac/Role');
const { bytesFromBase64, } = require('../utility/Utility');

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

    let password = bytesFromBase64(userInfo.password);

    const verified = await bcrypt.compare(password, pulledUsers[0].password);

    if (!verified) {
        logEvent(LogLevel.INFO, `Invalid password given at an attempted login for user ${pulledUsers[0].name}`);
        return { error: 'The username or password was not valid!' };
    }

    const resolvedRoles = [];
    const userRoles = await resolveRoles(pulledUsers[0]);
    for (let roleID of userRoles) {
        logEvent(LogLevel.DEBUG, `roleID: ${roleID}`);
        const role = await getRoles({ id: roleID });
        const roleName = role[0].name;
        resolvedRoles.push(roleName);
    }

    let sessionInfo = {
        name: pulledUsers[0].name,
        email: pulledUsers[0].email,
        roles: resolvedRoles,
        changePassword: pulledUsers[0].changePassword,
    }

    return sessionInfo;
}

async function updatePassword(userinfo) {
    const user = (await getUsers({ name: userinfo.username }))[0];
    if (!user) {
        return { error: 'User could not be found to update password!' }
    }
    let passwordMatch = await bcrypt.compare(userinfo.oldPassword, user.password);
    if (!passwordMatch) {
        return { error: 'Old password does not match!' }
    }

    let newPassword = await bcrypt.hash(userinfo.newPassword, 14);
    await updateUsers(user, { ...user, password: newPassword, changePassword: false });
    return { message: 'Password updated' };
}

module.exports = { checkAndLoginUser, updatePassword, }