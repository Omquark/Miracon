const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { cwd } = require('node:process');
const { logEvent, LogError, LogLevel, messageLevel, setMessageLevel } = require('./Log');
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
};

const DEFAULTS = {
    minecraftServer: {
        path: '/opt/minecraft',
        address: 'localhost',
        port: 25575,
    },
    log: {
        path: '/var/opt/miracon',
        logFolder: 'logs',
        auditFolder: 'audit',
    },
    nodeConfig: {
        port: 443,
    },
    dbConfig: {
        username: 'miracon',
        url: 'localhost',
        port: 27017,
        dbname: 'miracon',
    }
};

const Config = { ...DEFAULT_CONFIG, init: false };

/**
 * Retrieves the config as it was loaded, or throws if the config is not initialized
 * @returns The config as it currently is, or throws an error if the config is not initialized
 */
function getConfig() {
    if (!Config.init) {
        throw new Error('Config was attempted to be accessed before initialization. Call the init function before calling getConfig.');
    }
    return Config;
}

const HiddenConfig = {

}

function parseConfigData(configString) {
    return configString
        .split(/[\r\n]/)
        .filter(line => line !== '')
        .filter(line => !line.startsWith('#'))
        .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]);
}

function getConfigValue(configData, envName) {
    if (process.env[envName]) return process.env[envName];
    const row = configData.find(line => line[0] === envName);
    if (!row) {
        throw new Error(`Missing config value for ${envName}`);
    }
    return row[1];
}

function normalizeString(value, fallback, warnMessage) {
    if (!value || value === '') {
        logEvent(LogLevel.WARN, warnMessage);
        return fallback;
    }
    return value;
}

function normalizePort(value, fallback, warnMessage) {
    const port = Number.parseInt(value);
    if (!port || Number.isNaN(port) || port > 65535 || port < 1) {
        logEvent(LogLevel.WARN, warnMessage);
        return fallback;
    }
    return port;
}

function moveSecretToHidden(sectionName, keyName) {
    HiddenConfig[sectionName] = { [keyName]: Config[sectionName][keyName] };
    Config[sectionName][keyName] = '***************************';
}

/**
 * Initializes the config from the config.props file
 * @param {boolean} reload If to reload the config file
 * @throws An error if the config cannot be parsed or a required parameter is not defined.
 */
function initConfig(reload = false) {

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

    const configData = parseConfigData(configString);

    Config.minecraftServer.path = normalizeString(
        getConfigValue(configData, 'MINECRAFT_SERVER_PATH'),
        DEFAULTS.minecraftServer.path,
        'Received an empty value for the minecraft server path! I will assume it is at /opt/minecraft.'
    );

    Config.minecraftServer.address = normalizeString(
        getConfigValue(configData, 'MINECRAFT_ADDRESS'),
        DEFAULTS.minecraftServer.address,
        'Received an empty string as the Minecraft server address! Assuming it is running on localhost.'
    );

    Config.minecraftServer.port = normalizePort(
        getConfigValue(configData, 'MINECRAFT_PORT'),
        DEFAULTS.minecraftServer.port,
        'Minecraft port was not valid! Make sure it is a number within 1 to 65535 inclusive. Defaulting to 25575.'
    );

    Config.minecraftServer.password = bytesFromBase64(getConfigValue(configData, 'MINECRAFT_PASSWORD'));
    if (!Config.minecraftServer.password || Config.minecraftServer.password === '') {
        LogError('Minecraft RCON server password was not defined! This is a fatal error and this server will not start!');
        throw new Error('Set the minecraft RCON password in the config to connect!');
    }
    //Move the password to prevent it from being printed in the log.
    moveSecretToHidden('minecraftServer', 'password');

    Config.log.level = LogLevel[getConfigValue(configData, 'LOG_LEVEL')];
    if (!Config.log.level) {
        logEvent(LogLevel.WARN, 'The log level was not defined! This means that everything will be printed to the logs!');
        Config.log.level = LogLevel.ALL;
    }
    logEvent(LogLevel.DEBUG, JSON.stringify(Config.log.level));

    Config.log.path = normalizeString(
        getConfigValue(configData, 'LOG_PATH'),
        DEFAULTS.log.path,
        'Received in invalid value for the LOG_PATH! Defaulting to /var/opt/miracon.'
    );

    Config.log.logFolder = normalizeString(
        getConfigValue(configData, 'LOG_FOLDER'),
        DEFAULTS.log.logFolder,
        'Received an invalid value as the log folder! Defauting to logs.'
    );

    Config.log.auditFolder = normalizeString(
        getConfigValue(configData, 'AUDIT_FOLDER'),
        DEFAULTS.log.auditFolder,
        'Received an invalid value as the audit folder! Defaulting to audit.'
    );

    Config.nodeConfig.port = normalizePort(
        getConfigValue(configData, 'WEB_SERVER_PORT'),
        DEFAULTS.nodeConfig.port,
        'WEB_SERVER_PORT was not valid! Make sure it is a number within 1 to 65535 includsive. Defaulting to 443(HTTPS).'
    );

    Config.nodeConfig.installPath = normalizeString(
        getConfigValue(configData, 'MIRACON_INSTALL_DIRECTORY'),
        cwd(),
        'Received an invalid value for the install folder. Assuming the parent folder of the server'
    );
    if (Config.nodeConfig.installPath === cwd()) {
        logEvent(LogLevel.DEBUG, `installDirectory=${cwd()}`);
    }

    if (process.env.NODE_ENV === 'development' && process.env.MIRACON_INSTALL_DIRECTORY) {
        logEvent(LogLevel.DEBUG, `Using dev env variable for install path`);
        Config.nodeConfig.installPath = process.env.MIRACON_INSTALL_DIRECTORY;
        logEvent(LogLevel.DEBUG, `installDirectory=${Config.nodeConfig.installPath}`);
    }

    Config.dbConfig.username = normalizeString(
        getConfigValue(configData, 'DB_USERNAME'),
        DEFAULTS.dbConfig.username,
        'Received an empty value for the database username! I will assume it is miracon.'
    );

    Config.dbConfig.password = bytesFromBase64(getConfigValue(configData, 'DB_PASSWORD'));
    if (!Config.dbConfig.password || Config.dbConfig.password === '') {
        LogError('The database server was not found! This is a fatal error and the server will not start!');
        throw new Error('Set the database password in the config to connect!');
    }
    //Move the password to prevent it from being printed in the log.
    moveSecretToHidden('dbConfig', 'password');

    Config.dbConfig.url = normalizeString(
        getConfigValue(configData, 'DB_URL'),
        DEFAULTS.dbConfig.url,
        'Received an empty value for the database url! I will assume it is localhost.'
    );

    Config.dbConfig.port = normalizePort(
        getConfigValue(configData, 'DB_PORT'),
        DEFAULTS.dbConfig.port,
        'DB_PORT was not valid! Make sure it is a number within 1 to 65535 inclusive. Defaulting to 27017(MongoDB default port).'
    );

    Config.dbConfig.dbname = normalizeString(
        getConfigValue(configData, 'DB_NAME'),
        DEFAULTS.dbConfig.dbname,
        'Received an empty value for the database name! I will assume it is miracon.'
    );

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

module.exports = { getConfig, initConfig, HiddenConfig };
