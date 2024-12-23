## Miracon

Miracon is a NodeJS wrapper designed to fit with RCON for Minecraft, with an emphasis on ease of use and upgraded security through implementing
Role Based Access Control and limiting commands to roles.

Miracon is designed to work out of box with some configuration specific to your Minecraft server.

Currently, Miracon does not have access to commands, but can read ops files and create users based on their access level.

At this point, Miracon can create an admin user to administer roles along with current ops to the server.

Starting up
To start, the config.prop file requires updating. It can be located at config/config.props. All parameters have an explanation in the config.prop file itself and won't be explained here. The log path does not effect anything yet, but will be updated to write to a specific folder, partitioning as needed once the file reaches a certain size. This same is true for audits. Some values do not need to be defined in the config file, such values are noted in the config file. This application is currently tested with NodeJS 20.10, MongoDB 7.0.11, and Minecraft 1.21.

You also need a MongoDB running to persist information. Miracon will not run unless it is able to connect. The location of the DB is configurable and can be edited from the config.props file. The MongoDB needs a user setup that requires read and write access. The name of the DB must match what is defined in the config file.

On the furst run, ensure the INIT_USERS is defined to 1. After the first run, you will need to update this to 0 manually or any edits made to the DB will be re-created.

The default password for created users Mi1n3e&Cr4\tf$ This is the same for all users created, even those from the ops.json file. Any users must update their password at first login.

Now, you're ready to actually start the server. You will need NodeJS installed prior to starting. Go into the base directory from a command line and execute npm start. Currently, this will create a log file called mieacon.log at the base directory which will contain impoortant information. You can verify once the server is started by looking for the last line in the file which will show Server is listining on port xxxxx, which will have the same number as the NodeJS server port defined from config.props. You can then navigate to your address:port and login. It is recommended to login as Miracon and setup users as desired, though some values cannot be changed yet. Currently accounts cannot be deactivated, but removing the users from ops.json will cause the user to not be created on the server. Users cannot be added at this point, either, which will come at a later update.

The meat of Miracon, the commands can be executed by any user created at this moment, regardless of access level. Commands executed will be shown as AUDIT in the log file, so commands executed can be traced to any ops.

Later updates intended will include basic functionality as adding, removing, and disabling users, roles, and groups. There are some issues which are known about, which can be viewed in the notes.txt file in the base directory. Commands which are implemented will show up on the command page, and are currently working so far with testing done, but can be raised in the issues tab if something does not work.