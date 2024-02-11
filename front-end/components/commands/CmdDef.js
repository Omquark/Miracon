const Commands = [
  {
    "name": "CREATE_ROLE",
    "description": "Allows the user to create roles ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_ROLE",
    "description": "Allows the user to read roles ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_ROLE",
    "description": "Allows the user to make updates to roles only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_ROLE",
    "description": "Allows the user to delete roles. Does not require read access, but the user cannot see role names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "CREATE_GROUP",
    "description": "Allows the user to create groups ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_GROUP",
    "description": "Allows the user to read groups ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_GROUP",
    "description": "Allows the user to make updates to groups only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_GROUP",
    "description": "Allows the user to delete groups. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "CREATE_USER",
    "description": "Allows the user to create users ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_USER",
    "description": "Allows the user to read users ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_USER",
    "description": "Allows the user to make updates to users only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_USER",
    "description": "Allows the user to delete users. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "CREATE_WHITELIST",
    "description": "Allows the user to create whitelist entries ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_WHITELIST",
    "description": "Allows the user to read whitelist entries ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_WHITELIST",
    "description": "Allows the user to make updates to whitelist entries only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_WHITELIST",
    "description": "Allows the user to delete whitelist entries. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "CREATE_BANNED_PLAYER",
    "description": "Allows the user to create banned player entry ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_BANNED_PLAYER",
    "description": "Allows the user to read banned player entry ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_BANNED_PLAYER",
    "description": "Allows the user to make updates to banned player entry only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_BANNED_PLAYER",
    "description": "Allows the user to delete banned player entry. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "CREATE_BANNED_IP",
    "description": "Allows the user to create banned ip entry ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_BANNED_IP",
    "description": "Allows the user to read banned ip entry ONLY.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UPDATE_BANNED_IP",
    "description": "Allows the user to make updates to banned ip entry only. Does not require read access, but the user cannot see what they are changing without it.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "DELETE_BANNED_IP",
    "description": "Allows the user to delete banned ip entry. Does not require read access, but the user cannot see names or ids, which are required to delete.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "READ_SERVER_PROPERTY",
    "description": "Allows the user to access the server.properties file. Known secrets will be removed.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "WRITE_SERVER_PROPERTY",
    "description": "Allows the user to write/update server properties. This does not include reading, though not allowing this as well makes it difficult.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "BIND_ROLE_COMMAND",
    "description": "Allows the user to bind a role to a command, allowing users with that role to execute the command.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UNBIND_ROLE_COMMAND",
    "description": "Allows the user to unbind a role from a command, removing access to that command from users within that group.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "BIND_BLACKLIST_ROLE_COMMAND",
    "description": "Allows a user to blacklist a role from executing a command. Blacklisted roles take priority over whitelisted.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "UNBIND_BLACKLIST_ROLE_COMMAND",
    "description": "Allows a user to remove the blacklist of a role from a command. Blacklisted roles take priority over whitelisted roles.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "PASSWORD_RESET",
    "description": "Allows the user to reset a users password. This does not give them access to set the password, and the reset will be sent to the user email.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "PASSWORD_SET",
    "description": "Allows the user to set the password of other users. The user is able to see what the password is, and the user will be sent an alerting email about the change.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  },
  {
    "name": "BACKUP_ADMIN",
    "description": "Allows the user to manage backups i.e. housekeeping, copying for archive, etc. This does not allow a user to restore a backup from this utility.",
    "role": [],
    "blacklist-roles": [],
    "requirePassword": false
  }
]

module.exports = { Commands }