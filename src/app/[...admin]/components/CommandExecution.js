'use client'

import { useContext, useEffect, useState } from "react";
import { effectCommand, pullConsoleCommands } from "./api/consoleCommands";
import Button from "@/app/components/Button/Button";
import Selection from "@/app/components/Selection/Selection";
import TextBox from "@/app/components/TextBox/TextBox";
import { Flip, ToastContainer, toast } from "react-toastify";
import Modal from "@/app/components/Modal/Modal";
import CheckBox from "@/app/components/CheckBox/CheckBox";
import { UserInfoContext } from "@/app/layout";

export default function CommandExecution() {
  const { userInfo } = useContext(UserInfoContext);

  const [consoleCommands, setConsoleCommands] = useState();
  const [modalShown, setModalShown] = useState(false);
  const [modalHeader, setModalHeader] = useState('');
  const [footerButtons, setFooterButtons] = useState(<></>);
  const [modalMessage, setModalMessage] = useState(<></>);

  useEffect(() => {
    const setConsoleCommandsState = async () => {
      const roles = Array.isArray(userInfo?.roleIds) ? userInfo.roleIds : [];
      const pulledCommands = await pullConsoleCommands();
      const commands = Array.isArray(pulledCommands) ? pulledCommands : [];
      const tempCommands = commands.filter(command => {
        const commandRoles = Array.isArray(command.roles) ? command.roles : [];
        return roles.some(role => commandRoles.includes(role));
      });
      setConsoleCommands(tempCommands);
    };
    setConsoleCommandsState();
  }, [userInfo]);

  const createElements = async (elems, required) => {
    if (!Array.isArray(elems) || elems.length === 0) return undefined;
    const body = [];
    for (const param of elems) {
      if (!param?.type) continue;
      const id = `${param.name}`;
      switch (param.type.toUpperCase()) {
        case 'STRING': {
          body.push((
            <div className='my-4' key={id}>
              <TextBox
                className={required ? ' bg-red-300 ' : ''}
                type='text'
                id={id}
                placeholder={param.name} />
            </div>
          ));
          break;
        }
        case 'PLAYER':
        case 'ENUM':
          body.push((
            <div className='my-4' key={id}>
              <Selection
                className=''
                placeholder={param.name}
                id={id}
                values={
                  param.type.toUpperCase() === 'ENUM'
                    ? param.values
                    : await listPlayers()
                } />
            </div>
          ));
          break;
        case 'BOOLEAN': {
          body.push((
            <div className='my-4' key={id}>
              <CheckBox
                id={id}
                placeholder={param.name} />
            </div>
          ));
          break;
        }
        default:
          break;
      }
    }
    return body;
  };

  const listPlayers = async () => {
    const listResponse = await effectCommand('list');
    const message = String(listResponse?.message || '');
    const parts = message.split(':');
    if (parts.length < 2) return ['No players found'];
    const rawList = parts[1];
    const playerList = rawList.split(',').map(player => player.trim()).filter(Boolean);
    return playerList.length > 0 ? playerList : ['No players found'];
  };

  const executeSimpleCommand = (name) => {
    callCommand(name);
  };

  const executeCommand = (name) => {
    const params = [];
    const form = document.getElementById('command-form');
    const elements = form?.elements ? Array.from(form.elements) : [];
    elements
      .filter(elem => elem.nodeName !== 'BUTTON' && !elem.hidden)
      .forEach(elem => {
        if (elem.type === 'checkbox') {
          if (elem.checked) params.push(elem.id);
        } else {
          params.push(elem.value);
        }
      });

    const commandString = name.concat(' ', params.join(' '));
    setModalShown(false);
    callCommand(commandString);
  };

  const prepareModal = async (command) => {
    setModalHeader(command.name);

    const body = [];
    const reqElems = await createElements(command.required, true);
    if (reqElems?.length > 0) body.push(reqElems);
    const optElems = await createElements(command.optional, false);
    if (optElems?.length > 0) body.push(optElems);
    if (body.length === 0) {
      executeSimpleCommand(command.name);
      return;
    }

    const footer = (
      <>
        <Button
          className='mx-2 my-2 '
          onClick={() => executeCommand(command.name, true)}
          id='execute-command'
          type='submit'
          enabled={true} >Execute</Button>
        <Button
          className='mx-2 my-2 '
          onClick={() => setModalShown(false)}
          id='cancel-command'
          type='button'
          enabled={true} >Cancel</Button>
      </>
    );

    setModalMessage((
      <form
        id={`command-form`}
        method='dialog'>
        {body}
      </form>
    ));
    setFooterButtons(footer);
    setModalShown(true);
  };

  const callCommand = async (command) => {
    const message = await effectCommand(command);
    toast(message.message ? message.message : `Error: ${message.error}`);
    setModalShown(false);
  };

  const sortedCommands = Array.isArray(consoleCommands)
    ? [...consoleCommands].sort((lhs, rhs) => {
      const left = String(lhs?.name || '');
      const right = String(rhs?.name || '');
      return left.localeCompare(right);
    })
    : [];

  return (
    <div className='flex flex-wrap mt-5 '>
      <Modal
        id='console-modal'
        show={modalShown}
        setShow={() => setModalShown(false)}
        header={`Parameters for ${modalHeader}`}
        footer={footerButtons}
        static={true} >
        {modalMessage}
      </Modal>
      {
        sortedCommands.length > 0 ?
          sortedCommands.map(command => {
            return (
              <div key={command.id}>
                <Button
                  className='ms-4 my-5 '
                  onClick={() => prepareModal(command)}
                  id={`effect-${command.name}`}
                  type='button'
                  enabled={true} >
                  {command.name}
                </Button>
              </div>
            );
          })
          : null
      }
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        transition={Flip}
      />
    </div>
  );
}
