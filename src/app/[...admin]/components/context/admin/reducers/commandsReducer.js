const { pullCommands, saveCommands } = require("../../../api/commands");

const initialCommandsState = [{ name: "", id: "" }];

const commandsActionTypes = {
  ADD_COMMAND: "ADD_COMMAND",
  GET_COMMAND: "GET_COMMAND",
  UPDATE_COMMAND: "UPDATE_COMMAND",
  REMOVE_COMMAND: "REMOVE_COMMAND",
  REFRESH_COMMAND: "REFRESH_COMMAND",
  RESPONSE_COMMAND: "RESPONSE_COMMAND",
};

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function appendUniqueCommands(state, payload) {
  const incomingCommands = normalizePayload(payload);
  if (incomingCommands.length === 0) return state;

  const existingKeys = new Set(
    state
      .map((command) => command?.id || command?.name)
      .filter(Boolean)
  );

  const newCommands = incomingCommands.filter((command) => {
    const key = command?.id || command?.name;
    return key && !existingKeys.has(key);
  });

  return newCommands.length > 0 ? [...state, ...newCommands] : state;
}

function commandsReducer(state = initialCommandsState, action = {}) {
  const type = String(action.type || "").toUpperCase();

  switch (type) {
    case commandsActionTypes.ADD_COMMAND: {
      saveCommands(action.payload, action.context, "ADD");
      return state;
    }
    case commandsActionTypes.GET_COMMAND: {
      pullCommands(action.context);
      return state;
    }
    case commandsActionTypes.UPDATE_COMMAND: {
      saveCommands(action.payload, action.context, "UPDATE");
      return state;
    }
    case commandsActionTypes.REMOVE_COMMAND: {
      saveCommands(action.payload, action.context, "REMOVE");
      return state;
    }
    case commandsActionTypes.REFRESH_COMMAND: {
      return Array.isArray(action.payload) ? action.payload : state;
    }
    case commandsActionTypes.RESPONSE_COMMAND: {
      if (action.payload?.error) {
        return state;
      }
      return appendUniqueCommands(state, action.payload);
    }
    default: {
      return state;
    }
  }
}

module.exports = { initialCommandsState, commandsActionTypes, commandsReducer };
