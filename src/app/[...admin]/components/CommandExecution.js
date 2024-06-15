import { useEffect, useState } from "react";
import { effectCommand, pullConsoleCommands } from "./api/consoleCommands";
import Button from "@/app/components/Button/Button";

export default function CommandExecution() {

  const [consoleCommands, setConsoleCommands] = useState();

  useEffect(() => {
    const setConsoleCommandsState = async () => {
      const tempCommands = await pullConsoleCommands();
      setConsoleCommands(tempCommands);
    };
    setConsoleCommandsState();
  }, []);

  return (
    <div>
      {
        Array.isArray(consoleCommands) ?
          consoleCommands.map(command =>
            <div key={command.id}>
              <Button
                className='mx-2 my-2 '
                onClick={() => effectCommand(command.name)}
                id={`effect-${command.name}`}
                type='button'
                enabled={true} >
                {command.name}
              </Button>
            </div>
          ) : <></> //consoleCommands && Array.isArray(consoleCommands)
      }
    </div>
  )
}