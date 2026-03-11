const mockCollections = {
  roles: {
    createIndex: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
  groups: {
    createIndex: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
  users: {
    createIndex: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
  commands: {
    createIndex: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
  console_commands: {
    createIndex: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
};

const mockDb = {
  collection: jest.fn((name) => mockCollections[name]),
  dropCollection: jest.fn(),
  createCollection: jest.fn(),
};

const mockClient = {
  db: jest.fn(() => mockDb),
  close: jest.fn(),
};

const MockMongoClient = jest.fn(() => mockClient);

jest.mock('mongodb', () => ({
  MongoClient: MockMongoClient,
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
  }
}));

jest.mock('../Config', () => ({
  getConfig: () => ({
    dbConfig: {
      dbname: 'miracon-test',
      url: 'localhost',
      port: 27017,
      username: 'miracon',
      password: 'miracon',
    }
  }),
  HiddenConfig: { dbConfig: { password: 'miracon' } },
}));

describe('db module unit tests', () => {
  let db;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    db = require('./db');

    Object.values(mockCollections).forEach((collection) => {
      collection.createIndex.mockResolvedValue('ok');
      collection.insertOne.mockResolvedValue({ acknowledged: true });
      collection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
      collection.findOne.mockResolvedValue(undefined);
      collection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      collection.updateMany.mockResolvedValue({ modifiedCount: 1 });
      collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      collection.deleteMany.mockResolvedValue({ deletedCount: 1 });
      collection.bulkWrite.mockResolvedValue({});
    });

    mockDb.dropCollection.mockResolvedValue(undefined);
    mockDb.createCollection.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await db.closeConnection();
  });

  it('initializes DB and creates indexes without process exit', async () => {
    await db.initDatabase();

    expect(mockDb.dropCollection).toHaveBeenCalledTimes(5);
    expect(mockDb.createCollection).toHaveBeenCalledTimes(5);
    expect(mockCollections.roles.createIndex).toHaveBeenCalledWith({ name: 1 }, { unique: true, name: 'index_name_1' });
    expect(mockCollections.roles.createIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true, name: 'index_id_1' });
  });

  it('writes and reads single records', async () => {
    const wrote = await db.writeData('role', { id: '1', name: 'Role 1' });
    expect(wrote).toBe(true);

    mockCollections.roles.findOne.mockResolvedValue({ id: '1', name: 'Role 1' });
    const pulled = await db.readData('role', { id: '1' });
    expect(pulled).toEqual({ id: '1', name: 'Role 1' });
  });

  it('reads many records by id and preserves requested order with undefined misses', async () => {
    mockCollections.roles.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { id: '1', name: 'Role 1' },
        { id: '3', name: 'Role 3' },
      ]),
    });

    const pulled = await db.readManyData('role', [{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(pulled).toEqual([{ id: '1', name: 'Role 1' }, undefined, { id: '3', name: 'Role 3' }]);
  });

  it('handles bulk writes with partial failures', async () => {
    mockCollections.roles.bulkWrite.mockRejectedValue({
      writeErrors: [{ index: 1 }],
    });

    const result = await db.writeManyData('role', [
      { id: '1', name: 'Role 1' },
      { id: '2', name: 'Role 2' },
      { id: '3', name: 'Role 3' },
    ]);
    expect(result).toEqual([true, false, true]);
  });

  it('updates and removes in bulk', async () => {
    mockCollections.roles.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { id: '1', name: 'Role 1' },
        { id: '2', name: 'Role 2' },
      ]),
    });

    const updates = await db.updateManyData(
      'role',
      [{ id: '1' }, { id: '2' }],
      [{ name: 'Role 1 new' }, { name: 'Role 2 new' }]
    );
    expect(updates).toEqual([true, true]);

    const removals = await db.removeManyData('role', [{ id: '1' }, { id: '2' }]);
    expect(removals).toEqual([true, true]);
  });

  it('pulls a member from array fields with updateMany', async () => {
    mockCollections.groups.updateMany.mockResolvedValue({ modifiedCount: 2 });
    const result = await db.pullFromArray('group', 'roles', 'role-1');
    expect(result).toBe(2);
    expect(mockCollections.groups.updateMany).toHaveBeenCalledWith(
      { roles: 'role-1' },
      { $pull: { roles: 'role-1' } }
    );
  });
});
