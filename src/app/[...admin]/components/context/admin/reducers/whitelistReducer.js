const initialWhitelistState = [];

const whitelistActionTypes = {
  CREATE_WHITELIST: "CREATE_WHITELIST",
  GET_WHITELIST: "READ_WHITELIST",
  UPDATE_WHITELIST: "UPDATE_WHITELIST",
  REMOVE_WHITELIST: "DELETE_WHITELIST",
  REFRESH_WHITELIST: "REFRESH_WHITELIST",
  RESPONSE_WHITELIST: "RESPONSE_WHITELIST",
};

function whitelistReducer(state = initialWhitelistState, action = {}) {
  const type = String(action.type || "").toUpperCase();

  switch (type) {
    case whitelistActionTypes.CREATE_WHITELIST:
    case whitelistActionTypes.GET_WHITELIST:
    case whitelistActionTypes.UPDATE_WHITELIST:
    case whitelistActionTypes.REMOVE_WHITELIST:
    case whitelistActionTypes.RESPONSE_WHITELIST: {
      return state;
    }
    case whitelistActionTypes.REFRESH_WHITELIST: {
      return Array.isArray(action.payload) ? action.payload : state;
    }
    default: {
      return state;
    }
  }
}

module.exports = { initialWhitelistState, whitelistActionTypes, whitelistReducer };
