const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const nextReq = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = nextReq({ dev });
const handle = nextApp.getRequestHandler();

const { getConfig, init } = require('./components/Config');
const { logEvent, LogLevel, logError } = require('./components/Log');
const { checkAndLoginUser } = require('./components/session/UserLogin');
const { LoginSessionOpts } = require('./components/session/LoginSession');
const { getRoles, updateRoles } = require('./components/rbac/Role');
const { getGroups, updateGroups, resolveRoles } = require('./components/rbac/Group');
const { getUsers, updateUsers } = require('./components/rbac/User');
const { InitUsers } = require('./components/rbac/Init');
const { InitCommands, getCommand } = require('./components/rbac/Commands');
const { hostname } = require('os');

nextApp.prepare().then(() => {

    init();

    const Config = getConfig();

    const bodyParserJsonOptions = {
        limit: '1kb',
    }

    const bodyParserJson = bodyParser.json(bodyParserJsonOptions);

    app.use(cors());

    app.use(session(LoginSessionOpts));

    app.post('/login', bodyParserJson, async (req, res) => {
        const userinfo = req.body;
        const pulledInfo = await checkAndLoginUser(userinfo);

        if (pulledInfo.error) {
            res.status(401).send(pulledInfo);
            return;
        }

        req.session.userInfo = pulledInfo;
        req.session.save();
        res.status(200).send(pulledInfo);
    });

    app.use('/logout', (req, res) => {
        logEvent(LogLevel.DEBUG, 'Logging out');
        req.session.destroy();
        res.redirect(hostname());
    });

    app.use(/\/roles|\/groups|\/users|\/admin/, (req, res, next) => {
        const userInfo = req.session.userInfo;

        if (!userInfo) {
            res.status(401).send({ error: 'User is not logged in' });
            return;
        }

        const user = getUsers({ name: req.session.userInfo.name })
        if (!user[0].name || !user[0].id) {
            res.status(401).send({ error: 'User could not be found' })
            return;
        }
        const testRoles = resolveRoles(user);

        if (!testRoles || !Array.isArray(testRoles) || testRoles.length === 0) {
            res.status(403).send({ error: 'No roles could be found for user' });
            return;
        }
        next();
    });

    app.get('/roles', (req, res) => {
        const foundCmd = getCommand('READ_ROLE', req.session.userInfo);

        if (foundCmd.error) {
            logEvent(LogLevel.WARN, 'There was an error attempting to read the roles!');
            res.status(403).send({ error: foundCmd.error });
            return;
        }
        res.status(200).send(JSON.stringify(getRoles()));
    });

    app.post('/roles', bodyParserJson, (req, res) => {
        const rawBody = req.body;

        const newRoles = [];
        let updated;

        if (Array.isArray(rawBody)) {
            rawBody.forEach(raw => {
                if (!raw.id) {
                    logEvent(LogLevel.DEBUG, 'Attemptd to update a role without an ID in an Array!');
                    logEvent(LogLevel.DEBUG, `raw ${JSON.stringify(raw)}`);
                    return;
                }
                if (!raw.name) {
                    logEvent(LogLevel.DEBUG, 'Attemptd to update a role without a name in an Array!')
                    logEvent(LogLevel.DEBUG, `raw ${JSON.stringify(raw)}`);
                    return;
                }
                newRoles.push({ name: raw.name, id: raw.id });
            })
        }

        if (!Array.isArray(rawBody)) {
            if ((rawBody.name === undefined || rawBody.id === undefined)) {
                logError('A Role was attempted to be updated without an ID! This ID is required to update any roles!');
                res.status(400).send({ error: 'No ID provided with role! I don\'t know which one to upate without an ID!' });
                return;
            }
            newRoles.push({ name: rawBody.name, id: rawBody.id });
        }

        updated = updateRoles(newRoles, newRoles);

        res.status(200).send(updated);
    });

    app.get('/groups', (req, res) => {
        const pulledGroups = getGroups()
        res.status(200).send(JSON.stringify(pulledGroups));
    });

    app.post('/groups', bodyParserJson, (req, res) => {
        const rawBody = req.body;
        const newGroups = [];
        let updated;

        logEvent(LogLevel.DEBUG, 'Hitting endpoint@/admin/groups')
        if (Array.isArray(rawBody)) {
            rawBody.forEach(raw => {
                if (!raw.id && !raw.name) {
                    logEvent(LogLevel.DEBUG, 'Attemptd to update a group without an ID or name in an Array!');
                    logEvent(LogLevel.DEBUG, `raw ${JSON.stringify(raw)}`);
                    return;
                }
                newGroups.push({ name: raw.name, roles: raw.roles, id: raw.id });
            })
        }

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

    app.get('/users', (req, res) => {
        const pulledUsers = getUsers().map(user => {
            user.password = '*********************';
            return user;
        });
        res.status(200).send(JSON.stringify(pulledUsers));
    });

    app.post('/users', bodyParserJson, (req, res) => {
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

        updated = updateUsers(newUsers, newUsers).map(user => user.password = '***************************');

        res.status(200).send(updated);
    });

    app.use('/', (req, res) => {
        if (req.path.includes('admin')) {
            if (!req.session.userInfo) {
                logEvent(LogLevel.INFO, 'Attempt to access admin page without being logged in! Details:')
                res.status(401).send({ error: 'You must be logged in to acces this page' });
                return;
            }
            if (!req.session.userInfo.roles || req.session.userInfo.roles.length === 0) {
                res.status(401).send({ error: 'You are logged in, but you do not have access granted. Talk to the server owner about your access.' });
                return;
            }
        }
        logEvent(LogLevel.DEBUG, 'Handing off to next to handle requst');
        return handle(req, res)
    })

    if (Config.nodeConfig.initUsers) {
        InitUsers();
        InitCommands();
    }

    http.createServer(app).listen(Config.nodeConfig.port, (req, res) => {
    });

    logEvent(LogLevel.INFO, `Server is listening on port ${Config.nodeConfig.port}`);

});