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
  { password: "password1", byte64: "cGFzc3dvcmQx", bcrypt: "$2a$14$DRB7Xb.R9XTBpEgxnszp2e4E4T65FCcJGpDOlr3sZ/c3cjn57eyT2" },
]
const testRoles = [
  { name: 'ADD_ROLE', id: '1' },
  { name: 'READ_ROLE', id: '2' },
  { name: 'UPDATE_ROLE', id: '3' },
  { name: 'DELETE_ROLE', id: '4' },
  { name: 'ADD_GROUP', id: '5' },
  { name: 'READ_GROUP', id: '6' },
  { name: 'UPDATE_GROUP', id: '7' },
  { name: 'DELETE_GROUP', id: '8' },
  { name: 'ADD_USER', id: '9' },
  { name: 'READ_USER', id: '10' },
  { name: 'UPDATE_USER', id: '11' },
  { name: 'DELETE_USER', id: '12' },
  { name: 'ADD_COMMAND', id: '13' },
  { name: 'READ_COMMAND', id: '14' },
  { name: 'UPDATE_COMMAND', id: '15' },
  { name: 'DELETE_COMMAND', id: '16' },
];
const testGroups = [
  { name: 'Test Group 1', id: '1', roles: ['1', '2'] },
  { name: 'Test Group 2', id: '2', roles: ['1', '3'] },
  { name: 'Test Group 3', id: '3', roles: ['2', '3'] },
  { name: 'Super Group 1', id: '4', roles: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'] }
];
const testUsers = [
  { name: 'Invalid User 1', password: bcryptPasswords[0].bcrypt, email: 'TestUser1@email.com', preferences: {}, roles: ['1'], groups: ['1', '2'], id: '1', active: true, changePassword: true },
  { name: 'Invalid.User.2', password: bcryptPasswords[1].bcrypt, email: 'TestUser2@email.com', preferences: {}, roles: ['2'], groups: ['1', '3'], id: '2', active: true, changePassword: true },
  { name: 'Invalid_User_3', password: bcryptPasswords[2].bcrypt, email: 'TestUser3@email.com', preferences: {}, roles: ['3'], groups: ['2', '3'], id: '3', active: true, changePassword: true },
  { name: 'Invalid_User_4', password: bcryptPasswords[3].bcrypt, email: 'TestUser4@email.com', preferences: {}, roles: ['3'], groups: ['2', '3'], id: '4', active: true, changePassword: true },
  { name: 'Valid_User_1', password: bcryptPasswords[4].bcrypt, email: 'TestUser5@email.com', preferences: {}, roles: [], groups: [], id: '5', active: true, changePassword: true },
  { name: 'Valid_User_2', password: bcryptPasswords[5].bcrypt, email: 'TestUser6@email.com', preferences: {}, roles: [], groups: ['1'], id: '6', active: true, changePassword: true },
  { name: 'Valid_User_3', password: bcryptPasswords[6].bcrypt, email: 'TestUser7@email.com', preferences: {}, roles: [], groups: ['2'], id: '7', active: true, changePassword: true },
  { name: 'Super_User_4', password: bcryptPasswords[7].bcrypt, email: 'TestUser8@email.com', preferences: {}, roles: [], groups: ['4'], id: '8', active: true, changePassword: true },
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

    response = await agent.post('/login').send({ username: testUsers[5].name, password: bcryptPasswords[5].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[5].name);
    expect(response.body.email).toBe(testUsers[5].email);
    expect(response.body.roleNames).toContain(testRoles[0].name);
    expect(response.body.roleNames).toContain(testRoles[1].name);

    response = await agent.post('/login').send({ username: testUsers[6].name, password: bcryptPasswords[6].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[6].name);
    expect(response.body.email).toBe(testUsers[6].email);
    expect(response.body.roleNames).toContain(testRoles[0].name);
    expect(response.body.roleNames).toContain(testRoles[2].name);

    response = await agent.post('/login').send({ username: testUsers[7].name, password: bcryptPasswords[7].byte64 });
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(testUsers[7].name);
    expect(response.body.email).toBe(testUsers[7].email);
    for (let i = 0; i < testRoles.length; i++) {
      expect(response.body.roleNames).toContain(testRoles[i].name);
    }
  });

  it.only('should prevent access to protected endpoints', async () => {
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

  });
});