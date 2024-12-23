import { groupsActionTypes } from "../context/admin/groups";

export async function pullGroups(dispatch) {

    let response;
    let data;

    try {
        response = await fetch(`http://${location.host}/groups`,
            {
                headers: {
                    'content-type': 'application/json',
                },
                method: 'GET',
            });

        data = await response.json();

    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /groups on GET!' }
    }

    dispatch({ type: groupsActionTypes.REFRESH_GROUP, payload: data });
}

export async function mutateGroups(groups, dispatch, verb) {
    let response;
    let data;

    if (verb.toUpperCase() !== 'POST' && verb.toUpperCase() !== 'PUT' && verb.toUpperCase() !== 'DELETE') {
        data = { error: 'A valid verb was not supplied when attempting to mutate a group! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
        return;
    }

    const payload = { data: groups };

    try {
        response = await fetch(`http://${location.host}/groups`,
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
        data = { error: `Failed to access /groups on ${verb}!` };
    }

    dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
}