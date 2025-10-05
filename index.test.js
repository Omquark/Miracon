const { Commands } = require('./components/commands/CmdDef');

jest.doMock('./components/Log', () => {
  return {
    __esmodule: false,
    logEvent: (logLevel, message) => {
      //we do need the debug messages
      if (logLevel.level > -10) console.log(`${logLevel.name} ${message}`);
    },
    logError: (message) => {
      console.log(`${message}`);
    },
    LogLevel: {
      ALL: { name: 'ALL', level: -1 },
      DEBUG: { name: 'DEBUG', level: 0 },
      INFO: { name: 'INFO', level: 1 },
      WARN: { name: 'WARN', level: 2 },
      AUDIT: { name: 'AUDIT', level: 254 },
      ERROR: { name: 'ERROR', level: 255 },
    }
  }
});

jest.doMock('./components/Config', () => {
  return {
    initConfig: () => {
      return;
    },
    getConfig: () => {
      return {
        init: false,
        minecraftServer: {
          path: '/opt/minecraft',
          address: 'localhost',
          port: '25575',
          password: 'cGFzc3dvcmQK' //64-bit encoded
        },
        log: {
          level: 'DEBUG',
          path: '/var/miracon',
          logFolder: 'log',
          auditFolder: 'audit',
        },
        nodeConfig: {
          port: '3010',
          installPath: '/opt/miracon',
          initUsers: true,
        },
        dbConfig: {
          dbname: 'miracon-test',
          url: 'localhost',
          port: 27017,
          username: 'miracon',
          password: 'miracon'
        }
      }
    },
    HiddenConfig: {
      dbConfig: { password: 'miracon' },
      minecraftServer: { password: 'password' }
    }
  }
});

