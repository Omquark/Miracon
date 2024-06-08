'use client'

import { useContext, useEffect, useState } from "react";
import { SidebarItem } from "./Sidebaritem";
import { BsChevronDoubleLeft } from "react-icons/bs"
import { UserPrefContext } from "@/app/layout";
import { UserRolesContext } from "../../page";

export default function Sidebar() {

    const { prefs, setPrefs } = useContext(UserPrefContext);
    const { userRoles } = useContext(UserRolesContext);

    const [userMgt, setUserMgt] = useState([]);
    const [whiteBanMgt, setWhiteBanMgt] = useState([]);
    const [serverMgt, setServerMgt] = useState(false);

    useEffect(() => {
        //let rolesString;
        let roles;

        //rolesString = typeof window !== 'undefined' ? sessionStorage.getItem('roles') : undefined;
        roles = userRoles; //rolesString ? rolesString.split(',') : undefined;

        const umgt = [];
        const wmgt = [];
        if (roles) {
            roles.forEach(role => {
                switch (role.toUpperCase()) {
                    case ('READ_ROLE'): {
                        if (!umgt.find(mgt => mgt === 'Roles')) {
                            umgt.push('Roles');
                        }
                    }
                    case ('READ_GROUP'): {
                        if (!umgt.find(mgt => mgt === 'Groups')) {
                            umgt.push('Groups');
                        }
                    }
                    case ('READ_USER'): {
                        if (!umgt.find(mgt => mgt === 'Users')) {
                            umgt.push('Users');
                        }
                    }
                    case ('READ_WHITELIST'): {
                        if (!wmgt.find(mgt => mgt === 'Whitelist')) {
                            wmgt.push('Whitelist');
                        }
                    }
                    case ('READ_BANNED_PLAYER'): {
                        if (!wmgt.find(mgt => mgt === 'Banned Players')) {
                            wmgt.push('Banned Players');
                        }
                    }
                    case ('READ_BANNED_IP'): {
                        if (!wmgt.find(mgt => mgt === 'Banned IP')) {
                            wmgt.push('Banned IP');
                        }
                    }
                }
            });
            if (umgt.length > 0) {
                umgt.splice(0, 0, 'User management');
            }
            if (wmgt.length > 0 && wmgt[0] !== 'White/Ban list management') {
                wmgt.splice(0, 0, 'White/Ban list management');
            }

            setUserMgt(umgt);
            setWhiteBanMgt(wmgt);
        }
    }, [userRoles]);

    const expand = () => {
        setPrefs({ ...prefs, sidebarOpen: !prefs.sidebarOpen });
    }

    return (
        <nav id='admin-sidebar'
            className={'fixed duration-300 h-full z-[1] mt-14 ' +
                'text-start text-sm border-cyan-700 dark:border-cyan-300 ' +
                `${prefs.sidebarOpen ? 'w-64 px-2 border-r-4 ' : ' w-0 px-0 border-r-0 '}`}>

            <div className='relative h-full text-nowrap ' >
                <div className={`overflow-hidden ${prefs.sidebarOpen ? '' : ''}`} >
                    {userMgt && Array.isArray(userMgt) && userMgt.length > 0 ? <SidebarItem menuName={userMgt[0]} subMenus={userMgt.slice(1)} /> : <></>}
                    {whiteBanMgt && Array.isArray(whiteBanMgt) && whiteBanMgt.length > 0 ? <SidebarItem menuName={whiteBanMgt[0]} subMenus={whiteBanMgt.slice(1)} /> : <></>}
                    {serverMgt && Array.isArray(serverMgt) ? <SidebarItem menuName={'Server configuration'} /> : <></>}
                </div>
                <div className='absolute text-xl right-0 top-1/2 '>
                    <button
                        className={
                            'dark border-2 bg-white dark:bg-black border-cyan-700 dark:border-cyan-300 p-1 rounded-full ' +
                            'text-cyan-700 dark:text-cyan-300 ' +
                            `duration-300 ${prefs.sidebarOpen ? '' : 'translate-x-14 rotate-180'} `
                        }
                        onClick={() => expand()}>
                        <BsChevronDoubleLeft />
                    </button>
                </div>
            </div>
        </nav>
    )
}