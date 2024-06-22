const net = require('net');

const { structPacket, PACKET_TYPE, destructPacket } = require('./Packet');
const { logError, logEvent, LogLevel } = require('./Log');
const { getRoles } = require('./rbac/Role');

//Default configurable options for RCON
const RCONOptions = {
    password: 'password',
    serverAddress: 'localhost',
    serverPort: '25575',
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
        if (!options) {
            options = new RCONOptions;
        }
        ({
            password: this.password = 'password',
            serverAddress: this.serverAddress = 'minecraft',
            serverPort: this.serverPort = 25575
        } = options);

        this.connected = false;
        this.socket = undefined;
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

            const authPacket = structPacket({
                packetId: 0x10,
                packetType: PACKET_TYPE.PACKET_AUTH,
                packetBody: this.password,
            });

            this.socket = net.connect({ host: this.serverAddress, port: this.serverPort }, () => {
                this.socket.write(authPacket);
            });



            this.socket.on('error', (err) => {
                logError(`There was an error with th eRCON connection: ${JSON.stringify(err)}`);
                return reject(err);
            })

            this.socket.once('data', (data) => {
                const response = destructPacket(data);
                let message;
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
                const message = `Connection was closed and listeners have been removed.' + ${hadError ? ' There was an error which caused the close' : ''}`;
                logEvent(LogLevel.INFO, message);
                this.socket.removeAllListeners(); //Remove all listeners because the connection no longer exists.
                this.connected = false;
                return;
            });

            this.socket.on('timeout', async () => {
                const message = 'The socket has timed out, the conenction will be closed.'
                logEvent(LogLevel.INFO, message);
                await this.socket.destroy();
            });
        });
    }

    send(command) {
        return new Promise((resolve, reject) => {
            if (!command) {
                logEvent('Attempted to call command with no command arguement!');
                return reject('Attempted to call command with no command arguement!');
            }


            this.payload = structPacket({
                packetId: 0x11,
                packetType: PACKET_TYPE.PACKET_COMMAND,
                packetBody: command,
            });

            try {
                this.socket.on('data', (data) => {
                    let response;
                    response = destructPacket(data);
                    logEvent(LogLevel.DEBUG, `Data from command: ${JSON.stringify(response)}`);
                    resolve(response.packetBody);
                });
                logEvent(LogLevel.DEBUG, 'Writing data to the socket');
                this.socket.write(this.payload);
            } catch (err) {
                logError(LogLevel.ERROR, `Error attempting to send command ${command}! Logging error...`);
                logError(LogLevel.ERROR, err);
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