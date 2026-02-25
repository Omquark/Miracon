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
  validateRoles: jest.fn(),
  addObjects: jest.fn(),
  getObjects: jest.fn(),
  updateObjects: jest.fn(),
  removeObjects: jest.fn(),
}));

jest.mock('./Utility', () => ({
  strictProperties: jest.fn((object) => (Array.isArray(object) ? object : [object])),
}));

describe('Command wrapper unit tests', () => {
  let crud;
  let commandApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    crud = require('./CRUD');
    commandApi = require('./Command');
  });

  it('addCommands validates both roles and blacklistRoles', async () => {
    crud.validateRoles.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    crud.addObjects.mockResolvedValue([{ id: 'c1', name: 'C1' }]);

    const result = await commandApi.addCommands({
      id: 'c1',
      name: 'C1',
      roles: ['r1'],
      blacklistRoles: ['r2'],
    });

    expect(result).toEqual([{ id: 'c1', name: 'C1' }]);
    expect(crud.validateRoles).toHaveBeenNthCalledWith(1, {
      id: 'c1',
      name: 'C1',
      roles: ['r1'],
      blacklistRoles: ['r2'],
    });
    expect(crud.validateRoles).toHaveBeenNthCalledWith(2, [{ roles: ['r2'] }]);
    expect(crud.addObjects).toHaveBeenCalled();
  });

  it('addCommands returns [] when blacklist validation fails', async () => {
    crud.validateRoles.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await commandApi.addCommands({
      id: 'c1',
      name: 'C1',
      roles: ['r1'],
      blacklistRoles: ['missing-role'],
    });
    expect(result).toEqual([]);
    expect(crud.addObjects).not.toHaveBeenCalled();
  });

  it('updateCommands supports batch payload validation', async () => {
    crud.validateRoles.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    crud.updateObjects.mockResolvedValue([{ id: 'c1', name: 'C1-new' }, { id: 'c2', name: 'C2-new' }]);

    const result = await commandApi.updateCommands(
      [{ id: 'c1' }, { id: 'c2' }],
      [
        { id: 'c1', name: 'C1-new', roles: ['r1'], blacklistRoles: ['r2'] },
        { id: 'c2', name: 'C2-new', roles: ['r1'], blacklistRoles: [] },
      ]
    );

    expect(result).toEqual([{ id: 'c1', name: 'C1-new' }, { id: 'c2', name: 'C2-new' }]);
    expect(crud.validateRoles).toHaveBeenNthCalledWith(2, [{ roles: ['r2'] }, { roles: [] }]);
    expect(crud.updateObjects).toHaveBeenCalled();
  });

  it('get/remove proxy through CRUD', async () => {
    crud.getObjects.mockResolvedValue([{ id: 'c1', name: 'C1' }]);
    crud.removeObjects.mockResolvedValue([{ id: 'c1' }]);

    expect(await commandApi.getCommands({ id: 'c1' })).toEqual([{ id: 'c1', name: 'C1' }]);
    expect(await commandApi.removeCommands({ id: 'c1' })).toEqual([{ id: 'c1' }]);
  });
});
