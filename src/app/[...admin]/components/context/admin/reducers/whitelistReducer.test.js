const { whitelistReducer, whitelistActionTypes } = require("./whitelistReducer");

describe("whitelistReducer", () => {
  it("keeps state for non-refresh actions", () => {
    const state = [{ id: "1", username: "Player1" }];

    const nextState = whitelistReducer(state, {
      type: whitelistActionTypes.CREATE_WHITELIST,
      payload: { id: "2", username: "Player2" },
    });

    expect(nextState).toBe(state);
  });

  it("refreshes state when payload is an array", () => {
    const payload = [{ id: "2", username: "Player2" }];
    const nextState = whitelistReducer([], {
      type: whitelistActionTypes.REFRESH_WHITELIST,
      payload,
    });

    expect(nextState).toBe(payload);
  });
});
