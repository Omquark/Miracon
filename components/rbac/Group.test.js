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
  validateRoles: jest.fn(),
}));

jest.mock('./Utility', () => ({
  strictProperties: jest.fn((object) => (Array.isArray(object) ? object : [object])),
}));

describe('Group wrapper unit tests', () => {
  let crud;
  let groupApi;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    crud = require('./CRUD');
    groupApi = require('./Group');
  });

  it('adds groups when role validation passes', async () => {
    crud.validateRoles.mockResolvedValue(true);
    crud.addObjects.mockResolvedValue([{ id: 'g1', name: 'Group 1' }]);

    const result = await groupApi.addGroups({ id: 'g1', name: 'Group 1', roles: ['r1'] });
    expect(result).toEqual([{ id: 'g1', name: 'Group 1' }]);
    expect(crud.addObjects).toHaveBeenCalled();
  });

  it('does not add groups when role validation fails', async () => {
    crud.validateRoles.mockResolvedValue(false);

    const result = await groupApi.addGroups({ id: 'g1', name: 'Group 1', roles: ['missing-role'] });
    expect(result).toEqual([]);
    expect(crud.addObjects).not.toHaveBeenCalled();
  });

  it('removeGroups cascades each group id before removal', async () => {
    crud.removeObjects.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);

    const result = await groupApi.removeGroups([{ id: 'g1' }, { id: 'g2' }]);
    expect(result).toEqual([{ id: 'g1' }, { id: 'g2' }]);
    expect(crud.cascadeRemove).toHaveBeenCalledWith('g1', 'group', 'user');
    expect(crud.cascadeRemove).toHaveBeenCalledWith('g2', 'group', 'user');
  });

  it('resolveRoles batches group lookups and merges direct/group roles', async () => {
    crud.getObjects.mockResolvedValueOnce([
      { id: 'g1', roles: ['r2', 'r3'] },
      { id: 'g2', roles: ['r4'] },
    ]);

    const resolved = await groupApi.resolveRoles([
      { id: 'u1', roles: ['r1'], groups: ['g1', 'g2'] },
      { id: 'u2', roles: [], groups: ['g1'] },
    ]);

    expect(crud.getObjects).toHaveBeenCalledWith('group', [{ id: 'g1' }, { id: 'g2' }]);
    expect(resolved).toEqual(['r1', 'r2', 'r3', 'r4', 'r2', 'r3']);
  });
});
