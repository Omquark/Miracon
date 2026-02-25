jest.mock("../../../api/users", () => ({
  pullUsers: jest.fn(),
  mutateUsers: jest.fn(),
}));

const { pullUsers, mutateUsers } = require("../../../api/users");
const { usersReducer, usersActionTypes } = require("./usersReducer");

describe("usersReducer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls mutateUsers with PUT on UPDATE_USER", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "User_1", email: "a@a.com" }];

    const nextState = usersReducer(state, {
      type: usersActionTypes.UPDATE_USER,
      payload: { id: "1", name: "User_1_Updated", email: "b@b.com" },
      context: dispatch,
    });

    expect(mutateUsers).toHaveBeenCalledWith(
      { id: "1", name: "User_1_Updated", email: "b@b.com" },
      dispatch,
      "PUT"
    );
    expect(nextState[0]).toEqual({
      id: "1",
      name: "User_1_Updated",
      password: undefined,
      email: "b@b.com",
      roles: undefined,
      groups: undefined,
      active: undefined,
      changePassword: undefined,
    });
    expect(nextState[0]).not.toBe(state[0]);
  });

  it("calls pullUsers on GET_USER", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "User_1" }];

    const nextState = usersReducer(state, {
      type: usersActionTypes.GET_USER,
      context: dispatch,
    });

    expect(pullUsers).toHaveBeenCalledWith(dispatch);
    expect(nextState).toBe(state);
  });

  it("removes user by id on REMOVE_USER", () => {
    const state = [{ id: "1", name: "User_1" }, { id: "2", name: "User_2" }];

    const nextState = usersReducer(state, {
      type: usersActionTypes.REMOVE_USER,
      payload: { id: "1" },
      context: jest.fn(),
    });

    expect(nextState).toEqual([{ id: "2", name: "User_2" }]);
  });

  it("appends only new users on RESPONSE_USER", () => {
    const state = [{ id: "1", name: "User_1" }];

    const nextState = usersReducer(state, {
      type: usersActionTypes.RESPONSE_USER,
      payload: [{ id: "1", name: "User_1" }, { id: "2", name: "User_2" }],
    });

    expect(nextState).toEqual([{ id: "1", name: "User_1" }, { id: "2", name: "User_2" }]);
  });
});
