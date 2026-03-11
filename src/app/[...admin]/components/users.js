'use client'

import { useEffect, useState, useContext } from 'react';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import MultiSelection from '@/app/components/MultiSelection/MultiSelection';
import CheckBox from '@/app/components/CheckBox/CheckBox';
import { AdminUsersContext, usersActionTypes } from './context/admin/users';
import { AdminRolesContext, rolesActionTypes } from './context/admin/roles';
import { AdminGroupsContext, groupsActionTypes } from './context/admin/groups';
import { IoMdArrowDropdown } from 'react-icons/io';

export default function User() {
    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');
    const [sorted, setSorted] = useState({ column: 'name', ascending: true });

    const { adminUsers, dispatchAdminUsers } = useContext(AdminUsersContext);
    const { adminGroups, dispatchAdminGroups } = useContext(AdminGroupsContext);
    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    useEffect(() => {
        dispatchAdminUsers({ type: usersActionTypes.GET_USER, context: dispatchAdminUsers });
        dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
        dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    }, [dispatchAdminUsers, dispatchAdminGroups, dispatchAdminRoles]);

    const showCreateUserModal = () => {
        const user = { name: '', id: '', password: '', email: '', roles: [], groups: [], changePassword: true };
        showUserModal(user);
        setModalHeader('Create new User');
        const saveButton = document.getElementById('save-user');
        const createButton = document.getElementById('create-user');
        const removeButton = document.getElementById('remove-user');

        saveButton.hidden = true;
        createButton.hidden = undefined;
        removeButton.hidden = true;
    };

    const showUserModal = async (user) => {
        const selectedRoles = {};
        const selectedGroups = {};
        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        const userGroups = Array.isArray(user.groups) ? user.groups : [];

        adminRoles.forEach(role => {
            selectedRoles[role.name] = userRoles.includes(role.id);
        });

        adminGroups.forEach(group => {
            selectedGroups[group.name] = userGroups.includes(group.id);
        });

        const message = (
            <form>
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
                <CheckBox
                    className=''
                    id='UserChangePassword'
                    placeholder='Change Password'
                    defaultChecked={user.changePassword ? true : false}
                />
                <CheckBox
                    className=''
                    id='UserActive'
                    placeholder='Active'
                    defaultChecked={user.active ? true : false}
                />
            </form>
        );

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(`User: ${user.name}`);
        const saveButton = document.getElementById('save-user');
        const createButton = document.getElementById('create-user');
        const removeButton = document.getElementById('remove-user');
        const changePassword = document.getElementById('UserChangePassword');
        if (changePassword) changePassword.checked = Boolean(user.changePassword);
        const active = document.getElementById('UserActive');
        if (active) active.checked = Boolean(user.active);

        saveButton.hidden = undefined;
        createButton.hidden = true;
        removeButton.hidden = undefined;
    };

    const removeUser = () => {
        const userID = document.getElementById('UserID')?.value;
        if (!userID) {
            alert('The User ID cannot be found!');
            return;
        }

        dispatchAdminUsers({
            type: usersActionTypes.REMOVE_USER,
            payload: { id: userID },
            context: dispatchAdminUsers
        });
        setModalShown(false);
    };

    const saveUser = async (updated = true) => {
        let savingUserID;
        try {
            savingUserID = document.getElementById('UserID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const existingUser = updated ? adminUsers.find(user => user.id === savingUserID) : undefined;
        const changingUser = existingUser
            ? { ...existingUser }
            : { name: '', id: '', password: '', email: '', roles: [], groups: [], changePassword: true };

        const saveButton = document.getElementById('save-user');
        const rolesSelection = document.getElementById('UserRoles');
        const groupsSelection = document.getElementById('UserGroups');

        saveButton.innerHTML = 'Loading';
        saveButton.disabled = true;

        changingUser.name = document.getElementById('UserName').value;
        changingUser.password = document.getElementById('UserPassword').value;
        changingUser.email = document.getElementById('UserEmail').value;
        changingUser.changePassword = document.getElementById('UserChangePassword').checked;
        changingUser.active = document.getElementById('UserActive').checked;

        const roleNames = rolesSelection
            ? Array.from(rolesSelection.getElementsByTagName('input'))
                .filter(elem => elem.type === 'checkbox' && elem.checked)
                .map(elem => elem.id.split('-')[1])
            : [];

        changingUser.roles = adminRoles
            .filter(adminRole => roleNames.includes(adminRole.name))
            .map(adminRole => adminRole.id);

        const groupNames = groupsSelection
            ? Array.from(groupsSelection.getElementsByTagName('input'))
                .filter(elem => elem.type === 'checkbox' && elem.checked)
                .map(elem => elem.id.split('-')[1])
            : [];

        changingUser.groups = adminGroups
            .filter(adminGroup => groupNames.includes(adminGroup.name))
            .map(adminGroup => adminGroup.id);

        await dispatchAdminUsers({
            type: updated ? usersActionTypes.UPDATE_USER : usersActionTypes.CREATE_USER,
            payload: changingUser,
            context: dispatchAdminUsers
        });

        saveButton.innerHTML = 'Save';
        saveButton.disabled = false;
        setModalShown(false);
    };

    const footerButtons = (
        <>
            <Button
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
                enabled={true} >Create</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-user'
                type='button'
                enabled={true} >Cancel</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => removeUser()}
                id='remove-user'
                type='submit'
                enabled={true} >Delete</Button>
        </>
    );

    const sortBy = (column) => {
        const newSorted = { ...sorted };
        if (newSorted.column === column) {
            newSorted.ascending = !newSorted.ascending;
        } else {
            newSorted.column = column;
            newSorted.ascending = true;
        }
        setSorted(newSorted);
    };

    const sortedUsers = Array.isArray(adminUsers)
        ? [...adminUsers].sort((a, b) => {
            const lhs = String(a?.[sorted.column] ?? '');
            const rhs = String(b?.[sorted.column] ?? '');
            return sorted.ascending ? lhs.localeCompare(rhs) : rhs.localeCompare(lhs);
        })
        : [];

    return (
        <div className='text-center'>
            <Modal
                id={'UserModal'}
                show={modalShown}
                setShow={setModalShown}
                header={`${modalHeader}`}
                footer={footerButtons}
                static={true} >
                {modalMessage}
            </Modal>
            <table className='table-fixed border border-collapse w-full'>
                <thead>
                    <tr>
                        <th className='mx-auto cursor-pointer'>
                            <div className='flex justify-center' onClick={() => sortBy('id')}>
                                ID
                                {
                                    sorted.column === 'id' ?
                                        <IoMdArrowDropdown className={`duration-300 text-2xl my-auto ${sorted.ascending ? '' : 'rotate-180'}`} /> :
                                        <>
                                            <IoMdArrowDropdown className={`duration-300 text-2xl transform translate-y-1`} />
                                            <IoMdArrowDropdown className={`duration-300 text-2xl rotate-180 transform -translate-y-1 -translate-x-6`} />
                                        </>
                                }
                            </div>
                        </th>
                        <th className='mx-auto cursor-pointer' onClick={() => sortBy('name')}>
                            <div className='flex justify-center'>
                                Name
                                {
                                    sorted.column === 'name' ?
                                        <IoMdArrowDropdown className={`duration-300 text-2xl my-auto ${sorted.ascending ? '' : 'rotate-180'}`} /> :
                                        <>
                                            <IoMdArrowDropdown className={`duration-300 text-2xl transform translate-y-1`} />
                                            <IoMdArrowDropdown className={`duration-300 text-2xl rotate-180 transform -translate-y-1 -translate-x-6`} />
                                        </>
                                }
                            </div>
                        </th>
                        <th className='mx-auto cursor-pointer' onClick={() => sortBy('email')}>
                            <div className='flex justify-center'>
                                Email
                                {
                                    sorted.column === 'email' ?
                                        <IoMdArrowDropdown className={`duration-300 text-2xl my-auto ${sorted.ascending ? '' : 'rotate-180'}`} /> :
                                        <>
                                            <IoMdArrowDropdown className={`duration-300 text-2xl transform translate-y-1`} />
                                            <IoMdArrowDropdown className={`duration-300 text-2xl rotate-180 transform -translate-y-1 -translate-x-6`} />
                                        </>
                                }
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        sortedUsers.length > 0 ?
                            sortedUsers.map(user => {
                                if (!user) return null;
                                return (
                                    <tr
                                        className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                                        onClick={() => showUserModal(user)}
                                        key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                    </tr>
                                );
                            })
                            : null
                    }
                </tbody>
            </table>
            <Button onClick={() => showCreateUserModal()}>
                Create User
            </Button>
        </div>
    );
}
