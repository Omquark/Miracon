jest.mock('../Log', () => ({
  __esmodule: false,
  logEvent: jest.fn(),
  LogLevel: {
    ALL: { name: 'ALL', level: -1 },
    DEBUG: { name: 'DEBUG', level: 0 },
    INFO: { name: 'INFO', level: 1 },
    WARN: { name: 'WARN', level: 2 },
    ERROR: { name: 'ERROR', level: 255 },
    AUDIT: { name: 'AUDIT', level: 3 },
  },
}));

jest.mock('./CmdDef', () => ({
  Commands: [
    {
      name: 'CREATE_TEST',
      description: 'Test command',
      roles: [],
      blacklistRoles: [],
      requirePassword: false,
      enabled: true,
    },
  ],
}));

jest.mock('../rbac/Group', () => ({
  addGroups: jest.fn(),
  getGroups: jest.fn(),
  resolveRoles: jest.fn(),
}));

jest.mock('../rbac/Role', () => ({
  addRoles: jest.fn(),
  getRoles: jest.fn(),
}));

jest.mock('../rbac/User', () => ({
  getUsers: jest.fn(),
  updateUsers: jest.fn(),
}));

jest.mock('../rbac/Command', () => ({
  addCommands: jest.fn(),
  getCommands: jest.fn(),
}));

describe('Commands module', () => {
  let commandsApi;
  let roleApi;
  let groupApi;
  let userApi;
  let commandDbApi;
  let cmdDef;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    commandsApi = require('./Commands');
    roleApi = require('../rbac/Role');
    groupApi = require('../rbac/Group');
    userApi = require('../rbac/User');
    commandDbApi = require('../rbac/Command');
    cmdDef = require('./CmdDef');
  });

  it('CheckAuthorization allows whitelisted roles and blocks blacklist first', () => {
    expect(
      commandsApi.CheckAuthorization(['role-1'], { roles: ['role-1'], blacklistRoles: [] })
    ).toBe(true);

    expect(
      commandsApi.CheckAuthorization(['role-1', 'role-2'], { roles: ['role-1'], blacklistRoles: ['role-2'] })
    ).toBe(false);
  });

  it('getCommand returns safe error when command name is missing', async () => {
    const result = await commandsApi.getCommand(undefined, { name: 'Miracon' });
    expect(result).toEqual({ error: 'Command could not be found' });
  });

  it('getCommand authorizes when roleIds are provided directly', async () => {
    commandDbApi.getCommands.mockResolvedValue([
      { name: 'CREATE_TEST', roles: ['role-1'], blacklistRoles: [] },
    ]);

    const result = await commandsApi.getCommand('CREATE_TEST', { name: 'Miracon', roleIds: ['role-1'] });
    expect(result).toEqual({ name: 'CREATE_TEST', roles: ['role-1'], blacklistRoles: [] });
  });

  it('getCommand denies access when role is blacklisted', async () => {
    commandDbApi.getCommands.mockResolvedValue([
      { name: 'CREATE_TEST', roles: ['role-1'], blacklistRoles: ['role-2'] },
    ]);

    const result = await commandsApi.getCommand('CREATE_TEST', { name: 'Miracon', roleIds: ['role-1', 'role-2'] });
    expect(result.error).toContain('not authorized');
  });

  it('InitCommands does not mutate CmdDef command roles and binds admin group', async () => {
    roleApi.addRoles.mockResolvedValue([{ id: 'role-1', name: 'CREATE_TEST' }]);
    roleApi.getRoles.mockResolvedValue([{ id: 'role-1', name: 'CREATE_TEST' }]);
    commandDbApi.addCommands.mockResolvedValue([{ id: 'cmd-1', name: 'CREATE_TEST' }]);
    groupApi.addGroups.mockResolvedValue([{ id: 'group-1', name: 'Command Admin' }]);
    groupApi.getGroups.mockResolvedValue([{ id: 'group-1', name: 'Command Admin' }]);
    userApi.getUsers.mockResolvedValue([{ id: 'user-1', name: 'Miracon', groups: [], roles: [] }]);
    userApi.updateUsers.mockResolvedValue([{ id: 'user-1', name: 'Miracon', groups: ['group-1'], roles: [] }]);

    await commandsApi.InitCommands();

    expect(commandDbApi.addCommands).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CREATE_TEST', roles: ['role-1'] })
    );
    expect(cmdDef.Commands[0].roles).toEqual([]);
    expect(userApi.updateUsers).toHaveBeenCalled();
  });
});
