process.env.NODE_ENV = "test";
let mockSessionUserInfo = { name: "TestAdmin" };

const mockReadRole = jest.fn((req, res) => res.status(200).send({ ok: "read-role" }));
const mockUpdateRole = jest.fn((req, res) => res.status(200).send({ ok: "update-role" }));
const mockCreateRole = jest.fn((req, res) => res.status(200).send({ ok: "create-role" }));
const mockDeleteRole = jest.fn((req, res) => res.status(200).send({ ok: "delete-role" }));

const mockReadGroup = jest.fn((req, res) => res.status(200).send({ ok: "read-group" }));
const mockUpdateGroup = jest.fn((req, res) => res.status(200).send({ ok: "update-group" }));
const mockCreateGroup = jest.fn((req, res) => res.status(200).send({ ok: "create-group" }));
const mockDeleteGroup = jest.fn((req, res) => res.status(200).send({ ok: "delete-group" }));

const mockReadUser = jest.fn((req, res) => res.status(200).send({ ok: "read-user" }));
const mockUpdateUser = jest.fn((req, res) => res.status(200).send({ ok: "update-user" }));
const mockCreateUser = jest.fn((req, res) => res.status(200).send({ ok: "create-user" }));
const mockDeleteUser = jest.fn((req, res) => res.status(200).send({ ok: "delete-user" }));

const mockReadWhitelist = jest.fn((req, res) => res.status(200).send({ ok: "read-whitelist" }));
const mockUpdateWhitelist = jest.fn((req, res) => res.status(200).send({ ok: "update-whitelist" }));
const mockCreateWhitelist = jest.fn((req, res) => res.status(200).send({ ok: "create-whitelist" }));
const mockDeleteWhitelist = jest.fn((req, res) => res.status(200).send({ ok: "delete-whitelist" }));

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

jest.mock("./components/Config", () => ({
  initConfig: jest.fn(),
  getConfig: () => ({
    minecraftServer: { address: "localhost", port: "25575", path: "." },
    nodeConfig: { port: "3010" },
  }),
  HiddenConfig: { minecraftServer: { password: "password" } },
}));

jest.mock("./components/Log", () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
  LogLevel: {
    ALL: { name: "ALL", level: -1 },
    DEBUG: { name: "DEBUG", level: 0 },
    INFO: { name: "INFO", level: 1 },
    WARN: { name: "WARN", level: 2 },
    ERROR: { name: "ERROR", level: 255 },
  },
}));

jest.mock("./components/session/UserLogin", () => ({
  checkAndLoginUser: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("./components/session/LoginSession", () => ({
  LoginSessionOpts: {},
}));

jest.mock("./components/rbac/Group", () => ({
  resolveRoles: jest.fn().mockResolvedValue(["ROLE_1"]),
}));

jest.mock("./components/rbac/User", () => ({
  getUsers: jest.fn().mockResolvedValue([{ id: "1", name: "TestAdmin" }]),
}));

jest.mock("./components/rbac/Init", () => ({
  InitUsers: jest.fn(),
}));

jest.mock("./components/commands/Commands", () => ({
  InitCommands: jest.fn(),
  getCommand: jest.fn().mockResolvedValue({}),
}));

jest.mock("./components/commands/ConsoleCommands", () => ({
  InitConsoleCommands: jest.fn(),
}));

jest.mock("./components/rbac/Command", () => ({
  getCommands: jest.fn().mockResolvedValue([]),
}));

jest.mock("./components/rbac/ConsoleCommand", () => ({
  getConsoleCommands: jest.fn().mockResolvedValue([]),
}));

jest.mock("./components/RConnnection", () => ({
  RConnection: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue("ok"),
  })),
}));

jest.mock("./components/endpoint/roles", () => ({
  CreateRole: mockCreateRole,
  ReadRole: mockReadRole,
  UpdateRole: mockUpdateRole,
  DeleteRole: mockDeleteRole,
}));

jest.mock("./components/endpoint/groups", () => ({
  CreateGroup: mockCreateGroup,
  ReadGroup: mockReadGroup,
  UpdateGroup: mockUpdateGroup,
  DeleteGroup: mockDeleteGroup,
}));

jest.mock("./components/endpoint/users", () => ({
  CreateUser: mockCreateUser,
  ReadUser: mockReadUser,
  UpdateUser: mockUpdateUser,
  DeleteUser: mockDeleteUser,
}));

jest.mock("./components/endpoint/whitelist", () => ({
  CreateWhitelist: mockCreateWhitelist,
  ReadWhitelist: mockReadWhitelist,
  UpdateWhitelist: mockUpdateWhitelist,
  DeleteWhitelist: mockDeleteWhitelist,
}));

