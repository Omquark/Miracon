jest.mock("node:fs", () => ({
  readFileSync: jest.fn(),
}));

jest.mock("./Log", () => ({
  logEvent: jest.fn(),
  LogError: jest.fn(),
  LogLevel: {
    ALL: { name: "ALL", level: -1 },
    DEBUG: { name: "DEBUG", level: 0 },
    INFO: { name: "INFO", level: 1 },
    WARN: { name: "WARN", level: 2 },
    AUDIT: { name: "AUDIT", level: 255 },
    ERROR: { name: "ERROR", level: 255 },
  },
  messageLevel: { name: "ALL", level: -1 },
  setMessageLevel: jest.fn(),
}));

jest.mock("./utility/Utility", () => ({
  bytesFromBase64: jest.fn(),
}));

const { readFileSync } = require("node:fs");
const { bytesFromBase64 } = require("./utility/Utility");
const { LogLevel, setMessageLevel } = require("./Log");

const BASE_ENV = {
  NODE_ENV: "production",
};

const REQUIRED_KEYS = [
  "MINECRAFT_SERVER_PATH",
  "MINECRAFT_ADDRESS",
  "MINECRAFT_PORT",
  "MINECRAFT_PASSWORD",
  "LOG_LEVEL",
  "LOG_PATH",
  "LOG_FOLDER",
  "AUDIT_FOLDER",
  "WEB_SERVER_PORT",
  "MIRACON_INSTALL_DIRECTORY",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_URL",
  "DB_PORT",
  "DB_NAME",
];

function buildConfigString(overrides) {
  const values = { ...overrides };
  REQUIRED_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      values[key] = "value";
    }
  });
  return REQUIRED_KEYS.map((key) => `${key}=${values[key]}`).join("\n");
}

function loadConfigModule(configString, envOverrides = {}) {
  readFileSync.mockReturnValue(configString);
  process.env = { ...BASE_ENV, ...envOverrides };
  let moduleExports;
  jest.isolateModules(() => {
    moduleExports = require("./Config");
  });
  return moduleExports;
}

describe("Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    bytesFromBase64.mockImplementation((value) => `decoded:${value}`);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when accessed before initialization", () => {
    const { getConfig } = loadConfigModule(buildConfigString({}));
    expect(() => getConfig()).toThrow("Config was attempted to be accessed before initialization");
  });

  it("initializes config and masks secrets", () => {
    const configString = buildConfigString({
      MINECRAFT_SERVER_PATH: "/opt/minecraft",
      MINECRAFT_ADDRESS: "127.0.0.1",
      MINECRAFT_PORT: "25575",
      MINECRAFT_PASSWORD: "mcpass",
      LOG_LEVEL: "DEBUG",
      LOG_PATH: "/var/log/miracon",
      LOG_FOLDER: "logs",
      AUDIT_FOLDER: "audit",
      WEB_SERVER_PORT: "8443",
      MIRACON_INSTALL_DIRECTORY: "/opt/miracon",
      DB_USERNAME: "miracon",
      DB_PASSWORD: "dbpass",
      DB_URL: "db.local",
      DB_PORT: "27017",
      DB_NAME: "miracon",
    });
    const { initConfig, getConfig, HiddenConfig } = loadConfigModule(configString);

    initConfig();
    const config = getConfig();

    expect(config.init).toBe(true);
    expect(config.minecraftServer.password).toBe("***************************");
    expect(config.dbConfig.password).toBe("***************************");
    expect(HiddenConfig.minecraftServer.password).toBe("decoded:mcpass");
    expect(HiddenConfig.dbConfig.password).toBe("decoded:dbpass");
    expect(setMessageLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
  });

  it("defaults invalid values and uses cwd for install path", () => {
    const configString = buildConfigString({
      MINECRAFT_SERVER_PATH: "",
      MINECRAFT_ADDRESS: "",
      MINECRAFT_PORT: "abc",
      MINECRAFT_PASSWORD: "mcpass",
      LOG_LEVEL: "INVALID",
      LOG_PATH: "",
      LOG_FOLDER: "",
      AUDIT_FOLDER: "",
      WEB_SERVER_PORT: "99999",
      MIRACON_INSTALL_DIRECTORY: "",
      DB_USERNAME: "",
      DB_PASSWORD: "dbpass",
      DB_URL: "",
      DB_PORT: "0",
      DB_NAME: "",
    });
    const { initConfig, getConfig } = loadConfigModule(configString);

    initConfig();
    const config = getConfig();

    expect(config.minecraftServer.path).toBe("/opt/minecraft");
    expect(config.minecraftServer.address).toBe("localhost");
    expect(config.minecraftServer.port).toBe(25575);
    expect(config.log.path).toBe("/var/opt/miracon");
    expect(config.log.logFolder).toBe("logs");
    expect(config.log.auditFolder).toBe("audit");
    expect(config.nodeConfig.port).toBe(443);
    expect(config.nodeConfig.installPath).toBe(process.cwd());
    expect(config.dbConfig.username).toBe("miracon");
    expect(config.dbConfig.url).toBe("localhost");
    expect(config.dbConfig.port).toBe(27017);
    expect(config.dbConfig.dbname).toBe("miracon");
  });
});
