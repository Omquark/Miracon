jest.mock("../../../api/groups", () => ({
  pullGroups: jest.fn(),
  mutateGroups: jest.fn(),
}));

const { pullGroups, mutateGroups } = require("../../../api/groups");
const { groupsReducer, groupsActionTypes } = require("./groupsReducer");

describe("groupsReducer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls pullGroups on GET_GROUP", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Group_1" }];

    const nextState = groupsReducer(state, {
      type: groupsActionTypes.GET_GROUP,
      context: dispatch,
    });

    expect(pullGroups).toHaveBeenCalledWith(dispatch);
    expect(nextState).toBe(state);
  });

  it("calls mutateGroups with DELETE on REMOVE_GROUP", () => {
    const dispatch = jest.fn();
    const state = [{ id: "1", name: "Group_1" }, { id: "2", name: "Group_2" }];

    const nextState = groupsReducer(state, {
      type: groupsActionTypes.REMOVE_GROUP,
      payload: { id: "1" },
      context: dispatch,
    });

    expect(mutateGroups).toHaveBeenCalledWith({ id: "1" }, dispatch, "DELETE");
    expect(nextState).toEqual([{ id: "2", name: "Group_2" }]);
  });

  it("updates matching group immutably on UPDATE_GROUP", () => {
    const state = [{ id: "1", name: "Group_1", roles: ["Role_1"] }];

    const nextState = groupsReducer(state, {
      type: groupsActionTypes.UPDATE_GROUP,
      payload: { id: "1", name: "Group_1_Updated", roles: ["Role_2"] },
      context: jest.fn(),
    });

    expect(nextState[0]).toEqual({ id: "1", name: "Group_1_Updated", roles: ["Role_2"] });
    expect(nextState[0]).not.toBe(state[0]);
  });
});
