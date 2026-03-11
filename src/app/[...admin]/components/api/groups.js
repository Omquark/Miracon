const { isValidMutationVerb, requestApi } = require("./client");
const groupsActionTypes = {
    REFRESH_GROUP: 'REFRESH_GROUP',
    RESPONSE_GROUP: 'RESPONSE_GROUP',
};

async function pullGroups(dispatch) {
    const data = await requestApi('/groups', { method: 'GET' });

    dispatch({ type: groupsActionTypes.REFRESH_GROUP, payload: data });
}

async function mutateGroups(groups, dispatch, verb) {
    if (!isValidMutationVerb(verb)) {
        const data = { error: 'A valid verb was not supplied when attempting to mutate a group! Supply either POST, PUT, or DELETE for action.' }
        dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
        return;
    }

    const data = await requestApi('/groups', { method: verb.toUpperCase(), data: groups });

    dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
}

module.exports = { pullGroups, mutateGroups };
