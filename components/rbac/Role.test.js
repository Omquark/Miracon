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
  }
}));

jest.mock('./CRUD', () => ({
  getObjects: jest.fn(),
  addObjects: jest.fn(),
  updateObjects: jest.fn(),
  removeObjects: jest.fn(),
  cascadeRemove: jest.fn(),
}));

jest.mock('./Utility', () => ({
  strictProperties: jest.fn((object) => (Array.isArray(object) ? object : [object])),
}));

describe('Role wrapper unit tests', () => {
  let crud;
  let roleApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    crud = require('./CRUD');
    roleApi = require('./Role');
  });

  it('proxies add/get/update through CRUD', async () => {
    crud.addObjects.mockResolvedValue([{ id: 'r1', name: 'Role 1' }]);
    crud.getObjects.mockResolvedValue([{ id: 'r1', name: 'Role 1' }]);
    crud.updateObjects.mockResolvedValue([{ id: 'r1', name: 'Role 1 new' }]);

    expect(await roleApi.addRoles({ id: 'r1', name: 'Role 1' })).toEqual([{ id: 'r1', name: 'Role 1' }]);
    expect(await roleApi.getRoles({ id: 'r1' })).toEqual([{ id: 'r1', name: 'Role 1' }]);
    expect(await roleApi.updateRoles({ id: 'r1' }, { name: 'Role 1 new' })).toEqual([{ id: 'r1', name: 'Role 1 new' }]);
  });

  it('removeRoles cascades each role id to group/user/command', async () => {
    crud.removeObjects.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

    const result = await roleApi.removeRoles([{ id: 'r1' }, { id: 'r2' }]);
    expect(result).toEqual([{ id: 'r1' }, { id: 'r2' }]);

    expect(crud.cascadeRemove).toHaveBeenCalledWith('r1', 'role', 'group');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('r1', 'role', 'user');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('r1', 'role', 'command');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('r2', 'role', 'group');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('r2', 'role', 'user');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('r2', 'role', 'command');
  });
});
