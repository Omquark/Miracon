import { useEffect, useState } from "react";
import { effectCommand, pullConsoleCommands } from "./api/consoleCommands";
import Button from "@/app/components/Button/Button";
import Selection from "@/app/components/Selection/Selection";
import TextBox from "@/app/components/TextBox/TextBox";
import { Flip, ToastContainer, toast } from "react-toastify";
import Modal from "@/app/components/Modal/Modal";
import CheckBox from "@/app/components/CheckBox/CheckBox";

export default function CommandExecution() {

  const [consoleCommands, setConsoleCommands] = useState();
  const [modalShown, setModalShown] = useState(false);
  const [modalHeader, setModalHeader] = useState('');
  const [footerButtons, setFooterButtons] = useState(<></>);
  const [modalMessage, setModalMessage] = useState(<></>);

  useEffect(() => {
    const setConsoleCommandsState = async () => {
      const tempCommands = await pullConsoleCommands();
      setConsoleCommands(tempCommands);
    };
    setConsoleCommandsState();
  }, []);

  /**
   * Creates the elements for the form to offer the user required and optional elements
   * @param {Array} elems An array of parameters for the command
   * @param {boolean} required If this element is required. Used primarily to set a textbox red when it is required (Not yet working)
   * @returns The body to be used directly in the modal
   */
  const createElements = async (elems, required) => {
    if (elems.length === 0) return undefined;
    let param;
    const body = [];
    for (param of elems) {
      // elems.forEach(async (param) => {
      if (!param.type) return;
      let id = `${param.name}`;
      switch (param.type.toUpperCase()) {
        case ('STRING'): {
          body.push((
            <div key={id}>
              <TextBox
                className={required ? ' bg-red-300 ' : ''}
                type='text'
                id={id}
                placeholder={param.name} />
            </div>
          ));
          break;
        }
        //Handles similar, but has a slight difference how the selections are populated
        case ('PLAYER'):
        case ('ENUM'):
          body.push((
            <div key={id}>
              <Selection
                className=''
                placeholder={param.name}
                id={id}
                values={
                  param.type.toUpperCase() === 'ENUM' ?
                    param.values :
                    await listPlayers()
                } />
            </div>
          ));
          break;
        case ('BOOLEAN'): {
          body.push((
            <div key={id}>
              <CheckBox
                id={id}
                placeholder={param.name} />
            </div>
          ))
        }
      }
    }
    return body;
  }

  const listPlayers = async () => {
    const listResponse = await effectCommand('list');
    //String looks as There are 1 of max of 20 players online: player1, player2
    //we can assume player names are alpha-numeric with underscores
    //Split and use the second of the array, this is the raw player list
    const rawList = listResponse.message.split(':')[1];
    //Now split by commas
    const playerList = rawList.split(',').map(player => player.trim());
    if (playerList[0] === "") playerList[0] = "No players found";
    return playerList;
  }

  const executeSimpleCommand = (name) => {
    callCommand(name);
  }

  const executeCommand = (name) => {
    const params = [];
    const form = document.getElementById('command-form');
    const elements = form?.elements;
    Array.from(elements).filter(elem => elem.nodeName !== 'BUTTON' && !elem.hidden).forEach(elem => {
      if (elem.type === 'checkbox') {
        if (elem.checked)
          params.push(elem.id);
      } else {
        params.push(elem.value);
      }
    });

    const commandString = name.concat(' ', params.join(' '));
    setModalShown(false);
    callCommand(commandString);
  }

  const prepareModal = async (command) => {
    setModalHeader(command.name);

    const body = [];
    const reqElems = await createElements(command.required, true);
    if (reqElems?.length > 0) body.push(reqElems);
    const optElems = await createElements(command.optional, false);
    if (optElems?.length > 0) body.push(optElems);
    if (body.length === 0) {
      console.log(`Executing simple command ${command.name}`);
      executeSimpleCommand(command.name);
      return;
    }

    const footer = (
      <>
        <Button
          className='mx-2 my-2 '
          onClick={() => executeCommand(command.name)}
          id='save-user'
          type='submit'
          enabled={true} >Execute</Button>
        <Button
          className='mx-2 my-2 '
          onClick={() => setModalShown(false)}
          id='cancel-user'
          type='button'
          enabled={true} >Cancel</Button>
      </>
    )

    setModalMessage((
      <form
        id={`command-form`}
        method='dialog'>
        {body}
      </form>
    ));
    setFooterButtons(footer);
    setModalShown(true);
  }

  const callCommand = async (command) => {
    const message = await effectCommand(command);
    toast(message.message);
  }

  return (
    <div className='flex flex-wrap mt-5 '>
      <Modal
        id='console-modal'
        show={modalShown}
        setShow={setModalShown}
        header={`Parameters for ${modalHeader}`}
        footer={footerButtons}
        static={true} >
        {modalMessage}
      </Modal>
      {
        Array.isArray(consoleCommands) ?
          consoleCommands
            .sort((lhs, rhs) => lhs.name > rhs.name)
            .map(command =>
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
            ) : <></> //consoleCommands && Array.isArray(consoleCommands)
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
  )
}