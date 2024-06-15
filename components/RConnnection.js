const net = require('net');

const { structPacket, PACKET_TYPE, destructPacket } = require('./Packet');
const { logError, logEvent, LogLevel } = require('./Log');

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

        this.payload = structPacket({
            packetId: 0x10,
            packetType: PACKET_TYPE.PACKET_AUTH,
            packetBody: this.password
        });

        this.socket = net.connect({
            host: this.serverAddress,
            port: this.serverPort
        });

        this.socket.on('connect', () => {
            logEvent(LogLevel.INFO, `Connected to ${this.socket.remoteAddress}:${this.socket.remotePort}`);
            try {
                this.socket.write(this.payload);
            } catch (err) {
                logError(err);
            }
        })
            .on('data', (data) => { //Check if we connected
                let response = destructPacket(data);
                console.log('response from RCON', response);
                logEvent(LogLevel.DEBUG, `response from RCON login: ${JSON.stringify(data.buffer)}`);
            })
            .on('error', (err) => { //Failed!
                logError(err);
                this.connected = false;
            })
            //These need changed to appropriately react to the events.
            .on('close', () => { console.log('close event') })
            .on('drain', () => { console.log('drain event') })
            .on('end', () => { console.log('end event') })
            .on('lookup', () => { console.log('lookup event') })
            .on('ready', () => { console.log('ready event') })
            .on('timeout', () => { console.log('timeout event') })

    }

    send(command) {
        if (!command) {
            logEvent('Attempted to call command with no command arguement!');
            return;
        }

        const MessageHandler = (data) => {
            let response;
            response = destructPacket(data);
            logEvent(LogLevel.DEBUG, `data from command: ${JSON.stringify(response)}`);
        }

        this.payload = structPacket({
            packetId: 0x11,
            packetType: PACKET_TYPE.PACKET_COMMAND,
            packetBody: command,
        });

        try {
            this.socket.on('data', (data) => MessageHandler(data))
            this.socket.write(this.payload);
        } catch (err) {
            logError(LogLevel.ERROR, `Error attempting to send command ${command}! Logging error...`);
            logError(LogLevel.ERROR, err);
        }
    }
}

module.exports = { RConnection };