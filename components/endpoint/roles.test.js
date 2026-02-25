jest.mock("../commands/Commands", () => ({
  checkCommand: jest.fn(),
}));

jest.mock("../rbac/Role", () => ({
  addRoles: jest.fn(),
  getRoles: jest.fn(),
  updateRoles: jest.fn(),
  removeRoles: jest.fn(),
}));

jest.mock("../utility/Validators", () => ({
  isValidUsername: jest.fn(),
}));

jest.mock("../rbac/Utility", () => ({
  strictProperties: jest.fn((value) => value),
}));

const { checkCommand } = require("../commands/Commands");
const { addRoles, getRoles, updateRoles, removeRoles } = require("../rbac/Role");
const { isValidUsername } = require("../utility/Validators");
const { CreateRole, ReadRole, UpdateRole, DeleteRole } = require("./roles");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("roles endpoint handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkCommand.mockResolvedValue(undefined);
    isValidUsername.mockReturnValue(true);
  });

  it("CreateRole denies when command check fails", async () => {
    checkCommand.mockResolvedValue({ error: "denied" });
    const res = mockRes();
    await CreateRole({ body: { data: { name: "Role_1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(addRoles).not.toHaveBeenCalled();
  });

  it("CreateRole validates and sanitizes name", async () => {
    addRoles.mockResolvedValue([{ id: "1", name: "Role_1" }]);
    const res = mockRes();
    await CreateRole({ body: { data: { name: "  Role_1  " } }, session: { userInfo: {} } }, res);
    expect(addRoles).toHaveBeenCalledWith({ name: "Role_1" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("UpdateRole requires id and name", async () => {
    const res = mockRes();
    await UpdateRole({ body: { data: { name: "Role_1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateRoles).not.toHaveBeenCalled();
  });

  it("ReadRole returns role list", async () => {
    getRoles.mockResolvedValue([{ id: "1", name: "Role_1" }]);
    const res = mockRes();
    await ReadRole({ session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ id: "1", name: "Role_1" }]);
  });

  it("DeleteRole blocks critical roles", async () => {
    getRoles.mockResolvedValue([{ id: "1", name: "Role_1", critical: true }]);
    const res = mockRes();
    await DeleteRole({ body: { data: { id: "1", name: "Role_1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(removeRoles).not.toHaveBeenCalled();
  });

  it("DeleteRole removes non-critical roles", async () => {
    getRoles.mockResolvedValue([{ id: "1", name: "Role_1", critical: false }]);
    removeRoles.mockResolvedValue([{ id: "1", name: "Role_1" }]);
    const res = mockRes();
    await DeleteRole({ body: { data: { id: "1", name: "Role_1" } }, session: { userInfo: {} } }, res);
    expect(removeRoles).toHaveBeenCalledWith({ id: "1", name: "Role_1" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
