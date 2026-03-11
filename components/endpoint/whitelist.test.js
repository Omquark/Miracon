jest.mock("../commands/Commands", () => ({
  checkCommand: jest.fn(),
}));

const { checkCommand } = require("../commands/Commands");
const { CreateWhitelist, ReadWhitelist, UpdateWhitelist, DeleteWhitelist } = require("./whitelist");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("whitelist endpoint handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkCommand.mockResolvedValue(undefined);
  });

  it("denies by command check", async () => {
    checkCommand.mockResolvedValue({ error: "denied" });
    const res = mockRes();
    await ReadWhitelist({ session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("validates create/update/delete body names", async () => {
    let res = mockRes();
    await CreateWhitelist({ body: { data: {} }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    res = mockRes();
    await UpdateWhitelist({ body: { data: {} }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    res = mockRes();
    await DeleteWhitelist({ body: { data: {} }, session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns not implemented for valid whitelist actions", async () => {
    const req = { body: { data: { name: "Player_1" } }, session: { userInfo: {} } };

    let res = mockRes();
    await CreateWhitelist(req, res);
    expect(res.status).toHaveBeenCalledWith(501);

    res = mockRes();
    await ReadWhitelist({ session: { userInfo: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(501);

    res = mockRes();
    await UpdateWhitelist(req, res);
    expect(res.status).toHaveBeenCalledWith(501);

    res = mockRes();
    await DeleteWhitelist(req, res);
    expect(res.status).toHaveBeenCalledWith(501);
  });
});
