jest.mock('path', () => ({
  join: jest.fn((...parts) => parts.join('/')),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (value) => `hashed:${value}`),
}), { virtual: true });

jest.mock('../Config', () => ({
  getConfig: jest.fn(() => ({
    minecraftServer: {
      path: '/mock/minecraft',
    },
  })),
}));

jest.mock('../Log', () => ({
  __esmodule: false,
  logEvent: jest.fn(),
  logError: jest.fn(),
  LogLevel: {
    ALL: { name: 'ALL', level: -1 },
    DEBUG: { name: 'DEBUG', level: 0 },
    INFO: { name: 'INFO', level: 1 },
    WARN: { name: 'WARN', level: 2 },
    ERROR: { name: 'ERROR', level: 255 },
  },
}));

jest.mock('./db', () => ({
  initDatabase: jest.fn(),
}));

jest.mock('./User', () => ({
  addUsers: jest.fn(),
}));

jest.mock('./Role', () => ({
  addRoles: jest.fn(),
  getRoles: jest.fn(),
}));

jest.mock('./Group', () => ({
  addGroups: jest.fn(),
}));

jest.mock('../commands/CmdDef', () => ({
  Commands: [
    { name: 'READ_ROLE' },
    { name: 'READ_USER' },
    { name: 'UPDATE_USER' },
  ],
}));

describe('RBAC InitUsers', () => {
  let initApi;
  let fsApi;
  let roleApi;
  let groupApi;
  let userApi;
  let dbApi;
  let bcryptApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    initApi = require('./Init');
    fsApi = require('fs');
    roleApi = require('./Role');
    groupApi = require('./Group');
    userApi = require('./User');
    dbApi = require('./db');
    bcryptApi = require('bcrypt');
  });

  it('creates ops users plus Miracon and Selenium with expected access', async () => {
    fsApi.readFileSync.mockReturnValue(JSON.stringify([
      { name: '[Minecraft]', level: 4, uuid: 'mc-uuid' },
      { name: 'PlayerOne', level: 2, uuid: 'player-1' },
      { name: 'PlayerTwo', level: 4, uuid: 'player-2' },
    ]));

    roleApi.addRoles.mockResolvedValue([]);
    roleApi.getRoles.mockResolvedValue([
      { id: 'lvl-1', name: 'Level 1' },
      { id: 'lvl-2', name: 'Level 2' },
      { id: 'lvl-3', name: 'Level 3' },
      { id: 'lvl-4', name: 'Level 4' },
      { id: 'r-read-role', name: 'READ_ROLE' },
      { id: 'r-read-user', name: 'READ_USER' },
    ]);
    groupApi.addGroups.mockResolvedValue([
      { id: 'g-1', name: 'Level 1' },
      { id: 'g-2', name: 'Level 2' },
      { id: 'g-3', name: 'Level 3' },
      { id: 'g-4', name: 'Level 4' },
    ]);
    userApi.addUsers.mockResolvedValue([]);

    await initApi.InitUsers();

    expect(dbApi.initDatabase).toHaveBeenCalled();
    expect(userApi.addUsers).toHaveBeenCalledTimes(4);
    expect(bcryptApi.hash).toHaveBeenCalledTimes(4);

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'PlayerOne',
      id: 'player-1',
      groups: ['g-2'],
      roles: [],
      active: false,
      changePassword: true,
      password: expect.stringMatching(/^hashed:/),
    }));

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'PlayerTwo',
      id: 'player-2',
      groups: ['g-4'],
      roles: [],
      active: false,
      changePassword: true,
      password: expect.stringMatching(/^hashed:/),
    }));

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Miracon',
      groups: ['g-4'],
      roles: [],
      active: true,
      changePassword: true,
      critical: true,
      password: expect.stringMatching(/^hashed:/),
    }));

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Selenium',
      groups: [],
      roles: ['r-read-role', 'r-read-user'],
      active: true,
      changePassword: false,
      critical: false,
      password: expect.stringMatching(/^hashed:/),
    }));
  });

  it('supports ops.json as a single object and still creates bootstrap users', async () => {
    fsApi.readFileSync.mockReturnValue(JSON.stringify(
      { name: 'SoloPlayer', level: 1, uuid: 'solo-uuid' }
    ));

    roleApi.addRoles.mockResolvedValue([]);
    roleApi.getRoles.mockResolvedValue([
      { id: 'lvl-1', name: 'Level 1' },
      { id: 'lvl-2', name: 'Level 2' },
      { id: 'lvl-3', name: 'Level 3' },
      { id: 'lvl-4', name: 'Level 4' },
      { id: 'r-read-role', name: 'READ_ROLE' },
      { id: 'r-read-user', name: 'READ_USER' },
    ]);
    groupApi.addGroups.mockResolvedValue([
      { id: 'g-1', name: 'Level 1' },
      { id: 'g-2', name: 'Level 2' },
      { id: 'g-3', name: 'Level 3' },
      { id: 'g-4', name: 'Level 4' },
    ]);
    userApi.addUsers.mockResolvedValue([]);

    await initApi.InitUsers();

    expect(userApi.addUsers).toHaveBeenCalledTimes(3);
    expect(bcryptApi.hash).toHaveBeenCalledTimes(3);

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'SoloPlayer',
      id: 'solo-uuid',
      groups: ['g-1'],
      active: false,
      changePassword: true,
      password: expect.stringMatching(/^hashed:/),
    }));

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Miracon',
      groups: ['g-4'],
      active: true,
      changePassword: true,
      password: expect.stringMatching(/^hashed:/),
    }));

    expect(userApi.addUsers).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Selenium',
      groups: [],
      roles: ['r-read-role', 'r-read-user'],
      active: true,
      changePassword: false,
      password: expect.stringMatching(/^hashed:/),
    }));
  });
});
