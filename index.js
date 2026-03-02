const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const { validationResult } = require('express-validator');

const http = require('http');
const nextReq = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = nextReq({
    dev: dev,
    conf: {
        reactStrictMode: false,
        eslint: {
            dirs: ["src"],
            ignoreDuringBuilds: true,
        }
    }
});
// const nextApp = nextReq();

// const nextApp = nextReq();
const handle = nextApp.getRequestHandler();

const { getConfig, initConfig, HiddenConfig } = require('./components/Config');
const { logEvent, LogLevel, logError } = require('./components/Log');
const { checkAndLoginUser, updatePassword } = require('./components/session/UserLogin');
const { LoginSessionOpts } = require('./components/session/LoginSession');
const { resolveRoles, } = require('./components/rbac/Group');
const { getUsers, } = require('./components/rbac/User');
const { InitUsers } = require('./components/rbac/Init');
const { InitCommands, getCommand } = require('./components/commands/Commands');
const path = require('path');
const { access, constants, writeFile } = require('fs');
const { getCommands } = require('./components/rbac/Command');
const { validateAndSanitizeUser, isValidPassword, isValidUsername, isValidEmail } = require('./components/utility/Validators');
const { InitConsoleCommands } = require('./components/commands/ConsoleCommands');
const { getConsoleCommands } = require('./components/rbac/ConsoleCommand');
const { RConnection } = require('./components/RConnection');
const { bytesFromBase64 } = require('./components/utility/Utility');
const { CreateRole, ReadRole, UpdateRole, DeleteRole } = require('./components/endpoint/roles');
const { CreateGroup, ReadGroup, UpdateGroup, DeleteGroup } = require('./components/endpoint/groups');
const { ReadUser, UpdateUser, CreateUser, DeleteUser } = require('./components/endpoint/users');
const { ReadWhitelist, UpdateWhitelist, CreateWhitelist, DeleteWhitelist } = require('./components/endpoint/whitelist');
const {
    validateDataEnvelope,
    makeDataValidator,
    validateNameField,
    validateIdField,
    validateEmailField,
    validateArrayOfStrings,
} = require('./components/endpoint/middleware');


//Initialize the config and create the RConnection
initConfig(false);

//Get the config
const Config = getConfig();

//Limit the body parser to prevent ovesized packets. This is from the front end
const bodyParserJsonOptions = {
    limit: '1kb',
}

const rcon = new RConnection({
    password: HiddenConfig.minecraftServer.password,
    serverAddress: Config.minecraftServer.address,
    serverPort: Config.minecraftServer.port
});

app.use(bodyParser.json(bodyParserJsonOptions));
app.use(session(LoginSessionOpts));
app.disable('x-powered-by');

function sendError(res, statusCode, message) {
    res.status(statusCode).send({ error: message });
}

const validateRoleCreateBody = makeDataValidator({
    required: ['name'],
    validators: { name: validateNameField },
});
const validateRoleUpdateBody = makeDataValidator({
    required: ['id', 'name'],
    validators: { id: validateIdField, name: validateNameField },
});
const validateRoleDeleteBody = makeDataValidator({
    requireAny: ['id', 'name'],
    validators: { id: validateIdField, name: validateNameField },
});

const validateGroupCreateBody = makeDataValidator({
    required: ['name'],
    validators: { name: validateNameField, roles: validateArrayOfStrings('roles') },
});
const validateGroupUpdateBody = makeDataValidator({
    requireAny: ['id', 'name'],
    validators: { id: validateIdField, name: validateNameField, roles: validateArrayOfStrings('roles') },
});
const validateGroupDeleteBody = makeDataValidator({
    requireAny: ['id', 'name'],
    validators: { id: validateIdField, name: validateNameField },
});

const validateUserCreateBody = makeDataValidator({
    required: ['name', 'email', 'password'],
    validators: {
        name: validateNameField,
        email: validateEmailField,
        roles: validateArrayOfStrings('roles'),
        groups: validateArrayOfStrings('groups'),
    },
});
const validateUserUpdateBody = makeDataValidator({
    requireAny: ['id', 'name', 'email'],
    validators: {
        id: validateIdField,
        name: validateNameField,
        email: validateEmailField,
        roles: validateArrayOfStrings('roles'),
        groups: validateArrayOfStrings('groups'),
    },
});
const validateUserDeleteBody = makeDataValidator({
    requireAny: ['id', 'name', 'email'],
    validators: { id: validateIdField, name: validateNameField, email: validateEmailField },
});

const validateWhitelistMutateBody = makeDataValidator({
    required: ['name'],
    validators: { name: validateNameField },
});

