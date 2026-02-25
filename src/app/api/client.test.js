const { requestApi } = require("./client");

describe("app api client", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    Object.defineProperty(global, "location", {
      value: { host: "localhost:3010" },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sends JSON body and returns parsed payload", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ name: "TestUser" }),
    });

    const data = await requestApi("/login", {
      method: "POST",
      body: { username: "u", password: "p" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3010/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "u", password: "p" }),
      })
    );
    expect(data).toEqual({ name: "TestUser" });
  });

  it("returns normalized error object on non-ok", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "denied" }),
    });

    const data = await requestApi("/login", { method: "POST", body: {} });
    expect(data.error).toBe("denied");
    expect(data.status).toBe(401);
  });
});
