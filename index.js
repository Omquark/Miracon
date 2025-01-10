const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const { validationResult } = require('express-validator');

const http = require('http');
const nextReq = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = nextReq({ dev });
// const nextApp = nextReq();
const handle = nextApp.getRequestHandler();

const { getConfig, init, HiddenConfig } = require('./components/Config');
const { logEvent, LogLevel, logError } = require('./components/Log');
const { checkAndLoginUser, updatePassword } = require('./components/session/UserLogin');
const { LoginSessionOpts } = require('./components/session/LoginSession');
const { getRoles, updateRoles, addRoles, removeRoles } = require('./components/rbac/Role');
const { getGroups, updateGroups, addGroups, resolveRoles, removeGroups } = require('./components/rbac/Group');
const { getUsers, updateUsers, addUsers, removeUsers } = require('./components/rbac/User');
const { InitUsers } = require('./components/rbac/Init');
const { InitCommands, getCommand } = require('./components/commands/Commands');
const path = require('path');
const { access, constants, writeFile } = require('fs');
const { getCommands } = require('./components/rbac/Command');
const { validateAndSanitizeUser, validateNameId, isValidPassword, isValidUsername, isValidEmail } = require('./components/utility/Validators');
const { InitConsoleCommands } = require('./components/commands/ConsoleCommands');
const { getConsoleCommands } = require('./components/rbac/ConsoleCommand');
const { RConnection } = require('./components/RConnnection');
const { bytesFromBase64 } = require('./components/utility/Utility');
const bcrypt = require('bcrypt');
const { CreateRole, ReadRole, UpdateRole, DeleteRole } = require('./components/endpoint/roles');
const { CreateGroup } = require('./components/endpoint/groups');

