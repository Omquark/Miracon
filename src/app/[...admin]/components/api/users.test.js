jest.mock("./client", () => ({
  isValidMutationVerb: jest.fn(),
  requestApi: jest.fn(),
}));

jest.mock("../../../../../components/utility/Utility", () => ({
  bytesToBase64: jest.fn((value) => `b64:${value}`),
}));

const { isValidMutationVerb, requestApi } = require("./client");
const { mutateUsers } = require("./users");

const usersActionTypes = {
  RESPONSE_USER: "RESPONSE_USER",
};

describe("users api wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches response error for invalid verb", async () => {
    isValidMutationVerb.mockReturnValue(false);
    const dispatch = jest.fn();

    await mutateUsers({ name: "User_1" }, dispatch, "PATCH");
    expect(dispatch).toHaveBeenCalledWith({
      type: usersActionTypes.RESPONSE_USER,
      payload: expect.objectContaining({ error: expect.any(String) }),
    });
    expect(requestApi).not.toHaveBeenCalled();
  });

  it("encodes password and sends body.data for valid verb", async () => {
    isValidMutationVerb.mockReturnValue(true);
    requestApi.mockResolvedValue([{ id: "1", name: "User_1" }]);
    const dispatch = jest.fn();

    await mutateUsers({ id: "1", name: "User_1", password: "plain" }, dispatch, "PUT");
    expect(requestApi).toHaveBeenCalledWith("/users", {
      method: "PUT",
      data: { id: "1", name: "User_1", password: "b64:plain" },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: usersActionTypes.RESPONSE_USER,
      payload: [{ id: "1", name: "User_1" }],
    });
  });
});
