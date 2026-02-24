const { MongoClient } = require('mongodb');
const { getConfig, HiddenConfig } = require('../Config');
const { logEvent, LogLevel, logError } = require('../Log');

let client;

/**
 * Opens a connection to the database. Not being able to connect will not cause the server to close,
 * but will cause any data to be not written. The connection is not closed, and is designed to be kept open during
 * the entire session
 */
async function openConnection() {
  if (client) {
    logEvent(LogLevel.WARN, 'Attempted to open a database connection while an active connection exists.');
    logEvent(LogLevel.WARN, 'If you need to refresh the connection, close the client first, then attempt to open.');
    return;
  }
  logEvent(LogLevel.INFO, "Opening connection to database");
  const config = getConfig();
  const urlString = "mongodb://"
    .concat(config.dbConfig.username).concat(":") //Username to connect
    .concat(HiddenConfig.dbConfig.password).concat("@") //Password
    .concat(config.dbConfig.url).concat(":") //URL of db, proabbly localhost
    .concat(config.dbConfig.port).concat("/") //Port number default 27017
    .concat(config.dbConfig.dbname) //The database name
    .concat(""); //options

  logEvent(LogLevel.DEBUG, `urlString: ${urlString}`);
  try {
    client = new MongoClient(urlString);
    miracondb = client.db();
  } catch (err) {
    logError(err);
    logError('There was an error when attempting to connect to the database! Closing connection');
    await closeConnection();
    client = undefined;
  }
}

/**
 * Closes the connection to the database. This is only called on an error, or at the end of the session
 */
async function closeConnection() {
  client?.close();
  client = undefined;
}
/**
 * Validates the indexes within the 
 */
async function createIndexes() {
  const INDEXES = {};
  INDEXES.role = ['name', 'id'];
  INDEXES.group = ['name', 'id'];
  INDEXES.user = ['name', 'id', 'email'];
  INDEXES.command = ['name', 'id'];
  INDEXES.consoleCommand = ['name', 'id'];

  logEvent(LogLevel.INFO, 'Checking indexes for the database. This will create collections if they do not exist.');

  for (const key of Object.keys(INDEXES)) {
    for (const index of INDEXES[key]) {
      const collection = await getCollection(key);
      let insertIndex = {};
      insertIndex[index] = 1;
      await collection.createIndex(insertIndex, { unique: true, name: `index_${index}_1` });
    }
  }
}

/**
 * Writes information to the database. This will also attempt to open a connection if it is not open.
 * @param {string} type This should either be role, group, or user, case insensitive. If not, the data will not be written.
 * @param {Role | Group | User} object This is any object which is designed to be written through the CRUD operations. It must be a type of
 */
async function writeData(type, object) {
  let targetCollection;
  logEvent(LogLevel.INFO, 'Attempting to add data to the MongoDB database.')
  checkConnection();

  targetCollection = await getCollection(type);
  if (!targetCollection) {
    logEvent(LogLevel.WARN, 'Could not pull the collection to write. Check the type is correct and should be role, group, or user');
    return false;
  }
  if (!object) {
    logEvent(LogLevel.WARN, 'The object must be defined in order to write to the database.');
    return false;
  }

  if (!object.id || !object.name) {
    logEvent(LogLevel.WARN, 'Attempted to write an object, but the data does not contain an id AND name. Both of these must be defined.');
    return false;
  }

  try {
    let result = await targetCollection.insertOne(object);
    if (result.acknowledged === true) return true;
  } catch (err) {
    logError(err);
    return false;
  }

  return false;
}

