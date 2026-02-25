'use client'

import { createContext, useMemo, useReducer } from "react";
import commandsReducerModule from "./reducers/commandsReducer";

const { initialCommandsState, commandsActionTypes, commandsReducer } = commandsReducerModule;

export const AdminCommandsContext = createContext();
export { commandsActionTypes };

export default function AdminCommands({ children }) {
  const [adminCommands, dispatchAdminCommands] = useReducer(commandsReducer, initialCommandsState);
  const value = useMemo(
    () => ({ adminCommands, dispatchAdminCommands }),
    [adminCommands, dispatchAdminCommands]
  );

  return (
    <AdminCommandsContext.Provider value={value}>
      {children}
    </AdminCommandsContext.Provider>
  )
}
