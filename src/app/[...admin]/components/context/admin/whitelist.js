'use client'

import { createContext } from "react"

export const AdminWhitelistContext = createContext();

export const whitelistActionTypes = {
  CREATE_WHITELIST: 'CREATE_WHITELIST',
  GET_WHITELIST: 'READ_WHITELIST',
  UPDATE_WHITELIST: 'UPDATE_WHITELIST',
  REMOVE_WHITELIST: 'DELETE_WHITELIST',
  REFRESH_WHITELIST: 'REFRESH_WHITELIST',
  RESPONSE_WHITELIST: 'RESPONSE_WHITELIST',
}

/**
 * action object
 * @property {whitelistActionType} type Action to perform
 * @property {Array<entry>} payload An array which defines whitelist entries to effect a command upon
 * @property {context} context The context used when calling this function. Passed to the API to make dispatch calls
 */

/**
 * Reducer for the whitelist, used to perform and dispatch CRUD functions to the whitelist
 * @param {any} state The state as passed by the reducer
 * @param {Object} action An object containting details regarding how to transform this data
 * @returns The new state to be used
 */

function whitelistReducer(state, action) {
  switch (action.type.toUpperCase()) {
    case (whitelistActionTypes.CREATE_WHITELIST): {
      return state;
    }
    case (whitelistActionTypes.GET_WHITELIST): {
      return state;
    }
    case (whitelistActionTypes.UPDATE_WHITELIST): {
      return state;
    }
    case (whitelistActionTypes.REMOVE_WHITELIST): {
      return state;
    }
    case (whitelistActionTypes.REFRESH_WHITELIST): {
      return state;
    }
    case (whitelistActionTypes.RESPONSE_WHITELIST): {
      return state;
    }
  }
}