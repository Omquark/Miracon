const { join } = require("path");
const { getConfig } = require("../Config");
const { readFileSync } = require("fs");
const bcrypt = require("bcrypt");
const { logEvent, LogLevel, logError } = require("../Log");
const { addUsers } = require("./User");
const { addRoles, getRoles } = require("./Role");
const { addGroups } = require("./Group");
const { initDatabase } = require("./db");

async function InitUsers() {

  logEvent(LogLevel.INFO, 'Initializing the user/roles database.');
  await initDatabase();

  // logEvent(LogLevel.INFO, 'Clearing out the old roles');
  // let oldRoles = await getRoles();
  // removeRoles(oldRoles);
  //removeRoles(await getRoles());

  logEvent(LogLevel.INFO, 'Creating the default roles to align with minecraft security levels');
  const createdRoles = [
    { name: 'Level 1' },
    { name: 'Level 2' },
    { name: 'Level 3' },
    { name: 'Level 4' },
  ];

  logEvent(LogLevel.INFO, 'Adding the new roles to the database');
  await addRoles(createdRoles);
  const newRoles = await getRoles(createdRoles);

  logEvent(LogLevel.INFO, 'Clearing out the old groups');
  // await removeGroups(await getGroups());

  logEvent(LogLevel.INFO, 'Creating the new groups to align with minecraft security level');

  const createdGroups = [
    {
      name: 'Level 1',
      roles: [
        newRoles.find(role => role.name === 'Level 1').id,
      ]
    },
    {
      name: 'Level 2',
      roles: [
        newRoles.find(role => role.name === 'Level 1').id,
        newRoles.find(role => role.name === 'Level 2').id,
      ]
    },
    {
      name: 'Level 3',
      roles: [
        newRoles.find(role => role.name === 'Level 1').id,
        newRoles.find(role => role.name === 'Level 2').id,
        newRoles.find(role => role.name === 'Level 3').id,
      ]
    },
    {
      name: 'Level 4',
      roles: [
        newRoles.find(role => role.name === 'Level 1').id,
        newRoles.find(role => role.name === 'Level 2').id,
        newRoles.find(role => role.name === 'Level 3').id,
        newRoles.find(role => role.name === 'Level 4').id,
      ]
    },
  ]

  logEvent(LogLevel.INFO, 'Adding the new groups');
  const addedGroups = await addGroups(createdGroups);

  const Config = getConfig();
  const minecraftPath = Config.minecraftServer.path;
  logEvent(LogLevel.INFO, 'Reading the ops file');
  const opsString = readFileSync(join(minecraftPath, 'ops.json'), 'utf-8');
  let ops = JSON.parse(opsString);
  if (!Array.isArray(ops)) {
    ops = [ops];
  }
  logEvent(LogLevel.INFO, `Found ${ops.length - 1} users to create accounts for. This does not include the [Minecraft] user.`)
  const createdUsers = [];

  logEvent(LogLevel.INFO, 'Creating user accounts');

  ops.forEach(op => {
    if (op.name === '[Minecraft]') return; //Skip the server user
    logEvent(LogLevel.DEBUG, `Creating account for user ${op.name} with level ${op.level}`);
    const user = {
      name: op.name,
      password: 'Mi1n3e&Cr4\\tf$', //Plain text, we call the hash function later, which will do the adding.
      email: `${op.name}@miracon.com`,
      preferences: {},
      roles: [],
      groups: [addedGroups.find(group => group.name.includes(op.level)).id],
      id: ops.uuid,
      active: false,
      changePassword: true,
    }
    logEvent(LogLevel.DEBUG, `Adding ${user.name} to created users list`);
    createdUsers.push(user);
  });

  const defaultAdmin = { //Default admin to assign roles, can be deactivated later
    name: 'Miracon',
    password: 'Mi1n3e&Cr4\\tf$',
    email: 'miracon@miracon.com',
    preferences: {},
    roles: [],
    groups: [addedGroups.find(group => group.name === ('Level 4')).id],
    active: true,
    changePassword: true,
  }

  createdUsers.push(defaultAdmin);

  logEvent(LogLevel.INFO, 'Hashing passwords');


  for (user of createdUsers) {
    try {
      logEvent(LogLevel.DEBUG, `Hashing password for ${user.name}`);
      user.password = bcrypt.hashSync(user.password, 14);
      await addUsers(user);
    }
    catch (err) {
      logError(`Unable to add the user ${user.name}`)
    }
  }

  logEvent(LogLevel.WARN, `Created default users, and admins based on the ops.json`);
  logEvent(LogLevel.WARN, 'Users, groups, and roles have been created to align with the security level used by minecraft.');
  logEvent(LogLevel.WARN, 'All users have the same password and will be required to change at the next login.');
  logEvent(LogLevel.WARN, 'This will also force them to update any other information not provided by the ops.json such as email');
  logEvent(LogLevel.WARN, 'A default admin has also been created to manage roles as needed. You can use this to assign roles then disable later if you need.');
  logEvent(LogLevel.WARN, 'By default this has only access to the roles, but as it does, it effectively has total access.');
  logEvent(LogLevel.WARN, 'Use this utility with caution, and don\'t share passwords.');
  logEvent(LogLevel.WARN, 'Any damage done as a result of this utility, intentional or otherwise falls on the end user. In other words, use at your own risk.');
}

module.exports = { InitUsers, }