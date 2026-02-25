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

describe('ConsoleCommand wrapper unit tests', () => {
  let crud;
  let consoleCommandApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    crud = require('./CRUD');
    consoleCommandApi = require('./ConsoleCommand');
  });

  it('addConsoleCommands validates both roles and blacklistRoles', async () => {
    crud.validateRoles.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    crud.addObjects.mockResolvedValue([{ id: 'cc1', name: 'CC1' }]);

    const result = await consoleCommandApi.addConsoleCommands({
      id: 'cc1',
      name: 'CC1',
      roles: ['r1'],
      blacklistRoles: ['r2'],
    });

    expect(result).toEqual([{ id: 'cc1', name: 'CC1' }]);
    expect(crud.validateRoles).toHaveBeenNthCalledWith(2, [{ roles: ['r2'] }]);
    expect(crud.addObjects).toHaveBeenCalled();
  });

  it('updateConsoleCommands supports batch payload validation', async () => {
    crud.validateRoles.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    crud.updateObjects.mockResolvedValue([{ id: 'cc1', name: 'CC1-new' }]);

    const result = await consoleCommandApi.updateConsoleCommands(
      { id: 'cc1' },
      { id: 'cc1', name: 'CC1-new', roles: ['r1'], blacklistRoles: ['r2'] }
    );

    expect(result).toEqual([{ id: 'cc1', name: 'CC1-new' }]);
    expect(crud.validateRoles).toHaveBeenNthCalledWith(2, [{ roles: ['r2'] }]);
    expect(crud.updateObjects).toHaveBeenCalled();
  });

  it('get/remove proxy through CRUD', async () => {
    crud.getObjects.mockResolvedValue([{ id: 'cc1', name: 'CC1' }]);
    crud.removeObjects.mockResolvedValue([{ id: 'cc1' }]);

    expect(await consoleCommandApi.getConsoleCommands({ id: 'cc1' })).toEqual([{ id: 'cc1', name: 'CC1' }]);
    expect(await consoleCommandApi.removeConsoleCommands({ id: 'cc1' })).toEqual([{ id: 'cc1' }]);
  });
});
