const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

/**
 * Log levels used to write information to the log
 */
const LogLevel = {
    ALL: { name: 'ALL', level: -1 },
    DEBUG: { name: 'DEBUG', level: 0 },
    INFO: { name: 'INFO', level: 1 },
    WARN: { name: 'WARN', level: 2 },
    AUDIT: { name: 'AUDIT', level: 255 },
    ERROR: { name: 'ERROR', level: 255 },
}

/**
 * The logging level used to check again when writing logs
 * If not set, prints EVERYTHING!
 */
let messageLevel = LogLevel.ALL;

/**
 * Sets the minimum level required to print to log. If level is invalid, sets to everything.
 * Returns the new value that was set.
 * @param {LogLevel} level Sets the minimum message level to print to the log
 * @returns The new minimum LogLevel assigned
 */
function setMessageLevel(level) {
    logEvent(LogLevel.INFO, 'Attempting to set a new log level...');
    if (!level.name || level.name === '' || (!level.level && level === 0) || Number.isNaN(level.level)) {
        logEvent(LogLevel.WARN, 'Level passed was defaulted! Setting log to default, which will print everything.');
        messageLevel = LogLevel.ALL;
        return LogLevel.ALL;
    }
    logEvent(LogLevel.INFO, `Setting log level from ${messageLevel.name} to ${level.name}`)
    messageLevel = level;
    return level;
}

/**
 * Prints a message to the log with the requested log level
 * @param {LogLevel} logLevel The log level of the event
 * @param {string} message The comment of the message to print to the log
 */
function logEvent(logLevel, message) {
    if (logLevel.level < messageLevel.level) return;
    const logMessage = createMessage(logLevel, message);
    console.log(logMessage);
}

/**
 * Prints a message to the error log. As this is an error, it will always print.
 * @param {string} message The comment of the message to print to the error log
 */
function logError(message) {
    const logMessage = createMessage(LogLevel.ERROR, message);
    console.error(logMessage);
}

/**
 * Crafts a message to print to the log
 * @param {LogLevel} logLevel The log level to print to the log
 * @param {string} message The comment to bt used in the log entry
 * @returns A crafted message to print to the log
 */
function createMessage(logLevel, message) {
    const logTimeStamp = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logID = uuidv4();
    const logMessage = ''.concat(logTimeStamp)
        .concat('\t').concat(logID)
        .concat('\t').concat(logLevel.name)
        .concat('\t').concat(message);

    return logMessage;
}

module.exports = { LogLevel, setMessageLevel, logEvent, logError };