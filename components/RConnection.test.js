const { EventEmitter } = require("events");

jest.mock("net", () => ({
  connect: jest.fn(),
}));

const net = require("net");
const { structPacket, PACKET_TYPE } = require("./Packet");
const { RConnection } = require("./RConnection");

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.writes = [];
    this.destroy = jest.fn();
  }

  write(payload) {
    this.writes.push(payload);
    return true;
  }
}

describe("RConnection", () => {
  let socket;

  beforeEach(() => {
    jest.clearAllMocks();
    socket = null;
  });

  it("logs in when auth succeeds", async () => {
    net.connect.mockImplementation((_options, callback) => {
      socket = new FakeSocket();
      if (callback) process.nextTick(callback);
      return socket;
    });

    const connection = new RConnection({
      password: "secret",
      serverAddress: "localhost",
      serverPort: 25575,
    });

    const loginPromise = connection.login();
    const response = structPacket({
      packetId: 1,
      packetType: PACKET_TYPE.PACKET_AUTH,
      packetBody: "",
    });
    process.nextTick(() => socket.emit("data", response));

    await expect(loginPromise).resolves.toMatch("Succeeded in connecting to RCON");
  });

  it("splits outgoing commands beyond packet size and aggregates responses", async () => {
    jest.useFakeTimers();
    net.connect.mockImplementation((_options, callback) => {
      socket = new FakeSocket();
      if (callback) process.nextTick(callback);
      return socket;
    });

    const connection = new RConnection({ password: "secret" });
    const loginPromise = connection.login();
    process.nextTick(() => {
      socket.emit("data", structPacket({
        packetId: 1,
        packetType: PACKET_TYPE.PACKET_AUTH,
        packetBody: "",
      }));
    });
    jest.runAllTicks();
    await loginPromise;

    const longCommand = "a".repeat(9000);
    const sendPromise = connection.send(longCommand);

    await Promise.resolve();
    await Promise.resolve();
    expect(socket.writes.length).toBeGreaterThan(1);
    socket.writes.forEach((buffer) => {
      expect(buffer.length).toBeLessThanOrEqual(4096);
    });

    socket.emit("data", structPacket({
      packetId: 1,
      packetType: PACKET_TYPE.PACKET_COMMAND_RESPONSE,
      packetBody: "part1",
    }));
    socket.emit("data", structPacket({
      packetId: 1,
      packetType: PACKET_TYPE.PACKET_COMMAND_RESPONSE,
      packetBody: "part2",
    }));

    jest.advanceTimersByTime(50);
    await expect(sendPromise).resolves.toBe("part1part2");
    jest.useRealTimers();
  });
});
