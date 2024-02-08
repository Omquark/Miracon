'use client'

import { useContext, useEffect, useState } from 'react';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import { AdminRolesContext, rolesActionTypes } from './context/roles/roles';

export default function Role() {

    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');

    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    useEffect(() => {
        dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles })
    }, []);

    const showRoleModal = (role) => {
        const message = (
            <>
                <TextBox
                    className=''
                    type='text'
                    placeholder='Role ID'
                    id='RoleID'
                    value={role.id}
                    disabled={true}
                />
                <TextBox
                    className=''
                    type='text'
                    placeholder='Role Name'
                    id='RoleName'
                    value={role.name}
                />
            </>
        )

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(role.name);
    }

    const SaveRole = async () => {
        let savingRoleID;
        try {
            savingRoleID = document.getElementById('RoleID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const changingRole = adminRoles.find(role => {
            return role.id === savingRoleID;
        });

        const saveButton = document.getElementById('save-role');
        saveButton.innerHTML = 'Loading'
        saveButton.disabled = true;

        changingRole.name = document.getElementById('RoleName').value;

        dispatchAdminRoles({ type: rolesActionTypes.UPDATE_ROLE, payload: changingRole, context: dispatchAdminRoles });

        saveButton.innerHTML = 'Save'
        saveButton.disabled = false;

        setModalShown(false);
    }

    const footerButtons = (
        <>
            <Button
                className='mx-2 my-2 '
                onClick={SaveRole}
                id='save-role'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-role'
                type='button'
                enabled={true} >Cancel</Button>
        </>
    )

    return (
        <div className='text-center'>
            <form id='roles-form'>
                <Modal
                    id={'RoleModal'}
                    show={modalShown}
                    setShow={setModalShown}
                    header={`Role: ${modalHeader}`}
                    footer={footerButtons}
                    static={false} >
                    {modalMessage}
                </Modal>
            </form>
            <table className='table-fixed border border-collapse w-full'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        adminRoles && Array.isArray(adminRoles) ?
                            adminRoles.map(role => {
                                if (!role) return <></>
                                return (
                                    <tr
                                        className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                                        onClick={() => showRoleModal(role)}
                                        key={role.id}>
                                        <td>{role.id}</td>
                                        <td>{role.name}</td>
                                    </tr>
                                )
                            })
                            : <>{console.log('adminRoles', adminRoles)}</>//adminRroles && Array.isArray(Roles) ? 
                    }
                </tbody>
            </table>
        </div>
    )
}