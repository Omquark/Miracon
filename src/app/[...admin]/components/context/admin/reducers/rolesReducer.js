const { pullRoles, mutateRoles } = require("../../../api/roles");

const initialRolesState = [{ name: "", id: "" }];

const rolesActionTypes = {
  CREATE_ROLE: "CREATE_ROLE",
  GET_ROLE: "GET_ROLE",
  UPDATE_ROLE: "UPDATE_ROLE",
  REMOVE_ROLE: "REMOVE_ROLE",
  REFRESH_ROLE: "REFRESH_ROLE",
  RESPONSE_ROLE: "RESPONSE_ROLE",
};

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function appendUniqueRoles(state, payload) {
  const incomingRoles = normalizePayload(payload);
  if (incomingRoles.length === 0) return state;

  const existingKeys = new Set(
    state
      .map((role) => role?.id || role?.name)
      .filter(Boolean)
  );

  const newRoles = incomingRoles.filter((role) => {
    const key = role?.id || role?.name;
    return key && !existingKeys.has(key);
  });

  return newRoles.length > 0 ? [...state, ...newRoles] : state;
}

function rolesReducer(state = initialRolesState, action = {}) {
  const type = String(action.type || "").toUpperCase();

  switch (type) {
    case rolesActionTypes.CREATE_ROLE: {
      mutateRoles(action.payload, action.context, "POST");
      return state;
    }
    case rolesActionTypes.GET_ROLE: {
      pullRoles(action.context);
      return state;
    }
    case rolesActionTypes.UPDATE_ROLE: {
      mutateRoles(action.payload, action.context, "PUT");
      return state.map((role) =>
        role.id === action.payload?.id
          ? { ...role, name: action.payload?.name }
          : role
      );
    }
    case rolesActionTypes.REMOVE_ROLE: {
      mutateRoles(action.payload, action.context, "DELETE");
      const newState = state.filter(
        (role) =>
          role.id !== action.payload?.id && role.name !== action.payload?.name
      );
      return newState.length === state.length ? state : newState;
    }
    case rolesActionTypes.RESPONSE_ROLE: {
      if (action.payload?.error) {
        return state;
      }

      return appendUniqueRoles(state, action.payload);
    }
    case rolesActionTypes.REFRESH_ROLE: {
      return Array.isArray(action.payload) ? action.payload : state;
    }
    default: {
      return state;
    }
  }
}

module.exports = { initialRolesState, rolesActionTypes, rolesReducer };
