import { rolesActionTypes } from "../context/roles/roles";

export async function pullRoles(dispatch){

    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/roles`, 
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
        data = { error: 'Failed to access /roles on GET!' }
    }

    dispatch({ type: rolesActionTypes.REFRESH_ROLE, payload: data });
}

export async function saveRoles(roles, dispatch){
    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/roles`,
        {
            body: JSON.stringify(roles),
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        });

        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /roles on POST!' }
    }

    dispatch({ type: rolesActionTypes.RESPONSE_ROLE, payload: data });
}