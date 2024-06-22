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


  const createElements = (elems, required) => {
    if (elems.length === 0) return undefined;
    const body = [];
    elems.forEach((param) => {
      if (!param.type) return;
      let id = `${param.name}`;
      switch (param.type.toUpperCase()) {
        case ('STRING'): {
          body.push((
            <div key={id}>
              <TextBox
                className={required ? 'bg-red-300' : ''}
                type='text'
                id={id}
                placeholder={param.name} />
            </div>
          ));
          break;
        }
        case ('ENUM'): {
          body.push((
            <div key={id}>
              <Selection
                className=''
                placeholder={param.name}
                id={id}
                values={param.values} />
            </div>
          ));
          break;
        }
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
    });

    return body;
  }

  const executeCommand = (name) => {
    const params = [];
    const form = document.getElementById('command-form')?.elements;
    if (Array.isArray(form)) {
      Array.from(form).filter(elem => elem.nodeName !== 'BUTTON').forEach(elem => {
        if (elem.type === 'checkbox') {
          if (elem.checked)
            params.push(elem.id);
        } else {
          params.push(elem.value);
        }
      });
    }

    const commandString = name.concat(' ', params.join(' '));
    callCommand(commandString);
  }

  const prepareModal = async (command) => {
    setModalHeader(command.name);

    const body = [];
    const reqElems = createElements(command.required, true);
    if (reqElems?.length > 0) body.push(reqElems);
    const optElems = createElements(command.optional, false);
    if (optElems?.length > 0) body.push(optElems);
    console.log('body', body);
    if (body.length === 0) {
      executeCommand(command.name);
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
    <div className='flex'>
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
                  className='ms-4 my-5 mt-5 '
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