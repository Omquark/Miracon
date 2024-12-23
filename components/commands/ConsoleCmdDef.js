/**
 * The default console command, which is used to show what is expected of a console command
 * for required and optional, these contain an array of objects, which require a name and type
 * The name will be shown on a Modal on the web page.
 * The type can be either a string, enum, boolean.
 *    A string will allow entry on the webpage.
 *    A type of enum will need an array of values, which will allow a selection on the webpage.
 *    A type of boolean will display a checkbox on the webpage.
 * Some examples of what is already implemented can be seen below. This is exactly what they will be on insert of the DB.
 */

const ConsoleCommand = {
  'name': 'DEFAULT_COMMAND', //The name of the command, which is exactly how it is executed within the console
  'id': 'command id', //The id for this command, for database purposes, expects a uuidv4
  'description': 'The default command. This is not a valid console command.', //A description of the command
  'required': [], //Required arguments for the command, in the order the console expects, contains info on what these values can/should be as well
  'optional': [], //Optiona arguments for the command, in the order the console expects
  'roles': [], //A list of roles which can execute the command. Defaults to minecrafts 'levels'
  'blacklistRoles': [], //Roles which cannot explicitly execute this command.
}

const ConsoleCommands = [
  {
    'name': 'advancement',
    'description': 'Grants, removes, or checks player advancements',
    'required': [
      { name: 'Action', type: 'enum', values: ['grant', 'revoke'] },
      { name: 'Player', type: 'player' },
      { name: 'Which', type: 'enum', values: ['everything', 'from', 'only', 'through', 'until'] },
    ],
    'optional': [{ name: 'Advancement', type: 'string' }],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'clear',
    'description': 'Clears a player\'s inventory.',
    'required': [{ name: 'Player', type: 'player' }],
    'optional': [],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'difficulty',
    'description': 'Displays or changes the difficulty.',
    'required': [],
    'optional': [{ name: 'difficulty', type: 'enum', values: ['peaceful', 'easy', 'normal', 'hard'] }],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'kick',
    'description': 'Kicks target player from a server. If a reason is given, the player will see it ',
    'required': [{ name: 'Target', type: 'player', }],
    'optional': [{ name: 'Reason', type: 'string', }],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'list',
    'description': 'Lists active players which are logged in. This is accessible to any logged in player, and is also used by the server to effect commands.',
    'required': [{}],
    'optional': [{ name: 'uuids', type: 'boolean' }],
    'roles': ['Level 1'],
    'blacklistRoles': [''],
  },
  {
    'name': 'locate',
    'description': 'Finds the closest structure, biome, or point of interest (poi)',
    'required': [{ name: 'registry', type: 'enum', values: ['structure', 'biome', 'poi'] }, { name: 'target', type: 'string' }],
    'optional': [],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'reload',
    'description': 'Reloads the loot tables, advancements, and functions from disk.',
    'required': [],
    'optional': [],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'save-off',
    'description': 'Disables the auto save feature of the world.',
    'required': [],
    'optional': [],
    'roles': ['Level 4'],
    'blacklistRoles': [''],
  },
  {
    'name': 'save-on',
    'description': 'Enables the auto save feature of the world.',
    'required': [],
    'optional': [],
    'roles': ['Level 4'],
    'blacklistRoles': [''],
  },
  {
    'name': 'seed',
    'description': 'Displays the seed of the generated world.',
    'required': [],
    'optional': [],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'setblock',
    'description': 'Sets the block at the position.',
    'required': [{ name: 'X', type: 'string' }, { name: 'Y', type: 'string' }, { name: 'Z', type: 'string' }, { name: 'Block', type: 'string' }],
    'optional': [{ name: 'Action', type: 'enum', values: ['destroy', 'keep', 'replace'] }],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'stop',
    'description': 'Stops the server',
    'required': [],
    'optional': [],
    'roles': ['Level 4'],
    'blacklistRoles': [''],
  },
  {
    'name': 'weather',
    'description': 'Sets teh weather',
    'required': [{ name: 'Weather', type: 'enum', values: ['clear', 'rain', 'thunder'] }],
    'optional': [{ name: 'Duration', type: 'string' }],
    'roles': ['Level 2'],
    'blacklistRoles': [''],
  },
  {
    'name': 'msg',
    'description': 'Whispers a character a typed message',
    'required': [{ name: 'player', type: 'string' }, { name: 'message', type: 'string' }],
    'optional': [],
    'roles': ['Level 0'],
    'blacklistedroles': [''],
  },
]

module.exports = { ConsoleCommand, ConsoleCommands }