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

  logEvent(LogLevel.INFO, 'Checking indexes for the database. This will create collections if they do not exist.');

  for(const key of Object.keys(INDEXES)){
    for(const index of INDEXES[key]){
      const collection = await getCollection(key);
      let insertIndex = {};
      insertIndex[index] = 1;
      await collection.createIndex(insertIndex, { unique: true, name: `index_${index}_1`});
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
    return;
  }
  if (!object) {
    logEvent(LogLevel.WARN, 'The object must be defined in order to write to the database.');
    return;
  }

  if (!object.id || !object.name) {
    console.log('object failed: ', object, 'type', type);
    logEvent(LogLevel.WARN, 'Attempted to write an object, but the data does not contain an id AND name. Both of these must be defined.');
    return;
  }

  try {
    let result = await targetCollection.insertOne(object);
    console.log(result);
    if (result.acknowledged === true) return true;
  } catch (err) {
    logError(err);
    return false;
  }

  return false;
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
    documents = await targetCollection.find().toArray();
    returnedDocuments = documents.map(document => document.newObject)
    return returnedDocuments;
  }
  if (!object.id && !object.name) {
    console.log('object read failed', object, 'type', type);
    logEvent(LogLevel.WARN, 'An object was passed, but did not have the name OR id defined, so there\'s no info to search for')
    return;
  }

  let searchObject = {};
  if (object.name) searchObject.name = object.name;
  if (object.id) searchObject.id = object.id;
  let foundObj;
  try {
    foundObj = await targetCollection.findOne(searchObject);
  } catch (err) {
    logError(err);
    return undefined;
  }

  return foundObj;
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
  if (target.id) targetObject.id = oldObject.id;
  if (oldObject.name) targetObject.name = oldObject.name;
  Object.keys(newObject).forEach(key => {
    if (key === 'id') return; //Don't update the id
    updatedObject[key] = newObject[key];
  });
  try {
    let result = targetCollection.updateOne(targetObject, updatedObject, { upsert: false });
    if (result.modifiedCount > 0) return true;
  } catch (err) {
    logError(err);
    return false;
  }

  return false;
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

async function initDatabase() {

  await checkConnection();
  const tables = ['users', 'groups', 'roles']
  for(tableName of tables){
    await client.db().dropCollection(tableName);
    await client.db().createCollection(tableName);
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
  switch (type.toUpperCase()) {
    case ('ROLE' || 'ROLES'): {
      targetCollection = await client.db().collection("roles");
      return targetCollection;
    }
    case ('GROUP' || 'GROUPS'): {
      targetCollection = await client.db().collection("groups");
      return targetCollection;
    }
    case ('USER' || 'USERS'): {
      targetCollection = await client.db().collection("users");
      return targetCollection;
    }
    default: {
      logEvent(LogLevel.WARN, `Attempted to access the database with ${type}! It must be accessed with either role, group, or user and is case insensitive!`);
      return undefined;
    }
  }
}

module.exports = { writeData, readData, removeData, updateData, initDatabase, closeConnection }