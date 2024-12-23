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
import CommandExecution from "./components/commandExecution";

export default function Admin() {

    const { prefs, } = useContext(UserPrefContext);
    const { userInfo, setUserInfo } = useContext(UserInfoContext);
    const [activePage, setActivePage] = useState("");
    const pathname = usePathname();

    useEffect(() => {
        //Known pathname will begin with /admin, we need the next pathname ONLY
        const newPage = pathname.split('/')[2];//First element is empty, then admin, 3rd element is what we want
        setActivePage(newPage !== undefined ? newPage.charAt(0).concat(newPage.slice(1)) : '');
        if (!sessionStorage.getItem('username')) {
            window.location.href = '/';
        }
        const info = {
            roles: typeof (window) !== "undefined" ? sessionStorage.getItem('roles')?.split(',') : [''],
            username: typeof (window) !== "undefined" ? sessionStorage.getItem('username') : '',
            userEmail: typeof (window) !== "undefined" ? sessionStorage.getItem('useremail') : '',
            changePassword: typeof (window) !== 'undefined' ? sessionStorage.getItem('changePassword') === 'true' : false
        }
        setUserInfo(info);
    }, []);

    let adminPage = {
        roles: <AdminRoles><Role /></AdminRoles>,
        groups: <AdminRoles><AdminGroups><Group /></AdminGroups></AdminRoles>,
        users: <AdminRoles><AdminGroups><AdminUsers><User /></AdminUsers></AdminGroups></AdminRoles>,
        commands: <AdminRoles><AdminCommands><Command /></AdminCommands></AdminRoles>,
        "banned ip": <BannedIP />,
        "banned players": <BannedPlayers />,
        whitelist: <Whitelist />,
        "command execution": <CommandExecution />,
    }

    const adminPageSelector = () => {
        const normalizedPage = decodeURI(activePage.toLowerCase());
        return adminPage[normalizedPage];
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