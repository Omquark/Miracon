'use client'

import { useEffect, useState, useContext } from 'react';
import Modal from '@/app/components/Modal/Modal';
import TextBox from '@/app/components/TextBox/TextBox';
import Button from '@/app/components/Button/Button';
import MultiSelection from '@/app/components/MultiSelection/MultiSelection';
import { AdminGroupsContext, groupsActionTypes } from './context/admin/groups';
import { AdminRolesContext, rolesActionTypes } from './context/admin/roles';

export default function Group() {

    const [modalShown, setModalShown] = useState(false);
    const [modalMessage, setModalMessage] = useState(<></>);
    const [modalHeader, setModalHeader] = useState('');
    const [sorted, setSorted] = useState({ column: 'name', ascending: true })

    const { adminGroups, dispatchAdminGroups } = useContext(AdminGroupsContext);
    const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

    useEffect(() => {
        dispatchAdminGroups({ type: groupsActionTypes.GET_GROUP, context: dispatchAdminGroups });
        dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
    }, [dispatchAdminGroups, dispatchAdminRoles]);

    const showCreateGroupModal = () => {
        const group = { name: '', id: '', roles: [] };
        showGroupModal(group);
        setModalHeader(`Create new Group`);
        const saveButton = document.getElementById('save-group');
        const createButton = document.getElementById('create-group');
        const removeButton = document.getElementById('remove-group');

        saveButton.hidden = true;
        createButton.hidden = undefined;
        removeButton.hidden = true;
    }

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
                className='px-2 '>
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
                <MultiSelection
                    className=''
                    placeholder='Roles'
                    id='GroupRoles'
                    values={selectedRoles}
                />
            </div>
        )

        setModalMessage(message);
        setModalShown(true);
        setModalHeader(`Group: ${group.name}`);
        const saveButton = document.getElementById('save-group');
        const createButton = document.getElementById('create-group');
        const removeButton = document.getElementById('remove-group');

        saveButton.hidden = undefined;
        createButton.hidden = true;
        removeButton.hidden = undefined;
    }

    const RemoveGroup = () => {
        let groupID = document.getElementById('GroupID')?.value;
        if (!groupID) {
            console.log('The group ID is not defeined');
            return;
        }

        dispatchAdminGroups({ type: groupsActionTypes.REMOVE_GROUP, payload: { id: groupID }, context: dispatchAdminGroups });
        setModalShown(false);
    }

    const SaveGroup = async (updated = true) => {
        let savingGroupID;
        try {
            savingGroupID = document.getElementById('GroupID').value;
        } catch (err) {
            console.log(err);
            return;
        }

        const changingGroup = updated ?
            adminGroups.find(group => {
                return group.id === savingGroupID;
            }) :
            { name: '', id: '', roles: [] }

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
                if (roleName === adminRole.name) {
                    match = true;
                }
            });
            return match;
        })
            .map(adminRole => adminRole.id);

        changingGroup.roles = newRoles;

        dispatchAdminGroups({ type: updated ? groupsActionTypes.UPDATE_GROUP : groupsActionTypes.ADD_GROUP, payload: changingGroup, context: dispatchAdminGroups });

        saveButton.innerHTML = 'Save'
        saveButton.disabled = false;

        setModalShown(false);
    }

    const footerButtons = (
        <>
            <Button
                className='mx-2 my-2 '
                onClick={() => SaveGroup(true)}
                id='save-group'
                type='submit'
                enabled={true} >Save</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => SaveGroup(false)}
                id='create-group'
                type='submit'
                enabled={true} >Create</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => setModalShown(false)}
                id='cancel-group'
                type='button'
                enabled={true} >Cancel</Button>
            <Button
                className='mx-2 my-2 '
                onClick={() => RemoveGroup()}
                id='remove-group'
                type='submit'
                enabled={true} >Delete</Button>
        </>
    )

    return (
        <div className='text-center'>
            <Modal
                id={'GroupModal'}
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
            <Button onClick={() => showCreateGroupModal()}>
                Create Group
            </Button>
        </div>
    )
}