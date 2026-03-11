const net = require('net');

const { structPacket, PACKET_TYPE, destructPacket } = require('./Packet');
const { logError, logEvent, LogLevel } = require('./Log');

//Default configurable options for RCON
const DEFAULT_RCON_OPTIONS = {
    password: 'password',
    serverAddress: 'localhost',
    serverPort: 25575,
};

const MAX_PACKET_BYTES = 4096;
const PACKET_OVERHEAD_BYTES = 14; // size + id + type + two null terminators
const MAX_PAYLOAD_BYTES = MAX_PACKET_BYTES - PACKET_OVERHEAD_BYTES;
const RESPONSE_IDLE_MS = 25;

function chunkCommand(command) {
    const buffer = Buffer.from(command, 'ascii');
    if (buffer.length <= MAX_PAYLOAD_BYTES) return [command];

    const chunks = [];
    for (let offset = 0; offset < buffer.length; offset += MAX_PAYLOAD_BYTES) {
        chunks.push(buffer.slice(offset, offset + MAX_PAYLOAD_BYTES).toString('ascii'));
    }
    return chunks;
}

function writePacket(socket, payload) {
    return new Promise((resolve) => {
        const canWrite = socket.write(payload);
        if (canWrite) return resolve();
        socket.once('drain', resolve);
    });
}

/**
 * This class store and tracks the connection made to the Minecraft RCON server
 */
class RConnection {

    /**
     * Sets up connection to login to a minecraft server
     * 
     * @param {RCONOptions} options Options to connect to the minecraft server
     */
    constructor(options) {
        const resolvedOptions = { ...DEFAULT_RCON_OPTIONS, ...(options || {}) };
        ({
            password: this.password = 'password',
            serverAddress: this.serverAddress = 'localhost',
            serverPort: this.serverPort = 25575
        } = resolvedOptions);

        this.connected = false;
        this.socket = null;
        this.payload = '';
    }

    /**
     * Attempts to login to the server with the current password. Make sure this is set before logging in!
     * This will also clear the password after successful/failed attempts. Will reattempt on failure
     */
    login() {
        return new Promise((resolve, reject) => {

            if (this.connected) {
                logEvent(LogLevel.INFO, 'The socket is already open to RCON!');
                return resolve('Socket is already open!')
            }

            logEvent(LogLevel.DEBUG, `Creating Auth packet info serverAddress: ${this.serverAddress}, serverPort: ${this.serverPort}, password: ${this.password}`);

            const authPacket = structPacket({
                packetId: 0x10,
                packetType: PACKET_TYPE.PACKET_AUTH,
                packetBody: this.password,
            });

            this.socket = net.connect({ host: this.serverAddress, port: this.serverPort }, () => {
                this.socket.write(authPacket);
            });



            this.socket.on('error', (err) => {
                logError(`There was an error with the RCON connection: ${JSON.stringify(err)}`);
                return reject(err);
            });

            this.socket.once('data', (data) => {
                const response = destructPacket(data);
                let message;
                logEvent(LogLevel.DEBUG, `Response from server ${JSON.stringify(response)}`);
                if (response.packetId === -1) {
                    message = 'Failed to get connection to RCON. This is likely due to invalid credentials. Check your password and settings and try again.'
                    logError(message);
                    return reject(message);
                } else {
                    message = 'Succeeded in connecting to RCON on configured host. You can now send messages.';
                    logEvent(LogLevel.INFO, message);
                    this.connected = true;
                    return resolve(message)
                }
            });

            this.socket.on('close', (hadError) => {
                const message = `Connection was closed and listeners have been removed.${hadError ? ' There was an error which caused the close' : ''}`;
                logEvent(LogLevel.INFO, message);
                this.socket.removeAllListeners(); //Remove all listeners because the connection no longer exists.
                this.connected = false;
                return;
            });

            this.socket.on('timeout', async () => {
                const message = 'The socket has timed out, the connection will be closed.'
                logEvent(LogLevel.INFO, message);
                await this.socket.destroy();
            });
        });
    }

    send(command) {
        return new Promise((resolve, reject) => {
            if (!command) {
                logEvent(LogLevel.WARN, 'Attempted to call command with no command argument!');
                return reject('Attempted to call command with no command argument!');
            }
            if (!this.socket) {
                return reject('Socket is not connected. Call login before sending commands.');
            }

            const commandChunks = chunkCommand(command);
            const packets = commandChunks.map((chunk) => structPacket({
                packetId: 0x11,
                packetType: PACKET_TYPE.PACKET_COMMAND,
                packetBody: chunk,
            }));
            this.payload = packets[0];

            try {
                const responses = [];
                let idleTimer;

                const finalize = () => {
                    clearTimeout(idleTimer);
                    this.socket.off('data', onData);
                    this.socket.off('error', onError);
                    resolve(responses.join(''));
                };

                const scheduleFinalize = () => {
                    clearTimeout(idleTimer);
                    idleTimer = setTimeout(finalize, RESPONSE_IDLE_MS);
                };

                const onError = (err) => {
                    clearTimeout(idleTimer);
                    this.socket.off('data', onData);
                    this.socket.off('error', onError);
                    return reject(err);
                };

                const onData = (data) => {
                    const response = destructPacket(data);
                    logEvent(LogLevel.DEBUG, `Data from command: ${JSON.stringify(response)}`);
                    if (response.packetId === -1) {
                        clearTimeout(idleTimer);
                        this.socket.off('data', onData);
                        this.socket.off('error', onError);
                        return reject('Failed to get response from RCON. Check your password and settings and try again.');
                    }
                    responses.push(response.packetBody);
                    scheduleFinalize();
                };

                this.socket.on('data', onData);
                this.socket.on('error', onError);

                logEvent(LogLevel.DEBUG, 'Writing data to the socket');
                const writePromise = packets.reduce((promise, packet) => {
                    return promise.then(() => writePacket(this.socket, packet));
                }, Promise.resolve());
                writePromise.catch(onError);
            } catch (err) {
                logError(`Error attempting to send command ${command}! Logging error...`);
                logError(err);
                return reject(err);
            }

            // Use this event for when the socket is empty for sending multipacket messages
            // this.socket.on('drain', () => {
            //     logEvent(LogLevel.DEBUG, 'This can be used to listen for drain events.');
            // })
        });
    }
}

module.exports = { RConnection };
