const { body } = require('express-validator');

const validateAndSanitizeUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 16 }).withMessage('Username is required and must be between 3 and 16 characters')
    .matches(/^[\w_]+$/).withMessage('Username must be alphanumeric with _ (underscore)')
    .escape(),
  body('password')
    .trim()
    //.isLength({ min: 6, max: 32, }).withMessage('Password is required and must be bewteen 6 and 32 characters')
    .isBase64().withMessage('Password is expected to be sent as Base64 string')
    //.matches(/^[\w!@#$%^&*?\\]+$/).withMessage('Password must be alphanumeric and can contain any of !@#$%^&*?\\')
    .escape()
];

const validateNameId = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 32 }).withMessage('The name must be between 3 and 32 characters')
    .isAlphanumeric().withMessage('The name must be alphanumeric'),
  body('id')
    .trim()
    .isUUID(4).withMessage('ID must be a valid UUIDv4')
    .escape()
];

function isValidUUIDv4(uuid) {
  const uuid4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuid4Regex.test(uuid);
}

function isValidUsername(username) {
  const usernameRegex = /^[\w_]+$/
  return usernameRegex.test(username);
}

function isValidPassword(password) {
  const passwordRegex = /^[\w!@#$%^&*?\\]+$/
  return passwordRegex.test(password);
}

//This probably doesn't cover all emails, but should cover most
function isValidEmail(email) {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  return emailRegex.test(email);
}

function validateUUIDArray(fieldName) {
  return body(fieldName).isArray().custom((value) => {
    if (!Array.isArray(value)) return false;
    return value.every(isValidUUIDv4)
  })
}

module.exports = { validateAndSanitizeUser, validateNameId, isValidUsername, isValidPassword, isValidEmail, validateUUIDArray }