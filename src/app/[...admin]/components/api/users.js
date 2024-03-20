import { usersActionTypes } from "../context/admin/users";

export async function pullUsers(dispatch){

    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/users`, 
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
        data = { error: 'Failed to access /users on GET!' }
    }

    //console.log('data', data);

    dispatch({ type: usersActionTypes.REFRESH_USER, payload: data });
}

export async function saveUsers(users, dispatch){
    let response;
    let data;

    try{
        response = await fetch(`http://${location.host}/users`,
        {
            body: JSON.stringify(users),
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        });

        data = await response.json();
    } catch (err) {
        console.log(err);
        data = { error: 'Failed to access /users on POST!' }
    }

    dispatch({ type: usersActionTypes.RESPONSE_USER, payload: data });
}