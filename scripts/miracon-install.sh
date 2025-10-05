#! /bin/bash
# PRODUCT_NAME="miracon"
# TEMP_PATH=/var/tmp/$PRODUCT_NAME
EDITOR_PASSWORD=$PRODUCT_NAME
CREATED_USER=$PRODUCT_NAME
# INSTALL_PATH=/opt/${PRODUCT_NAME}
# CONFIG_PATH=/etc/opt/${PRODUCT_NAME}
# LOG_PATH=/var/opt/${PRODUCT_NAME}

EXPECTED_USER=root

#Verify User
if [ ! $USER = $EXPECTED_USER ];
then
    "$(date) This program must be run as $EXPECTED_USER"
    exit 1
fi

#Create the user and group
useradd -M $CREATED_USER -p $EDITOR_PASSWORD
groupadd ${CREATED_USER}g
usermod -a -G ${CREATED_USER}g ${CREATED_USER}

#Check if install path exists and remove it if it does
if [ -d $INSTALL_PATH ];
then
        echo "Directory $INSTALL_PATH exists. I will remove this folder without prejudice!"
        rm $INSTALL_PATH -rf
fi

echo "Creating installation directory @ $INSTALL_PATH"
mkdir -p $INSTALL_PATH/bin $INSTALL_PATH/scripts
chown -R ${CREATED_USER}:${CREATED_USER}g $INSTALL_PATH

#Check the config path and remove it if it's there
if [ -d $CONFIG_PATH ];
then
        echo "Directory $CONFIG_PATH exists. I will remove this folder without prejudice!"
        rm $CONFIG_PATH -rf
fi

echo "Creating configuration path @ $CONFIG_PATH"
mkdir -p $CONFIG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $CONFIG_PATH

#Check for the log path and reove it if it's there
if [ -d $LOG_PATH ];
then
        echo "$(date) Directory $LOG_PATH exists. I will remove this folder without prejudice!"
        rm $LOG_PATH -rf
fi

if [ ! -d $MINECRAFT_SERVER_PATH ];
then
        echo "Creating folder to mount Minecraft Server files."
        mkdir -p $MINECRAFT_SERVER_PATH
fi

echo "Creating log directory @ $LOG_PATH"
mkdir -p $LOG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $LOG_PATH

echo "Creating logs directory @ $LOG_PATH/logs"
mkdir $LOG_PATH/logs

echo "Creating and initializing DB"
mkdir -p /data/db
# mongod --bind_ip_all &

cd $TEMP_PATH
echo "Downloading necessary files to build front end"
npm install --include=dev
echo "Building the front end"
npm run build

echo "Installing application"
cp index.js $INSTALL_PATH/bin -r
cp package.json $INSTALL_PATH/bin -r
cp postcss.config.js $INSTALL_PATH/bin -r
cp tailwind.config.js $INSTALL_PATH/bin -r
cp components/ $INSTALL_PATH/bin -r
cp scripts/ $INSTALL_PATH -r
cp $TEMP_PATH/.next/ $INSTALL_PATH/bin -a
mkdir /home/miracon

echo "Copying configuration"
cp config/config.prop $CONFIG_PATH/config.prop

echo "Preparing build for launch"
cd $INSTALL_PATH/bin
npm install
cd $INSTALL_PATH

echo "Updating security properties"
chmod -R 755 $INSTALL_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $INSTALL_PATH
chmod -R 755 $CONFIG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $CONFIG_PATH
chmod -R 755 $LOG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $LOG_PATH
chmod -R 755 /data
chown -R ${CREATED_USER}:${CREATED_USER}g /data

echo "Cleaning up temp files"
rm $TEMP_PATH -rf