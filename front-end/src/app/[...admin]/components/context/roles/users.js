'use client'

import { createContext, useReducer, useContext, useEffect } from "react"
import { pullUsers, saveUsers } from "../../api/users";
import { AdminRolesContext, rolesActionTypes } from "./roles";
import { pullRoles } from "../../api/roles";
import { AdminGroupsContext, groupsActionTypes } from "./groups";

const initialUsersState = [{ name: '', id: '' }]

export const AdminUsersContext = createContext();

export const usersActionTypes = {
  ADD_USER: 'ADD_USER',
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
    case (usersActionTypes.ADD_USER): {
      console.log('adding users placeholder');
      return state;
    }
    //Retrieves and updates all users
    case (usersActionTypes.GET_USER): {
      pullUsers(action.context);
      return state;
    }
    //Updates a single user
    case (usersActionTypes.UPDATE_USER): {
      // COMMENT: action object = { type: "UPDATE_USER", payload: { newUser }, context: context for THIS reducer function}
      saveUsers(action.payload, action.context);
      const newUser = state.find(user => user.id === action.payload.id);
      newUser.name = action.payload.name;
      newUser.roles = [...action.payload.roles];
      const newUsers = [...state];
      return newUsers;
    }
    //Removes a single user
    case (usersActionTypes.REMOVE_USER): {
      console.log('removing users')
      return state;
    }
    //Used to show the response to the user
    case (usersActionTypes.RESPONSE_USER): {
      if (action.payload.error) {
        alert(`There was an error while updating the user!\nDetails: ${action.payload.error}`);
        location.reload();
        return state;
      }
      return state;
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

  const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);
  const { adminGroups, dispatchAdminGroups } = useContext(AdminGroupsContext);

  const { children } = props;

  const [adminUsers, dispatchAdminUsers] = useReducer(usersReducer, initialUsersState);

  useEffect(() => {
    dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
  }, [])

  return (
      <AdminUsersContext.Provider value={{ adminUsers: adminUsers, dispatchAdminUsers: dispatchAdminUsers }}>
        {children}
      </AdminUsersContext.Provider>
  )
}