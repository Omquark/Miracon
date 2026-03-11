'use client'

import { createContext, useMemo, useReducer } from "react"
import groupsReducerModule from "./reducers/groupsReducer";

const { initialGroupsState, groupsActionTypes, groupsReducer } = groupsReducerModule;

export const AdminGroupsContext = createContext();
export { groupsActionTypes };

export default function AdminGroups({ children }) {
  const [adminGroups, dispatchAdminGroups] = useReducer(groupsReducer, initialGroupsState);
  const value = useMemo(() => ({ adminGroups, dispatchAdminGroups }), [adminGroups, dispatchAdminGroups]);

  return (
    <AdminGroupsContext.Provider value={value}>
      {children}
    </AdminGroupsContext.Provider>
  )
}
