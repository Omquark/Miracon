import Modal from "@/app/components/Modal/Modal";
import { useEffect, useState } from "react";
import { retrieveUUID } from "./api/users";
import Button from "@/app/components/Button/Button";
import TextBox from "@/app/components/TextBox/TextBox";
import { BiRefresh } from 'react-icons/bi'
import { Tooltip } from "react-tooltip";
import { ToastContainer, Flip, toast } from "react-toastify";

export default function Whitelist() {

    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');
    const [sorted, setSorted] = useState({ column: 'name', ascending: true });
    const [userUUID, setUserUUID] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // const fetchUser = async () => {
        //     const rawUser = await retrieveUUID('hexad');
        //     console.log('rawUser', rawUser);
        // }

        // fetchUser();
    }, []);

    const retrieveUser = async () => {
        setLoading(true);
        let toastMessage;
        let username = document.getElementById('UserName').value;
        if (!username || username.length < 4 || username.length > 16 || !/^[\w_]+$/.test(username)) {
            toastMessage = 'Username must be between 4 and 16 characters and consist of alphanumeric or _ characters.'
        } else {
            const rawData = await retrieveUUID(username);
            const userID = document.getElementById('UserID');
            if (rawData.success === false) {
                userID.value = '';
                toastMessage = `Failed to retrieve UUID of user ${username}`;
            } else {
                userID.value = rawData.data.player.id;
                toastMessage = `Succussfully found UUID of user ${username}`;
            }
        }
        toast(toastMessage);
        setLoading(false);
    }

    const showWhitelistModal = (update = false) => {
        const message =
            <form>
                <div className='mx-auto w-2/3'>
                    <TextBox
                        className=''
                        type='text'
                        placeholder='User ID'
                        id='UserID'
                        value={''}
                        disabled={true}
                    />
                </div>
                <div className='mx-auto w-2/3 flex '>
                    <TextBox
                        className=''
                        type='text'
                        placeholder='User Name'
                        id='UserName'
                        value={''}
                    />
                    <Button
                        className={'absolute w-12 h-12 ' +
                            'bg-transparent dark:bg-transparent ' +
                            'text-black dark:text-white ' +
                            'transform translate-y-1.5 -translate-x-12 ' +
                            `${loading ? 'animate-spin' : ''} `}
                        onClick={() => retrieveUser()}
                        id='cancel-user'
                        type='button'
                        enabled={true} >
                        <BiRefresh className='w-full h-full text-black dark:text-white scale-x-[-1] '
                            data-tooltip-id='pull-id'
                            data-tooltip-content='Pull UserID' />
                    </Button>
                </div>
                <Tooltip id='pull-id' />
            </form>

        setModalMessage(message);
        setModalShown(true);
    }

    const footerButtons = (
        <>
            {/* <Button
                className='mx-2 my-2 '
                onClick={() => saveUser(true)}
                id='save-user'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => saveUser(false)}
                id='create-user'
                type='submit'
                enabled={true} >Create</Button> */}
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-user'
                type='button'
                enabled={true} >Cancel</Button>
            {/* <Button
                className='mx-2 my-2 '
                onClick={() => removeUser}
                id='remove-user'
                type='submit'
                enabled={true} >Delete</Button> */}
        </>
    )

    return (
        <div>
            <Modal
                id={'WhiteListModal'}
                show={modalShown}
                setShow={setModalShown}
                header={modalHeader}
                footer={footerButtons}
                static={true}
            >
                {modalMessage}
            </Modal>
            <Button
                onClick={() => showWhitelistModal()}
                id='cancel-user'
                type='button'
                enabled={true} >
                Create Entry
            </Button>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                closeOnClick
                pauseOnFocusLoss
                pauseOnHover
                transition={Flip}
            />
            {/* <Button onClick={() => showWhitelistModal()}>
                Create entry
            </Button> */}
        </div>
    )
}