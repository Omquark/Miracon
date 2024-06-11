'use client'

import { createContext, useReducer } from "react";
import { pullCommands } from "../../api/commands";

const initialCommandsState = [{ name: '', id: '' }];

export const AdminCommandsContext = createContext();

export const commandsActionTypes = {
  ADD_COMMAND: 'ADD_COMMAND',
  GET_COMMAND: 'GET_COMMAND',
  UPDATE_COMMAND: 'UPDATE_COMMAND',
  REMOVE_COMMAND: 'REMOVE_COMMAND',
  REFRESH_COMMAND: 'REFRESH_COMMAND',
  RESPONSE_COMMAND: 'RESPONSE_COMMAND',
}

function commandsReducer(state, action) {
  console.log('action', action);
  switch (action.type.toUpperCase()) {
    case (commandsActionTypes.ADD_COMMAND): {
      console.log('Adding command placeholder');
      return state;
    }
    case (commandsActionTypes.GET_COMMAND): {
      pullCommands(action.context);
      return state;
    }
    case (commandsActionTypes.UPDATE_COMMAND): {
      console.log('Update command placeholder');
      return state;
    }
    case (commandsActionTypes.REMOVE_COMMAND): {
      console.log('Remove command placeholder');
      return state;
    }
    case (commandsActionTypes.REFRESH_COMMAND): {
      console.log('Refresh command placeholder');
      return action.payload;
    }
    case (commandsActionTypes.RESPONSE_COMMAND): {
      console.log('Response command placeholder');
      return state;
    }
  }
}

export default function AdminCommands(props) {

  const { children } = props;
  const [adminCommands, dispatchAdminCommands] = useReducer(commandsReducer, initialCommandsState);

  return (
    <AdminCommandsContext.Provider value={{ adminCommands: adminCommands, dispatchAdminCommands: dispatchAdminCommands }}>
      {children}
    </AdminCommandsContext.Provider>
  )
}