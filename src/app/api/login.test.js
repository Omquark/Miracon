jest.mock("./client", () => ({
  requestApi: jest.fn(),
}));

const { login, logout } = require("./login");
const { requestApi } = require("./client");

describe("login api module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.btoa = jest.fn((value) => Buffer.from(value, "binary").toString("base64"));
  });

  it("login encodes password and calls /login", async () => {
    requestApi.mockResolvedValue({ name: "User_1" });
    const data = await login({ username: "User_1", password: "abc123" });

    expect(requestApi).toHaveBeenCalledWith("/login", {
      method: "POST",
      body: { username: "User_1", password: expect.any(String) },
    });
    expect(data).toEqual({ name: "User_1" });
  });

  it("logout calls /logout", async () => {
    requestApi.mockResolvedValue({});
    await logout();
    expect(requestApi).toHaveBeenCalledWith("/logout", { method: "GET" });
  });
});
