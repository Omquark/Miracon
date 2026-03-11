'use client'

import { createContext, useMemo, useReducer } from "react"
import { Flip, ToastContainer } from "react-toastify";
import usersReducerModule from "./reducers/usersReducer";

const { initialUsersState, usersActionTypes, usersReducer } = usersReducerModule;

export const AdminUsersContext = createContext();
export { usersActionTypes };

export default function AdminUsers({ children }) {
  const [adminUsers, dispatchAdminUsers] = useReducer(usersReducer, initialUsersState);
  const value = useMemo(() => ({ adminUsers, dispatchAdminUsers }), [adminUsers, dispatchAdminUsers]);

  return (
    <AdminUsersContext.Provider value={value}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        transition={Flip}
      />
    </AdminUsersContext.Provider>
  )
}
