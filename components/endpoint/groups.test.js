jest.mock("../commands/Commands", () => ({
  checkCommand: jest.fn(),
}));

jest.mock("../rbac/Group", () => ({
  updateGroups: jest.fn(),
  getGroups: jest.fn(),
  addGroups: jest.fn(),
  removeGroups: jest.fn(),
}));

jest.mock("../utility/Validators", () => ({
  isValidUsername: jest.fn(),
}));

const { checkCommand } = require("../commands/Commands");
const { updateGroups, getGroups, addGroups, removeGroups } = require("../rbac/Group");
const { isValidUsername } = require("../utility/Validators");
const { CreateGroup, ReadGroup, UpdateGroup, DeleteGroup } = require("./groups");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("groups endpoint handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkCommand.mockResolvedValue(undefined);
    isValidUsername.mockReturnValue(true);
  });

  it("CreateGroup validates name and roles", async () => {
    addGroups.mockResolvedValue([{ id: "1", name: "Group_1", roles: ["r1"] }]);
    const res = mockRes();
    await CreateGroup({
      body: { data: { name: "  Group_1 ", roles: [" r1 ", "", "r2"] } },
      session: { userInfo: {} }
    }, res);
    expect(addGroups).toHaveBeenCalledWith({ name: "Group_1", roles: ["r1", "r2"] });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("UpdateGroup requires selector", async () => {
    const res = mockRes();
    await UpdateGroup({ body: { data: { roles: ["r1"] } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateGroups).not.toHaveBeenCalled();
  });

  it("UpdateGroup uses selector and updated payload", async () => {
    updateGroups.mockResolvedValue([{ id: "1", name: "Group_1", roles: ["r2"] }]);
    const res = mockRes();
    await UpdateGroup({
      body: { data: { id: "1", name: "Group_1", roles: [" r2 "] } },
      session: { userInfo: {} }
    }, res);
    expect(updateGroups).toHaveBeenCalledWith({ id: "1", name: "Group_1" }, { id: "1", name: "Group_1", roles: ["r2"] });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("ReadGroup returns list", async () => {
    getGroups.mockResolvedValue([{ id: "1", name: "Group_1" }]);
    const res = mockRes();
    await ReadGroup({ session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ id: "1", name: "Group_1" }]);
  });

  it("DeleteGroup blocks critical groups", async () => {
    getGroups.mockResolvedValue([{ id: "1", name: "Group_1", critical: true }]);
    const res = mockRes();
    await DeleteGroup({ body: { data: { id: "1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(removeGroups).not.toHaveBeenCalled();
  });

  it("DeleteGroup removes non-critical groups", async () => {
    getGroups.mockResolvedValue([{ id: "1", name: "Group_1", critical: false }]);
    removeGroups.mockResolvedValue([{ id: "1", name: "Group_1" }]);
    const res = mockRes();
    await DeleteGroup({ body: { data: { id: "1", name: "Group_1" } }, session: { userInfo: {} } }, res);
    expect(removeGroups).toHaveBeenCalledWith({ id: "1", name: "Group_1" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
