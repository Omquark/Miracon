'use client'

import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import Header from './components/Header/Header';
import { createContext, useState, useRef, useEffect } from 'react';

export const UserPrefContext = createContext();
export const UserInfoContext = createContext();

export default function RootLayout({ children }) {

  const preferences = {
    darkMode: false,
    sidebarOpen: true,
  };

  const defaultInfo = {
    username: '',
    userEmail: '',
    userRoles: ['', ''],
    changePassword: false,
  }

  const [prefs, setPrefs] = useState(preferences);
  const [userInfo, setUserInfo] = useState(defaultInfo);

  const prefRef = useRef(prefs);
  const testDarkMode = useRef(false);

  const setUserPrefs = (userPrefs) => {
    prefRef.current = userPrefs;
    setPrefs(userPrefs);
    testDarkMode.current = !testDarkMode.current;
  }

  const setNewUserInfo = (newInfo) => {
    sessionStorage.setItem('changePassword', newInfo.changePassword)
    setUserInfo(newInfo);
  }

  useEffect(() => {
    setPrefs(prefRef.current);
  }, [prefs]);

  return (
    <UserPrefContext.Provider value={{ prefs: prefs, setPrefs: setUserPrefs }}>
      <UserInfoContext.Provider value={{ userInfo: userInfo, setUserInfo: setNewUserInfo }}>
        <html className={`${prefs.darkMode ? 'dark' : ''}`} lang="en">
          <head className='min-h-screen'>
          </head>
          <body
            className={'bg-white dark:bg-black text-base text-slate-700 dark:text-slate-300 '
            }>
            <Header />
            <div className={``}>
              {children}
            </div>
          </body>
        </html>
      </UserInfoContext.Provider>
    </UserPrefContext.Provider>
  )
}
