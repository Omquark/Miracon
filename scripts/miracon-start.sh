#INSTALL_PATH="/opt/miracon"
#CONFIG_PATH="/etc/opt/miracon"
#LOG_PATH="/var/opt/miracon"

USER=$(whoami)

EXPECTED_USER=miracon

if [ ! $EXPECTED_USER = $USER ]
then
	echo "$(date) This program must be run as $EXPECTED_USER"
	exit 1
fi

cd $INSTALL_PATH/bin/server
node index.js