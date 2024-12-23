'use client'

import { createContext, useReducer } from "react"
import { pullRoles, mutateRoles } from "../../api/roles";

const initialRolesState = [{ name: '', id: '' }]

export const AdminRolesContext = createContext();

export const rolesActionTypes = {
  CREATE_ROLE: 'CREATE_ROLE',
  GET_ROLE: 'GET_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  REMOVE_ROLE: 'REMOVE_ROLE',
  REFRESH_ROLE: 'REFRESH_ROLE',
  RESPONSE_ROLE: 'RESPONSE_ROLE',
}

/**
 * action object
 * @property {rolesActionType} type Action to perform
 * @property {Array<Role>} payload An array of roles to display the info on-page
 * @property {context} context The context used when calling this function. Passed to the API to make dispatch calls
 */

/**
 * Reducer for the roles, used to perform CRUD funtcions to the roles object
 * @param {any} state The state as passed by the reducer
 * @param {Object} action An object containing details regarding how to transform the state, detailed above
 * @returns The new state to be used
 */
function rolesReducer(state, action) {
  switch (action.type.toUpperCase()) {
    //Hits the endpoint to add
    case (rolesActionTypes.CREATE_ROLE): {
      mutateRoles(action.payload, action.context, 'POST');
      return state;
    }
    //Retrieves and updates all roles
    case (rolesActionTypes.GET_ROLE): {
      pullRoles(action.context);
      return state;
    }
    //Updates a single role
    case (rolesActionTypes.UPDATE_ROLE): {
      mutateRoles(action.payload, action.context, 'PUT');
      // const newRoles = [...state];
      // const newRole = newRoles.find(role => role.id === action.payload.id);
      // newRole.name = action.payload.name;
      const newRoles = state.map(role => {
        if (role.id === action.payload.id) {
          role.name = action.payload.name;
        }
        return role;
      });
      return newRoles;
    }
    //Removes a single role
    case (rolesActionTypes.REMOVE_ROLE): {
      mutateRoles(action.payload, action.context, 'DELETE');
      const removedRoleIndex = state.findIndex(role => role.id === action.payload.id || role.name === action.payload.name);
      const newState = [...state];
      newState.splice(removedRoleIndex, 1);
      return newState;
    }
    //Used to show the response to the user
    case (rolesActionTypes.RESPONSE_ROLE): {
      console.log('action', action);
      if (action.payload.error) {
        // alert(`There was an error while updating the role!\nDetails: ${action.payload.error}`);
        location.reload();
        return state;
      }
      //Checks if the array already contains the role, if not, add it to the array
      return state.find(role => role.name === action.payload[0].name) ? [...state] : [...state, ...action.payload];
    }
    //Updates the roles with the payload sent. Used with pullRoles, this is called by the API specifically
    case (rolesActionTypes.REFRESH_ROLE): {
      return action.payload;
    }
    //Action does not exist
    default: {
      console.log('Hit default in role reducer! Returning current state, no logic');
      return state;
    }
  }
}

export default function AdminRoles(props) {

  const { children } = props;
  const [adminRoles, dispatchAdminRoles] = useReducer(rolesReducer, initialRolesState);

  return (
    <AdminRolesContext.Provider value={{ adminRoles: adminRoles, dispatchAdminRoles: dispatchAdminRoles }}>
      {children}
    </AdminRolesContext.Provider>
  )
}