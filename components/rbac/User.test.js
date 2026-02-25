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
  addObjects: jest.fn(),
  getObjects: jest.fn(),
  updateObjects: jest.fn(),
  removeObjects: jest.fn(),
  validateRoles: jest.fn(),
  validateGroups: jest.fn(),
}));

jest.mock('./Utility', () => ({
  strictProperties: jest.fn((object) => (Array.isArray(object) ? object : [object])),
}));

describe('User wrapper unit tests', () => {
  let crud;
  let userApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    crud = require('./CRUD');
    userApi = require('./User');
  });

  it('addUsers stops when role validation fails', async () => {
    crud.validateRoles.mockResolvedValue(false);
    crud.validateGroups.mockResolvedValue(true);

    const result = await userApi.addUsers({ id: 'u1', name: 'User 1', roles: ['missing'], groups: [] });
    expect(result).toEqual([]);
    expect(crud.addObjects).not.toHaveBeenCalled();
  });

  it('addUsers stops when group validation fails', async () => {
    crud.validateRoles.mockResolvedValue(true);
    crud.validateGroups.mockResolvedValue(false);

    const result = await userApi.addUsers({ id: 'u1', name: 'User 1', roles: [], groups: ['missing'] });
    expect(result).toEqual([]);
    expect(crud.addObjects).not.toHaveBeenCalled();
  });

  it('addUsers calls addObjects when validations pass', async () => {
    crud.validateRoles.mockResolvedValue(true);
    crud.validateGroups.mockResolvedValue(true);
    crud.addObjects.mockResolvedValue([{ id: 'u1', name: 'User 1' }]);

    const result = await userApi.addUsers({ id: 'u1', name: 'User 1', roles: [], groups: [] });
    expect(result).toEqual([{ id: 'u1', name: 'User 1' }]);
    expect(crud.addObjects).toHaveBeenCalledWith('user', [{ id: 'u1', name: 'User 1', roles: [], groups: [] }]);
  });

  it('updateUsers awaits validations and returns empty marker when invalid', async () => {
    crud.validateRoles.mockResolvedValue(false);
    crud.validateGroups.mockResolvedValue(true);

    const result = await userApi.updateUsers({ id: 'u1' }, { roles: ['missing'] });
    expect(result).toEqual([{}]);
    expect(crud.updateObjects).not.toHaveBeenCalled();
  });

  it('updateUsers calls CRUD update when validations pass', async () => {
    crud.validateRoles.mockResolvedValue(true);
    crud.validateGroups.mockResolvedValue(true);
    crud.updateObjects.mockResolvedValue([{ name: 'User 1 updated' }]);

    const result = await userApi.updateUsers({ id: 'u1' }, { name: 'User 1 updated' });
    expect(result).toEqual([{ name: 'User 1 updated' }]);
    expect(crud.updateObjects).toHaveBeenCalled();
  });
});
