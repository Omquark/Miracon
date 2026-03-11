'use client'

import { createContext, useMemo, useReducer } from "react"
import whitelistReducerModule from "./reducers/whitelistReducer";

const { initialWhitelistState, whitelistActionTypes, whitelistReducer } = whitelistReducerModule;

export const AdminWhitelistContext = createContext();
export { whitelistActionTypes };

export default function AdminWhitelist({ children }) {
  const [adminWhitelist, dispatchAdminWhitelist] = useReducer(whitelistReducer, initialWhitelistState);
  const value = useMemo(
    () => ({ adminWhitelist, dispatchAdminWhitelist }),
    [adminWhitelist, dispatchAdminWhitelist]
  );

  return (
    <AdminWhitelistContext.Provider value={value}>
      {children}
    </AdminWhitelistContext.Provider>
  );
}