//Endpoint to login.
app.post('/login', validateAndSanitizeUser, async (req, res) => {

    const rawBody = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logEvent(LogLevel.INFO, `Validation failed at login: ${JSON.stringify(errors)}`);
        return res.status(400).json({ error: errors.array() });
    }

    const userinfo = {};
    userinfo.username = rawBody.username;
    userinfo.password = bytesFromBase64(rawBody.password);

    logEvent(LogLevel.DEBUG, `userinfo: ${JSON.stringify(userinfo)}`);
    if (!isValidPassword(userinfo.password)) {
        sendError(res, 400, 'Password must be alphanumeric and can contain any of !@#$%^&*?\\');
        return;
    }
    if (!userinfo.username || !userinfo.password) {
        sendError(res, 400, 'No username or password provided');
        return;
    }
    const pulledInfo = await checkAndLoginUser(userinfo);

    if (pulledInfo.error) {
        res.status(401).send(pulledInfo);
        return;
    }

    req.session.userInfo = pulledInfo;
    logEvent(LogLevel.DEBUG, `pulledInfo sending to front: ${JSON.stringify(pulledInfo)}`);
    req.session.save();
    res.status(200).send(pulledInfo);
});

//Logs the user out and destroys the session
app.all('/logout', (req, res) => {
    logEvent(LogLevel.DEBUG, 'Logging out');
    req.session.userInfo = undefined;
    req.session.destroy();
    res.redirect('/');
});

//Changes the password of the user. You must be logged in to change the password
app.put('/change_password', async (req, res) => {

    if (!req.session.userInfo) {
        sendError(res, 401, 'User is not logged in.');
        return;
    }

    const rawBody = req.body;

    if (!rawBody.userinfo || !rawBody.userinfo.oldPassword || !rawBody.userinfo.newPassword) {
        sendError(res, 400, 'One of the old password or new password was not provided. Both must be in order to apply a change.');
        return;
    }

    const userinfo = {
        username: rawBody.userinfo.username,
        oldPassword: bytesFromBase64(rawBody.userinfo.oldPassword),
        newPassword: bytesFromBase64(rawBody.userinfo.newPassword),
    }

    if (!isValidPassword(userinfo.oldPassword) || !isValidPassword(userinfo.newPassword)) {
        sendError(res, 400, 'The provided password is not valid! A password must be alphanumeric or have the characters !@#$%^&*?\\');
        return;
    }

    if (!isValidUsername(rawBody.userinfo.username)) {
        sendError(res, 400, 'The provided username is not valid! The usernames allowed must be alphanumeric and _');
        return;
    }

    const message = await updatePassword(userinfo);
    res.status(message.error ? 400 : 200).send(message)
});

//Check that userinfo exists and validate it with session
app.all(/^(?!\/$|\/_next|\/favicon\.ico$).*$/, async (req, res, next) => {
    const userInfo = req.session.userInfo;

    logEvent(LogLevel.DEBUG, `process.env.NODE_ENV = ${process.env.NODE_ENV}`);
    logEvent(LogLevel.DEBUG, `userInfo = ${JSON.stringify(userInfo)}`);

    if (!userInfo?.name) {
        sendError(res, 401, 'User is not logged in');
        return;
    }

    const user = await getUsers({ name: req.session.userInfo.name });
    const currentUser = Array.isArray(user) ? user[0] : undefined;
    if (!currentUser?.name || !currentUser?.id) {
        sendError(res, 401, 'User could not be found');
        return;
    }
    const testRoles = await resolveRoles(user);

    if (!testRoles || !Array.isArray(testRoles) || testRoles.length === 0) {
        sendError(res, 403, 'No roles could be found for user');
        return;
    }

    req.session.userInfo = {
        ...req.session.userInfo,
        id: currentUser.id,
        roleIds: testRoles,
    };
    next();
});

//Used to execute get commands from the DB
app.get('/commands', async (req, res) => {
    const foundCmd = await getCommand('READ_COMMAND', req.session.userInfo);

    if (foundCmd?.error) {
        logEvent(LogLevel.WARN, 'There was an error attempting to read the commands!');
        sendError(res, 403, foundCmd.error);
        return;
    }
    res.status(200).send(await getCommands());
});

//Used to get console commands
app.get('/console', async (req, res) => {
    const commands = await getConsoleCommands();
    res.status(200).send(commands);
});

//Used to execute comands through RCon
app.post('/console', async (req, res) => {
    const commandName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    logEvent(LogLevel.INFO, `Attempting to execute command ${commandName}`);
    if (!commandName) {
        logEvent(LogLevel.INFO, `Command ${commandName} is not a valid command.`);
        sendError(res, 400, 'Attempted to execute a blank or invalid command!');
        return;
    }

    const firstSpace = commandName.indexOf(' ');
    const command = (await getConsoleCommands({ name: commandName.substring(0, firstSpace === -1 ? commandName.length : firstSpace).trim() }))[0];
    if (!command) {
        logEvent(LogLevel.INFO, `Command ${commandName} could not be found in the database.`);
        sendError(res, 404, 'Command cannot be found!');
        return;
    }

    logEvent(LogLevel.INFO, `Sending ${commandName} to be executed`);

    let response;
    try {
        await rcon.login();
        response = await rcon.send(commandName.trim());
    } catch (err) {
        response = err;
        logError(err);
        sendError(res, 500, response);
        return;
    }

    res.status(200).send({ message: response });
});