async function writeManyData(type, objects) {
  checkConnection();
  if (!Array.isArray(objects) || objects.length === 0) {
    return [];
  }

  const targetCollection = await getCollection(type);
  if (!targetCollection) {
    return objects.map(() => false);
  }

  const validIndexes = [];
  const ops = [];
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    if (!object || !object.id || !object.name) {
      continue;
    }
    validIndexes.push(i);
    ops.push({ insertOne: { document: object } });
  }

  const result = objects.map(() => false);
  if (ops.length === 0) {
    return result;
  }

  try {
    await targetCollection.bulkWrite(ops, { ordered: false });
    validIndexes.forEach(index => {
      result[index] = true;
    });
    return result;
  } catch (err) {
    const failedWriteIndexes = new Set(
      (err?.writeErrors || []).map(writeError => writeError.index)
    );
    for (let i = 0; i < validIndexes.length; i++) {
      if (!failedWriteIndexes.has(i)) {
        result[validIndexes[i]] = true;
      }
    }
    if (!err?.writeErrors) {
      logError(err);
    }
    return result;
  }
}

/**
 * Rither reads a single document from the collection given, or will return all documents if the object passed is undefined
 * @param {string} type The type of object to find
 * @param {Role | Group | User} object If this is undefined, all documents will be pulled from the target collection. Otherwise, this
 *  should contain a key of some sort, being either a name or id, or for users email can be used.
 * @returns A Promise<Role | Group | User | undefined> matching the objectType, or undefined if passed a non-array object or if no records were found
 */
async function readData(type, object = undefined) {
  let targetCollection;
  let documents = [];
  let returnedDocuments = [];
  logEvent(LogLevel.INFO, 'Attempting to read data to the MongoDB database.');
  checkConnection();

  logEvent(LogLevel.DEBUG, 'Retrieving the collection to read.');
  targetCollection = await getCollection(type);
  if (!targetCollection) {
    logEvent(LogLevel.WARN, 'Could not pull the collection to read. Check the type is correct and should be role, group, or user');
    return;
  }
  if (!object) {
    logEvent(LogLevel.INFO, 'No object was passed to read, getting all records.');
    returnedDocuments = await targetCollection.find().toArray();
    return returnedDocuments;
  }
  if (!object.id && !object.name) {
    logEvent(LogLevel.WARN, 'An object was passed, but did not have the name OR id defined, so there\'s no info to search for')
    return;
  }

  let searchObject = {};
  if (object.name) searchObject.name = object.name;
  if (object.id) searchObject.id = object.id;
  let foundObj;
  try {
    foundObj = await targetCollection.findOne(searchObject);
    if (foundObj === null) foundObj = undefined;
  } catch (err) {
    logError(err);
    return undefined;
  }

  return foundObj;
}

async function readManyData(type, objects) {
  if (!Array.isArray(objects) || objects.length === 0) {
    return [];
  }

  const targetCollection = await getCollection(type);
  if (!targetCollection) {
    return objects.map(() => undefined);
  }

  const filters = [];
  const normalizedObjects = objects.map(object => {
    if (!object || (!object.id && !object.name)) {
      return undefined;
    }
    const searchObject = {};
    if (object.id) searchObject.id = object.id;
    if (object.name) searchObject.name = object.name;
    filters.push(searchObject);
    return searchObject;
  });

  if (filters.length === 0) {
    return objects.map(() => undefined);
  }

  const pulled = await targetCollection.find({ $or: filters }).toArray();
  const byId = new Map();
  const byName = new Map();
  pulled.forEach(document => {
    if (document.id !== undefined) byId.set(document.id, document);
    if (document.name !== undefined) byName.set(document.name, document);
  });

  return normalizedObjects.map(searchObject => {
    if (!searchObject) return undefined;
    if (searchObject.id && searchObject.name) {
      const byExactId = byId.get(searchObject.id);
      if (byExactId && byExactId.name === searchObject.name) {
        return byExactId;
      }
      return pulled.find(document => document.id === searchObject.id && document.name === searchObject.name);
    }
    if (searchObject.id) return byId.get(searchObject.id);
    return byName.get(searchObject.name);
  });
}

