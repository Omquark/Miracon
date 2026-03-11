const { isValidUsername, isValidEmail } = require("../utility/Validators");

function validateDataEnvelope(req, res, next) {
  if (!req.body || typeof req.body !== "object" || !req.body.data || typeof req.body.data !== "object") {
    res.status(400).send({ error: "Request body must include a data object." });
    return;
  }
  next();
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function makeDataValidator({ required = [], requireAny = [], validators = {} }) {
  return (req, res, next) => {
    const data = req?.body?.data;
    if (!data || typeof data !== "object") {
      res.status(400).send({ error: "Request body must include a data object." });
      return;
    }

    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        res.status(400).send({ error: `Missing required field: ${field}` });
        return;
      }
    }

    if (requireAny.length > 0) {
      const hasOne = requireAny.some((field) => data[field] !== undefined && data[field] !== null && data[field] !== "");
      if (!hasOne) {
        res.status(400).send({ error: `At least one of [${requireAny.join(", ")}] must be provided.` });
        return;
      }
    }

    for (const field of Object.keys(validators)) {
      if (data[field] === undefined || data[field] === null) continue;
      const validation = validators[field](data[field]);
      if (validation !== true) {
        res.status(400).send({ error: validation });
        return;
      }
    }

    next();
  };
}

function validateNameField(value) {
  if (!isNonEmptyString(value)) return "Field name must be a non-empty string.";
  if (!isValidUsername(value.trim())) return "Field name can only contain alphanumeric characters and _.";
  return true;
}

function validateIdField(value) {
  if (!isNonEmptyString(value)) return "Field id must be a non-empty string.";
  return true;
}

function validateEmailField(value) {
  if (!isNonEmptyString(value)) return "Field email must be a non-empty string.";
  if (!isValidEmail(value.trim())) return "Field email is invalid.";
  return true;
}

function validateArrayOfStrings(fieldName) {
  return (value) => {
    if (!Array.isArray(value)) return `Field ${fieldName} must be an array.`;
    for (const item of value) {
      if (!isNonEmptyString(item)) {
        return `Field ${fieldName} must contain only non-empty strings.`;
      }
    }
    return true;
  };
}

module.exports = {
  validateDataEnvelope,
  makeDataValidator,
  validateNameField,
  validateIdField,
  validateEmailField,
  validateArrayOfStrings,
};
