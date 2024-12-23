'use client'

import { createContext, useReducer, useContext, useEffect } from "react"
import { pullUsers, mutateUsers } from "../../api/users";
import { AdminRolesContext, rolesActionTypes } from "./roles";
import { AdminGroupsContext, groupsActionTypes } from "./groups";

const initialUsersState = [{ name: '', id: '' }]

export const AdminUsersContext = createContext();

export const usersActionTypes = {
  CREATE_USER: 'CREATE_USER',
  GET_USER: 'GET_USER',
  UPDATE_USER: 'UPDATE_USER',
  REMOVE_USER: 'REMOVE_USER',
  REFRESH_USER: 'REFRESH_USER',
  RESPONSE_USER: 'RESPONSE_USER',
}

/**
 * action object
 * @property {usersActionType} type Action to perform
 * @property {Array<User>} payload An array of users to display the info on-page
 * @property {context} context The context used when calling this function. Passed to the API to make dispatch calls
 */

/**
 * Reducer for the users, used to perform CRUD funtcions to the users object
 * @param {any} state The state as passed by the reducer
 * @param {Object} action An object containing details regarding how to transform the state
 * @returns The new state to be used
 */
function usersReducer(state, action) {
  switch (action.type.toUpperCase()) {
    //Hits the endpoint to add
    case (usersActionTypes.CREATE_USER): {
      mutateUsers(action.payload, action.context, 'POST');
      return state;
    }
    //Retrieves and updates all users
    case (usersActionTypes.GET_USER): {
      pullUsers(action.context);
      return state;
    }
    //Updates a single user
    case (usersActionTypes.UPDATE_USER): {
      mutateUsers(action.payload, action.context);
      const newUser = state.find(user => user.id === action.payload.id);
      newUser.name = action.payload.name;
      newUser.roles = [...action.payload.roles];
      const newUsers = [...state];
      return newUsers;
    }
    //Removes a single user
    case (usersActionTypes.REMOVE_USER): {
      mutateUsers(action.payload, action.context, 'DELETE');
      const removeUserIndex = state.findIndex(user => user.id === action.payload.id || user.name === action.payload.name || user.email === action.payload.email);
      const newState = [...state];
      newState.splice(removeUserIndex, 1);
      return newState;
    }
    //Used to show the response to the user
    case (usersActionTypes.RESPONSE_USER): {
      if (action.payload.error) {
        alert(`There was an error while updating the user!\nDetails: ${action.payload.error}`);
        location.reload();
        return state;
      }

      return action.payload.length > 0 &&
        state.find(user => user.name === action.payload[0].name) ?
        state :
        [...state, ...action.payload];
    }
    //Updates the users with the payload sent. Used with pullUsers, this is called by the API
    case (usersActionTypes.REFRESH_USER): {
      return action.payload;
    }
    //Action does not exist
    default: {
      console.log('action', action);
      console.log('Hit default in user reducer! Returning current state, no logic');
      return state;
    }
  }
}

export default function AdminUsers(props) {

  const { dispatchAdminRoles } = useContext(AdminRolesContext);
  const { dispatchAdminGroups } = useContext(AdminGroupsContext);

  const { children } = props;

  const [adminUsers, dispatchAdminUsers] = useReducer(usersReducer, initialUsersState);

  useEffect(() => {
    dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
  }, [dispatchAdminGroups, dispatchAdminRoles])

  return (
    <AdminUsersContext.Provider value={{ adminUsers: adminUsers, dispatchAdminUsers: dispatchAdminUsers }}>
      {children}
    </AdminUsersContext.Provider>
  )
}