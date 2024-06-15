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

export async function saveRoles(roles, dispatch, action) {
    let response;
    let data;

    const payload = { data: roles, action: action }

    try {
        response = await fetch(`http://${location.host}/roles`,
            {
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json',
                },
                method: 'POST',
            });

        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /roles on POST!' }
    }

    dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
}