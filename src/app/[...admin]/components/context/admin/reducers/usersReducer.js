const { pullUsers, mutateUsers } = require("../../../api/users");

const initialUsersState = [{ name: "", id: "" }];

const usersActionTypes = {
  CREATE_USER: "CREATE_USER",
  GET_USER: "GET_USER",
  UPDATE_USER: "UPDATE_USER",
  REMOVE_USER: "REMOVE_USER",
  REFRESH_USER: "REFRESH_USER",
  RESPONSE_USER: "RESPONSE_USER",
};

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function appendUniqueUsers(state, payload) {
  const incomingUsers = normalizePayload(payload);
  if (incomingUsers.length === 0) return state;

  const existingKeys = new Set(
    state
      .map((user) => user?.id || user?.name || user?.email)
      .filter(Boolean)
  );

  const newUsers = incomingUsers.filter((user) => {
    const key = user?.id || user?.name || user?.email;
    return key && !existingKeys.has(key);
  });

  return newUsers.length > 0 ? [...state, ...newUsers] : state;
}

function usersReducer(state = initialUsersState, action = {}) {
  const type = String(action.type || "").toUpperCase();

  switch (type) {
    case usersActionTypes.CREATE_USER: {
      mutateUsers(action.payload, action.context, "POST");
      return state;
    }
    case usersActionTypes.GET_USER: {
      pullUsers(action.context);
      return state;
    }
    case usersActionTypes.UPDATE_USER: {
      mutateUsers(action.payload, action.context, "PUT");
      return state.map((user) =>
        user.id === action.payload?.id
          ? {
              ...user,
              name: action.payload?.name,
              password: action.payload?.password,
              email: action.payload?.email,
              roles: action.payload?.roles,
              groups: action.payload?.groups,
              active: action.payload?.active,
              changePassword: action.payload?.changePassword,
            }
          : user
      );
    }
    case usersActionTypes.REMOVE_USER: {
      mutateUsers(action.payload, action.context, "DELETE");
      const matchesId = action.payload?.id !== undefined;
      const matchesName = action.payload?.name !== undefined;
      const matchesEmail = action.payload?.email !== undefined;
      const newState = state.filter(
        (user) =>
          (!matchesId || user.id !== action.payload?.id) &&
          (!matchesName || user.name !== action.payload?.name) &&
          (!matchesEmail || user.email !== action.payload?.email)
      );
      return newState.length === state.length ? state : newState;
    }
    case usersActionTypes.RESPONSE_USER: {
      if (action.payload?.error) {
        return state;
      }

      return appendUniqueUsers(state, action.payload);
    }
    case usersActionTypes.REFRESH_USER: {
      return Array.isArray(action.payload) ? action.payload : state;
    }
    default: {
      return state;
    }
  }
}

module.exports = { initialUsersState, usersActionTypes, usersReducer };