const bcryptPasswords = [
  { password: "password", byte64: "cGFzc3dvcmQ=", bcrypt: "$2a$14$XEN4yKbGTUHrdwgpkPeo7uDo.mSTIipsGvBulGGp45WT673EsK4zC" },
  { password: "password", byte64: "cGFzc3dvcmQ=", bcrypt: "$2a$14$XEN4yKbGTUHrdwgpkPeo7uDo.mSTIipsGvBulGGp45WT673EsK4zC" },
  { password: "pass.word.1", byte64: "cGFzcy53b3JkLjE=", bcrypt: "$2a$14$MBWYJb0ApETUd/uj.Yjo0eOgKr4CcmndcNh3vqgHT5VQHHRXlqAHu" },
  { password: "password%", byte64: "password%", bcrypt: "$2a$14$2aDpUQIzXofPe3/gEyiHvO0/EPEN/72hbBublXG5.NqF9Fx8hJfYy" },
  { password: "pass!word@1!@#$%^&*?", byte64: "cGFzcyF3b3JkQDEhQCMkJV4mKj8=", bcrypt: "$2a$14$kwdDF0ZXiaQKQN.DeqvRUuo5Tb5z/m0qgdARX7DifKCz4iQFmvzfO" },
  { password: "pass@word$1", byte64: "cGFzc0B3b3JkJDE=", bcrypt: "$2a$14$3Lm.AK4HaTy9267PdD4Q0OtPsDNyMF0geDJmxzYt2udX/zLSpM4Sa" },
  { password: "password1", byte64: "cGFzc3dvcmQx", bcrypt: "$2a$14$DRB7Xb.R9XTBpEgxnszp2e4E4T65FCcJGpDOlr3sZ/c3cjn57eyT2" },
  { password: "password2", byte64: "cGFzc3dvcmQy", bcrypt: "$2a$14$tmU4AqRHlwFhIg/RTZ4Vpuq296Hu0gJgOl4ECZeErz7wxbfUTX6Ru" },
  { password: "password3", byte64: "cGFzc3dvcmQz", bcrypt: "$2a$14$uMjP522yRKv95mfGDCC/2eHrOtugRhLTJ6k5TeYebLo03KrBo2/TO" },
  { password: "password4", byte64: "cGFzc3dvcmQ0", bcrypt: "$2a$14$Y8tUFXUczmsge0XRDcUlGuUxRtb0GXxfaC4uUich2uz2eAfcsSCRa" },
  { password: "password5", byte64: "cGFzc3dvcmQ1", bcrypt: "$2a$14$ptcUap9kSGRme7QGBHSHjuODI8uWgtvap5ofeJBJ9VP9lmbiJaZRK" },
  { password: "password6", byte64: "cGFzc3dvcmQ2", bcrypt: "$2a$14$ercQOHFHNmBkk1.nzfB4beVjOcFqA5/Lfn1zI5oBbq6o6u4TtYLpG" },
  { password: "password7", byte64: "cGFzc3dvcmQ3", bcrypt: "$2a$14$HbtSC6PAYOuqes2mZLc0Zem3VmQUgcjoaSurtI1pCyUYLR.uWK862" },
]
const testRoles = [
  { name: 'CREATE_ROLE', id: '1' },
  { name: 'READ_ROLE', id: '2' },
  { name: 'UPDATE_ROLE', id: '3' },
  { name: 'DELETE_ROLE', id: '4' },
  { name: 'CREATE_GROUP', id: '5' },
  { name: 'READ_GROUP', id: '6' },
  { name: 'UPDATE_GROUP', id: '7' },
  { name: 'DELETE_GROUP', id: '8' },
  { name: 'CREATE_USER', id: '9' },
  { name: 'READ_USER', id: '10' },
  { name: 'UPDATE_USER', id: '11' },
  { name: 'DELETE_USER', id: '12' },
  { name: 'CREATE_COMMAND', id: '13' },
  { name: 'READ_COMMAND', id: '14' },
  { name: 'UPDATE_COMMAND', id: '15' },
  { name: 'DELETE_COMMAND', id: '16' },
  { name: 'CREATE_WHITELIST', id: '17' },
  { name: 'READ_WHITELIST', id: '18' },
  { name: 'UPDATE_WHITELIST', id: '19' },
  { name: 'DELETE_WHITELIST', id: '20' },
];
const testGroups = [
  { name: 'Test Group 1', id: '1', roles: ['1', '2'] },
  { name: 'Test Group 2', id: '2', roles: ['1', '3'] },
  { name: 'Test Group 3', id: '3', roles: ['2', '3'] },
  { name: 'Super Group 1', id: '4', roles: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'] },
  { name: 'Role Group 1', id: '5', roles: ['1', '2', '3', '4'] },
  { name: 'Group Group 1', id: '6', roles: ['5', '6', '7', '8'] },
  { name: 'User Group 1', id: '7', roles: ['9', '10', '11', '12'] },
  { name: 'Command Group 1', id: '8', roles: ['13', '14', '15', '16'] },
  { name: 'Whitelist Group 1', id: '9', roles: ['17', '18', '19', '20'] },
];
const testUsers = [
  { name: 'Invalid User 1', password: bcryptPasswords[0].bcrypt, email: 'TestUser1@email.com', preferences: {}, roles: ['1'], groups: ['1', '2'], id: '1', active: true, changePassword: true },
  { name: 'Invalid.User.2', password: bcryptPasswords[1].bcrypt, email: 'TestUser2@email.com', preferences: {}, roles: ['2'], groups: ['1', '3'], id: '2', active: true, changePassword: true },
  { name: 'Invalid_User_3', password: bcryptPasswords[2].bcrypt, email: 'TestUser3@email.com', preferences: {}, roles: ['3'], groups: ['2', '3'], id: '3', active: true, changePassword: true },
  { name: 'Invalid_User_4', password: bcryptPasswords[3].bcrypt, email: 'TestUser4@email.com', preferences: {}, roles: ['3'], groups: ['2', '3'], id: '4', active: true, changePassword: true },
  { name: 'Valid_User_1', password: bcryptPasswords[4].bcrypt, email: 'TestUser5@email.com', preferences: {}, roles: [], groups: [], id: '5', active: true, changePassword: true },
  { name: 'Valid_User_2', password: bcryptPasswords[5].bcrypt, email: 'TestUser6@email.com', preferences: {}, roles: [], groups: ['1'], id: '6', active: true, changePassword: true },
  { name: 'Valid_User_3', password: bcryptPasswords[6].bcrypt, email: 'TestUser7@email.com', preferences: {}, roles: [], groups: ['2'], id: '7', active: true, changePassword: true },
  { name: 'Miracon', password: bcryptPasswords[7].bcrypt, email: 'TestUser8@email.com', preferences: {}, roles: [], groups: ['4'], id: '8', active: true, changePassword: false },
  { name: 'Role_Access_1', password: bcryptPasswords[8].bcrypt, email: 'TestUser9@email.com', preferences: {}, roles: [], groups: ['5'], id: '9', active: true, changePassword: true },
  { name: 'Group_Access_1', password: bcryptPasswords[9].bcrypt, email: 'TestUser10@email.com', preferences: {}, roles: [], groups: ['6'], id: '10', active: true, changePassword: true },
  { name: 'User_Access_1', password: bcryptPasswords[10].bcrypt, email: 'TestUser11@email.com', preferences: {}, roles: [], groups: ['7'], id: '11', active: true, changePassword: true },
  { name: 'Command_Access_1', password: bcryptPasswords[11].bcrypt, email: 'TestUser12@email.com', preferences: {}, roles: [], groups: ['8'], id: '12', active: true, changePassword: true },
  { name: 'whitelist_Access_1', password: bcryptPasswords[12].bcrypt, email: 'TestUser13@email.com', preferences: {}, roles: [], groups: ['9'], id: '13', active: true, changePassword: true },
];

describe('Tests the endpoints which aren\'t handled by NextJS', () => {

  const { initDatabase, closeConnection, } = require('./components/rbac/db');
  const { app } = require('./index.js');
  const request = require('supertest');
  let server;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    server = app.listen(3011);
  })

  beforeEach(async () => {
    jest.resetModules();
    jest.resetAllMocks();

    await initDatabase();
    await closeConnection();

    const { addRoles, } = require('./components/rbac/Role');
    const { addGroups } = require('./components/rbac/Group');
    const { addUsers } = require('./components/rbac/User');
    const { InitCommands } = require('./components/commands/Commands');

    await addRoles(testRoles);
    await addGroups(testGroups);
    await addUsers(testUsers);
    await InitCommands();
  });

  afterEach(async () => {
    await closeConnection();
  });

  afterAll(async () => {
    await server?.close();
  });

  it('login endpoint should respond with 400 for incomplete credentials', async () => {
    const agent = request.agent(app);

    let response = await agent.post('/login');
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(400);
    response = await agent.post('/login').send({ username: 'username' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    response = await agent.post('/login').send({ password: 'password' });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
  })

  it('login should not allow invalid characters in username or password', async () => {
    const agent = request.agent(app);

    let response = await agent.post('/login').send({ username: testUsers[0].name, password: bcryptPasswords[0].byte64 });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBeDefined();
    expect(response.body.error[0].msg).toBe('Username must be alphanumeric with _ (underscore)');

    response = await agent.post('/login').send({ username: testUsers[1].name, password: bcryptPasswords[1].byte64 });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBeDefined();
    expect(response.body.error[0].msg).toBe('Username must be alphanumeric with _ (underscore)');

    response = await agent.post('/login').send({ username: testUsers[2].name, password: bcryptPasswords[2].byte64 });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toBe('Password must be alphanumeric and can contain any of !@#$%^&*?\\');

    response = await agent.post('/login').send({ username: testUsers[3].name, password: bcryptPasswords[3].byte64 });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBeDefined();
    expect(response.body.error[0].msg).toBe('Password is expected to be sent as Base64 string');
  });

  it('should allow login with correct username and password', async () => {
    const agent = request.agent(app);

    response = await agent.post('/login').send({ username: testUsers[4].name, password: bcryptPasswords[4].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[4].name);
    expect(response.body.email).toBe(testUsers[4].email);
    expect(response.body.roleNames.length).toBe(0);
    expect(response.body.changePassword).toBe(true);

    response = await agent.post('/login').send({ username: testUsers[5].name, password: bcryptPasswords[5].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[5].name);
    expect(response.body.email).toBe(testUsers[5].email);
    expect(response.body.roleNames).toContain(testRoles[0].name);
    expect(response.body.roleNames).toContain(testRoles[1].name);
    expect(response.body.changePassword).toBe(true);

    response = await agent.post('/login').send({ username: testUsers[6].name, password: bcryptPasswords[6].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[6].name);
    expect(response.body.email).toBe(testUsers[6].email);
    expect(response.body.roleNames).toContain(testRoles[0].name);
    expect(response.body.roleNames).toContain(testRoles[2].name);
    expect(response.body.changePassword).toBe(true);

    response = await agent.post('/login').send({ username: testUsers[7].name, password: bcryptPasswords[7].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[7].name);
    expect(response.body.email).toBe(testUsers[7].email);
    for (let i = 0; i < testRoles.length; i++) {
      expect(response.body.roleNames).toContain(testRoles[i].name);
    }
    expect(response.body.changePassword).toBe(false);
  });

  it('should prevent access to protected endpoints', async () => {
    let agent = request.agent(app);

    let response = await agent.post('/roles').send({ id: '4', name: 'New Role 1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/roles');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.put('/roles').send({ id: '2', name: 'New Role 2' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.delete('/roles').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.post('/groups').send({ id: '4', name: 'Test Group 1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/groups');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.put('/groups').send({ id: '2', name: 'Test Group 1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.delete('/groups').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.post('/users').send({ id: '4', name: 'Valid_User_1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/users');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.put('/users').send({ id: '2', name: 'Valid_User_1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.delete('/users').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.post('/whitelist').send({ id: '4', name: 'Valid_User_1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/whitelist');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.put('/whitelist').send({ id: '2', name: 'Valid_User_1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.delete('/whitelist').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.post('/console').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/console');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/command').send({ id: '1' });
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');

    response = await agent.get('/invalid_path');
    expect(response.status).toEqual(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('User is not logged in');
  });

  it.only('checks the role endpoint for access and sanitation', async () => {
    let agent = request.agent(app);

    let response = await agent.post('/login').send({ username: testUsers[8].name, password: bcryptPasswords[8].byte64 });
    let body = response.body;
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(body).toBeDefined();
    response = await agent.get('/roles');
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/text/);
    expect(response.text).toBeDefined();
    let text = JSON.parse(response.text);
    //The testRoles will not perfectly match as InitCommands creates all roles which are also used in production
    //There are 39 default commands
    expect(text.length).toEqual(Commands.length);
    //But, it will contain all the roles which we added
    for (let i = 0; i < testRoles.length; i++) {
      expect(text).toContainEqual(testRoles[i]);
    }

    //Check invalid role name through POST
    response = await agent.post('/roles').send({ data: { name: 'New Role', id: '200' } });
    console.log(response.body);
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toEqual('Role name can only contain alphanumeric characters and _');

    //Check to add a role via POST
    response = await agent.post('/roles').send({ data: { name: 'New_Role', id: '200' } });
    console.log(response.body);
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(response.body)).toEqual(true);
    expect(response.body.length).toEqual(1)
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).not.toEqual('200');
    expect(response.body[0]).not.toHaveProperty('_id');
    let roleID = response.body[0].id;

    //Check invalid role name via PUT
    response = await agent.put('/roles').send({ data: { name: 'Updated Role', id: roleID } });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toEqual('Role name can only contain alphanumeric characters and _');

    //Check to update the same role via PUT
    response = await agent.put('/roles').send({ data: { name: 'Updated_Role', id: roleID } });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).not.toHaveProperty('error');
    expect(Array.isArray(response.body)).toEqual(true);
    expect(response.body.length).toEqual(1);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].id).toEqual(roleID);
    expect(response.body[0].name).toEqual('Updated_Role');

    //Check to delete a role with an invalid name
    response = await agent.delete('/roles').send({ data: { name: 'Updated Role' } });
    expect(response.status).toEqual(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toEqual('Role name can only contain alphanumeric characters and _');

    //Check to delete the same role via DELETE
    response = await agent.delete('/roles').send({ data: { name: 'Updated_Role', id: roleID } });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).not.toHaveProperty('error');
    expect(Array.isArray(response.body)).toEqual(true);
    expect(response.body.length).toEqual(1);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].id).toEqual(roleID);
    expect(response.body[0].name).toEqual('Updated_Role');

    response = await agent.get('/roles');
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/text/);
    text = JSON.parse(response.text);
    expect(text).not.toContainEqual({ name: 'Updated_Role', id: roleID });
  });
});