async function updateData(type, oldObject, newObject) {
  let targetCollection;
  logEvent(LogLevel.INFO, 'Attempting to update data within the MongoDB.');
  checkConnection();
  targetCollection = await getCollection(type);
  if (!targetCollection) {
    logEvent(LogLevel.WARN, 'Could not pull the collection to updateData. Check the type is correct and should be role, group, or user');
    return false;
  }

  if (!oldObject) {
    logEvent(LogLevel.WARN, 'The old object was not defined. This must be defined to know which object to update.');
    return false;
  }
  if (!newObject) {
    logEvent(LogLevel.WARN, 'The new object was not defined. This must be defined to update the object with new values.');
    return false;
  }

  if (!oldObject.name && !oldObject.id) {
    logEvent(LogLevel.WARN, 'The old object needs to have either the name or id defined to find the old object.');
    return false;
  }

  let updatedObject = {};
  let targetObject = {};
  if (oldObject.id) targetObject.id = oldObject.id;
  if (oldObject.name) targetObject.name = oldObject.name;
  Object.keys(newObject).forEach(key => {
    if (key === 'id') return; //Don't update the id
    updatedObject[key] = newObject[key];
  });
  try {
    let result = await targetCollection.updateOne(targetObject, { $set: updatedObject }, { upsert: false });
    if (result.modifiedCount > 0) return true;
  } catch (err) {
    logError(err);
    return false;
  }

  return false;
}

async function updateManyData(type, oldObjects, newObjects) {
  if (!Array.isArray(oldObjects) || !Array.isArray(newObjects) || oldObjects.length !== newObjects.length) {
    return [];
  }

  const targetCollection = await getCollection(type);
  if (!targetCollection) {
    return oldObjects.map(() => false);
  }

  const existing = await readManyData(type, oldObjects);
  const operations = [];
  const opToSourceIndex = [];
  const results = oldObjects.map(() => false);

  for (let i = 0; i < oldObjects.length; i++) {
    if (!existing[i]) {
      continue;
    }
    const oldObject = oldObjects[i];
    const newObject = newObjects[i];
    if (!newObject) {
      continue;
    }
    const targetObject = {};
    if (oldObject?.id) targetObject.id = oldObject.id;
    if (oldObject?.name) targetObject.name = oldObject.name;
    if (Object.keys(targetObject).length === 0) {
      continue;
    }
    const updatedObject = {};
    Object.keys(newObject).forEach(key => {
      if (key === 'id') return;
      updatedObject[key] = newObject[key];
    });
    operations.push({
      updateOne: {
        filter: targetObject,
        update: { $set: updatedObject },
        upsert: false,
      }
    });
    opToSourceIndex.push(i);
  }

  if (operations.length === 0) {
    return results;
  }

  try {
    await targetCollection.bulkWrite(operations, { ordered: false });
    opToSourceIndex.forEach(index => {
      results[index] = true;
    });
    return results;
  } catch (err) {
    const failedWriteIndexes = new Set(
      (err?.writeErrors || []).map(writeError => writeError.index)
    );
    for (let i = 0; i < opToSourceIndex.length; i++) {
      if (!failedWriteIndexes.has(i)) {
        results[opToSourceIndex[i]] = true;
      }
    }
    if (!err?.writeErrors) {
      logError(err);
    }
    return results;
  }
}

async function removeData(type, object) {
  let targetCollection;
  logEvent(LogLevel.INFO, 'Attempting to remove data to the MongoDB database.');
  await checkConnection();
  targetCollection = await getCollection(type);
  if (!targetCollection) {
    logEvent(LogLevel.WARN, 'Could not pull the collection to remove an item. The type must either be role, group, user and is case insensitive.');
    return false;
  }

  if (!object) {
    logEvent(LogLevel.WARN, 'The object passed to remove was undefined! This object must defined to remove from the db');
    return false;
  }

  if (!object.id && !object.name) {
    logEvent(LogLevel.WARN, 'The object passed to remove must have either the id or the name defined to remove.');
    return false;
  }

  let targetObject = {};
  if (object.id) targetObject.id = object.id;
  if (object.name) targetObject.name = object.name;
  try {
    let result = await targetCollection.deleteOne(targetObject);
    if (result.deletedCount > 0) return true;
  } catch (err) {
    logError(err);
    return false;
  }

  return false;
}

