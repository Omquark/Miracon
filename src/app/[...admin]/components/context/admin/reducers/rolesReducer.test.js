jest.mock("../../../api/roles", () => ({
  pullRoles: jest.fn(),
  mutateRoles: jest.fn(),
}));

const { pullRoles, mutateRoles } = require("../../../api/roles");
const { rolesReducer, rolesActionTypes } = require("./rolesReducer");

describe("rolesReducer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls mutateRoles with POST on CREATE_ROLE", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Role_1" }];

    const nextState = rolesReducer(state, {
      type: rolesActionTypes.CREATE_ROLE,
      payload: { name: "Role_2" },
      context: dispatch,
    });

    expect(mutateRoles).toHaveBeenCalledWith({ name: "Role_2" }, dispatch, "POST");
    expect(nextState).toBe(state);
  });

  it("calls pullRoles on GET_ROLE", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Role_1" }];

    const nextState = rolesReducer(state, {
      type: rolesActionTypes.GET_ROLE,
      context: dispatch,
    });

    expect(pullRoles).toHaveBeenCalledWith(dispatch);
    expect(nextState).toBe(state);
  });

  it("updates a matching role immutably on UPDATE_ROLE", () => {
    const state = [{ id: "1", name: "Role_1" }, { id: "2", name: "Role_2" }];

    const nextState = rolesReducer(state, {
      type: rolesActionTypes.UPDATE_ROLE,
      payload: { id: "2", name: "Role_2_Updated" },
      context: jest.fn(),
    });

    expect(nextState).toEqual([{ id: "1", name: "Role_1" }, { id: "2", name: "Role_2_Updated" }]);
    expect(nextState[1]).not.toBe(state[1]);
  });

  it("appends non-duplicate roles on RESPONSE_ROLE", () => {
    const state = [{ id: "1", name: "Role_1" }];

    const nextState = rolesReducer(state, {
      type: rolesActionTypes.RESPONSE_ROLE,
      payload: [{ id: "1", name: "Role_1" }, { id: "2", name: "Role_2" }],
    });

    expect(nextState).toEqual([{ id: "1", name: "Role_1" }, { id: "2", name: "Role_2" }]);
  });

  it("refreshes state from payload on REFRESH_ROLE", () => {
    const payload = [{ id: "3", name: "Role_3" }];
    const nextState = rolesReducer([{ id: "1", name: "Role_1" }], {
      type: rolesActionTypes.REFRESH_ROLE,
      payload,
    });
    expect(nextState).toBe(payload);
  });
});
