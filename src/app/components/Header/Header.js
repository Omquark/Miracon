'use client'

import { logout } from "@/app/api/login";
import { UserPrefContext } from "@/app/layout";
import { useContext } from "react";
import { FaRegMoon, FaRegSun } from "react-icons/fa";
import { IoLogOutOutline } from 'react-icons/io5'

export default function Header() {

    const { prefs, setPrefs } = useContext(UserPrefContext);

    const handleLogout = () => {
        logout()
    }

    return (
        <div className={
            'sticky bg-sky-700 dark:bg-sky-300 h-14 mx-auto top-0 left-0 z-20 ' +
            'text-slate-300 dark:text-slate-700 '
        }>
            <div className='pb-2 px-2 flex h-full'>
                <div className='my-auto flex-shrink'>
                    <span className='font-bold text-lime-400 dark:text-lime-600'>
                        Miracon
                    </span>
                </div>
                <div className='my-auto flex-grow text-center'>
                    <span>
                        Welcome, {'User'}
                    </span>
                </div>
                <div className='my-auto flex-shrink duration-300 flex'>
                    <div className='pt-2'>
                    <button onClick={() => setPrefs({ ...prefs, darkMode: !prefs.darkMode })}>
                        {
                            prefs.darkMode ?
                                <FaRegSun /> :
                                <FaRegMoon />
                        }
                    </button>
                    </div>
                    <div className='ms-5 text-2xl pt-1'>
                        <button onClick={() => handleLogout()}>
                            <IoLogOutOutline />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}