nextApp.prepare().then(async () => {

    //Initialize the config and create the RConnection
    init();

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

        if (!rawBody.userinfo || !rawBody.userinfo.oldPassword || !rawBody.userinfo.newPassword) {
            res.status(400).send({ error: 'One of the old password or new password was not provided. Both must be in order to apply a change.' });
            return;
        }

        console.log(JSON.stringify(rawBody));

        const userinfo = {
            username: rawBody.userinfo.username,
            oldPassword: bytesFromBase64(rawBody.userinfo.oldPassword),
            newPassword: bytesFromBase64(rawBody.userinfo.newPassword),
        }

        console.log('userinfo', userinfo);

        if (!isValidPassword(userinfo.oldPassword) || !isValidPassword(userinfo.newPassword)) {
            res.status(400).send({ error: 'The provided password is not valid! A password must be alphanumeric or have the characters !@#$%^&*?\\' });
            return;
        }

        if (!isValidUsername(rawBody.userinfo.username)) {
            res.status(400).send({ error: 'The provided username is not valid! The usernames allowed must be alphanumeric and _' });
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

    const checkCommand = async (commandName, userInfo) => {
        const foundCmd = await getCommand(commandName, userInfo);
        if (foundCmd.error) {
            logEvent(LogLevel.WARN, `There was an error attempting to access command ${commandName}`);
            return { error: foundCmd.error };
        }

        return;
    }

    app.get('/roles', async (req, res) => {
        ReadRole(req, res);
    });

    app.put('/roles', validateNameId, async (req, res) => {
        UpdateRole(req, res);
    });

    app.post('/roles', validateNameId, async (req, res) => {
        CreateRole(req, res);
    });

    app.delete('/roles', validateNameId, async (req, res) => {
        DeleteRole(req, res);
    });

    app.get('/groups', async (req, res) => {
        CreateGroup(req, res);
    });

    app.put('/groups', validateNameId, async (req, res) => {
        const rawBody = req.body;
        const newGroup = {};
        let updated;

        const commandError = await checkCommand('UPDATE_GROUP', req.session.userInfo);
        if (commandError?.error) {
            res.status(403).send({ error: commandError.error });
            return;
        }

        if ((rawBody.name === undefined && rawBody.id === undefined)) {
            logError('A Group was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
            res.status(400).send({ error: 'No ID or name provided with group! I don\'t know which one to upate without an ID or name!' });
            return;
        }

        newGroup.name = rawBody.data.name;
        newGroup.roles = rawBody.data.roles ? rawBody.data.roles : [];
        newGroup.id = rawBody.data.id;

        updated = await updateGroups(newGroup, newGroup);
        res.status(200).send(updated);
    });

    app.post('/groups', validateNameId, async (req, res) => {
        const rawBody = req.body;
        let added;

        const commandError = await checkCommand('CREATE_GROUP', req.session.userInfo);
        if (commandError?.error) {
            res.status(403).send({ error: commandError.error });
            return;
        }

        if ((rawBody.name === undefined)) {
            logError('A Group was attempted to be added is missing an name and ID! At least one of these values must be provided!');
            res.status(400).send({ error: 'No name provided with group! Group must have a name to be added.' });
            return;
        }

        added = await addGroups({ name: rawBody.data.name, roles: rawBody.data.roles });
        res.status(200).send(added);
    });

    app.delete('/groups', validateNameId, async (req, res) => {

        const rawBody = req.body;

        const commandError = await checkCommand('DELETE_GROUP', req.session.userInfo);
        if (commandError?.error) {
            res.status(403).send({ error: commandError.error });
            return;
        }

        if (rawBody.data === undefined || (rawBody.data.name === undefined && rawBody.data.id === undefined)) {
            logError('A group was attempted to be deleted, but must contain either an ID or a name!');
            res.status(400).send({ error: 'No ID or name supplied to remove the group! Specify which group with either an ID or name and try again.' });
            return;
        }

        let foundGroup = await getRoles({ id: rawBody.data.name });
        if (foundGroup[0].critical) {
            logEvent(LogLevel.WARN, `Attempted to remove critical group ${foundGroup[0].name}!`);
            res.status(403).send({ error: `Cannot remove critical group ${foundGroup[0].name}` });
            return;
        }


        const removedGroup = await removeGroups({ name: rawBody.data.name, id: rawBody.data.id });
        res.status(200).send(removedGroup);
    });

    app.get('/users', validateNameId, async (req, res) => {
        const commandError = await checkCommand('READ_USER', req.session.userInfo);

        if (commandError?.error) {
            res.status(403).send({ error: commandError });
            return;
        }

        const pulledUsers = (await getUsers()).map(user => {
            user.password = '*********************';
            return user;
        });
        res.status(200).send(JSON.stringify(pulledUsers));
    });

    app.put('/users', validateNameId, async (req, res) => {
        const rawBody = req.body;

        const commandError = await checkCommand('UPDATE_USER', req.session.userInfo);
        if (commandError?.error) {
            res.status(403).send({ error: commandError });
            return;
        }

        const password = rawBody.data.password ? bytesFromBase64(rawBody.data.password) : '';

        logEvent(LogLevel.DEBUG, 'Verifying data is present');
        if (!rawBody.data || (!rawBody.data.name && !rawBody.data.email && !rawBody.data.id)) {
            logError('A user was attempted to be updated without a username, email, or ID! At least one of these fields must be provided to update');
            res.status(400).send({ error: "No username, email, or id was provided! You must specifiy one of these to update a user." });
            return;
        }

        logEvent(LogLevel.DEBUG, 'Verifying valid username');
        if (rawBody.data.name && !isValidUsername(rawBody.data.name)) {
            logError('Username must only contain alphanumeric characters with underscore');
            res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
            return;
        }

        // logEvent(LogLevel.DEBUG, 'Verifying valid password');
        // if (password && !isValidPassword(password)) {
        //     logError('Password must contain alphanumeric characters or any of _!@#$%^&*?');
        //     res.status(400).send({ error: 'Password must contain alohanumeric characters or any of _!@#$%^&*?' });
        //     return;
        // }

        logEvent(LogLevel.DEBUG, 'Verifying valid email (correct characters, not the email is valid itself)');
        if (rawBody.data.email && !isValidEmail(rawBody.data.email)) {
            logError('Email is not valid, only alphanumeric character and _@. are allowed');
            res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _@. are allowed' });
            return;
        }

        logEvent(LogLevel.DEBUG, 'Attempting to find the current user to update');
        const user = await getUsers({ id: rawBody.data.id, name: rawBody.data.name, email: rawBody.data.email });

        user[0].name = rawBody.data.name ? rawBody.data.name : user.name;
        // user.password = rawBody.data.password ? await bcrypt.hash(rawBody.data.password, 14) : user.password;
        user[0].email = rawBody.data.email ? rawBody.data.email : user.email;
        user[0].roles = rawBody.data.roles ? rawBody.data.roles : user.roles;
        user[0].groups = rawBody.data.groups ? rawBody.data.groups : user.groups;
        user[0].active = rawBody.data.active !== undefined ? rawBody.data.active : user.active;
        user[0].changePassword = rawBody.data.changePassword !== undefined ? rawBody.data.changePassword : user.changePassword;

        logEvent(LogLevel.DEBUG, `Updating user ${JSON.stringify(user)}`);
        logEvent(LogLevel.DEBUG, `rawBody.data ${JSON.stringify(rawBody.data)}`);
        const updatedUser = await updateUsers({ id: user[0].id, name: user[0].name }, user[0]);

        logEvent(LogLevel.DEBUG, `updatedUser: ${JSON.stringify(updatedUser)}`);

        res.status(200).send(JSON.stringify(updatedUser))
    });

    app.post('/users', validateNameId, async (req, res) => {
        const rawBody = req.body;

        const commandError = await checkCommand('CREATE_USER', req.session.userInfo);

        if (commandError?.error) {
            res.status(400).send({ error: commandError.error });
            return;
        }

        console.log('rawBody', rawBody);

        if (rawBody.data === undefined ||
            (
                rawBody.data.name === undefined &&
                rawBody.data.email === undefined &&
                rawBody.data.password === undefined)) {
            logError('A user was attempted to be created without a username, password or email! All of these must be provided to create a new user.')
            res.status(400).send({ error: 'An email, name, and password must be provided to create a user.' });
            return;
        }

        const password = bytesFromBase64(rawBody.data.password);
        console.log(`password: ${password}`);

        if (!isValidUsername(rawBody.data.name)) {
            res.status(400).send({ error: 'Username must only contain alphanumeric characters with underscore' })
            return;
        }

        if (!isValidPassword(password)) {
            res.status(400).send({ error: 'Password must contain alohanumeric characters or any of _!@#$%^&*?\\' });
            return;
        }

        if (!isValidEmail(rawBody.data.email)) {
            res.status(400).send({ error: 'Email is not valid, only alphanumeric chaaracters and _- are allowed' });
            return;
        }

        const newUser = await addUsers({
            name: rawBody.data.name,
            password: await bcrypt.hash(password, 14),
            email: rawBody.data.email,
            preferences: {},
            roles: rawBody.data.roles ? rawBody.data.roles : [],
            groups: rawBody.data.groups ? rawBody.data.groups : [],
            active: rawBody.data.active ? rawBody.data.active : false,
            changePassword: true,
            critical: false,
        });

        newUser.password = '****************';

        res.status(200).send(JSON.stringify(newUser));



        // if (Array.isArray(rawBody)) {
        //     rawBody.forEach(raw => {
        //         if (!raw.id && !raw.name) {
        //             logEvent(LogLevel.DEBUG, 'Attemptd to update a user without an ID or name in an Array!');
        //             logEvent(LogLevel.DEBUG, `raw ${JSON.stringify(raw)}`);
        //             return;
        //         }
        //         newUsers.push({ name: raw.name, roles: raw.roles, id: raw.id });
        //     })
        // }

        // if (!Array.isArray(rawBody)) {
        //     if ((rawBody.name === undefined && rawBody.id === undefined)) {
        //         logError('A User was attempted to be updated is missing an name and ID! At least one of these values must be provided!');
        //         res.status(400).send({ error: 'No ID or name provided with user! I don\'t know which one to upate without an ID or name!' });
        //         return;
        //     }
        //     newUsers.push({ name: rawBody.name, roles: rawBody.roles, id: rawBody.id });
        // }

        // updated = await updateUsers(newUsers, newUsers).map(user => user.password = '***************************');

        // res.status(200).send(updated);
    });

    app.delete('/users', validateNameId, async (req, res) => {
        const rawBody = req.body;

        const commandError = await checkCommand('DELETE_USER');

        if (commandError?.error) {
            res.status(400).send({ error: commandError.error });
            return;
        }

        if (rawBody.data === undefined ||
            (
                rawBody.data.name === undefined &&
                rawBody.data.email === undefined &&
                rawBody.data.password === undefined)) {
            logError('A user was attempted to be created without a username, password or email! All of these must be provided to create a new user.')
            res.status(400).send({ error: 'An email, name, and password must be provided to create a user.' });
            return;
        }

        let foundUser = await getUsers({ id: rawBody.data.name });
        if (foundUser[0].critical) {
            logEvent(LogLevel.WARN, `Attempted to remove critical user ${foundUser[0].name}!`);
            res.status(403).send({ error: `Cannot remove critical user ${foundUser[0].name}` });
            return;
        }

        const user = { name: rawBody.data.name, id: rawBody.data.id, email: rawBody.data.email };

        const removedUser = await removeUsers(user);
        res.status(400).send(removedUser);
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
        if (req.path === '/' || req.path === '/favicon.ico') {
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

        //Start the server!
        http.createServer(app).listen(Config.nodeConfig.port, (req, res) => {
        });

        //Log the event to ensure everything is up and good
        logEvent(LogLevel.INFO, `Server is listening on port ${Config.nodeConfig.port}`);

    });

    //TODO: If the above works, remove this from the config
    // if (Config.nodeConfig.initUsers) {
    //     await InitUsers();
    //     await InitCommands();
    //     await InitConsoleCommands();
    // }
});