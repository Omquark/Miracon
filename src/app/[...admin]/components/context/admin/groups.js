'use client'

import { createContext, useReducer, useContext, useEffect } from "react"
import { pullGroups, mutateGroups } from "../../api/groups";
import { AdminRolesContext, rolesActionTypes } from "./roles";

const initialGroupsState = [{ name: '', id: '' }]

export const AdminGroupsContext = createContext();

export const groupsActionTypes = {
  CREATE_GROUP: 'CREATE_GROUP',
  GET_GROUP: 'GET_GROUP',
  UPDATE_GROUP: 'UPDATE_GROUP',
  REMOVE_GROUP: 'REMOVE_GROUP',
  REFRESH_GROUP: 'REFRESH_GROUP',
  RESPONSE_GROUP: 'RESPONSE_GROUP',
}

/**
 * action object
 * @property {groupsActionType} type Action to perform
 * @property {Array<Group>} payload An array of groups to display the info on-page
 * @property {context} context The context used when calling this function. Passed to the API to make dispatch calls
 */

/**
 * Reducer for the groups, used to perform CRUD funtcions to the groups object
 * @param {any} state The state as passed by the reducer
 * @param {Object} action An object containing details regarding how to transform the state
 * @returns The new state to be used
 */
function groupsReducer(state, action) {
  switch (action.type.toUpperCase()) {
    //Hits the endpoint to add
    case (groupsActionTypes.CREATE_GROUP): {
      mutateGroups(action.payload, action.context, 'POST');
      return state;
    }
    //Retrieves and updates all groups
    case (groupsActionTypes.GET_GROUP): {
      pullGroups(action.context);
      return state;
    }
    //Updates a single group
    case (groupsActionTypes.UPDATE_GROUP): {
      // COMMENT: action object = { type: "UPDATE_GROUP", payload: { newGroup }, context: context for THIS reducer function}
      mutateGroups(action.payload, action.context, 'PUT');
      const newGroup = state.find(group => group.id === action.payload.id);
      newGroup.name = action.payload.name;
      newGroup.roles = [...action.payload.roles];
      const newGroups = [...state];
      return newGroups;
    }
    //Removes a single group
    case (groupsActionTypes.REMOVE_GROUP): {
      mutateGroups(action.payload, action.context, 'DELETE');
      const removeGroupIndex = state.findIndex(group => group.id === action.payload.id || group.name === action.payload.name);
      const newState = [...state];
      newState.splice(removeGroupIndex, 1);
      return newState;
    }
    //Used to show the response to the user
    case (groupsActionTypes.RESPONSE_GROUP): {
      if (action.payload.error) {
        alert(`There was an error while updating the group!\nDetails: ${action.payload.error}`);
        location.reload();
        return state;
      }

      //return state if payload < 0 AND the payload is in the original array
      return action.payload.length > 0 &&
        state.find(group => group.name === action.payload[0].name) ?
        state :
        //otherwise add the payload to the array and return as a new state
        [...state, ...action.payload]
    }
    //Updates the groups with the payload sent. Used with pullGroups, this is called by the API
    case (groupsActionTypes.REFRESH_GROUP): {
      return action.payload;
    }
    //Action does not exist
    default: {
      console.log('action', action);
      console.log('Hit default in group reducer! Returning current state, no logic');
      return state;
    }
  }
}

export default function AdminGroups(props) {

  const { dispatchAdminRoles } = useContext(AdminRolesContext);

  const { children } = props;

  const [adminGroups, dispatchAdminGroups] = useReducer(groupsReducer, initialGroupsState);

  useEffect(() => {
    dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
  }, [dispatchAdminRoles])

  return (
    <AdminGroupsContext.Provider value={{ adminGroups: adminGroups, dispatchAdminGroups: dispatchAdminGroups }}>
      {children}
    </AdminGroupsContext.Provider>
  )
}