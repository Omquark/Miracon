'use client'

import { useContext } from "react";
import { SidebarItem } from "./Sidebaritem";
import { BsChevronDoubleLeft } from "react-icons/bs"
import { UserPrefContext } from "@/app/layout";

export default function Sidebar() {

    const { prefs, setPrefs } = useContext(UserPrefContext);

    const expand = () => {
        console.log('prefs', prefs);
        console.log('Calling setPrefs with', {...prefs, sidebarOpen: !prefs.sidebarOpen})
        setPrefs({...prefs, sidebarOpen: !prefs.sidebarOpen});
    }

    const userMgt = ['User management', 'Roles', 'Groups', 'Users'];
    const whiteBanMgt = ['White/Ban list management', 'Whitelist', 'Banned players', 'Banned IP'];

    return (
        <nav id='admin-sidebar'
            className={'duration-300 h-full z-[1035] ' +
                'text-start text-sm border-cyan-700 dark:border-cyan-300 ' +
                `${prefs.sidebarOpen ? 'w-64 px-2 border-r-4 ' : ' w-0 px-0 border-r-0 '}`}>

            <div className='relative h-full '>
                <div className={`overflow-hidden ${prefs.sidebarOpen ? '' : ''}`} >
                    <SidebarItem menuName={userMgt[0]} subMenus={userMgt.slice(1)} />
                    <SidebarItem menuName={whiteBanMgt[0]} subMenus={whiteBanMgt.slice(1)} />
                    <SidebarItem menuName={'Server configuration'} />
                </div>
                <div className='absolute text-xl right-0 top-1/2'>
                    <button
                        className={
                            'dark border-2 border-cyan-700 dark:border-cyan-300 p-1 rounded-full ' +
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