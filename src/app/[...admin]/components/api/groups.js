import { groupsActionTypes } from "../context/roles/groups";

export async function pullGroups(dispatch){

    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/groups`, 
        {
            headers: {
                'content-type': 'application/json',
            },
            method: 'GET',
            mode: 'cors',
        });

        data = await response.json();

    } catch(err)  {
        console.log(err);
        data = { error: 'Failed to access /groups on GET!' }
    }

    //console.log('data', data);

    dispatch({ type: groupsActionTypes.REFRESH_GROUP, payload: data });
}

export async function saveGroups(groups, dispatch){
    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/groups`,
        {
            body: JSON.stringify(groups),
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        });

        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /groups on POST!' }
    }

    dispatch({ type: groupsActionTypes.RESPONSE_GROUP, payload: data });
}