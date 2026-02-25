process.env.NODE_ENV = "test";

const request = require("supertest");

let mockSessionUserInfo = { name: "TestAdmin" };

const mockCreateRole = jest.fn((req, res) => res.status(200).send([{ id: "role-1", name: req.body.data.name }]));
const mockReadRole = jest.fn((req, res) => res.status(200).send([{ id: "role-1", name: "Role_1" }]));
const mockUpdateRole = jest.fn((req, res) => res.status(200).send([{ id: req.body.data.id, name: req.body.data.name }]));
const mockDeleteRole = jest.fn((req, res) => res.status(200).send([{ id: req.body.data.id }]));

const mockCreateUser = jest.fn((req, res) => res.status(200).send([{ id: "user-1", ...req.body.data }]));
const mockReadUser = jest.fn((req, res) => res.status(200).send([{ id: "user-1", name: "User_1", email: "user_1@test.com" }]));
const mockUpdateUser = jest.fn((req, res) => res.status(200).send([{ id: req.body.data.id, ...req.body.data }]));
const mockDeleteUser = jest.fn((req, res) => res.status(200).send([{ id: req.body.data.id }]));

jest.mock("next", () => () => ({
  prepare: jest.fn().mockResolvedValue(undefined),
  getRequestHandler: jest.fn(() => (req, res) => res.status(200).send({ ok: "next-handler" })),
}));

jest.mock("express-session", () => () => (req, res, next) => {
  req.session = {
    userInfo: mockSessionUserInfo,
    save: jest.fn(),
    destroy: jest.fn(),
  };
  next();
});

jest.mock("fs", () => ({
  access: jest.fn((path, mode, cb) => cb(null)),
  constants: { F_OK: 0 },
  writeFile: jest.fn((path, data, cb) => cb(null)),
}));

jest.mock("../../../../../components/Config", () => ({
  initConfig: jest.fn(),
  getConfig: () => ({
    minecraftServer: { address: "localhost", port: "25575", path: "." },
    nodeConfig: { port: "3010" },
  }),
  HiddenConfig: { minecraftServer: { password: "password" } },
}));

jest.mock("../../../../../components/Log", () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
  LogLevel: {
    DEBUG: { name: "DEBUG", level: 0 },
    INFO: { name: "INFO", level: 1 },
    WARN: { name: "WARN", level: 2 },
    ERROR: { name: "ERROR", level: 255 },
  },
}));

jest.mock("../../../../../components/session/UserLogin", () => ({
  checkAndLoginUser: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("../../../../../components/session/LoginSession", () => ({
  LoginSessionOpts: {},
}));

jest.mock("../../../../../components/rbac/Group", () => ({
  resolveRoles: jest.fn().mockResolvedValue(["ROLE_1"]),
}));

jest.mock("../../../../../components/rbac/User", () => ({
  getUsers: jest.fn().mockResolvedValue([{ id: "1", name: "TestAdmin" }]),
}));

jest.mock("../../../../../components/rbac/Init", () => ({
  InitUsers: jest.fn(),
}));

jest.mock("../../../../../components/commands/Commands", () => ({
  InitCommands: jest.fn(),
  getCommand: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../../../components/commands/ConsoleCommands", () => ({
  InitConsoleCommands: jest.fn(),
}));

jest.mock("../../../../../components/rbac/Command", () => ({
  getCommands: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../../components/rbac/ConsoleCommand", () => ({
  getConsoleCommands: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../../components/RConnnection", () => ({
  RConnection: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue("ok"),
  })),
}));

jest.mock("../../../../../components/endpoint/roles", () => ({
  CreateRole: mockCreateRole,
  ReadRole: mockReadRole,
  UpdateRole: mockUpdateRole,
  DeleteRole: mockDeleteRole,
}));

jest.mock("../../../../../components/endpoint/groups", () => ({
  CreateGroup: jest.fn((req, res) => res.status(200).send([])),
  ReadGroup: jest.fn((req, res) => res.status(200).send([])),
  UpdateGroup: jest.fn((req, res) => res.status(200).send([])),
  DeleteGroup: jest.fn((req, res) => res.status(200).send([])),
}));

jest.mock("../../../../../components/endpoint/users", () => ({
  CreateUser: mockCreateUser,
  ReadUser: mockReadUser,
  UpdateUser: mockUpdateUser,
  DeleteUser: mockDeleteUser,
}));

jest.mock("../../../../../components/endpoint/whitelist", () => ({
  CreateWhitelist: jest.fn((req, res) => res.status(200).send([])),
  ReadWhitelist: jest.fn((req, res) => res.status(200).send([])),
  UpdateWhitelist: jest.fn((req, res) => res.status(200).send([])),
  DeleteWhitelist: jest.fn((req, res) => res.status(200).send([])),
}));

const { app } = require("../../../../../index");
const { mutateRoles } = require("./roles");
const { pullUsers, mutateUsers } = require("./users");

function bridgeFetchToApp(expressApp) {
  return jest.fn(async (url, options = {}) => {
    const method = String(options.method || "GET").toLowerCase();
    const requestUrl = new URL(url);
    let req = request(expressApp)[method](requestUrl.pathname);

    for (const [key, value] of Object.entries(options.headers || {})) {
      req = req.set(key, value);
    }

    if (options.body !== undefined) {
      const payload = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
      req = req.send(payload);
    }

    const response = await req;
    const textPayload =
      typeof response.text === "string" && response.text.length > 0
        ? response.text
        : JSON.stringify(response.body ?? {});

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: async () => textPayload,
    };
  });
}

describe("front-to-back admin api integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionUserInfo = { name: "TestAdmin" };
    Object.defineProperty(global, "location", {
      value: { host: "localhost:3010" },
      configurable: true,
    });
    global.fetch = bridgeFetchToApp(app);
  });

  it("hits index /roles POST from mutateRoles and dispatches response", async () => {
    const dispatch = jest.fn();
    await mutateRoles({ name: "Role_New" }, dispatch, "POST");

    expect(mockCreateRole).toHaveBeenCalledTimes(1);
    expect(mockCreateRole.mock.calls[0][0].body).toEqual({ data: { name: "Role_New" } });
    expect(dispatch).toHaveBeenCalledWith({
      type: "RESPONSE_ROLE",
      payload: [{ id: "role-1", name: "Role_New" }],
    });
  });

  it("hits index /users GET from pullUsers and dispatches refresh", async () => {
    const dispatch = jest.fn();
    await pullUsers(dispatch);

    expect(mockReadUser).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: "REFRESH_USER",
      payload: [{ id: "user-1", name: "User_1", email: "user_1@test.com" }],
    });
  });

  it("hits index /users PUT from mutateUsers and carries encoded password in body.data", async () => {
    const dispatch = jest.fn();
    await mutateUsers(
      { id: "user-1", name: "User_1", email: "user_1@test.com", password: "plain" },
      dispatch,
      "PUT"
    );

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser.mock.calls[0][0].body.data.password).toBe("cGxhaW4=");
    expect(dispatch).toHaveBeenCalledWith({
      type: "RESPONSE_USER",
      payload: [
        {
          id: "user-1",
          name: "User_1",
          email: "user_1@test.com",
          password: "cGxhaW4=",
        },
      ],
    });
  });

  it("does not hit backend on invalid mutateUsers verb", async () => {
    const dispatch = jest.fn();
    await mutateUsers({ id: "user-1" }, dispatch, "PATCH");

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: "RESPONSE_USER",
      payload: expect.objectContaining({ error: expect.any(String) }),
    });
  });
});
