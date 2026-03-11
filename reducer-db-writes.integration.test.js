process.env.NODE_ENV = "test";

const request = require("supertest");

let mockSessionUserInfo = { name: "TestAdmin" };

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

jest.mock("bcrypt", () => ({
  hash: jest.fn(async (value) => `hash:${value}`),
}));

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
    dbConfig: {
      username: "test",
      url: "localhost",
      port: "27017",
      dbname: "miracon-test",
    },
  }),
  HiddenConfig: {
    minecraftServer: { password: "password" },
    dbConfig: { password: "password" },
  },
}));

jest.mock("./components/Log", () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
  LogLevel: {
    DEBUG: { name: "DEBUG", level: 0 },
    INFO: { name: "INFO", level: 1 },
    WARN: { name: "WARN", level: 2 },
    ERROR: { name: "ERROR", level: 255 },
    AUDIT: { name: "AUDIT", level: 10 },
  },
}));

jest.mock("./components/session/UserLogin", () => ({
  checkAndLoginUser: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("./components/session/LoginSession", () => ({
  LoginSessionOpts: {},
}));

jest.mock("./components/rbac/Init", () => ({
  InitUsers: jest.fn(),
}));

jest.mock("./components/commands/ConsoleCommands", () => ({
  InitConsoleCommands: jest.fn(),
}));

jest.mock("./components/rbac/ConsoleCommand", () => ({
  getConsoleCommands: jest.fn().mockResolvedValue([]),
}));

jest.mock("./components/RConnection", () => ({
  RConnection: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue("ok"),
  })),
}));

jest.mock("./components/commands/Commands", () => {
  const actual = jest.requireActual("./components/commands/Commands");
  return {
    ...actual,
    InitCommands: jest.fn(),
  };
});

