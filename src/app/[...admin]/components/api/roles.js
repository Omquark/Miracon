import { rolesActionTypes } from "../context/admin/roles";

export async function pullRoles(dispatch) {

    let response;
    let data;

    try {
        response = await fetch(`http://${location.host}/roles`,
            {
                headers: {
                    'content-type': 'application/json',
                },
                method: 'GET',
            });

        data = await response.json();

    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /roles on GET!' }
    }

    if (data.error) {
        alert(`There was an error attempting to get the roles from the server!\n${data.error}`);
        return;
    }

    dispatch({ type: rolesActionTypes.REFRESH_ROLE, payload: data });
}

export async function mutateRoles(roles, dispatch, verb) {
    let response;
    let data;

    if (verb.toUpperCase() !== 'POST' && verb.toUpperCase() !== 'PUT' && verb.toUpperCase() !== 'DELETE') {
        data = { error: 'A valid verb was not supplied when attempting to mutate a role! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
        return;
    }

    const payload = { data: roles }

    try {
        response = await fetch(`http://${location.host}/roles`,
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
        data = { error: `Failed to access /roles on ${verb}!` }
    }

    dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
}