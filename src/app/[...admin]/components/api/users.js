import { bytesToBase64 } from "../../../../../components/utility/Utility";
import { usersActionTypes } from "../context/admin/users";

export async function pullUsers(dispatch) {

    let response;
    let data;

    try {
        response = await fetch(`http://${location.host}/users`,
            {
                headers: {
                    'content-type': 'application/json',
                },
                method: 'GET',
            });

        data = await response.json();

    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /users on GET!' }
    }

    dispatch({ type: usersActionTypes.REFRESH_USER, payload: data });
}

export async function mutateUsers(users, dispatch, verb) {
    let response;
    let data;

    if (verb.toUpperCase() !== 'POST' && verb.toUpperCase() !== 'PUT' && verb.toUpperCase() !== 'DELETE') {
        data = { error: 'A valid verb was not supplied when attempting to mutate a user! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
        return;
    }

    const payload = { data: users };
    console.log('users', users);
    console.log('payload before', payload);
    payload.data.password = bytesToBase64(users.password);
    console.log('payload after', payload);

    try {
        response = await fetch(`http://${location.host}/users`,
            {
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json',
                },
                method: verb.toUpperCase(),
            });

        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /users on POST!' }
    }

    dispatch({ type: usersActionTypes.RESPONSE_USER, payload: data });
}

export async function changePassword(userinfo) {
    let response;
    let data;

    userinfo.password = bytesToBase64(userinfo.password);

    try {
        response = await fetch(`http://${location.host}/change_password`,
            {
                body: JSON.stringify({ userinfo: userinfo }),
                headers: {
                    'content-type': 'application/json',
                },
                method: 'PUT',
            });
        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to update password on PUT' }
    }

    return data;
}