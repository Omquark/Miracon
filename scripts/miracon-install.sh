PRODUCT_NAME="miracon"
TEMP_PATH=/var/tmp/$PRODUCT_NAME
EDITOR_PASSWORD=$PRODUCT_NAME
CREATED_USER=$PRODUCT_NAME
INSTALL_PATH=/opt/${PRODUCT_NAME}
CONFIG_PATH=/etc/opt/${PRODUCT_NAME}
LOG_PATH=/var/opt/${PRODUCT_NAME}


EXPECTED_USER=root

#Verify User
if [ ! $USER = $EXPECTED_USER ]
then
    "$(date) This program must be run as $EXPECTED_USER"
    exit 1
fi

#Create the user and group
useradd -M $CREATED_USER -p $EDITOR_PASSWORD
groupadd $CREATED_USER
usermod -a -G ${CREATED_USER}g ${CREATED_USER}

#Check if install path exists and remove it if it does
if [ -d $INSTALL_PATH ]
then
        echo "$(date) Directory $INSTALL_PATH exists. I will remove this folder without prejudice!"
        rm $INSTALL_PATH -rf
fi

mkdir $INSTALL_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $INSTALL_PATH

#Check the config path and remove it if it's there
if [ -d $CONFIG_PATH ]
then
        echo "$(date) Directory $CONFIG_PATH exists. I will remove this folder without prejudice!"
        rm $CONFIG_PATH -rf
fi

mkdir $CONFIG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $CONFIG_PATH

#Check for the log path and reove it if it's there
if [ -d $LOG_PATH ]
then
        echo "$(date) Directory $LOG_PATH exists. I will remove this folder without prejudice!"
        rm $LOG_PATH -rf
fi

mkdir $LOG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $LOG_PATH

echo "$(date) Creating installation binaries @ $INSTALL_PATH/bin"
mkdir "$INSTALL_PATH/bin"
echo "$(date) Creating logs directory @ $LOG_PATH/logs"
mkdir "$LOG_PATH/logs"

echo "Building the back-end for deployment"
cd $TEMP_PATH
echo "Installing maven"
apt-get install maven -y
mvn clean install

echo "$(date) Installing NodeJS 18.x latest"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
apt-get install nodejs -y
apt-get install npm -y

cd $TEMP_PATH
echo "$(date) Copying configuration"
cp config/config.prop $CONFIG_PATH/config.prop
cp scripts/ $INSTALL_PATH/bin/ -r
echo "$(date) Copying front-end"
cp build/ $INSTALL_PATH/bin -r
cp server/ $INSTALL_PATH/bin/server -r
echo "$(date) Running npm install on the server"
cd $INSTALL_PATH/bin/server
npm install
cd $TEMP_PATH

echo "$(date) Removing installation files"
rm "/opt/$PRODUCT_NAME/bin/$PRODUCT_NAME-install.ksh" -f

echo "$(date) Updating security properties"
chmod -R 755 $INSTALL_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $INSTALL_PATH
chmod -R 755 $CONFIG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $CONFIG_PATH
chmod -R 755 $LOG_PATH
chown -R ${CREATED_USER}:${CREATED_USER}g $LOG_PATH
cd /
cp $TEMP_PATH/$PRODUCT_NAME-install.log /var/opt/$PRODUCT_NAME/logs
#rm $TEMP_PATH -rf