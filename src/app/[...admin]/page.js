'use client'

import Sidebar from "./components/sidebar/Sidebar";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Role from "./components/roles";
import Group from "./components/groups";
import User from "./components/users";
import BannedPlayers from "./components/banned players";
import BannedIP from "./components/banned ip";
import Whitelist from "./components/whitelist";
import AdminRoles from "./components/context/admin/roles";
import AdminGroups from "./components/context/admin/groups";
import AdminUsers from "./components/context/admin/users";
import { UserInfoContext, UserPrefContext } from "../layout";
import Command from './components/commands';
import AdminCommands from "./components/context/admin/commands";
import PasswordModal from "./components/PasswordModal/PasswordModal";
import CommandExecution from "./components/CommandExecution";

export default function Admin() {

    const { prefs, } = useContext(UserPrefContext);
    const { userInfo, setUserInfo } = useContext(UserInfoContext);
    const [activePage, setActivePage] = useState("");
    const pathname = usePathname();

    useEffect(() => {
        //Known pathname will begin with /admin, we need the next pathname ONLY
        const newPage = pathname.split('/')[2];//First element is empty, then admin, 3rd element is what we want
        setActivePage(newPage !== undefined ? newPage.charAt(0).concat(newPage.slice(1)) : '');
        const info = {
            roles: typeof (window) !== "undefined" ? sessionStorage.getItem('roles').split(',') : [''],
            username: typeof (window) !== "undefined" ? sessionStorage.getItem('username') : '',
            userEmail: typeof (window) !== "undefined" ? sessionStorage.getItem('useremail') : '',
            changePassword: typeof (window) !== 'undefined' ? sessionStorage.getItem('changePassword') === 'true' : false
        }
        setUserInfo(info);
    }, []);

    const adminPageSelector = () => {
        switch (decodeURI(activePage.toLowerCase())) {
            case ('roles'): return <AdminRoles><Role /></AdminRoles>
            case ('groups'): return <AdminRoles><AdminGroups><Group /></AdminGroups></AdminRoles>
            case ('users'): return <AdminRoles><AdminGroups><AdminUsers><User /></AdminUsers></AdminGroups></AdminRoles>
            case ('commands'): return <AdminRoles><AdminCommands><Command /></AdminCommands></AdminRoles>
            case ("banned ip"): return <BannedIP />
            case ('banned players'): return <BannedPlayers />
            case ("whitelist"): return <Whitelist />
            case ("command execution"): return <CommandExecution />
            default: return <></>
        }
    }

    return (
        <div className='text-center flex'>
            {userInfo.changePassword ? <PasswordModal /> : <></>}
            <div className='h-screen flex-shrink-1'>
                <Sidebar />
            </div>
            <div className={`duration-300 w-screen mt-14 ${prefs.sidebarOpen ? 'ml-64' : ''}`}>

                {adminPageSelector()}
            </div>
        </div>
    )
}