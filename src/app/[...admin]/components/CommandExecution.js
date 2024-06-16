import { useEffect, useState } from "react";
import { effectCommand, pullConsoleCommands } from "./api/consoleCommands";
import Button from "@/app/components/Button/Button";
import { Flip, ToastContainer, toast } from "react-toastify";

import 'react-toastify/dist/ReactToastify.css'

export default function CommandExecution() {

  const [consoleCommands, setConsoleCommands] = useState();

  useEffect(() => {
    const setConsoleCommandsState = async () => {
      const tempCommands = await pullConsoleCommands();
      setConsoleCommands(tempCommands);
    };
    setConsoleCommandsState();
  }, []);

  const callCommand = async (command) => {
    const message = await effectCommand(command);
    toast(message.message);
    console.log(message);
  }

  return (
    <div className='flex'>
      {
        Array.isArray(consoleCommands) ?
          consoleCommands
            .sort((lhs, rhs) => lhs.name > rhs.name)
            .map(command =>
              <div key={command.id}>
                <Button
                  className='ms-4 my-5 mt-5 '
                  onClick={() => callCommand(command.name)}
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