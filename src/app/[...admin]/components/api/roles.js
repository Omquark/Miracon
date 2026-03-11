const { isValidMutationVerb, requestApi } = require("./client");
const rolesActionTypes = {
    REFRESH_ROLE: 'REFRESH_ROLE',
    RESPONSE_ROLE: 'RESPONSE_ROLE',
};

async function pullRoles(dispatch) {
    const data = await requestApi('/roles', { method: 'GET' });

    if (data.error) {
        alert(`There was an error attempting to get the roles from the server!\n${data.error}`);
        return;
    }

    dispatch({ type: rolesActionTypes.REFRESH_ROLE, payload: data });
}

async function mutateRoles(roles, dispatch, verb) {
    if (!isValidMutationVerb(verb)) {
        const data = { error: 'A valid verb was not supplied when attempting to mutate a role! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
        return;
    }

    const data = await requestApi('/roles', { method: verb.toUpperCase(), data: roles });

    dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
}

module.exports = { pullRoles, mutateRoles };
