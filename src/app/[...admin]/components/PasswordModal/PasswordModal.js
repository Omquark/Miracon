'use client'

import Button from "@/app/components/Button/Button";
import Modal from "@/app/components/Modal/Modal";
import TextBox from "@/app/components/TextBox/TextBox";
import { UserInfoContext } from "@/app/layout";
import { useState, useContext, useEffect } from "react";
import { changePassword } from "../api/users";

export default function PasswordModal() {

  const [modalShown, setModalShown] = useState(false);
  const [modalMessage, setModalMessage] = useState(<></>);
  const [responseText, setResponseText] = useState('');

  const { userInfo, setUserInfo } = useContext(UserInfoContext);

  useEffect(() => {
    // showPasswordModal();
  }, []);

  const newChange = () => {
    showPasswordModal();
  }

  const showPasswordModal = () => {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    const message = (
      <>
        <TextBox
          className=''
          id='oldPassword'
          type='password'
          placeholder='Old Password'
        />
        <TextBox
          className=''
          id='newPassword'
          type='password'
          placeholder='New Password'
          onChange={newChange}
        />
        {
          !newPassword ||
            /^[\w!@#$%^&*?\\]+$/.test(newPassword) ?
            <></> : //passwordValid
            <span className='text-red-600'>Password must be alphanumeric and can contain any of !@#$%^&*?\\</span>
        }
        <TextBox
          className=''
          id='confirmPassword'
          type='password'
          placeholder='Confirm Password'
          onChange={newChange}
        />
        <span className={`text-red-600 ${newPassword && confirmPassword && newPassword !== confirmPassword ? '' : 'hidden'}`}>Passwords must match</span>
        <div><span className={`text-red-600 ${responseText ? '' : 'hidden'}`}>{responseText}</span></div>
      </>
    )

    setModalMessage(message);
    console.log(userInfo)
    setModalShown(userInfo.changePassword);
  }

  const savePassword = async () => {
    const oldPassword = document.getElementById('oldPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if ((!oldPassword || !newPassword || !confirmPassword) ||
      newPassword !== confirmPassword || !/^[\w!@#$%^&*?\\]+$/.test(newPassword)) {
      return;
    }

    const newPasswordInfo = {
      username: userInfo.username,
      oldPassword: oldPassword,
      newPassword: newPassword,
    };

    let passwordResult = await changePassword(newPasswordInfo);

    if (!passwordResult.error) {
      setModalShown(false);
      setUserInfo({ ...userInfo, changePassword: false })
    } else {
      setResponseText(passwordResult.error)
    }
  }

  const footerButtons = (
    <>
      <Button
        className='mx-2 my-2'
        onClick={savePassword}
        id='save-button'
        type='submit'
        enabled={true}>Save</Button>
    </>
  )

  return (
    <Modal
      id={'PasswordModal'}
      show={modalShown}
      setShow={showPasswordModal}
      header={`Change password`}
      footer={footerButtons}
      static={true} >
      {modalMessage}
    </Modal>
  )
}