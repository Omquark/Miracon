'use client'

import './globals.css'
import Header from './components/Header/Header';
import { createContext, useState, useRef, useEffect } from 'react';

export const UserPrefContext = createContext();

export default function RootLayout({ children }) {

  const preferences = {
    darkMode: false,
    sidebarOpen: true,
  };

  const [prefs, setPrefs] = useState(preferences);

  const prefRef = useRef(prefs);

  const testDarkMode = useRef(false);

  const setUserPrefs = (userPrefs) => {
    console.log('userPrefs', userPrefs);
    prefRef.current = userPrefs;
    setPrefs(userPrefs);
    testDarkMode.current = !testDarkMode.current;
    console.log('testDarkMode.current', testDarkMode.current);
  }

  useEffect(() => {
    setPrefs(prefRef.current);
  }, [prefs]);

  return (
    <UserPrefContext.Provider value ={{ prefs: prefs, setPrefs: setUserPrefs }}>
    <html className={`${prefs.darkMode ? 'dark' : ''}`} lang="en">
      <head className=''>
      </head>
        <body
          className='bg-white dark:bg-black text-base text-slate-700 dark:text-slate-300'>
          <Header />
          {children}
        </body>
    </html>
    </UserPrefContext.Provider>
  )
}
