const { logEvent, LogLevel } = require("../Log");

/**
 * Copies the elements from the object using the template to filter object properties
 * @param {Role | Group | User | Array<Role> | Array<Group> | Array<User>} object A single or list of objects to remove extra fields from
 * @param {Object} template The object to validate against
 * @return An array of new objects filtered based on the template. If no objects were found, returns [{}]
 */

function strictProperties(object, template){
    const os = Array.isArray(object) ? [...object] : [object];
    const newOs = [];

    logEvent(LogLevel.INFO, `Received objects, removing keys not matching [${Object.keys(template).join(', ')}]`);

    os.forEach(o => {
        if(!o) return;
        const newO = {};
        Object.keys(o).forEach(oKey => {
            if(template[oKey] !== undefined){
                newO[oKey] = o[oKey];
            } else {
                logEvent(LogLevel.INFO, `Stripping property ${oKey} from object`)
            }
        });
        newOs.push(newO);
    });

    if(newOs.length === 0){
        logEvent(LogLevel.WARN, 'Unable to find any matching keys to objects passed! I give you back an empty array.');
        newOs.push({});
    }

    return newOs;
}

module.exports = { strictProperties }