//Default, reaquired commands. These commands are required by Miracon for basic access and cannot be removed.
//Changing this data can result in Miracon not working as aexpected

const Command =
{
  "name": "DEFAULT_COMMAND",
  "description": "The default command. This should not be used in production",
  "roles": [],
  "blacklistRoles": ["ALL"],
  "requirePassword": false,
  "enabled": true,
  "id": "command id",
  'required': [],
  'optional': [],
}

const Commands = [
  {
    "name": "CREATE_ROLE",
    "description": "Allows the user to create roles ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true,
  },
  {
    "name": "READ_ROLE",
    "description": "Allows the user to read roles ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_ROLE",
    "description": "Allows the user to make updates to roles only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_ROLE",
    "description": "Allows the user to delete roles. Does not require read access, but the user cannot see role names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "CREATE_GROUP",
    "description": "Allows the user to create groups ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_GROUP",
    "description": "Allows the user to read groups ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_GROUP",
    "description": "Allows the user to make updates to groups only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_GROUP",
    "description": "Allows the user to delete groups. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "CREATE_USER",
    "description": "Allows the user to create users ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_USER",
    "description": "Allows the user to read users ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_USER",
    "description": "Allows the user to make updates to users only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_USER",
    "description": "Allows the user to delete users. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "CREATE_WHITELIST",
    "description": "Allows the user to create whitelist entries ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_WHITELIST",
    "description": "Allows the user to read whitelist entries ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_WHITELIST",
    "description": "Allows the user to make updates to whitelist entries only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_WHITELIST",
    "description": "Allows the user to delete whitelist entries. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "CREATE_BANNED_PLAYER",
    "description": "Allows the user to create banned player entry ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_BANNED_PLAYER",
    "description": "Allows the user to read banned player entry ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_BANNED_PLAYER",
    "description": "Allows the user to make updates to banned player entry only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_BANNED_PLAYER",
    "description": "Allows the user to delete banned player entry. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "CREATE_BANNED_IP",
    "description": "Allows the user to create banned ip entry ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_BANNED_IP",
    "description": "Allows the user to read banned ip entry ONLY.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_BANNED_IP",
    "description": "Allows the user to make updates to banned ip entry only. Does not require read access, but the user cannot see what they are changing without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "DELETE_BANNED_IP",
    "description": "Allows the user to delete banned ip entry. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_SERVER_PROPERTY",
    "description": "Allows the user to access the server.properties file. Known secrets will be removed.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "WRITE_SERVER_PROPERTY",
    "description": "Allows the user to write/update server properties. This does not include reading, though not allowing this as well makes it difficult.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "BIND_ROLE_COMMAND",
    "description": "Allows the user to bind a role to a command, allowing users with that role to execute the command.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UNBIND_ROLE_COMMAND",
    "description": "Allows the user to unbind a role from a command, removing access to that command from users within that group.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "BIND_BLACKLIST_ROLE_COMMAND",
    "description": "Allows a user to blacklist a role from executing a command. Blacklisted roles take priority over whitelisted.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UNBIND_BLACKLIST_ROLE_COMMAND",
    "description": "Allows a user to remove the blacklist of a role from a command. Blacklisted roles take priority over whitelisted roles.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "PASSWORD_RESET",
    "description": "Allows the user to reset a users password. This does not give them access to set the password, and the reset will be sent to the user email.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "PASSWORD_SET",
    "description": "Allows the user to set the password of other users. The user is able to see what the password is, and the user will be sent an alerting email about the change.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "BACKUP_ADMIN",
    "description": "Allows the user to manage backups i.e. housekeeping, copying for archive, etc. This does not allow a user to restore a backup from this utility.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "READ_COMMAND",
    "description": "Allows the user to read commands.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "WRITE_COMMAND",
    "description": "Allows the user to write a command. This does not require the read commands role, but is difficult to do without it.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "UPDATE_COMMAND",
    "description": "Allows the user to make updates to commands.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
  {
    "name": "REMOVE_COMMAND",
    "description": "Allows the user to remove commands.",
    "roles": [],
    "blacklistRoles": [],
    "requirePassword": false,
    "enabled": true
  },
]

module.exports = { Commands, Command }