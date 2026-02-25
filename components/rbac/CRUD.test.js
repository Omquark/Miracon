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

let mockUUID = 0;
jest.mock('uuid', () => ({
  __esmodule: false,
  v4: () => {
    mockUUID += 1;
    return `uuid-${mockUUID}`;
  },
}));

jest.mock('./db', () => ({
  writeData: jest.fn(),
  writeManyData: jest.fn(),
  readData: jest.fn(),
  readManyData: jest.fn(),
  removeData: jest.fn(),
  removeManyData: jest.fn(),
  updateData: jest.fn(),
  updateManyData: jest.fn(),
  pullFromArray: jest.fn(),
}));

describe('CRUD unit tests with mocked db', () => {
  let db;
  let crud;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockUUID = 0;
    db = require('./db');
    crud = require('./CRUD');
  });

  it('adds single and batch objects with expected db calls', async () => {
    db.writeData.mockResolvedValue(true);
    db.writeManyData.mockResolvedValue([true, false, true]);

    const single = await crud.addObjects('role', { name: 'role-1' });
    expect(single).toEqual([{ name: 'role-1', id: 'uuid-1' }]);
    expect(db.writeData).toHaveBeenCalledWith('role', { name: 'role-1', id: 'uuid-1' });

    const batch = await crud.addObjects('role', [{ name: 'role-2' }, { name: 'role-3' }, { name: 'role-4' }]);
    expect(batch).toEqual([
      { name: 'role-2', id: 'uuid-2' },
      undefined,
      { name: 'role-4', id: 'uuid-4' },
    ]);
    expect(db.writeManyData).toHaveBeenCalledTimes(1);
  });

  it('gets objects via readData/readManyData based on cardinality', async () => {
    db.readData.mockResolvedValue({ id: '1', name: 'single' });
    db.readManyData.mockResolvedValue([{ id: '2', name: 'r2' }, undefined]);

    const all = await crud.getObjects('role');
    expect(db.readData).toHaveBeenCalledWith('role');
    expect(all).toEqual({ id: '1', name: 'single' });

    const single = await crud.getObjects('role', { id: '1' });
    expect(single).toEqual([{ id: '1', name: 'single' }]);

    const many = await crud.getObjects('role', [{ id: '2' }, { id: '3' }]);
    expect(db.readManyData).toHaveBeenCalledWith('role', [{ id: '2' }, { id: '3' }]);
    expect(many).toEqual([{ id: '2', name: 'r2' }, undefined]);
  });

  it('updates objects in batch using updateManyData results', async () => {
    db.updateManyData.mockResolvedValue([true, false, true]);

    const updated = await crud.updateObjects(
      'user',
      [{ id: '1' }, { id: '2' }, { id: '3' }],
      [{ name: 'u1' }, { name: 'u2' }, { name: 'u3' }]
    );

    expect(db.updateManyData).toHaveBeenCalledWith(
      'user',
      [{ id: '1' }, { id: '2' }, { id: '3' }],
      [{ name: 'u1' }, { name: 'u2' }, { name: 'u3' }]
    );
    expect(updated).toEqual([{ name: 'u1' }, { name: 'u3' }]);
  });

  it('removes objects in batch using removeManyData results', async () => {
    db.removeManyData.mockResolvedValue([false, true, true]);

    const removed = await crud.removeObjects('group', [{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(db.removeManyData).toHaveBeenCalledWith('group', [{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(removed).toEqual([{ id: '2' }, { id: '3' }]);
  });

  it('cascadeRemove performs a set-based pull', async () => {
    await crud.cascadeRemove('role-1', 'role', 'group');
    expect(db.pullFromArray).toHaveBeenCalledWith('group', 'roles', 'role-1');
  });

  it('validateRoles checks only referenced role ids', async () => {
    db.readManyData.mockResolvedValue([{ id: 'r1', name: 'role1' }, undefined]);

    const valid = await crud.validateRoles([{ roles: ['r1', 'r2'] }]);
    expect(valid).toBe(false);
    expect(db.readManyData).toHaveBeenCalledWith('role', [{ id: 'r1' }, { id: 'r2' }]);

    db.readManyData.mockResolvedValue([{ id: 'r1', name: 'role1' }]);
    const validNoRefs = await crud.validateRoles([{ roles: [] }]);
    expect(validNoRefs).toBe(true);
  });

  it('validateGroups checks only referenced group ids', async () => {
    db.readManyData.mockResolvedValue([{ id: 'g1', name: 'group1' }, undefined]);

    const valid = await crud.validateGroups([{ groups: ['g1', 'g2'] }]);
    expect(valid).toBe(false);
    expect(db.readManyData).toHaveBeenCalledWith('group', [{ id: 'g1' }, { id: 'g2' }]);

    const validNoRefs = await crud.validateGroups([{ groups: [] }]);
    expect(validNoRefs).toBe(true);
  });
});
