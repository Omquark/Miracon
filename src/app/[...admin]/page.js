'use client'

import Sidebar from "./components/sidebar/Sidebar";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import Role from "./components/roles";
import Group from "./components/groups";
import User from "./components/users";
import BannedPlayers from "./components/banned players";
import BannedIP from "./components/banned ip";
import Whitelist from "./components/whitelist";
import AdminRoles from "./components/context/admin/roles";
import AdminGroups from "./components/context/admin/groups";
import AdminUsers from "./components/context/admin/users";
import { UserPrefContext } from "../layout";

export const UserRolesContext = createContext();

export default function Admin() {

    const { prefs, setPrefs } = useContext(UserPrefContext);
    const [activePage, setActivePage] = useState("");
    const [userRoles, setUserRoles] = useState(['']);
    const pathname = usePathname();

    useEffect(() => {
        //Known pathname will begin with /admin, we need the next pathname ONLY
        const newPage = pathname.split('/')[2];//First element is empty, then admin, 3rd element is what we want
        setActivePage(newPage !== undefined ? newPage.charAt(0).concat(newPage.slice(1)) : '');

        const roles = typeof (window) !== "undefined" ? sessionStorage.getItem('roles') : undefined
        setUserRoles(roles ? roles.split(',') : ['']);
    }, []);

    const adminPageSelector = () => {
        switch (decodeURI(activePage.toLowerCase())) {
            case ('roles'): return <AdminRoles><Role /></AdminRoles>
            case ('groups'): return <AdminRoles><AdminGroups><Group /></AdminGroups></AdminRoles>
            case ('users'): return <AdminRoles><AdminGroups><AdminUsers><User /></AdminUsers></AdminGroups></AdminRoles>
            case ("banned ip"): return <BannedIP />
            case ('banned players'): return <BannedPlayers />
            case ("whitelist"): return <Whitelist />
            default: return <></>
        }
    }

    return (
        <div className='text-center flex'>
            <UserRolesContext.Provider value={{ userRoles: userRoles, setUserRoles: setUserRoles }}>
                <div className='h-screen flex-shrink-1'>
                    <Sidebar />
                </div>
                <div className={`duration-300 w-screen mt-14 ${prefs.sidebarOpen ? 'ml-64' : '' }`}>
                    {adminPageSelector()}
                </div>
            </UserRolesContext.Provider>
        </div>
    )
}