#! /bin/bash

USER=$(whoami)

EXPECTED_USER=miracon

if [ ! $EXPECTED_USER = $USER ];
then
	echo "This program must be run as $EXPECTED_USER"
	exit 1
fi

cd $INSTALL_PATH/bin
mongod --bind_ip_all &
sleep 5
if [ -f "$INSTALL_PATH/scripts/mongo-init.js" ];
then
	echo "Detected mongo start script, setting up the database user"
	mongosh < "$INSTALL_PATH/scripts/mongo-init.js"
	rm "$INSTALL_PATH/scripts/mongo-init.js"
fi

# node index.js
node index.js > $LOG_PATH/$LOG_FOLDER/miracon.log 2>&1