app.get('/roles', async (req, res) => {
    ReadRole(req, res);
});

app.put('/roles', validateDataEnvelope, validateRoleUpdateBody, async (req, res) => {
    UpdateRole(req, res);
});

app.post('/roles', validateDataEnvelope, validateRoleCreateBody, async (req, res) => {
    CreateRole(req, res);
});

app.delete('/roles', validateDataEnvelope, validateRoleDeleteBody, async (req, res) => {
    DeleteRole(req, res);
});

app.get('/groups', async (req, res) => {
    ReadGroup(req, res);
});

app.put('/groups', validateDataEnvelope, validateGroupUpdateBody, async (req, res) => {
    UpdateGroup(req, res)
});

app.post('/groups', validateDataEnvelope, validateGroupCreateBody, async (req, res) => {
    CreateGroup(req, res);
});

app.delete('/groups', validateDataEnvelope, validateGroupDeleteBody, async (req, res) => {
    DeleteGroup(req, res);
});

app.get('/users', async (req, res) => {
    ReadUser(req, res);
});

app.put('/users', validateDataEnvelope, validateUserUpdateBody, async (req, res) => {
    UpdateUser(req, res);
});

app.post('/users', validateDataEnvelope, validateUserCreateBody, async (req, res) => {
    CreateUser(req, res);
});

app.delete('/users', validateDataEnvelope, validateUserDeleteBody, async (req, res) => {
    DeleteUser(req, res);
});

app.get('/whitelist', async (req, res) => {
    ReadWhitelist(req, res);
});

app.put('/whitelist', validateDataEnvelope, validateWhitelistMutateBody, async (req, res) => {
    UpdateWhitelist(req, res);
});

app.post('/whitelist', validateDataEnvelope, validateWhitelistMutateBody, async (req, res) => {
    CreateWhitelist(req, res);
});

app.delete('/whitelist', validateDataEnvelope, validateWhitelistMutateBody, async (req, res) => {
    DeleteWhitelist(req, res);
});

//Used to serve static files
app.get('/_next/*', (req, res) => {
    const reqPath = decodeURI(req.path.replace('_', '.'));
    logEvent(LogLevel.DEBUG, `Static path request: ${path.join(__dirname, reqPath)}`);
    const filePath = path.join(__dirname, reqPath);
    access(filePath, constants.F_OK, (err) => {
        if (err) {
            logError(err);
            res.status(404).send({ error: 'Page could not be found' });
            return;
        }
        return handle(req, res);
    });
});

//Used to retrieve any pages from the admin sub diesctory
app.get(/^\/admin/, (req, res) => {
    return handle(req, res);
});

//Used to serve non-admin pages
app.all('/', (req, res, next) => {
    if (req.path !== '/' && req.path !== '/favicon.ico') {
        next();
        return;
    }
    logEvent(LogLevel.DEBUG, 'Handing off to next to handle requst');
    logEvent(LogLevel.DEBUG, `req.path ${req.path}`);
    handle(req, res);
});

//If the path could not be found
app.all('*', (req, res) => {
    logEvent(LogLevel.INFO, `404 error hit, trying to access page: ${req.path}`);
    res.status(404).send({ error: 'Page not found' });
});

//Checks if the init.lock file exists. This will re-create the DB if the file is deleted
//You can prevent this simply by creating the file yourself if you want a fresh, blank database
//It's typically an empty file, but since the contents aren't checked, you can write anything you want in it
access('./init.lock', constants.F_OK, async (err) => {
    //If the file does not exist/we do not have access
    if (err) {
        logEvent(LogLevel.INFO, 'init.lock could not be found, initializing the database');
        //Create the file to prevent re-init
        writeFile('./init.lock', '', (wErr) => {
            if (wErr) {
                logError('Failed to write the init.lock file! Make sure this program has access to the base directory.');
                logError(`Error: ${err}`);
                process.exit(1);
            }
        });
        //If the file does not exist
        logEvent(LogLevel.INFO, 'Initializing data...');
        await InitUsers();
        await InitCommands();
        await InitConsoleCommands();
    } else {
        logEvent(LogLevel.INFO, 'Skipping initialization...');
    }

    logEvent(LogLevel.DEBUG, `process.env.NODE_ENV=`, process.env.NODE_ENV);
    //Start the server!
    if (process.env.NODE_ENV !== 'test') {
        logEvent(LogLevel.DEBUG, 'Starting server in non-test mode')
        nextApp.prepare().then(async () => {
            http.createServer(app).listen(Config.nodeConfig.port, (req, res) => {
            });
            //Log the event to show everything is up and good
            logEvent(LogLevel.INFO, `Server is listening on port ${Config.nodeConfig.port}`);
        });
    } else {

        // http.createServer(app).listen(Config.nodeConfig.port, (req, res) => {
        // });
        // //Log the event to show everything is up and good
        // logEvent(LogLevel.INFO, `Server is listening on port ${Config.nodeConfig.port}`);
    }
});

if (process.env.NODE_ENV === 'test') {
    module.exports = { nextApp, app }
}
