const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { logEvent, LogError, LogLevel, messageLevel, setMessageLevel } = require('./Log');
const { cwd } = require('node:process');
const { bytesFromBase64 } = require('./utility/Utility');

const DEFAULT_CONFIG = {

    init: false,
    minecraftServer: {
        path: '/opt/minecraft',
        address: 'localhost',
        port: '25575',
        password: 'cGFzc3dvcmQK' //64-bit encoded
    },
    log: {
        level: 'ALL',
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
        dbname: 'miracon',
        url: 'localhost',
        port: 27017,
        username: 'miracon',
        password: 'bWlyYWNvbg=='
    }
}

const Config = { ...DEFAULT_CONFIG, init: false }

function getConfig() {
    if (!Config.init) {
        throw new Error('Config was attempted to be accessed before initialization. Call the init function before calling getConfig.');
    }
    return Config;
}

const HiddenConfig = {

}

function init(reload) {

    if (Config.init && !reload) return Config;

    if (reload) logEvent(LogLevel.INFO, 'Re-initializing the configuration. This will cause a restart in the server!');
    else logEvent(LogLevel.INFO, 'Initializing the configuration for miracon');

    const configPath = !process.env.NODE_ENV || process.env.NODE_ENV === 'production' ? '/etc/opt/miracon' : '.\\config';
    const configFile = 'config.prop';
    let configString;

    try {
        configString = readFileSync(join(configPath, configFile), 'utf-8');
    } catch (err) {
        logEvent(LogLevel.ERROR, err);
        throw new Error(`Unable to find configuration file @${join(configPath, configFile)}`);
    }

    const configData = configString.split(/[\r\n]/)
        .filter(line => line !== '')
        .filter(line => !line.startsWith('#'))
        .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]);

    const getEnvVar = (envName) => {
        return process.env[envName] ? process.env[envName] : configData.find(line => line[0] === envName)[1];
    }

    Config.minecraftServer.path = getEnvVar('MINECRAFT_SERVER_PATH');
    if (!Config.minecraftServer.path || Config.minecraftServer.path === '') {
        logEvent(LogLevel.WARN, 'Received an empty value for the minecraft server path! I will assume it is at /opt/minecraft.');
        Config.minecraftServer.path = '/opt/minecraft';
    }


    Config.minecraftServer.address = getEnvVar('MINECRAFT_ADDRESS');
    if (!Config.minecraftServer.address || Config.minecraftServer.address === '') {
        logEvent(LogLevel.WARN, 'Received an empty string as the Minecraft server address! Assuming it is running on localhost.')
        Config.minecraftServer.address = 'localhost';
    }

    Config.minecraftServer.port = Number.parseInt(getEnvVar('MINECRAFT_PORT'));
    if (!Config.minecraftServer.port || Number.isNaN(Config.minecraftServer.port) ||
        Config.minecraftServer.port > 65535 || Config.minecraftServer.port < 1) {
        logEvent(LogLevel.WARN, 'Minecraft port was not valid! Make sure it is a number within 1 to 65535 inclusive. Defaulting to 25575.')
        Config.minecraftServer.port = 25575;
    }

    Config.minecraftServer.password = bytesFromBase64(getEnvVar('MINECRAFT_PASSWORD'));
    if (!Config.minecraftServer.password || Config.minecraftServer.password === '') {
        LogError('Minecraft RCON server password was not defined! This is a fatal error and this server will not start!');
        throw new Error('Set the minecraft RCON password in the config to connect!');
    }
    //Move the password to prevent it from being printed in the log.
    HiddenConfig.minecraftServer = { password: Config.minecraftServer.password };
    Config.minecraftServer.password = '***************************';

    Config.log.level = LogLevel[getEnvVar('LOG_LEVEL')];
    if (!Config.log.level) {
        logEvent(LogLevel.WARN, 'The log level was not defined! This means that everything will be printed to the logs!');
        Config.log.level = LogLevel.ALL;
    }
    logEvent(LogLevel.DEBUG, JSON.stringify(Config.log.level));

    Config.log.path = getEnvVar('LOG_PATH');
    if (!Config.log.path || Config.log.path === '') {
        logEvent(LogLevel.WARN, 'Received in invalid value for the LOG_PATH! Defaulting to /var/opt/miracon.')
        Config.log.path = '/var/opt/miracon';
    }

    Config.log.logFolder = getEnvVar('LOG_FOLDER');
    if (!Config.log.logFolder || Config.log.logFolder === '') {
        logEvent(LogLevel.WARN, 'Received an invalid value as the log folder! Defauting to logs.')
        Config.log.logFolder = 'logs';
    }

    Config.log.auditFolder = getEnvVar('AUDIT_FOLDER');
    if (!Config.log.auditFolder || Config.log.auditFolder === '') {
        logEvent(LogLevel.WARN, 'Received an invalid value as the audit folder! Defaulting to audit.')
        Config.log.auditFolder = 'audit';
    }

    Config.nodeConfig.port = getEnvVar('WEB_SERVER_PORT');
    if (!Config.nodeConfig.port || Number.isNaN(Config.nodeConfig.port) ||
        Config.nodeConfig.port > 65535 || Config.nodeConfig.port < 1) {
        logEvent(LogLevel.WARN, 'WEB_SERVER_PORT was not valid! Make sure it is a number within 1 to 65535 includsive. Defaulting to 443(HTTPS).')
        Config.nodeConfig.port = 443;
    }

    Config.nodeConfig.installPath = getEnvVar('MIRACON_INSTALL_DIRECTORY');
    if (!Config.nodeConfig.installPath || Config.nodeConfig.installPath === '') {
        logEvent(LogLevel.WARN, 'Received an invalid value for the install folder. Assuming the parent folder of the server')
        Config.nodeConfig.installPath = cwd();
        logEvent(LogLevel.DEBUG, `installDirectory=${cwd()}`);
    }

    Config.nodeConfig.initUsers = Number.parseInt(getEnvVar('INIT_USERS'));
    if (Config.nodeConfig.initUsers === undefined || Number.isNaN(Config.nodeConfig.initUsers) ||
        (Config.nodeConfig.initUsers !== 0 && Config.nodeConfig.initUsers !== 1)) {
        logEvent(LogLevel.WARN, 'Received an invalid value if to initialize users, this is a fatal error! This value must either be 0(No) or 1(Yes). This must be corrected to continue!');
        throw new Error('Invalid value for INIT_USERS! This must be either 1 to init or 0 to skip and declared in the config.');
    }

    if (process.env.NODE_ENV === 'development' && process.env.MIRACON_INSTALL_DIRECTORY) {
        logEvent(LogLevel.DEBUG, `Using dev env variable for install path`);
        Config.nodeConfig.installPath = process.env.MIRACON_INSTALL_DIRECTORY;
        logEvent(LogLevel.DEBUG, `installDirectory=${Config.nodeConfig.installPath}`);
    }

    Config.dbConfig.username = getEnvVar('DB_USERNAME');
    if (!Config.dbConfig.username || Config.dbConfig.username === '') {
        logEvent(LogLevel.WARN, 'Received an empty value for the database username! I will assume it is miracon.');
        Config.dbConfig.username = 'miracon';
    }

    Config.dbConfig.password = bytesFromBase64(getEnvVar('DB_PASSWORD'));
    if (!Config.dbConfig.password || Config.dbConfig.password === '') {
        LogError('The database server was not found! This is a fatal error and the server will not start!');
        throw new Error('Set the database password in the config to connect!');
    }
    //Move the password to prevent it from being printed in the log.
    HiddenConfig.dbConfig = { password: Config.dbConfig.password };
    Config.dbConfig.password = '***************************';

    Config.dbConfig.url = getEnvVar('DB_URL');
    if (!Config.dbConfig.url || Config.dbConfig.url === '') {
        logEvent(LogLevel.WARN, 'Received an empty value for the database url! I will assume it is localhost.');
        Config.dbConfig.url = 'localhost';
    }

    Config.dbConfig.port = getEnvVar('DB_PORT');
    if (!Config.dbConfig.port || Number.isNaN(Config.dbConfig.port) ||
        Config.dbConfig.port > 65535 || Config.dbConfig.port < 1) {
        logEvent(LogLevel.WARN, 'DB_PORT was not valid! Make sure it is a number within 1 to 65535 inclusive. Defaulting to 27017(MongoDB default port).')
        Config.dbConfig.port = 27017;
    }

    Config.dbConfig.dbname = getEnvVar('DB_NAME');
    if (!Config.dbConfig.dbname || Config.dbConfig.dbname === '') {
        logEvent(LogLevel.WARN, 'Received an empty value for the database name! I will assume it is miracon.');
        Config.dbConfig.dbname = 'miracon';
    }

    logEvent(LogLevel.INFO, 'Setting the log level.');
    setMessageLevel(Config.log.level);

    Config.init = true;

    printConfig();
}

function printConfig() {
    logEvent(LogLevel.DEBUG, JSON.stringify(Config));

    /**
     * Prints all objects properties keys and values, as well as sub objects.
     * Used to print the configuration information at start up.
     * This will also print the 'path' of the property e.g. Config.minecraftServer.port
     * @param {Object} obj Any object
     * @param {string, Array} keyPath Path to print when printing the properties of obj. Strings are converted to Array.length === 1.
     */
    const recursePath = (obj, keyPath) => {

        if (typeof (keyPath) === 'string') {
            keyPath = [keyPath];
        }
        Object
            .keys(obj)
            .forEach(key => {
                if (Object.keys(obj[key]).length > 0 && typeof (obj[key]) !== 'string') {
                    keyPath.push(key);
                    recursePath(obj[key], keyPath);
                    keyPath.pop();
                } else {
                    const fullPath = keyPath.join('.').concat(`.${key}`);
                    logEvent(LogLevel.INFO, `${fullPath}=${obj[key]}`);
                }
            })
    }
    recursePath(Config, 'Config');
}

module.exports = { getConfig, init, HiddenConfig };