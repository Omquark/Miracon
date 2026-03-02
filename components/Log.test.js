const { format } = require("date-fns");
const { v4: uuidv4 } = require("uuid");

jest.mock("date-fns", () => ({
  format: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

const { LogLevel, setMessageLevel, logEvent, logError } = require("./Log");

describe("Log", () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    format.mockReturnValue("20240101\t12:34:56");
    uuidv4.mockReturnValue("log-id");
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setMessageLevel(LogLevel.ALL);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("formats log entries with timestamp, id, and level", () => {
    logEvent(LogLevel.INFO, "hello");
    expect(logSpy).toHaveBeenCalledWith("20240101\t12:34:56\tlog-id\tINFO\thello");
  });

  it("filters messages below current level", () => {
    setMessageLevel(LogLevel.WARN);
    logSpy.mockClear();
    logEvent(LogLevel.INFO, "skip");
    logEvent(LogLevel.ERROR, "keep");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("20240101\t12:34:56\tlog-id\tERROR\tkeep");
  });

  it("falls back to ALL on invalid level", () => {
    const result = setMessageLevel({ name: "", level: NaN });
    expect(result).toBe(LogLevel.ALL);
  });

  it("logs errors to stderr", () => {
    logError("boom");
    expect(errorSpy).toHaveBeenCalledWith("20240101\t12:34:56\tlog-id\tERROR\tboom");
  });
});
