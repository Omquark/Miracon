const { bytesToBase64 } = require("../../../../../components/utility/Utility");
const { isValidMutationVerb, requestApi } = require("./client");
const usersActionTypes = {
    REFRESH_USER: 'REFRESH_USER',
    RESPONSE_USER: 'RESPONSE_USER',
};

async function pullUsers(dispatch) {
    const data = await requestApi('/users', { method: 'GET' });

    dispatch({ type: usersActionTypes.REFRESH_USER, payload: data });
}

async function mutateUsers(users, dispatch, verb) {
    if (!isValidMutationVerb(verb)) {
        const data = { error: 'A valid verb was not supplied when attempting to mutate a user! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: usersActionTypes.RESPONSE_USER, payload: data });
        return;
    }

    const payload = { ...users };
    if (typeof users?.password === 'string' && users.password.length > 0) {
        payload.password = bytesToBase64(users.password);
    }
    const data = await requestApi('/users', { method: verb.toUpperCase(), data: payload });

    dispatch({ type: usersActionTypes.RESPONSE_USER, payload: data });
}

async function changePassword(userinfo) {
    const payload = {
        ...userinfo,
        oldPassword: bytesToBase64(userinfo.oldPassword),
        newPassword: bytesToBase64(userinfo.newPassword),
    };

    return requestApi('/change_password', { method: 'PUT', body: { userinfo: payload } });
}

async function retrieveUUID(username) {
    let response;
    let data;

    try {
        response = await fetch(`https://playerdb.co/api/player/minecraft/${username}`,
            {
                headers: {
                    'content-type': 'text/html'
                },
                method: 'GET',
            });
        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: `Failed to retrieve user ${username}` }
    }

    return data;
}

module.exports = { pullUsers, mutateUsers, changePassword, retrieveUUID };