const request = require("supertest");
const { app } = require("./index");
const { resolveRoles } = require("./components/rbac/Group");
const { getUsers } = require("./components/rbac/User");
const { getCommand } = require("./components/commands/Commands");
const { getCommands } = require("./components/rbac/Command");
const { getConsoleCommands } = require("./components/rbac/ConsoleCommand");

describe("index route middleware and endpoint wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionUserInfo = { name: "TestAdmin" };
    resolveRoles.mockResolvedValue(["ROLE_1"]);
    getUsers.mockResolvedValue([{ id: "1", name: "TestAdmin" }]);
    getCommand.mockResolvedValue({});
    getCommands.mockResolvedValue([{ name: "cmd" }]);
    getConsoleCommands.mockResolvedValue([{ name: "say" }]);
  });

  it("requires body.data envelope for mutating CRUD routes", async () => {
    const routes = [
      { method: "post", path: "/roles", spy: mockCreateRole },
      { method: "put", path: "/groups", spy: mockUpdateGroup },
      { method: "delete", path: "/users", spy: mockDeleteUser },
      { method: "post", path: "/whitelist", spy: mockCreateWhitelist },
    ];

    for (const route of routes) {
      const response = await request(app)[route.method](route.path).send({ name: "missing-data-wrapper" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Request body must include a data object.");
      expect(route.spy).not.toHaveBeenCalled();
    }
  });

  it("applies route-level field schema validation before endpoint handlers", async () => {
    let response = await request(app).post("/roles").send({ data: {} });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing required field: name");
    expect(mockCreateRole).not.toHaveBeenCalled();

    response = await request(app).put("/roles").send({ data: { id: "1" } });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing required field: name");
    expect(mockUpdateRole).not.toHaveBeenCalled();

    response = await request(app).put("/groups").send({ data: { id: "1", roles: "not-array" } });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Field roles must be an array.");
    expect(mockUpdateGroup).not.toHaveBeenCalled();

    response = await request(app).post("/users").send({ data: { name: "User_1", email: "bad-email", password: "x" } });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Field email is invalid.");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("delegates CRUD routes to endpoint handlers when body.data exists", async () => {
    let response = await request(app).post("/roles").send({ data: { name: "Role_1" } });
    expect(response.status).toBe(200);
    expect(mockCreateRole).toHaveBeenCalledTimes(1);

    response = await request(app).put("/groups").send({ data: { id: "1", name: "Group_1" } });
    expect(response.status).toBe(200);
    expect(mockUpdateGroup).toHaveBeenCalledTimes(1);

    response = await request(app).delete("/users").send({ data: { id: "1" } });
    expect(response.status).toBe(200);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);

    response = await request(app).post("/whitelist").send({ data: { name: "Player_1" } });
    expect(response.status).toBe(200);
    expect(mockCreateWhitelist).toHaveBeenCalledTimes(1);
  });

  it("keeps GET routes body-independent and wired", async () => {
    let response = await request(app).get("/roles");
    expect(response.status).toBe(200);
    expect(mockReadRole).toHaveBeenCalledTimes(1);

    response = await request(app).get("/groups");
    expect(response.status).toBe(200);
    expect(mockReadGroup).toHaveBeenCalledTimes(1);

    response = await request(app).get("/users");
    expect(response.status).toBe(200);
    expect(mockReadUser).toHaveBeenCalledTimes(1);

    response = await request(app).get("/whitelist");
    expect(response.status).toBe(200);
    expect(mockReadWhitelist).toHaveBeenCalledTimes(1);
  });

  it("protects admin and API routes when session user is missing or invalid", async () => {
    mockSessionUserInfo = undefined;
    let response = await request(app).get("/admin");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("User is not logged in");

    mockSessionUserInfo = { name: "Ghost" };
    getUsers.mockResolvedValue([undefined]);
    response = await request(app).get("/roles");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("User could not be found");

    getUsers.mockResolvedValue([{ id: "1", name: "TestAdmin" }]);
    resolveRoles.mockResolvedValue([]);
    response = await request(app).get("/roles");
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("No roles could be found for user");
  });

  it("returns consistent status codes for commands and console endpoints", async () => {
    let response = await request(app).get("/commands");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ name: "cmd" }]);

    getCommand.mockResolvedValue({ error: "denied" });
    response = await request(app).get("/commands");
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("denied");

    response = await request(app).post("/console").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Attempted to execute a blank or invalid command!");

    getConsoleCommands.mockResolvedValue([]);
    response = await request(app).post("/console").send({ name: "unknown arg" });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Command cannot be found!");
  });
});