async function removeManyData(type, objects) {
  if (!Array.isArray(objects) || objects.length === 0) {
    return [];
  }

  const targetCollection = await getCollection(type);
  if (!targetCollection) {
    return objects.map(() => false);
  }

  const existing = await readManyData(type, objects);
  const filters = [];
  existing.forEach(foundObject => {
    if (!foundObject) return;
    if (foundObject.id !== undefined) {
      filters.push({ id: foundObject.id });
    } else if (foundObject.name !== undefined) {
      filters.push({ name: foundObject.name });
    }
  });

  if (filters.length === 0) {
    return existing.map(() => false);
  }

  try {
    await targetCollection.deleteMany({ $or: filters });
    return existing.map(foundObject => !!foundObject);
  } catch (err) {
    logError(err);
    return existing.map(() => false);
  }
}

async function pullFromArray(type, arrayField, value) {
  const targetCollection = await getCollection(type);
  if (!targetCollection) {
    return 0;
  }
  if (!arrayField || value === undefined) {
    return 0;
  }

  try {
    const result = await targetCollection.updateMany(
      { [arrayField]: value },
      { $pull: { [arrayField]: value } }
    );
    return result.modifiedCount || 0;
  } catch (err) {
    logError(err);
    return 0;
  }
}

async function initDatabase() {

  await checkConnection();
  const tables = ['users', 'groups', 'roles', 'commands', 'console_commands']
  for (tableName of tables) {
    try {
      await client.db().dropCollection(tableName);
      await client.db().createCollection(tableName);
    } catch (err) {
      logError('Failed to connect to the database server! Check the connection is running and the address and port are correct!');
      logError(`${err}`);
      console.log(err);
      logError('Exiting...');
      process.exit(1);
    }
  }

  await createIndexes();
}

async function checkConnection() {
  if (!client) {
    logEvent(LogLevel.DEBUG, 'Database connection was closed.');
    await openConnection();
    if (!client) {
      logError('The connection to the database cannot be secured! The data cannot be written.');
      logError('The database needs to be started and the correct config assigned to miracon.');
      throw new Error("Cannot open database for writes! Make sure the database is running and the connection information is correct.")
    }
  }
}

/**
 * Retrieves a collection from the database.
 * @param {string} type A string defining which collection to pull. This will either be role, group, or user, and is case insensitive.
 * @returns Either the collection or undefined if the string is invalid.
 */
async function getCollection(type) {
  let targetCollection;
  await checkConnection();
  if (!type) {
    logEvent(LogLevel.WARN, 'No type was passed to the collection! It must be either role, group, or user and is case insensitive.');
    return undefined;
  }
  switch (type.toUpperCase()) {
    case 'ROLE':
    case 'ROLES': {
      targetCollection = await client.db().collection("roles");
      return targetCollection;
    }
    case 'GROUP':
    case 'GROUPS': {
      targetCollection = await client.db().collection("groups");
      return targetCollection;
    }
    case 'USER':
    case 'USERS': {
      targetCollection = await client.db().collection("users");
      return targetCollection;
    }
    case 'COMMAND':
    case 'COMMANDS': {
      targetCollection = await client.db().collection("commands");
      return targetCollection;
    }
    case 'CONSOLECOMMAND':
    case 'CONSOLECOMMANDS': {
      targetCollection = await client.db().collection("console_commands");
      return targetCollection;
    }
    default: {
      logEvent(LogLevel.WARN, `Attempted to access the database with ${type}! It must be accessed with either role, group, or user and is case insensitive!`);
      return undefined;
    }
  }
}

module.exports = {
  writeData,
  writeManyData,
  readData,
  readManyData,
  removeData,
  removeManyData,
  updateData,
  updateManyData,
  pullFromArray,
  initDatabase,
  closeConnection,
}
