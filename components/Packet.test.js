const { PACKET_TYPE, structPacket, destructPacket } = require("./Packet");

describe("Packet", () => {
  it("structures packets with expected header and body", () => {
    const buffer = structPacket({
      packetId: 42,
      packetType: PACKET_TYPE.PACKET_COMMAND,
      packetBody: "list",
    });

    expect(buffer.readInt32LE(0)).toBe(buffer.length - 4);
    expect(buffer.readInt32LE(4)).toBe(42);
    expect(buffer.readInt32LE(8)).toBe(PACKET_TYPE.PACKET_COMMAND);
    expect(buffer.toString("ascii", 12, buffer.length - 2)).toBe("list");
  });

  it("destructures packets and validates size", () => {
    const buffer = structPacket({
      packetId: 7,
      packetType: PACKET_TYPE.PACKET_AUTH,
      packetBody: "secret",
    });

    const parsed = destructPacket(buffer);
    expect(parsed.packetId).toBe(7);
    expect(parsed.packetType).toBe(PACKET_TYPE.PACKET_AUTH);
    expect(parsed.packetBody).toBe("secret");
    expect(parsed.packetValid).toBe(true);
  });

  it("marks invalid packets when size mismatches", () => {
    const buffer = structPacket({
      packetId: 1,
      packetType: PACKET_TYPE.PACKET_COMMAND,
      packetBody: "say hi",
    });

    buffer.writeInt32LE(0, 0);
    const parsed = destructPacket(buffer);
    expect(parsed.packetValid).toBe(false);
  });
});
