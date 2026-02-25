jest.mock("../../../api/commands", () => ({
  pullCommands: jest.fn(),
  saveCommands: jest.fn(),
}));

const { pullCommands, saveCommands } = require("../../../api/commands");
const { commandsReducer, commandsActionTypes } = require("./commandsReducer");

describe("commandsReducer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls pullCommands on GET_COMMAND", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Command_1" }];

    const nextState = commandsReducer(state, {
      type: commandsActionTypes.GET_COMMAND,
      context: dispatch,
    });

    expect(pullCommands).toHaveBeenCalledWith(dispatch);
    expect(nextState).toBe(state);
  });

  it("routes add/update/remove to saveCommands", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Command_1" }];

    commandsReducer(state, {
      type: commandsActionTypes.ADD_COMMAND,
      payload: { name: "Command_2" },
      context: dispatch,
    });
    commandsReducer(state, {
      type: commandsActionTypes.UPDATE_COMMAND,
      payload: { id: "1", name: "Command_1_Updated" },
      context: dispatch,
    });
    commandsReducer(state, {
      type: commandsActionTypes.REMOVE_COMMAND,
      payload: { id: "1" },
      context: dispatch,
    });

    expect(saveCommands).toHaveBeenNthCalledWith(1, { name: "Command_2" }, dispatch, "ADD");
    expect(saveCommands).toHaveBeenNthCalledWith(2, { id: "1", name: "Command_1_Updated" }, dispatch, "UPDATE");
    expect(saveCommands).toHaveBeenNthCalledWith(3, { id: "1" }, dispatch, "REMOVE");
  });
});
