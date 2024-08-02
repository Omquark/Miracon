const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const { validationResult } = require('express-validator');

const http = require('http');
const nextReq = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = nextReq({ dev });
const handle = nextApp.getRequestHandler();

const { getConfig, init } = require('./components/Config');
const { logEvent, LogLevel, logError } = require('./components/Log');
const { checkAndLoginUser, bytesFromBase64, updatePassword } = require('./components/session/UserLogin');
const { LoginSessionOpts } = require('./components/session/LoginSession');
const { getRoles, updateRoles } = require('./components/rbac/Role');
const { getGroups, updateGroups, resolveRoles } = require('./components/rbac/Group');
const { getUsers, updateUsers } = require('./components/rbac/User');
const { InitUsers } = require('./components/rbac/Init');
const { InitCommands, getCommand } = require('./components/commands/Commands');
const path = require('path');
const { access, constants } = require('fs');
const { getCommands } = require('./components/rbac/Command');
const { validateAndSanitizeUser, validateNameId, isValidPassword, isValidUsername } = require('./components/utility/Validators');
const { InitConsoleCommands } = require('./components/commands/ConsoleCommands');
const { getConsoleCommands } = require('./components/rbac/ConsoleCommand');
const { RConnection } = require('./components/RConnnection');

nextApp.prepare().then(async () => {

    //Initialize the config and create the RConnection
    init();
    const rcon = new RConnection({
        password: 'password',
        serverAddress: 'minecraft',
        serverPort: 25575
    });

    //Get the config
    const Config = getConfig();

    //Limit the body parser to prevent ovesized packets. This is from the front end
    const bodyParserJsonOptions = {
        limit: '1kb',
    }

    //Setup the middleware
    app.use(bodyParser.json(bodyParserJsonOptions));
    app.use(session(LoginSessionOpts));

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
        userinfo.password = rawBody.password;

        logEvent(LogLevel.DEBUG, `userinfo: ${JSON.stringify(userinfo)}`);
        if (!isValidPassword(bytesFromBase64(userinfo.password))) {
            res.status(400).send({ error: 'Password must be alphanumeric and can contain any of !@#$%^&*?\\' });
            return;
        }
        if (!userinfo.username || !userinfo.password) {
            res.status(400).send({ error: 'No username or password provided' });
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
            res.status(401).send({ error: 'User is not logged in.' });
            return;
        }

        const rawBody = req.body;
        if (!rawBody.userinfo && !rawBody.userinfo.oldPassword &&
            !isValidPassword(rawBody.userinfo.oldPassword) ||
            !rawBody.userinfo && !rawBody.userinfo.newPassword &&
            !isValidPassword(rawBody.userinfo.newPassword)) {
            res.status(400).send({ error: 'Password is not valid, must be alphanumeric or any of !@#$%^&*?\\' });
            return;
        }

        if (!rawBody?.userinfo?.username || !isValidUsername(rawBody.userinfo.username)) {
            logEvent(LogLevel.AUDIT, 'A user attempted to change a password, but did not have a session or userinfo, user has been logged out and the session destroyed.');
            logEvent(LogLevel.AUDIT, 'I am also blacklisting this IP for 15 minutes to prevent any further attempts');
            logEvent(LogLevel.AUDIT, `userinfo: ${rawBody?.userinfo}, req.session.userinfo: ${req.session.userInfo}`);
            req.session.destroy();
            res.redirect('/');
            return;
        }

        const userinfo = {
            username: req.session.userInfo.name,
            oldPassword: rawBody.userinfo.oldPassword,
            newPassword: rawBody.userinfo.newPassword,
        }

        const message = await updatePassword(userinfo);
        res.status(message.error ? 400 : 200).send(message)
    });

    //Validates login to not allow not logged in users through
    app.all(/\/roles|\/groups|\/users|\/admin|\/commands|\/console/, async (req, res, next) => {
        const userInfo = req.session.userInfo;

        logEvent(LogLevel.DEBUG, `process.env.NODE_ENV = ${process.env.NODE_ENV}`);

        if (!userInfo) {
            res.status(401).send({ error: 'User is not logged in' });
            return;
        }

        const user = await getUsers({ name: req.session.userInfo.name })
        if (!user[0].name || !user[0].id) {
            res.status(401).send({ error: 'User could not be found' })
            return;
        }
        const testRoles = await resolveRoles(user);

        if (!testRoles || !Array.isArray(testRoles) || testRoles.length === 0) {
            res.status(403).send({ error: 'No roles could be found for user' });
            return;
        }
        next();
    });

    //Used to execute get commands from the DB
    app.get('/commands', async (req, res) => {
        const foundCmd = await getCommand('READ_COMMAND', req.session.userInfo);

        if (foundCmd.error) {
            logEvent(LogLevel.WARN, 'There was an error attempting to read the commands!');
            res.status(403).send({ error: foundCmd.error });
            return;
        }
        res.status(200).send(JSON.stringify(await getCommands()));
    });

    //Used to get console commands
    app.get('/console', async (req, res) => {
        const commands = await getConsoleCommands();
        res.status(200).send(commands);
    });

    //Used to execute comands through RCon
    app.put('/console', async (req, res) => {
        const commandName = req.body?.name?.replace(/^![\w_]+$/, '');
        logEvent(LogLevel.INFO, `Attempting to execute command ${commandName}`);
        if (!commandName) {
            logEvent(LogLevel.INFO, `Command ${commandName} is not a valid command.`);
            res.status(400).send({ error: 'Attempted to execute a blank or invalid command!' });
            return;
        }

        let firstSpace = commandName.indexOf(' ');
        command = (await getConsoleCommands({ name: commandName.substring(0, firstSpace === -1 ? commandName.length : firstSpace).trim() }))[0];
        if (!command) {
            logEvent(LogLevel.INFO, `Command ${commandName} could not be found in the database.`);
            res.status(404).send({ error: 'Command cannot be found!' });
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
            res.status(400).send({ error: response });
            return;
        }

        res.status(200).send({ message: response });
    });

    //Used to get roles
    app.get('/roles', async (req, res) => {
        const foundCmd = await getCommand('READ_ROLE', req.session.userInfo);

        if (foundCmd.error) {
            logEvent(LogLevel.WARN, 'There was an error attempting to read the roles!');
            res.status(403).send({ error: foundCmd.error });
            return;
        }
        res.status(200).send(JSON.stringify(await getRoles()));
    });

    //Used to update the roles
    app.post('/roles', validateNameId, async (req, res) => {
        const rawBody = req.body;

        const newRoles = {};
        let updated;
        //TODO: This needs fixed. We can expect to not receive an array from the front end
        //In turn, the update also needs fixed, the old variable should only be id
        //At some point, this will need updated to allow for all CRUD actions!
        if (!Array.isArray(rawBody)) {
            logEvent(LogLevel.DEBUG, `rawBody is ${JSON.stringify(rawBody)}`)
            if ((rawBody.data.name === undefined || rawBody.data.id === undefined)) {
                logError('A Role was attempted to be updated without an ID! This ID is required to update any roles!');
                res.status(400).send({ error: 'No ID provided with role! I don\'t know which one to upate without an ID!' });
                return;
            }
            newRoles.name = rawBody.data.name;
            newRoles.id = rawBody.data.id;
        }

        updated = await updateRoles({ id: newRoles.id }, newRoles);

        res.status(200).send(updated);
    });

    //Used to get the groups
    app.get('/groups', async (req, res) => {
        const pulledGroups = await getGroups()
        res.status(200).send(JSON.stringify(pulledGroups));
    });

    //Used to update the groups
    app.post('/groups', validateNameId, (req, res) => {
        const rawBody = req.body;
        const newGroups = [];
        let updated;

        logEvent(LogLevel.DEBUG, 'Hitting endpoint@/admin/groups')

        if (!Array.isArray(rawBody)) {
            if ((rawBody.name === undefined && rawBody.id === undefined)) {
                logError('A Group was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
                res.status(400).send({ error: 'No ID or name provided with group! I don\'t know which one to upate without an ID or name!' });
                return;
            }
            newGroups.push({ name: rawBody.name, roles: rawBody.roles, id: rawBody.id });
        }

        updated = updateGroups(newGroups, newGroups);
        res.status(200).send(updated);
    });

    //Used to get the users
    app.get('/users', async (req, res) => {
        const pulledUsers = (await getUsers()).map(user => {
            user.password = '*********************';
            return user;
        });
        res.status(200).send(JSON.stringify(pulledUsers));
    });

    //Used to update the users
    app.post('/users', validateNameId, async (req, res) => {
        const rawBody = req.body;
        const newUsers = [];
        let updated;

        logEvent(LogLevel.DEBUG, 'Hitting endpoint@/admin/users')
        if (Array.isArray(rawBody)) {
            rawBody.forEach(raw => {
                if (!raw.id && !raw.name) {
                    logEvent(LogLevel.DEBUG, 'Attemptd to update a user without an ID or name in an Array!');
                    logEvent(LogLevel.DEBUG, `raw ${JSON.stringify(raw)}`);
                    return;
                }
                newUsers.push({ name: raw.name, roles: raw.roles, id: raw.id });
            })
        }

        if (!Array.isArray(rawBody)) {
            if ((rawBody.name === undefined && rawBody.id === undefined)) {
                logError('A User was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
                res.status(400).send({ error: 'No ID or name provided with user! I don\'t know which one to upate without an ID or name!' });
                return;
            }
            newUsers.push({ name: rawBody.name, roles: rawBody.roles, id: rawBody.id });
        }

        updated = (await updateUsers(newUsers, newUsers)).map(user => user.password = '***************************');

        res.status(200).send(updated);
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
            //express.static(path.join(__dirname, decodeURI(reqPath))); //(req, res, next);P
            return handle(req, res);
        });
    });

    //Used to retrieve any pages from the admin sub diesctory
    app.get(/^\/admin/, (req, res) => {
        return handle(req, res);
    });

    //Used to serve non-admin pages
    app.all('/', (req, res, next) => {
        if (req.path.includes('admin')) {
            if (!req.session.userInfo) {
                logEvent(LogLevel.INFO, `Attempt to access admin page without being logged in! Details: ${JSON.stringify(req.body, undefined, 2)}`)
                res.status(401).send({ error: 'You must be logged in to access this page' });
                return;
            }
            if (!req.session.userInfo.roles || req.session.userInfo.roles.length === 0) {
                res.status(401).send({ error: 'You are logged in, but you do not have access granted. Talk to the server owner about your access.' });
                return;
            }
        } else if (req.path !== '/') {
            next();
        }
        logEvent(LogLevel.DEBUG, 'Handing off to next to handle requst');
        logEvent(LogLevel.DEBUG, `req.path ${req.path}`);
        if (req.path === '/') {
            // logEvent(LogLevel.INFO, `404 error hit, details: ${JSON.stringify(req, undefined, 2)}`);
            handle(req, res);
            // res.status(404).send({ error: 'Page cannot be found' });
            return;
        }
        next();
    });

    //If the path could not be found
    app.all('*', (req, res) => {
        logEvent(LogLevel.INFO, `404 error hit, trying to access page: ${req.path}`);
        res.status(404).send({ error: 'Page not found' });
        // handle(req, res);
    });

    //Initializes the DB if the initializer is set from the config
    if (Config.nodeConfig.initUsers) {
        await InitUsers();
        await InitCommands();
        await InitConsoleCommands();
    }

    //Start the server!
    http.createServer(app).listen(Config.nodeConfig.port, (req, res) => {
    });

    //Log the event to ensure everything is up and good
    logEvent(LogLevel.INFO, `Server is listening on port ${Config.nodeConfig.port}`);

});