const { body } = require('express-validator');

/**
 * Used to build a validation for users to limit allowed characters
 */
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

/**
 * Used to validate a name and id for users. Id's are validated against UUIDv4
 */
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

/**
 * Validates a UUIDv4. 
 * @param {String} uuid The UUID to verify
 * @returns A boolean defining if the UUID is valid
 */
function isValidUUIDv4(uuid) {
  const uuid4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuid4Regex.test(uuid);
}

/**
 * Checks if the username is valid
 * @param {String} username The username to validate
 * @returns A boolean defining if the name is valid
 */
function isValidUsername(username){
  const usernameRegex = /^[\w_]+$/
  return usernameRegex.test(username);
}

/**
 * Checks if the password is valid
 * @param {String} password The password to validate
 * @returns A boolean defining if the password is valid
 */
function isValidPassword(password) {
  const passwordRegex = /^[\w!@#$%^&*?\\]+$/
  return passwordRegex.test(password);
}

/**
 * Checks if an array of UUIDs are valid
 * @param {String} fieldName The array to validate
 * @returns A boolean defining if the array is valid UUIDs, or false of the field is not an array.
 */
function validateUUIDArray(fieldName) {
  return body(fieldName).isArray().custom((value) => {
    if (!Array.isArray(value)) return false;
    return value.every(isValidUUIDv4)
  })
}

module.exports = { validateAndSanitizeUser, validateNameId, isValidUsername, isValidPassword, validateUUIDArray }