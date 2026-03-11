jest.mock("../commands/Commands", () => ({
  checkCommand: jest.fn(),
}));

jest.mock("../rbac/User", () => ({
  addUsers: jest.fn(),
  updateUsers: jest.fn(),
  getUsers: jest.fn(),
  removeUsers: jest.fn(),
}));

jest.mock("../utility/Utility", () => ({
  bytesFromBase64: jest.fn(),
}));

jest.mock("../utility/Validators", () => ({
  isValidUsername: jest.fn(),
  isValidPassword: jest.fn(),
  isValidEmail: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const { checkCommand } = require("../commands/Commands");
const { addUsers, updateUsers, getUsers, removeUsers } = require("../rbac/User");
const { bytesFromBase64 } = require("../utility/Utility");
const { isValidUsername, isValidPassword, isValidEmail } = require("../utility/Validators");
const bcrypt = require("bcrypt");
const { CreateUser, ReadUser, UpdateUser, DeleteUser } = require("./users");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("users endpoint handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkCommand.mockResolvedValue(undefined);
    isValidUsername.mockReturnValue(true);
    isValidPassword.mockReturnValue(true);
    isValidEmail.mockReturnValue(true);
    bytesFromBase64.mockReturnValue(Buffer.from("Pass_123!"));
    bcrypt.hash.mockResolvedValue("hashed");
  });

  it("CreateUser validates and masks password", async () => {
    addUsers.mockResolvedValue([{ id: "1", name: "User_1", password: "hashed" }]);
    const res = mockRes();

    await CreateUser({
      body: { data: { name: " User_1 ", email: "user@example.com", password: "cA==", roles: ["r1"], groups: ["g1"] } },
      session: { userInfo: {} }
    }, res);

    expect(addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: "User_1",
      email: "user@example.com",
      roles: ["r1"],
      groups: ["g1"],
      password: "hashed",
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ id: "1", name: "User_1", password: "****************" }]);
  });

  it("UpdateUser returns 404 when user does not exist", async () => {
    getUsers.mockResolvedValue([undefined]);
    const res = mockRes();
    await UpdateUser({ body: { data: { id: "1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("UpdateUser updates found user and masks password", async () => {
    getUsers.mockResolvedValue([{ id: "1", name: "User_1", email: "u@e.com", password: "hashed", roles: [], groups: [], active: true, changePassword: false }]);
    updateUsers.mockResolvedValue([{ id: "1", name: "User_1", password: "hashed2" }]);
    const res = mockRes();
    await UpdateUser({ body: { data: { id: "1", email: "new@e.com" } }, session: { userInfo: {} } }, res);
    expect(updateUsers).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ id: "1", name: "User_1", password: "****************" }]);
  });

  it("ReadUser masks all password fields", async () => {
    getUsers.mockResolvedValue([{ id: "1", name: "User_1", password: "a" }, { id: "2", name: "User_2", password: "b" }]);
    const res = mockRes();
    await ReadUser({ session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([
      { id: "1", name: "User_1", password: "****************" },
      { id: "2", name: "User_2", password: "****************" },
    ]);
  });

  it("DeleteUser blocks critical users", async () => {
    getUsers.mockResolvedValue([{ id: "1", name: "User_1", critical: true }]);
    const res = mockRes();
    await DeleteUser({ body: { data: { id: "1" } }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(removeUsers).not.toHaveBeenCalled();
  });

  it("DeleteUser removes selected user", async () => {
    getUsers.mockResolvedValue([{ id: "1", name: "User_1", critical: false, password: "x" }]);
    removeUsers.mockResolvedValue([{ id: "1", name: "User_1", password: "x" }]);
    const res = mockRes();
    await DeleteUser({ body: { data: { id: "1", name: "User_1" } }, session: { userInfo: {} } }, res);
    expect(removeUsers).toHaveBeenCalledWith({ id: "1", name: "User_1" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
