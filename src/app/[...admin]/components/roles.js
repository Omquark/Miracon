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
    const [sorted, setSorted] = useState({ column: 'id', ascending: true })

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

    const sortBy = (column) => {
        const newSorted = { ...sorted };
        if (newSorted.column === column) {
            newSorted.ascending = !sorted.ascending;
        } else {
            newSorted.column = column;
            newSorted.ascending = true;
        }
        setSorted(newSorted);
    }

    return (
        <div className='text-center'>
            <form id='roles-form'>
                <Modal
                    id={'RoleModal'}
                    show={modalShown}
                    setShow={setModalShown}
                    header={`Role: ${modalHeader}`}
                    footer={footerButtons}
                    static={true} >
                    {modalMessage}
                </Modal>
            </form>
            <table className='table-fixed border border-collapse w-full'>
                <thead>
                    <tr>
                        <th className='mx-auto cursor-pointer' onClick={() => sortBy('id')}>
                            <div className='flex justify-center '>
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
                        adminRoles && Array.isArray(adminRoles) ?
                            adminRoles
                                .sort((a, b) => {
                                    return sorted.ascending ? a[sorted.column] > b[sorted.column] : a[sorted.column] < b[sorted.column];
                                })
                                .map(role => {
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