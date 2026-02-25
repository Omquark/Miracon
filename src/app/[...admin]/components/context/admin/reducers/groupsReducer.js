const { pullGroups, mutateGroups } = require("../../../api/groups");

const initialGroupsState = [{ name: "", id: "" }];

const groupsActionTypes = {
  CREATE_GROUP: "CREATE_GROUP",
  GET_GROUP: "GET_GROUP",
  UPDATE_GROUP: "UPDATE_GROUP",
  REMOVE_GROUP: "REMOVE_GROUP",
  REFRESH_GROUP: "REFRESH_GROUP",
  RESPONSE_GROUP: "RESPONSE_GROUP",
};

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function appendUniqueGroups(state, payload) {
  const incomingGroups = normalizePayload(payload);
  if (incomingGroups.length === 0) return state;

  const existingKeys = new Set(
    state
      .map((group) => group?.id || group?.name)
      .filter(Boolean)
  );

  const newGroups = incomingGroups.filter((group) => {
    const key = group?.id || group?.name;
    return key && !existingKeys.has(key);
  });

  return newGroups.length > 0 ? [...state, ...newGroups] : state;
}

function groupsReducer(state = initialGroupsState, action = {}) {
  const type = String(action.type || "").toUpperCase();

  switch (type) {
    case groupsActionTypes.CREATE_GROUP: {
      mutateGroups(action.payload, action.context, "POST");
      return state;
    }
    case groupsActionTypes.GET_GROUP: {
      pullGroups(action.context);
      return state;
    }
    case groupsActionTypes.UPDATE_GROUP: {
      mutateGroups(action.payload, action.context, "PUT");
      return state.map((group) =>
        group.id === action.payload?.id
          ? {
              ...group,
              name: action.payload?.name,
              roles: Array.isArray(action.payload?.roles) ? [...action.payload.roles] : [],
            }
          : group
      );
    }
    case groupsActionTypes.REMOVE_GROUP: {
      mutateGroups(action.payload, action.context, "DELETE");
      const newState = state.filter(
        (group) =>
          group.id !== action.payload?.id && group.name !== action.payload?.name
      );
      return newState.length === state.length ? state : newState;
    }
    case groupsActionTypes.RESPONSE_GROUP: {
      if (action.payload?.error) {
        return state;
      }

      return appendUniqueGroups(state, action.payload);
    }
    case groupsActionTypes.REFRESH_GROUP: {
      return Array.isArray(action.payload) ? action.payload : state;
    }
    default: {
      return state;
    }
  }
}

module.exports = { initialGroupsState, groupsActionTypes, groupsReducer };
