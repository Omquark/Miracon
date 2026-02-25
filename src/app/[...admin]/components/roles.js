'use client'

import { useContext, useEffect, useState } from 'react';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import { AdminRolesContext, rolesActionTypes } from './context/admin/roles';
import { IoMdArrowDropdown } from 'react-icons/io';

export default function Role() {
    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');
    const [sorted, setSorted] = useState({ column: 'name', ascending: true });

    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    useEffect(() => {
        dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    }, [dispatchAdminRoles]);

    const showCreateRoleModal = () => {
        const role = { name: '', id: '' };
        showRoleModal(role);
        setModalHeader('Create new Role');
        const saveButton = document.getElementById('save-role');
        const createButton = document.getElementById('create-role');
        const removeButton = document.getElementById('remove-role');

        saveButton.hidden = true;
        createButton.hidden = undefined;
        removeButton.hidden = true;
    };

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
        );

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(`Role: ${role.name}`);
        const saveButton = document.getElementById('save-role');
        const createButton = document.getElementById('create-role');
        const removeButton = document.getElementById('remove-role');

        saveButton.hidden = undefined;
        createButton.hidden = true;
        removeButton.hidden = undefined;
        removeButton.disabled = role.critical;
    };

    const saveRole = async (update = true) => {
        let savingRoleID;
        try {
            savingRoleID = document.getElementById('RoleID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const existingRole = update ? adminRoles.find(role => role.id === savingRoleID) : undefined;
        const changingRole = existingRole ? { ...existingRole } : { name: '', id: '' };

        const saveButton = document.getElementById('save-role');
        saveButton.innerHTML = 'Loading';
        saveButton.disabled = true;

        changingRole.name = document.getElementById('RoleName').value;

        dispatchAdminRoles({
            type: update ? rolesActionTypes.UPDATE_ROLE : rolesActionTypes.CREATE_ROLE,
            payload: changingRole,
            context: dispatchAdminRoles
        });

        saveButton.innerHTML = 'Save';
        saveButton.disabled = false;

        setModalShown(false);
    };

    const removeRole = () => {
        const roleID = document.getElementById('RoleID')?.value;
        if (!roleID) {
            console.log('The Role ID is not defined');
            return;
        }

        dispatchAdminRoles({ type: rolesActionTypes.REMOVE_ROLE, payload: { id: roleID }, context: dispatchAdminRoles });
        setModalShown(false);
    };

    const footerButtons = (
        <>
            <Button
                className='mx-2 my-2 '
                onClick={() => saveRole(true)}
                id='save-role'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => saveRole(false)}
                id='create-role'
                type='submit'
                enabled={true}
                hidden={true} >Create</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-role'
                type='button'
                enabled={true} >Cancel</Button>
            <Button
                className='mx-2 my-2'
                onClick={() => removeRole()}
                id='remove-role'
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

    const sortedRoles = Array.isArray(adminRoles)
        ? [...adminRoles].sort((a, b) => {
            const lhs = String(a?.[sorted.column] ?? '');
            const rhs = String(b?.[sorted.column] ?? '');
            return sorted.ascending ? lhs.localeCompare(rhs) : rhs.localeCompare(lhs);
        })
        : [];

    return (
        <div className='text-center'>
            <form id='roles-form'>
                <Modal
                    id={'RoleModal'}
                    show={modalShown}
                    setShow={setModalShown}
                    header={`${modalHeader}`}
                    footer={footerButtons}
                    static={true} >
                    {modalMessage}
                </Modal>
            </form>
            <table className='table-fixed border border-collapse w-full'>
                <thead className=''>
                    <tr className=''>
                        <th className='mx-auto cursor-pointer' onClick={() => sortBy('id')}>
                            <div className='flex justify-center'>
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
                        <th className='mx-auto cursor-pointer ' onClick={() => sortBy('name')}>
                            <div className='flex justify-center '>
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
                    </tr>
                </thead>
                <tbody>
                    {
                        sortedRoles.length > 0 ?
                            sortedRoles.map(role => {
                                if (!role) return null;
                                return (
                                    <tr
                                        className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                                        onClick={() => showRoleModal(role)}
                                        key={role.id}>
                                        <td>{role.id}</td>
                                        <td>{role.name}</td>
                                    </tr>
                                );
                            })
                            : null
                    }
                </tbody>
            </table>
            <Button onClick={() => showCreateRoleModal()}>
                Create Role
            </Button>
        </div>
    );
}
