/**
 * Defines the what the objects should look like to define properties realted to Roles for RBAC
 */

/**
 * Defines a role to be used for RBAC
 * Used for a psuedoDB, name is considered the PK
 * @property {string} name Name of the role, must be unique and is used as the PK
 */
const Role = {
    name: 'AdminRole',
    id: '82094693-a73c-4aa6-869f-5d812c9a9203',
}

const otherRole = {
    name: 'AdminOther',
    id: 'b40c988e-c96a-4586-834c-7108323bb13e',
}

/**
 * Defines a RoleGroup for RBAC. This is used to bind multiple Roles to define a group of roles.
 * Used for the psuedoDB, name is considered the PK
 * @property {string} name Name of the RoleGroup, must be unique and is used as the PK
 * @property {Array} roles An array of Roles that this group contains, used to validate in an RBAC style
 */
const Group = {
    name: 'AdminGroup',
    roles: [Role.id],
    id: '79c7af5e-a997-4d31-9727-0ff038b28499',
}

/**
 * Defines a User that is able to login and access certain commands
 * Use for the pseudoDB, name is considered the PK
 * @property {string} name Name of the user, as when logged into the Minecraft server. Must be unique and is ued in RBAC authentication
 * @property {string} password A bcrypt password of the user. The default defined is a bcrypt of "Mineraft".
 * @property {object} preferences A Session variable that defines the users preferences
 * @property {Array} roles Roles the User belongs to
 * @property {Array} groups RoleGroups the User belongs to
 * @property {string} id A unquie ID to identify this user, by default uses a uuidv4
 * @property {boolean} active Determines if this user is active. Setting this to false effectively disables the user.
 * @property {boolean} changePassword Forces the user to update their password on the next login
 */
const User = {
    name: 'AdminUser',
    password: '$2a$12$Kir2hu6aTah8sVbeXCT1zuaTZ2mzNntCkxcTpRLcOKy/KWdobp9sO',
    email: 'email@email.com',
    preferences: {},
    roles: [otherRole.id],
    groups: [Group.id],
    id: '71ec725c-2c84-4930-9153-63f3a8369672',
    active: true,
    changePassword: true,
}

// const Roles = [Role, otherRole];
// const Groups = [Group];
// const Users = [User];


// module.exports = { Role, Group, User, Roles, Groups, Users };
module.exports = { Role, Group, User };