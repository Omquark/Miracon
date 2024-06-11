import Modal from "@/app/components/Modal/Modal";
import Selection from "@/app/components/Selection/Selection";
import TextBox from "@/app/components/TextBox/TextBox";
import { useContext, useEffect, useState } from "react";
import { AdminCommandsContext, commandsActionTypes } from "./context/admin/commands";
import Button from "@/app/components/Button/Button";
import { IoMdArrowDropdown } from "react-icons/io";
import { AdminRolesContext, rolesActionTypes } from "./context/admin/roles";

export default function Command() {

  const [modalShown, setModalShown] = useState(false);
  const [modalMessage, setModalMessage] = useState(<></>);
  const [modalHeader, setModalHeader] = useState('');
  const [sorted, setSorted] = useState({ column: 'id', ascending: true });

  const { adminCommands, dispatchAdminCommands } = useContext(AdminCommandsContext);
  const { adminRoles, dispatchAdminRoles } = useContext(AdminRolesContext);

  useEffect(() => {
    dispatchAdminCommands({ type: commandsActionTypes.GET_COMMAND, context: dispatchAdminCommands });
    dispatchAdminRoles({ type: rolesActionTypes.GET_ROLE, context: dispatchAdminRoles });
  }, []);

  const showCommandModal = (command) => {
    const selectedRoles = {};
    const blacklistSelected = {};

    adminRoles.forEach(role => {
      let selected = false;
      let foundRole = command.roles.find(crole => {
        return crole === role.id;
      });
      if (foundRole) {
        selected = true;
      }
      selectedRoles[role.name] = selected;

      selected = false;
      let foundBlack = command.blacklistRoles.find(brole => {
        return brole === role.id;
      })
      if (foundBlack) {
        selected = true;
      }
      blacklistSelected[role.name] = selected;
    });

    const message = (
      <>
        <TextBox
          className=''
          type='text'
          placeholder='Command ID'
          id='CommandID'
          value={command.id}
          disabled={true}
        />
        <TextBox
          className=''
          type='text'
          placeholder='Description'
          id='Description'
          value={command.description}
          disabled={true}
        />
        <Selection
          className=''
          placeholder='roles'
          id='CommandRoles'
          values={selectedRoles}
        />
        <Selection
          className=''
          placeholder='Blacklisted roles'
          id='CommandBlacklistRoles'
          values={selectedRoles}
        />
      </>
    )

    setModalMessage(message);
    setModalShown(true)
    setModalHeader(command.name);
  }

  const SaveCommand = async () => {
    alert("Save command placeholder");
  }

  const footerButtons = (
    <>
      <Button
        className='mx-2 my-2 '
        onClick={SaveCommand}
        id='save-command'
        type='submit'
        enabled={true} >Save</Button>
      <Button
        className='mx-2 my-2 '
        onClick={() => setModalShown(false)}
        id='cancel-command'
        type='button'
        enabled={true} >Cancel</Button>
    </>
  )

  return (
    <div className='text-center'>
      <form id='commands-form'>
        <Modal
          id={'CommandModal'}
          show={modalShown}
          setShow={setModalShown}
          header={`Command: ${modalHeader}`}
          footer={footerButtons}
          static={true} >
          {modalMessage}
        </Modal>
      </form>
      <table className='table-fixed border border-collapse w-full'>
        <thead>
          <tr>
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
          </tr>
        </thead>
        <tbody>
          {
            adminCommands && Array.isArray(adminCommands) ?
              adminCommands
                .sort((a, b) => {
                  return sorted.ascending ? a[sorted.column] > b[sorted.column] : a[sorted.column] < b[sorted.column];
                })
                .map(command => {
                  if (!command) return <></>
                  return <tr
                    className='border odd:bg-neutral-300 dark:odd:bg-neutral-700 hover:cursor-pointer '
                    onClick={() => showCommandModal(command)}
                    key={command.id}>
                    <td>{command.id}</td>
                    <td>{command.name}</td>
                  </tr>
                })
              : <></> //adminCommands && Array.isArray(adminCommands) ?
          }
        </tbody>
      </table>
    </div>
  )
}