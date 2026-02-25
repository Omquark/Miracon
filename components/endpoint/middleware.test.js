jest.mock("../utility/Validators", () => ({
  isValidUsername: jest.fn(),
  isValidEmail: jest.fn(),
}));

const { isValidUsername, isValidEmail } = require("../utility/Validators");
const {
  validateDataEnvelope,
  makeDataValidator,
  validateNameField,
  validateIdField,
  validateEmailField,
  validateArrayOfStrings,
} = require("./middleware");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("endpoint middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isValidUsername.mockReturnValue(true);
    isValidEmail.mockReturnValue(true);
  });

  it("validateDataEnvelope rejects missing data object", () => {
    const res = mockRes();
    const next = jest.fn();
    validateDataEnvelope({ body: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("validateDataEnvelope accepts valid data object", () => {
    const res = mockRes();
    const next = jest.fn();
    validateDataEnvelope({ body: { data: { name: "x" } } }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("makeDataValidator enforces required and any-of fields", () => {
    const validator = makeDataValidator({ required: ["name"], requireAny: ["id", "email"] });
    const res = mockRes();
    const next = jest.fn();

    validator({ body: { data: { name: "n" } } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("makeDataValidator applies custom field validators", () => {
    const validator = makeDataValidator({
      validators: {
        name: () => "bad-name",
      },
    });
    const res = mockRes();
    const next = jest.fn();
    validator({ body: { data: { name: "bad" } } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "bad-name" });
    expect(next).not.toHaveBeenCalled();
  });

  it("validateNameField validates username syntax", () => {
    isValidUsername.mockReturnValue(false);
    expect(validateNameField("bad name")).toBe("Field name can only contain alphanumeric characters and _.");
  });

  it("validateIdField validates non-empty string", () => {
    expect(validateIdField("")).toBe("Field id must be a non-empty string.");
    expect(validateIdField("abc")).toBe(true);
  });

  it("validateEmailField validates syntax", () => {
    isValidEmail.mockReturnValue(false);
    expect(validateEmailField("bad")).toBe("Field email is invalid.");
  });

  it("validateArrayOfStrings validates array item types", () => {
    const validateRoles = validateArrayOfStrings("roles");
    expect(validateRoles("x")).toBe("Field roles must be an array.");
    expect(validateRoles(["ok", ""])).toBe("Field roles must contain only non-empty strings.");
    expect(validateRoles(["a", "b"])).toBe(true);
  });
});
