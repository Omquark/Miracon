const PACKET_TYPE = {
    PACKET_FAILED: -1,
    PACKET_COMMAND_RESPONSE: 0,
    PACKET_COMMAND: 2,
    PACKET_AUTH: 3,
}

/**
 * Packet info used to structure and destructure packets.
 * @property {Number} packetId The packet ID of this packet
 * @property {Number} packetType The PACKET_TYPE of this packet
 * @property {string} packetBody The body of this packet
 * @property {boolean} valid Used during the destructure, marks if the size is valid against the packet reported size
 * This will still destructure the packet regardless, and depends on the caller to do what it wants with the info.
 */
const PACKET_INFO = {
    packetId: 0,
    packetType: 0,
    packetBody: '',
    PacketValid: true,
}

/**
 * Structures a packet to use for RCON. The packet can be written directly to a generic socket.
 * @param {PACKET_INFO} packetInfo The packet info to structure into a packet for RCON
 * @returns The fully structured Packet.
 */
function structPacket(packetInfo){
    const { packetId, packetType } = packetInfo;

    //If packets fail, check to make sure the body is not being appened with non-whitspace characters!
    const packetBody = packetInfo.packetBody ? packetInfo.packetBody.trim() : '';

    const payloadLength = packetBody ? Buffer.byteLength(packetBody, 'ascii') : 0;
    const size = 4 + 4 + 4 + payloadLength + 2; //ID + Type + Payload + 2 null butes

    const buffer = Buffer.alloc(size);

    buffer.writeInt32LE(size - 4, 0); //Packet size minus the size field
    buffer.writeInt32LE(packetId, 4); //packetID
    buffer.writeInt32LE(packetType, 8); //packetType

    //Write the packet payload
    if(packetBody){
        buffer.write(packetBody, 12, payloadLength, 'ascii');
    }

    //Terminator
    buffer.writeInt16LE(0x00, 12 + payloadLength);

    return buffer;
}

/**
 * Reads the packet passed and returns the ID, type, and body contained.
 * This also validates the size against 
 * @param {Buffer} buffer A Buffer containing the packet info
 * @returns {PACKET_INFO} A PACKET_INFO representing this packet. Also marks packetValid based on size matching.
 */
function destructPacket(buffer){
    
    let id, type, body, valid;

    const size = buffer.length - 4;

    valid = size === buffer.readInt32LE();
    id = buffer.readInt32LE(4);
    type = buffer.readInt32LE(8);
    body = buffer.toString('utf-8', 12, buffer.length - 2);

    valid &= buffer.readInt32LE(size - 4);

    return { packetId: id, packetType: type, packetBody: body, packetValid: valid };
}

module.exports = { PACKET_TYPE, PACKET_INFO, structPacket, destructPacket };