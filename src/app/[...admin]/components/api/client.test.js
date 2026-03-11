const { isValidMutationVerb, requestApi } = require("./client");

describe("admin api client", () => {
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

  it("wraps mutating data with { data } envelope", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "1" }]),
    });

    const data = await requestApi("/roles", { method: "POST", data: { name: "Role_1" } });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3010/roles",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ data: { name: "Role_1" } }),
      })
    );
    expect(data).toEqual([{ id: "1" }]);
  });

  it("returns structured error payload on non-ok response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "bad-input" }),
    });

    const data = await requestApi("/users", { method: "PUT", data: { id: "1" } });
    expect(data.error).toBe("bad-input");
    expect(data.status).toBe(400);
  });

  it("returns fallback error on fetch failure", async () => {
    global.fetch.mockRejectedValue(new Error("boom"));

    const data = await requestApi("/groups", { method: "GET" });
    expect(data.error).toBe("Failed to access /groups on GET!");
    expect(data.status).toBe(0);
  });

  it("validates allowed mutation verbs", () => {
    expect(isValidMutationVerb("post")).toBe(true);
    expect(isValidMutationVerb("PUT")).toBe(true);
    expect(isValidMutationVerb("DELETE")).toBe(true);
    expect(isValidMutationVerb("PATCH")).toBe(false);
  });
});