jest.mock("./components/rbac/db", () => {
  const state = {
    collections: {},
    counts: {},
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const resetCollections = () => {
    state.collections = {
      role: [
        { id: "role-admin", name: "Role_Admin", critical: true },
        { id: "role-delete", name: "Role_Delete", critical: false },
      ],
      group: [
        { id: "group-1", name: "Group_1", roles: ["role-delete"] },
        { id: "group-delete", name: "Group_Delete", roles: [] },
      ],
      user: [
        {
          id: "user-admin",
          name: "TestAdmin",
          email: "admin@test.com",
          password: "hash:admin",
          roles: ["role-admin"],
          groups: [],
          active: true,
          changePassword: false,
          critical: true,
        },
        {
          id: "user-1",
          name: "User_1",
          email: "user1@test.com",
          password: "hash:user1",
          roles: ["role-delete"],
          groups: ["group-delete"],
          active: true,
          changePassword: false,
          critical: false,
        },
      ],
      command: [
        { id: "cmd-read", name: "READ_COMMAND", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-create-role", name: "CREATE_ROLE", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-update-role", name: "UPDATE_ROLE", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-delete-role", name: "DELETE_ROLE", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-create-group", name: "CREATE_GROUP", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-update-group", name: "UPDATE_GROUP", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-delete-group", name: "DELETE_GROUP", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-create-user", name: "CREATE_USER", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-update-user", name: "UPDATE_USER", roles: ["role-admin"], blacklistRoles: [] },
        { id: "cmd-delete-user", name: "DELETE_USER", roles: ["role-admin"], blacklistRoles: [] },
      ],
      consolecommand: [],
    };
  };

  const resetCounts = () => {
    state.counts = {
      readData: 0,
      readManyData: 0,
      writeData: 0,
      writeManyData: 0,
      updateData: 0,
      updateManyData: 0,
      removeData: 0,
      removeManyData: 0,
      pullFromArray: 0,
    };
  };

  const normalizeType = (type) => String(type || "").toLowerCase().replace(/s$/, "");

  const findOne = (type, object) => {
    const list = state.collections[type] || [];
    if (!object) return undefined;
    return list.find((entry) => {
      const idMatches = object.id !== undefined ? entry.id === object.id : true;
      const nameMatches = object.name !== undefined ? entry.name === object.name : true;
      if (object.id !== undefined && object.name !== undefined) return idMatches && nameMatches;
      if (object.id !== undefined) return idMatches;
      if (object.name !== undefined) return nameMatches;
      return false;
    });
  };

  resetCollections();
  resetCounts();

  return {
    writeData: jest.fn(async (type, object) => {
      const normalized = normalizeType(type);
      state.counts.writeData += 1;
      if (!object || !object.id || !object.name) return false;
      const exists = findOne(normalized, { id: object.id }) || findOne(normalized, { name: object.name });
      if (exists) return false;
      state.collections[normalized].push(clone(object));
      return true;
    }),
    writeManyData: jest.fn(async () => {
      state.counts.writeManyData += 1;
      return [];
    }),
    readData: jest.fn(async (type, object) => {
      const normalized = normalizeType(type);
      state.counts.readData += 1;
      const list = state.collections[normalized] || [];
      if (object === undefined) return clone(list);
      const found = findOne(normalized, object);
      return found ? clone(found) : undefined;
    }),
    readManyData: jest.fn(async (type, objects) => {
      const normalized = normalizeType(type);
      state.counts.readManyData += 1;
      if (!Array.isArray(objects)) return [];
      return objects.map((object) => {
        const found = findOne(normalized, object);
        return found ? clone(found) : undefined;
      });
    }),
    updateData: jest.fn(async (type, oldObject, newObject) => {
      const normalized = normalizeType(type);
      state.counts.updateData += 1;
      const list = state.collections[normalized] || [];
      const idx = list.findIndex((entry) => {
        const idMatches = oldObject?.id !== undefined ? entry.id === oldObject.id : true;
        const nameMatches = oldObject?.name !== undefined ? entry.name === oldObject.name : true;
        if (oldObject?.id !== undefined && oldObject?.name !== undefined) return idMatches && nameMatches;
        if (oldObject?.id !== undefined) return idMatches;
        if (oldObject?.name !== undefined) return nameMatches;
        return false;
      });
      if (idx === -1) return false;
      const merged = { ...list[idx], ...clone(newObject) };
      merged.id = list[idx].id;
      list[idx] = merged;
      return true;
    }),
    updateManyData: jest.fn(async () => {
      state.counts.updateManyData += 1;
      return [];
    }),
    removeData: jest.fn(async (type, object) => {
      const normalized = normalizeType(type);
      state.counts.removeData += 1;
      const list = state.collections[normalized] || [];
      const idx = list.findIndex((entry) => {
        if (object?.id !== undefined) return entry.id === object.id;
        if (object?.name !== undefined) return entry.name === object.name;
        return false;
      });
      if (idx === -1) return false;
      list.splice(idx, 1);
      return true;
    }),
    removeManyData: jest.fn(async () => {
      state.counts.removeManyData += 1;
      return [];
    }),
    pullFromArray: jest.fn(async (type, arrayField, value) => {
      const normalized = normalizeType(type);
      state.counts.pullFromArray += 1;
      const list = state.collections[normalized] || [];
      let modified = 0;
      list.forEach((entry) => {
        if (!Array.isArray(entry[arrayField])) return;
        const before = entry[arrayField].length;
        entry[arrayField] = entry[arrayField].filter((item) => item !== value);
        if (entry[arrayField].length !== before) modified += 1;
      });
      return modified;
    }),
    initDatabase: jest.fn(),
    closeConnection: jest.fn(),
    __resetDb: () => {
      resetCollections();
      resetCounts();
    },
    __getAccessCounts: () => ({ ...state.counts }),
  };
});

const { app } = require("./index");
const db = require("./components/rbac/db");
const { rolesReducer, rolesActionTypes } = require("./src/app/[...admin]/components/context/admin/reducers/rolesReducer");
const { groupsReducer, groupsActionTypes } = require("./src/app/[...admin]/components/context/admin/reducers/groupsReducer");
const { usersReducer, usersActionTypes } = require("./src/app/[...admin]/components/context/admin/reducers/usersReducer");
const { commandsReducer, commandsActionTypes } = require("./src/app/[...admin]/components/context/admin/reducers/commandsReducer");
const { whitelistReducer, whitelistActionTypes } = require("./src/app/[...admin]/components/context/admin/reducers/whitelistReducer");

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

async function waitFor(assertion, timeoutMs = 2000) {
  const started = Date.now();
  while (true) {
    try {
      assertion();
      return;
    } catch (err) {
      if (Date.now() - started > timeoutMs) throw err;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

describe("reducer end-to-end db access counts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.__resetDb();
    mockSessionUserInfo = { name: "TestAdmin" };
    Object.defineProperty(global, "location", {
      value: { host: "localhost:3010" },
      configurable: true,
    });
    global.fetch = bridgeFetchToApp(app);
  });

  it("roles reducer write counts match create/update/remove flow", async () => {
    const dispatch = jest.fn();
    const state = [{ id: "role-delete", name: "Role_Delete" }];

    rolesReducer(state, {
      type: rolesActionTypes.CREATE_ROLE,
      payload: { name: "Role_New" },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.writeData).toBe(1);
      expect(counts.readData).toBe(2);
    });

    rolesReducer(state, {
      type: rolesActionTypes.UPDATE_ROLE,
      payload: { id: "role-delete", name: "Role_Delete_Updated" },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.updateData).toBe(1);
      expect(counts.readData).toBe(4);
    });

    rolesReducer(state, {
      type: rolesActionTypes.REMOVE_ROLE,
      payload: { id: "role-delete" },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.removeData).toBe(1);
      expect(counts.pullFromArray).toBe(3);
      expect(counts.readData).toBe(7);
    });
  });

  it("groups reducer write counts match create/update/remove flow", async () => {
    const dispatch = jest.fn();
    const state = [{ id: "group-delete", name: "Group_Delete", roles: [] }];

    groupsReducer(state, {
      type: groupsActionTypes.CREATE_GROUP,
      payload: { name: "Group_New", roles: [] },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.writeData).toBe(1);
      expect(counts.readData).toBe(2);
    });

    groupsReducer(state, {
      type: groupsActionTypes.UPDATE_GROUP,
      payload: { id: "group-delete", name: "Group_Delete_Updated", roles: [] },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.updateData).toBe(1);
      expect(counts.readData).toBe(4);
    });

    groupsReducer(state, {
      type: groupsActionTypes.REMOVE_GROUP,
      payload: { id: "group-delete" },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.removeData).toBe(1);
      expect(counts.pullFromArray).toBe(1);
      expect(counts.readData).toBe(7);
    });
  });

  it("users reducer write counts match create/update/remove flow", async () => {
    const dispatch = jest.fn();
    const state = [{ id: "user-1", name: "User_1", email: "user1@test.com" }];

    usersReducer(state, {
      type: usersActionTypes.CREATE_USER,
      payload: {
        name: "User_New",
        email: "user_new@test.com",
        password: "plain",
        roles: [],
        groups: [],
        active: true,
      },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.writeData).toBe(1);
      expect(counts.readManyData).toBe(0);
      expect(counts.readData).toBe(2);
    });

    usersReducer(state, {
      type: usersActionTypes.UPDATE_USER,
      payload: {
        id: "user-1",
        name: "User_1",
        email: "user1@test.com",
        password: "plain",
        roles: [],
        groups: [],
        active: true,
        changePassword: false,
      },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.updateData).toBe(1);
      expect(counts.readManyData).toBe(0);
      expect(counts.readData).toBe(5);
    });

    usersReducer(state, {
      type: usersActionTypes.REMOVE_USER,
      payload: { id: "user-1" },
      context: dispatch,
    });
    await waitFor(() => {
      const counts = db.__getAccessCounts();
      expect(counts.removeData).toBe(1);
      expect(counts.pullFromArray).toBe(0);
      expect(counts.readData).toBe(8);
    });
  });

  it("commands reducer GET does not perform db writes", async () => {
    const dispatch = jest.fn();
    commandsReducer([], {
      type: commandsActionTypes.GET_COMMAND,
      context: dispatch,
    });

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "REFRESH_COMMAND",
          payload: expect.any(Array),
        })
      );
    });

    const counts = db.__getAccessCounts();
    expect(counts.readData).toBe(3);
    expect(counts.writeData).toBe(0);
    expect(counts.updateData).toBe(0);
    expect(counts.removeData).toBe(0);
    expect(counts.pullFromArray).toBe(0);
  });

  it("whitelist reducer actions do not hit db writes", () => {
    const state = [];
    whitelistReducer(state, { type: whitelistActionTypes.CREATE_WHITELIST, payload: { name: "Player_1" } });
    whitelistReducer(state, { type: whitelistActionTypes.GET_WHITELIST });
    whitelistReducer(state, { type: whitelistActionTypes.UPDATE_WHITELIST, payload: { name: "Player_1" } });
    whitelistReducer(state, { type: whitelistActionTypes.REMOVE_WHITELIST, payload: { name: "Player_1" } });

    const counts = db.__getAccessCounts();
    expect(counts.readData).toBe(0);
    expect(counts.readManyData).toBe(0);
    expect(counts.writeData).toBe(0);
    expect(counts.updateData).toBe(0);
    expect(counts.removeData).toBe(0);
    expect(counts.pullFromArray).toBe(0);
  });
});
