'use client'

import { createContext, useMemo, useReducer } from "react"
import rolesReducerModule from "./reducers/rolesReducer";

const { initialRolesState, rolesActionTypes, rolesReducer } = rolesReducerModule;

export const AdminRolesContext = createContext();
export { rolesActionTypes };

export default function AdminRoles({ children }) {
  const [adminRoles, dispatchAdminRoles] = useReducer(rolesReducer, initialRolesState);
  const value = useMemo(() => ({ adminRoles, dispatchAdminRoles }), [adminRoles, dispatchAdminRoles]);

  return (
    <AdminRolesContext.Provider value={value}>
      {children}
    </AdminRolesContext.Provider>
  )
}
