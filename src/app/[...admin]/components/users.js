'use client'

import { useEffect, useState, useContext, useRef } from 'react';
import { pullUsers, saveUsers } from './api/users';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import MultiSelection from '@/app/components/MultiSelection/MultiSelection';
import CheckBox from '@/app/components/CheckBox/CheckBox';
import { AdminUsersContext, usersActionTypes } from './context/admin/users';
import { AdminRolesContext, rolesActionTypes } from './context/admin/roles';
import { AdminGroupsContext, groupsActionTypes } from './context/admin/groups';

//TODO: Need to be able to write user changes. Use form to detect changes and send only what's needed.

export default function User() {

    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');

    const { adminUsers, dispatchAdminUsers } = useContext(AdminUsersContext);
    const { adminGroups, dispatchAdminGroups } = useContext(AdminGroupsContext);
    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            dispatchAdminUsers({ type: usersActionTypes.GET_USER, context: dispatchAdminUsers });
            dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
            dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
            isInitialRender.current = false;
        }
    }, [dispatchAdminUsers, dispatchAdminGroups, dispatchAdminRoles]);

    const showUserModal = async (user) => {
        const selectedRoles = {};
        const selectedGroups = {};

        adminRoles.forEach(role => {
            let selected = false;
            let foundRole = user.roles.find(grole => {
                return grole === role.id;
            });

            if (foundRole) {
                selected = true;
            }
            selectedRoles[`${role.name}`] = selected;
        });

        adminGroups.forEach(group => {
            let selected = false;
            let foundGroup = user.groups.find(ugroup => {
                return ugroup === group.id;
            })

            if (foundGroup) {
                selected = true;
            }
            selectedGroups[`${group.name}`] = selected;
        })

        const message = (
            <form
                onChange={(event) => handleFormChange(event)}>
                <TextBox
                    className=''
                    type='text'
                    placeholder='User ID'
                    id='UserID'
                    value={user.id}
                    disabled={true}
                />
                <TextBox
                    className=''
                    type='password'
                    placeholder='Password'
                    id='UserPassword'
                    value={user.password}
                />
                <TextBox
                    className=''
                    type='text'
                    placeholder='User Name'
                    id='UserName'
                    value={user.name}
                />
                <TextBox
                    className=''
                    type='text'
                    placeholder='Email'
                    id='UserEmail'
                    value={user.email}
                />
                <MultiSelection
                    className=''
                    placeholder='Roles'
                    id='UserRoles'
                    values={selectedRoles}
                />
                <MultiSelection
                    className=''
                    placeholder='Groups'
                    id='UserGroups'
                    values={selectedGroups}
                />
            </form>
        )

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(user.name);
    }

    const handleFormChange = (event) => {
        console.log('Hello from form change placeholder!');
    }

    const SaveUser = async () => {
        let savingUserID;
        try {
            savingUserID = document.getElementById('UserID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const changingUser = adminUsers.find(user => {
            return user.id === savingUserID;
        });

        const saveButton = document.getElementById('save-user');
        const rolesSelection = document.getElementById('UserRoles');
        const groupsSelection = document.getElementById('UserGroups');

        saveButton.innerHTML = 'Loading'
        saveButton.disabled = true;

        changingUser.name = document.getElementById('UserName').value;

        const roleNames = Array.from(rolesSelection.getElementsByTagName('input'))
            .filter(elem => elem.type === 'checkbox')
            .filter(elem => elem.checked)
            .map(elem => elem.id.split('-')[1]);

        const newRoles = adminRoles.filter(adminRole => {
            let match = false;
            roleNames.forEach(roleName => {
                if (roleName === adminRole.name) {
                    match = true;
                }
            });
            return match;
        }).map(adminRole => adminRole.id);

        const groupNames = Array.from(groupsSelection.getElementsByTagName('input'))
            .filter(elem => elem.type === 'checkbox')
            .filter(elem => elem.checked)
            .map(elem => elem.id.split('-')[1]);

        const newGroups = adminGroups.filter(adminGroup => {
            let match = false;
            groupNames.forEach(groupName => {
                if(groupName === adminGroup.name){
                    match = true;
                }
            });
            return match;
        }).map(adminGroup => adminGroup.id);

        changingUser.roles = newRoles;
        changingUser.groups = newGroups;

        dispatchAdminUsers({ type: usersActionTypes.UPDATE_USER, payload: changingUser, context: dispatchAdminUsers });

        saveButton.innerHTML = 'Save'
        saveButton.disabled = false;

        setModalShown(false);
    }

    const footerButtons = (
        <>
            <Button
                className='mx-2 my-2 '
                onClick={SaveUser}
                id='save-user'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-user'
                type='button'
                enabled={true} >Cancel</Button>
        </>
    )

    return (
        <div className='text-center'>
            <Modal
                id={'UserModal'}
                show={modalShown}
                setShow={setModalShown}
                header={`User: ${modalHeader}`}
                footer={footerButtons}
                static={true} >
                {modalMessage}
            </Modal>
            <table className='table-fixed border border-collapse w-full'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        adminUsers && Array.isArray(adminUsers) ?
                            adminUsers.map(user => {
                                if (!user) return <></>
                                return (
                                    <tr
                                        className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                                        onClick={() => showUserModal(user)}
                                        key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                    </tr>
                                )
                            })
                            : <></>//users && Array.isArray(users) ? 
                    }
                </tbody>
            </table>
        </div>
    )
}