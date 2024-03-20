'use client'

import { useEffect, useState, useContext } from 'react';
import { pullGroups, saveGroups } from './api/groups';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import Selection from '@/app/components/Selection/Selection';
import { AdminGroupsContext, groupsActionTypes } from './context/admin/groups';
import { AdminRolesContext, rolesActionTypes } from './context/admin/roles';

export default function Group() {

    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');

    const { adminGroups, dispatchAdminGroups } = useContext(AdminGroupsContext);
    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    useEffect(() => {
        dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
        dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    }, []);

    const showGroupModal = async (group) => {
        const selectedRoles = {};

        adminRoles.forEach(role => {
            let selected = false;
            let foundRole = group.roles.find(grole => {
                return grole === role.id;
            });

            if (foundRole) {
                selected = true;
            }
            selectedRoles[role.name] = selected;
        })

        const message = (
            <div
                className='px-2 border'>
                <TextBox
                    className=''
                    type='text'
                    placeholder='Group ID'
                    id='GroupID'
                    value={group.id}
                    disabled={true}
                />
                <TextBox
                    className=''
                    type='text'
                    placeholder='Group Name'
                    id='GroupName'
                    value={group.name}
                />
                <Selection
                    className=''
                    placeholder='Roles'
                    id='GroupRoles'
                    values={selectedRoles}
                />
            </div>
        )

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(group.name);
    }

    const SaveGroup = async () => {
        let savingGroupID;
        try {
            savingGroupID = document.getElementById('GroupID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const changingGroup = adminGroups.find(group => {
            return group.id === savingGroupID;
        });

        const saveButton = document.getElementById('save-group');
        const rolesSelection = document.getElementById('GroupRoles');

        saveButton.innerHTML = 'Loading'
        saveButton.disabled = true;

        changingGroup.name = document.getElementById('GroupName').value;

        const roleNames = Array.from(rolesSelection.getElementsByTagName('input'))
            .filter(elem => elem.type === 'checkbox')
            .filter(elem => elem.checked)
            .map(elem => elem.id.split('-')[1]);

        const newRoles = adminRoles.filter(adminRole => {
            let match = false;
            roleNames.forEach(roleName => {
                console.log('roleName', roleName);
                console.log('adminRole', adminRole);
                if(roleName === adminRole.name){
                    match = true;
                }
            });
            return match;
        })
        .map(adminRole => adminRole.id);

        console.log('newRoles', newRoles);

        changingGroup.roles = newRoles;

        dispatchAdminGroups({ type: groupsActionTypes.UPDATE_GROUP, payload: changingGroup, context: dispatchAdminGroups });

        saveButton.innerHTML = 'Save'
        saveButton.disabled = false;

        setModalShown(false);
    }

    const footerButtons = (
        <>
            <Button
                className='mx-2 my-2 '
                onClick={SaveGroup}
                id='save-group'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-group'
                type='button'
                enabled={true} >Cancel</Button>
        </>
    )

    return (
        <div className='text-center'>
            <Modal
                id={'GroupModal'}
                show={modalShown}
                setShow={setModalShown}
                header={`Group: ${modalHeader}`}
                footer={footerButtons}
                static={false} >
                {modalMessage}
            </Modal>
            <table className='table-fixed border border-collapse w-full'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        adminGroups && Array.isArray(adminGroups) ?
                            adminGroups.map(group => {
                                if (!group) return <></>
                                return (
                                    <tr
                                        className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                                        onClick={() => showGroupModal(group)}
                                        key={group.id}>
                                        <td>{group.id}</td>
                                        <td>{group.name}</td>
                                    </tr>
                                )
                            })
                            : <></>//groups && Array.isArray(groups) ? 
                    }
                </tbody>
            </table>
        </div>
    )
}