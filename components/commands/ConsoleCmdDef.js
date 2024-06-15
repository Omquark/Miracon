const ConsoleCommand = {
  'name': 'DEFAULT_COMMAND', //The name of the command, which is exactly how it is executed within the console
  'id': 'command id', //The id for this command, for database purposes, expects a uuidv4
  'description': 'The default command. This is not a valid console command.', //A description of the command
  'required': [], //Required arguments for the command, in the order the console expects
  'optional': [], //Optiona arguments for the command, in the order the console expects
  'roles': [], //A list of roles which can execute the command. Defaults to minecrafts 'levels'
  'blacklistRoles': [], //Roles which cannot explicitly execute this command.
}

const ConsoleCommands = [
  {
    'name': 'list', 
    'description': 'Lists active players which are logged in. This is accessible to any logged in player, and is also used by the server to effect commands.',
    'required': [''],
    'optional': [''],
    'roles': ['Level 1'],
    'blacklistRoles': [''],
  },
  {
    'name': 'seed', 
    'description': 'Displays the seed of the generated world.',
    'required': [''],
    'optional': [''],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
]

module.exports = { ConsoleCommand, ConsoleCommands }