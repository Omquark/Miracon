import { createContext, useRef, useState, useEffect } from "react";

export const UserPrefContext = createContext();

export default function UserPreferences(props){
  const { children } = props;

  const preferences = {
    darkMode: false,
    sidebarOpen: true,
  };

  const [prefs, setPrefs] = useState(preferences);

  const prefRef = useRef(prefs);

  const setUserPrefs = (userPrefs) => {
    console.log('userPrefs', userPrefs);
    setPrefs(userPrefs);
  }


  useEffect(() => {
    // console.log('prefRef.current', prefRef.current);
    // setPrefs(prefRef.current);
  }, [prefs]);

  return (
    <UserPrefContext.Provider value={{ prefs: prefs, setPrefs: setUserPrefs }}>
      {children}
    </UserPrefContext.Provider>
  )
}