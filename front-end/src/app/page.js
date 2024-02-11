'use client';

import TextBox from './components/TextBox/TextBox'
import Button from './components/Button/Button'
import Selection from './components/Selection/Selection';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import login from './api/login';

export default function Home() {

  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState({ erred: false, message: '' });

  const { push } = useRouter();

  const updateLogin = (logging) => {
    setLoggingIn(logging);
  }

  const attemptLogin = async () => {
    const info = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    }

    updateLogin(true);

    const userInfo = await login(info);

    updateLogin(false);

    if (userInfo.error) {
      setLoginError({ erred: true, message: userInfo.error });
      updateLogin(false);
      return;
    }

    console.log(userInfo.roles);

    sessionStorage.setItem('username', userInfo.name);
    sessionStorage.setItem('useremail', userInfo.email);
    sessionStorage.setItem('roles', userInfo.roles);

    setLoginError({ erred: false, message: '' });
    push('/admin');

  }

  const roles = ['Role 1', 'Role 2', 'Role 3', 'Role 4', 'Role 5',];

  return (
    <div className={`text-center `}>
      <form>
      <div className='mx-auto w-1/6'>
        <TextBox type='text' placeholder='Username' id='username' />
      </div>
      <div className='mx-auto w-1/6'>
        <TextBox type='password' placeholder='Password' id='password' />
      </div>
      <Button onClick={attemptLogin} id='login-button' enabled={loggingIn} type='submit'>{loggingIn ? 'Logging in' : 'Login'}</Button>
      {
        loginError.erred ?
          <span className='text-red-600' >{loginError.message}</span> :
          <></>
      }
      </form>
      <div className='w-1/6 text-center mx-auto '>
        <Selection
          className=''
          placeholder='placeholder'
          id='test-select'
          values={roles} />
      </div>
    </div>
  )
}
